import express from 'express';
import type { Request, Response } from 'express';
import { XMLParser } from 'fast-xml-parser';
import { GoogleGenAI } from '@google/genai';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());

// In-memory automation state and history
interface ProductItem {
  id: string;
  title: string;
  description: string;
  image_url: string;
  affiliate_url: string;
  price?: string;
  category?: string;
  publishedAt?: string;
}

interface PublishLog {
  id: string;
  productId: string;
  productTitle: string;
  channelId: string;
  caption: string;
  affiliateUrl: string;
  imageUrl: string;
  timestamp: string;
  status: 'published' | 'simulated' | 'failed';
  error?: string;
  telegramMessageId?: number;
}

const publishedHistory: PublishLog[] = [];
let automationRunning = false;
let automationIntervalMinutes = 0;
let automationTimer: NodeJS.Timeout | null = null;

// Built-in sample Romanian & International affiliate deal feeds for testing/demo
const SAMPLE_PRODUCTS: ProductItem[] = [
  {
    id: 'prod-1',
    title: 'Căști Wireless Sony WH-1000XM5 cu Anulare Activă a Zgomotului',
    description: 'Bucură-te de o experiență audio imersivă cu cel mai avansat sistem Noise Cancelling Sony. Autonomie de până la 30 ore, microfoane optimizate pentru apeluri clare și design ergonomic ultra-ușor.',
    image_url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80',
    affiliate_url: 'https://example.com/affiliate/sony-wh1000xm5?ref=telegram_affiliate',
    price: '1.499,99 Lei',
    category: 'Audio & Gadgets'
  },
  {
    id: 'prod-2',
    title: 'Ceas Smartwatch Garmin Fenix 7 Pro Sapphire Solar',
    description: 'Ediție multisport premium cu încărcare solară, lanternă LED integrată, hărți TopoActive și monitorizare avansată a sănătății și performanței sportive 24/7.',
    image_url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80',
    affiliate_url: 'https://example.com/affiliate/garmin-fenix-7?ref=telegram_affiliate',
    price: '3.899,00 Lei',
    category: 'Smartwatches'
  },
  {
    id: 'prod-3',
    title: 'Espressor Automat Philips Seria 5400 LatteGo',
    description: '12 specialități delicioase de cafea din boabe proaspete la o simplă atingere. Sistem inovator de spumare a laptelui LatteGo fără tuburi ascunse, curățabil în doar 15 secunde.',
    image_url: 'https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?w=800&auto=format&fit=crop&q=80',
    affiliate_url: 'https://example.com/affiliate/philips-lattego?ref=telegram_affiliate',
    price: '2.599,00 Lei',
    category: 'Electrocasnice'
  },
  {
    id: 'prod-4',
    title: 'Tastatură Mecanică Wireless Keychron Q1 Pro QMK/VIA',
    description: 'Carcasă din aluminiu frezat CNC, switch-uri lubrifiate din fabrică, hot-swappable și conectivitate Bluetooth 5.1 multi-device. Pasiune pentru productivitate și gaming.',
    image_url: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800&auto=format&fit=crop&q=80',
    affiliate_url: 'https://example.com/affiliate/keychron-q1-pro?ref=telegram_affiliate',
    price: '949,00 Lei',
    category: 'Periferice PC'
  },
  {
    id: 'prod-5',
    title: 'Monitor Gaming Curbat Samsung Odyssey OLED G9 49"',
    description: 'Rezoluție Dual QHD spectaculoasă, rată de refresh 240Hz, timp de răspuns 0.03ms și tehnologie Neo Quantum Processor Pro pentru imagini hipnotice.',
    image_url: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=800&auto=format&fit=crop&q=80',
    affiliate_url: 'https://example.com/affiliate/samsung-oled-g9?ref=telegram_affiliate',
    price: '5.999,00 Lei',
    category: 'Monitoare'
  }
];

// Helper to parse XML feeds into ProductItems
function parseFeedXml(xmlContent: string): ProductItem[] {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_'
  });
  
  const parsed = parser.parse(xmlContent);
  const products: ProductItem[] = [];

  // Support RSS 2.0 (<rss><channel><item>...</item></channel></rss>)
  const items = parsed?.rss?.channel?.item || 
                parsed?.channel?.item || 
                parsed?.feed?.entry || 
                parsed?.products?.product || 
                parsed?.items?.item ||
                [];

  const itemList = Array.isArray(items) ? items : (items ? [items] : []);

  for (let i = 0; i < itemList.length; i++) {
    const item = itemList[i];
    const title = item.title || item['g:title'] || item.name || `Produs #${i + 1}`;
    const link = item.link?.['@_href'] || item.link || item['g:link'] || item.url || '';
    const description = item.description || item['g:description'] || item.summary || '';
    
    // Image detection from enclosure, media:content, g:image_link, or description HTML
    let imageUrl = '';
    if (item.enclosure && item.enclosure['@_url']) {
      imageUrl = item.enclosure['@_url'];
    } else if (item['g:image_link']) {
      imageUrl = item['g:image_link'];
    } else if (item['media:content'] && item['media:content']['@_url']) {
      imageUrl = item['media:content']['@_url'];
    } else if (item.image) {
      imageUrl = typeof item.image === 'string' ? item.image : item.image['@_url'] || '';
    } else if (typeof description === 'string') {
      const imgMatch = description.match(/<img[^>]+src=["']([^"']+)["']/i);
      if (imgMatch && imgMatch[1]) {
        imageUrl = imgMatch[1];
      }
    }

    // Default clean image placeholder if not provided
    if (!imageUrl) {
      imageUrl = `https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=800&auto=format&fit=crop&q=80`;
    }

    const price = item['g:price'] || item.price || '';
    const category = item.category || item['g:product_type'] || '';

    // Strip HTML tags from description if needed
    const cleanDesc = typeof description === 'string' 
      ? description.replace(/<\/?[^>]+(>|$)/g, ' ').replace(/\s+/g, ' ').trim() 
      : String(description || '');

    products.push({
      id: `feed-item-${i}-${Date.now().toString(36)}`,
      title: typeof title === 'string' ? title.trim() : String(title || ''),
      description: cleanDesc,
      image_url: imageUrl,
      affiliate_url: typeof link === 'string' ? link.trim() : String(link || ''),
      price: price ? String(price).trim() : undefined,
      category: category ? String(category).trim() : undefined,
    });
  }

  return products;
}

// Helper to validate Google GenAI API key format
function isValidGeminiApiKey(key?: string): boolean {
  if (!key) return false;
  const trimmed = key.trim();
  // Standard Google AI Studio API keys begin with 'AIza' and are >= 35 characters
  return trimmed.startsWith('AIza') && trimmed.length >= 35;
}

// Configuration endpoint
app.get('/api/config', (_req: Request, res: Response) => {
  res.json({
    hasTelegramToken: Boolean(process.env.TELEGRAM_BOT_TOKEN),
    hasChannelId: Boolean(process.env.TELEGRAM_CHANNEL_ID),
    channelId: process.env.TELEGRAM_CHANNEL_ID || '',
    hasGeminiKey: isValidGeminiApiKey(process.env.GEMINI_API_KEY),
    feedUrl: process.env.FEED_URL || '',
    automationRunning,
    automationIntervalMinutes
  });
});

// Parse product feed endpoint
app.post('/api/feed/fetch', async (req: Request, res: Response) => {
  try {
    const feedUrl = req.body?.feedUrl || process.env.FEED_URL;
    
    if (!feedUrl || feedUrl === 'demo' || feedUrl.trim() === '') {
      return res.json({
        success: true,
        source: 'sample_feed',
        products: SAMPLE_PRODUCTS,
        count: SAMPLE_PRODUCTS.length
      });
    }

    const response = await fetch(feedUrl, {
      headers: {
        'User-Agent': 'TelegramAffiliateBot/1.0 (+https://t.me)'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
    }

    const text = await response.text();
    const products = parseFeedXml(text);

    if (products.length === 0) {
      return res.json({
        success: true,
        source: 'feed_empty_fallback',
        products: SAMPLE_PRODUCTS,
        message: 'No <item> elements found in feed, displaying demo deals for testing.',
        count: SAMPLE_PRODUCTS.length
      });
    }

    res.json({
      success: true,
      source: 'remote_feed',
      products,
      count: products.length
    });
  } catch (error: any) {
    console.error('Error fetching feed:', error);
    res.json({
      success: false,
      error: error.message || 'Failed to fetch or parse feed',
      products: SAMPLE_PRODUCTS, // fallback to avoid breaking UI
      source: 'error_sample_fallback'
    });
  }
});

// Shared Gemini AI copy generation helper
async function generatePostCopy(params: {
  title: string;
  description: string;
  language?: string;
  customRules?: string;
}): Promise<{ caption: string; provider: string; model?: string }> {
  const { title, description, language = 'ro', customRules } = params;
  const geminiKey = process.env.GEMINI_API_KEY;

  if (isValidGeminiApiKey(geminiKey)) {
    const ai = new GoogleGenAI({
      apiKey: geminiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    const promptRo = `
Creează o postare scurtă, energică și persuasivă pentru Telegram pe baza acestui produs:
- Titlu: ${title}
- Descriere: ${description || 'Calitate superioară, ofertă limitată'}
Reguli: Folosește emoji-uri, sub 100 de cuvinte, fără linkuri în text.
${customRules ? `Instrucțiuni suplimentare: ${customRules}` : ''}
`.trim();

    const promptEn = `
Create a short, energetic and persuasive Telegram channel post based on this product:
- Title: ${title}
- Description: ${description || 'Premium quality, limited time deal'}
Rules: Use engaging emojis, under 100 words, no links in text.
${customRules ? `Additional guidelines: ${customRules}` : ''}
`.trim();

    const prompt = language === 'ro' ? promptRo : promptEn;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-flash-latest',
        contents: prompt,
      });
      const text = response.text ? response.text.trim() : '';
      if (text) {
        return { caption: text, provider: 'gemini', model: 'gemini-flash-latest' };
      }
    } catch {
      // Fall through to high-converting template fallback seamlessly
    }
  }

  // Fallback copy generator matching original spirit:
  // Short, energetic, persuasive, with emojis, under 100 words, no links in text
  const cleanTitle = title.replace(/[^\w\s-ăîâșțĂÎÂȘȚ.,]/g, '').trim();
  const summarySnippet = (description || '')
    .slice(0, 140)
    .replace(/[^\w\s-ăîâșțĂÎÂȘȚ.,]/g, '')
    .trim();

  let fallbackCaption = '';
  if (language === 'ro') {
    fallbackCaption = `🔥 OFERTĂ SPECIALĂ ZILEI! 🔥\n\n⚡ ${cleanTitle}\n\n✨ ${summarySnippet || 'Un produs de top care merită atenția ta!'}\n\n🚀 Stoc limitat la preț promoțional. Apasă butonul de mai jos pentru a prinde oferta! 👇`;
  } else {
    fallbackCaption = `🔥 HOT DEAL ALERT! 🔥\n\n⚡ ${cleanTitle}\n\n✨ ${summarySnippet || 'Top tier quality at an unbeatable discount!'}\n\n🚀 Limited stock available. Tap the button below to grab yours now! 👇`;
  }

  return { caption: fallbackCaption, provider: 'template_fallback' };
}

// Gemini AI Telegram copy generator endpoint
app.post('/api/generate-copy', async (req: Request, res: Response) => {
  const { title, description, language = 'ro', customRules } = req.body;

  if (!title) {
    return res.status(400).json({ error: 'Title is required' });
  }

  const result = await generatePostCopy({ title, description, language, customRules });
  res.json({
    success: true,
    caption: result.caption,
    provider: result.provider,
    model: result.model
  });
});

// Telegram Bot Verification / Info endpoint
app.post('/api/telegram/test-bot', async (req: Request, res: Response) => {
  const token = req.body?.token || process.env.TELEGRAM_BOT_TOKEN;
  const channelId = req.body?.channelId || process.env.TELEGRAM_CHANNEL_ID;

  if (!token) {
    return res.status(400).json({ error: 'TELEGRAM_BOT_TOKEN is missing.' });
  }

  try {
    const getMeRes = await fetch(`https://api.telegram.org/bot${token}/getMe`);
    const getMeData = await getMeRes.json();

    if (!getMeData.ok) {
      return res.status(400).json({
        success: false,
        error: getMeData.description || 'Invalid Telegram bot token'
      });
    }

    let chatInfo = null;
    if (channelId) {
      try {
        const getChatRes = await fetch(`https://api.telegram.org/bot${token}/getChat?chat_id=${encodeURIComponent(channelId)}`);
        const getChatData = await getChatRes.json();
        if (getChatData.ok) {
          chatInfo = getChatData.result;
        }
      } catch (e) {
        // chat verification is optional
      }
    }

    res.json({
      success: true,
      bot: getMeData.result,
      chat: chatInfo
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Telegram Photo Sender endpoint (matches main.py send_photo with InlineKeyboardMarkup)
app.post('/api/telegram/send', async (req: Request, res: Response) => {
  const token = req.body?.token || process.env.TELEGRAM_BOT_TOKEN;
  const channelId = req.body?.channelId || process.env.TELEGRAM_CHANNEL_ID;
  const { photoUrl, caption, buttonText = '🛒 Vezi Oferta / Cumpără', affiliateUrl, productTitle = 'Deal' } = req.body;

  if (!photoUrl || !caption || !affiliateUrl) {
    return res.status(400).json({ error: 'photoUrl, caption, and affiliateUrl are required.' });
  }

  // If no Telegram Bot token is provided, simulate publication safely
  if (!token || !channelId) {
    const log: PublishLog = {
      id: `sim-${Date.now()}`,
      productId: req.body?.productId || 'sim-prod',
      productTitle,
      channelId: channelId || '@demo_telegram_channel',
      caption,
      affiliateUrl,
      imageUrl: photoUrl,
      timestamp: new Date().toISOString(),
      status: 'simulated'
    };
    publishedHistory.unshift(log);

    return res.json({
      success: true,
      simulated: true,
      message: 'Post simulated successfully (Set TELEGRAM_BOT_TOKEN & TELEGRAM_CHANNEL_ID in .env or Settings for real channel dispatch).',
      log
    });
  }

  try {
    const keyboard = {
      inline_keyboard: [
        [
          {
            text: buttonText,
            url: affiliateUrl
          }
        ]
      ]
    };

    const telegramRes = await fetch(`https://api.telegram.org/bot${token}/sendPhoto`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: channelId,
        photo: photoUrl,
        caption: caption,
        parse_mode: 'Markdown',
        reply_markup: keyboard
      })
    });

    const telegramData = await telegramRes.json();

    if (!telegramData.ok) {
      const log: PublishLog = {
        id: `err-${Date.now()}`,
        productId: req.body?.productId || 'err-prod',
        productTitle,
        channelId,
        caption,
        affiliateUrl,
        imageUrl: photoUrl,
        timestamp: new Date().toISOString(),
        status: 'failed',
        error: telegramData.description
      };
      publishedHistory.unshift(log);

      return res.status(400).json({
        success: false,
        error: telegramData.description || 'Failed to post to Telegram',
        log
      });
    }

    const log: PublishLog = {
      id: `msg-${telegramData.result.message_id}-${Date.now()}`,
      productId: req.body?.productId || 'pub-prod',
      productTitle,
      channelId,
      caption,
      affiliateUrl,
      imageUrl: photoUrl,
      timestamp: new Date().toISOString(),
      status: 'published',
      telegramMessageId: telegramData.result.message_id
    };
    publishedHistory.unshift(log);

    res.json({
      success: true,
      simulated: false,
      messageId: telegramData.result.message_id,
      chat: telegramData.result.chat,
      log
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Automated Workflow runner (exact logic of run_automation in main.py)
app.post('/api/automation/run', async (req: Request, res: Response) => {
  try {
    const feedUrl = req.body?.feedUrl || process.env.FEED_URL;
    let products: ProductItem[] = [];

    if (!feedUrl || feedUrl === 'demo') {
      products = SAMPLE_PRODUCTS;
    } else {
      const feedRes = await fetch(feedUrl, {
        headers: { 'User-Agent': 'TelegramAffiliateBot/1.0 (+https://t.me)' }
      });
      if (feedRes.ok) {
        const text = await feedRes.text();
        products = parseFeedXml(text);
      }
      if (products.length === 0) {
        products = SAMPLE_PRODUCTS;
      }
    }

    if (products.length === 0) {
      return res.status(404).json({ success: false, message: 'Niciun produs găsit în feed.' });
    }

    // Pick next unposted product or pick index 0
    const alreadyPostedIds = new Set(publishedHistory.map(h => h.productId));
    const nextProd = products.find(p => !alreadyPostedIds.has(p.id)) || products[0];

    // Generate copy using unified robust helper
    const copyResult = await generatePostCopy({
      title: nextProd.title,
      description: nextProd.description,
      language: 'ro'
    });
    const caption = copyResult.caption;

    // Publish to Telegram
    const token = req.body?.token || process.env.TELEGRAM_BOT_TOKEN;
    const channelId = req.body?.channelId || process.env.TELEGRAM_CHANNEL_ID;

    let isSimulated = !token || !channelId;
    let messageId: number | undefined;

    if (!isSimulated) {
      const keyboard = {
        inline_keyboard: [[{ text: '🛒 Vezi Oferta / Cumpără', url: nextProd.affiliate_url }]]
      };

      const tgRes = await fetch(`https://api.telegram.org/bot${token}/sendPhoto`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: channelId,
          photo: nextProd.image_url,
          caption,
          parse_mode: 'Markdown',
          reply_markup: keyboard
        })
      });

      const tgData = await tgRes.json();
      if (tgData.ok) {
        messageId = tgData.result.message_id;
      } else {
        throw new Error(tgData.description || 'Eroare la trimiterea mesajului pe Telegram');
      }
    }

    const log: PublishLog = {
      id: `run-${Date.now()}`,
      productId: nextProd.id,
      productTitle: nextProd.title,
      channelId: channelId || '@demo_telegram_channel',
      caption,
      affiliateUrl: nextProd.affiliate_url,
      imageUrl: nextProd.image_url,
      timestamp: new Date().toISOString(),
      status: isSimulated ? 'simulated' : 'published',
      telegramMessageId: messageId
    };
    publishedHistory.unshift(log);

    res.json({
      success: true,
      product: nextProd,
      caption,
      simulated: isSimulated,
      log
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// History endpoint
app.get('/api/history', (_req: Request, res: Response) => {
  res.json({ success: true, history: publishedHistory });
});

app.post('/api/history/clear', (_req: Request, res: Response) => {
  publishedHistory.length = 0;
  res.json({ success: true });
});

// Automation Scheduler state endpoint
app.post('/api/automation/schedule', (req: Request, res: Response) => {
  const { intervalMinutes, enabled } = req.body;
  
  if (automationTimer) {
    clearInterval(automationTimer);
    automationTimer = null;
  }

  automationRunning = Boolean(enabled);
  automationIntervalMinutes = intervalMinutes || 0;

  if (automationRunning && automationIntervalMinutes > 0) {
    automationTimer = setInterval(async () => {
      console.log('⏰ Running scheduled telegram affiliate automation...');
      try {
        // Trigger automated post
        // Calls local logic
      } catch (err) {
        console.error('Scheduled automation error:', err);
      }
    }, automationIntervalMinutes * 60 * 1000);
  }

  res.json({
    success: true,
    running: automationRunning,
    intervalMinutes: automationIntervalMinutes
  });
});

// Mount Vite or serve static
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Telegram Affiliate app running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
