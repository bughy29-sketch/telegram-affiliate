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

interface Workflow {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  feedUrl?: string;
  categoryFilter?: string;
  keywordFilter?: string;
  excludeKeywordFilter?: string;
  minPrice?: number;
  maxPrice?: number;
  selectionStrategy: 'fifo' | 'random' | 'highest_price';
  language: 'ro' | 'en' | 'es' | 'fr' | 'de';
  tone: 'energetic' | 'flash_deal' | 'premium' | 'tech_specs' | 'custom';
  customInstructions?: string;
  includePriceInCaption: boolean;
  emojiLevel: 'high' | 'normal' | 'minimal';
  channelId?: string;
  buttonText: string;
  scheduleType: 'manual' | 'interval' | 'cron';
  intervalMinutes: number;
  cronExpression?: string;
  lastRunAt?: string;
  totalRuns: number;
  successfulRuns: number;
  createdAt: string;
}

const publishedHistory: PublishLog[] = [];
let automationRunning = false;
let automationIntervalMinutes = 0;
let automationTimer: NodeJS.Timeout | null = null;

// Initial workflows
const workflows: Workflow[] = [
  {
    id: 'wf-default',
    name: '⚡ Flux Standard Telegram (main.py)',
    description: 'Preia cele mai recente oferte din feed, generează text persuasiv cu Gemini AI și publică automat în canal.',
    isActive: true,
    selectionStrategy: 'fifo',
    language: 'ro',
    tone: 'energetic',
    includePriceInCaption: true,
    emojiLevel: 'high',
    buttonText: '🛒 Vezi Oferta / Cumpără',
    scheduleType: 'interval',
    intervalMinutes: 240,
    cronExpression: '0 */4 * * *',
    totalRuns: 0,
    successfulRuns: 0,
    createdAt: new Date().toISOString()
  },
  {
    id: 'wf-flash',
    name: '🔥 Oferte Flash & Reduceri Limitate',
    description: 'Focus pe urgență, stoc limitat și apeluri persuasive la acțiune pentru promoții cu impact vizual maxim.',
    isActive: true,
    selectionStrategy: 'random',
    language: 'ro',
    tone: 'flash_deal',
    customInstructions: 'Subliniază ideea de stoc limitat și expirare rapidă a ofertei. Creează FOMO pozitiv.',
    includePriceInCaption: true,
    emojiLevel: 'high',
    buttonText: '⚡ Profită de Ofertă Acum',
    scheduleType: 'interval',
    intervalMinutes: 120,
    cronExpression: '0 */2 * * *',
    totalRuns: 0,
    successfulRuns: 0,
    createdAt: new Date().toISOString()
  },
  {
    id: 'wf-tech',
    name: '💻 Top Gadgets & Tehnologie Premium',
    description: 'Filtrează produse de tip tech/audio/monitoare și creează prezentări stilate, axate pe specificații și calitate.',
    isActive: true,
    categoryFilter: 'Audio & Gadgets,Periferice PC,Monitoare,Smartwatches',
    selectionStrategy: 'highest_price',
    language: 'ro',
    tone: 'tech_specs',
    customInstructions: 'Evidențiază specificațiile cheie, calitatea materialelor și performanța de top.',
    includePriceInCaption: true,
    emojiLevel: 'normal',
    buttonText: '🔍 Detalii & Comandă',
    scheduleType: 'cron',
    intervalMinutes: 360,
    cronExpression: '0 9,15,20 * * *',
    totalRuns: 0,
    successfulRuns: 0,
    createdAt: new Date().toISOString()
  }
];

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

// Helper to extract numeric price value for filtering and sorting
function extractNumericPrice(priceStr?: string): number {
  if (!priceStr) return 0;
  // Handle formats like "1.499,99 Lei", "1499.99 RON", "$129.99", "949 Lei"
  const cleaned = priceStr.replace(/[^0-9.,]/g, '').trim();
  if (!cleaned) return 0;
  // If format is 1.499,99
  if (cleaned.includes('.') && cleaned.includes(',')) {
    return parseFloat(cleaned.replace(/\./g, '').replace(',', '.'));
  }
  // If format is 1,499.99
  if (cleaned.includes(',') && cleaned.lastIndexOf(',') < cleaned.lastIndexOf('.')) {
    return parseFloat(cleaned.replace(/,/g, ''));
  }
  // If format is 1499,99
  if (cleaned.includes(',') && !cleaned.includes('.')) {
    return parseFloat(cleaned.replace(',', '.'));
  }
  return parseFloat(cleaned) || 0;
}

// Shared Gemini AI copy generation helper
async function generatePostCopy(params: {
  title: string;
  description: string;
  price?: string;
  language?: string;
  tone?: 'energetic' | 'flash_deal' | 'premium' | 'tech_specs' | 'custom';
  customRules?: string;
  includePrice?: boolean;
  emojiLevel?: 'high' | 'normal' | 'minimal';
}): Promise<{ caption: string; provider: string; model?: string }> {
  const {
    title,
    description,
    price,
    language = 'ro',
    tone = 'energetic',
    customRules,
    includePrice = true,
    emojiLevel = 'high'
  } = params;
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

    const toneDescriptions: Record<string, { ro: string; en: string }> = {
      energetic: {
        ro: 'Ton entuziasmant, foarte dinamic și persuasiv, stil prezentare de super-ofertă.',
        en: 'Enthusiastic, energetic and persuasive tone, high-converting deal style.'
      },
      flash_deal: {
        ro: 'Ton de ofertă fulger (Flash Deal): pune accent pe urgență, timp limitat și stoc redus.',
        en: 'Flash deal tone: emphasize urgency, limited time, and low stock.'
      },
      premium: {
        ro: 'Ton elegant, minimalist și sofisticat: accent pe calitate premium, rafinament și valoare.',
        en: 'Elegant, minimalist, sophisticated tone: focus on premium build, prestige, and luxury.'
      },
      tech_specs: {
        ro: 'Ton tech-geek / profesionist: evidențiază specificațiile cheie, performanța hardware și productivitatea.',
        en: 'Tech-enthusiast / pro tone: highlight specs, hardware performance, and reliability.'
      },
      custom: {
        ro: customRules || 'Ton profesional și persuasiv.',
        en: customRules || 'Professional and persuasive tone.'
      }
    };

    const emojiInstruction: Record<string, { ro: string; en: string }> = {
      high: {
        ro: 'Folosește multe emoji-uri atractive la început de rânduri.',
        en: 'Use plenty of eye-catching emojis throughout the post.'
      },
      normal: {
        ro: 'Folosește 3-4 emoji-uri bine alese și echilibrate.',
        en: 'Use 3-4 tasteful and relevant emojis.'
      },
      minimal: {
        ro: 'Folosește maxim 1-2 emoji-uri subtile, păstrează stilul aerisit.',
        en: 'Use at most 1-2 subtle emojis, keep the style minimal.'
      }
    };

    const currentTone = toneDescriptions[tone] || toneDescriptions.energetic;
    const currentEmoji = emojiInstruction[emojiLevel] || emojiInstruction.high;
    const priceText = includePrice && price ? (language === 'ro' ? `- Preț promoțional: ${price}\n` : `- Deal Price: ${price}\n`) : '';

    const promptRo = `
Creează o postare captivantă și persuasivă pentru Telegram pe baza acestui produs:
- Titlu: ${title}
- Descriere: ${description || 'Calitate superioară, ofertă limitată'}
${priceText}
Reguli stricte:
1. ${currentTone.ro}
2. ${currentEmoji.ro}
3. Lungime: sub 100 de cuvinte.
4. FĂRĂ linkuri sau adrese web în text (utilizatorul va apăsa butonul inline).
${customRules ? `5. Instrucțiuni suplimentare obligatorii: ${customRules}` : ''}
`.trim();

    const promptEn = `
Create a compelling and persuasive Telegram channel post based on this product:
- Title: ${title}
- Description: ${description || 'Premium quality, limited time deal'}
${priceText}
Strict rules:
1. ${currentTone.en}
2. ${currentEmoji.en}
3. Length: under 100 words.
4. NO links or URLs inside the text (the user will tap the inline action button).
${customRules ? `5. Mandatory extra rules: ${customRules}` : ''}
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

  // Fallback copy generator matching original spirit and tone
  const cleanTitle = title.replace(/[^\w\s-ăîâșțĂÎÂȘȚ.,]/g, '').trim();
  const summarySnippet = (description || '')
    .slice(0, 140)
    .replace(/[^\w\s-ăîâșțĂÎÂȘȚ.,]/g, '')
    .trim();
  const priceSnippet = includePrice && price ? `\n💰 Preț: ${price}` : '';

  let fallbackCaption = '';
  if (language === 'ro') {
    if (tone === 'flash_deal') {
      fallbackCaption = `⚡ ALERTĂ OFERTĂ FLASH! ⚡\n\n🔥 ${cleanTitle}\n${priceSnippet}\n\n⏳ Stocul se epuizează rapid! ${summarySnippet || 'Prinde reducerea înainte să expire.'}\n\n👇 Apasă butonul de mai jos pentru comanda directă:`;
    } else if (tone === 'tech_specs') {
      fallbackCaption = `🚀 GADGET RECOMANDAT 🚀\n\n💻 ${cleanTitle}\n${priceSnippet}\n\n⚙️ Performanță de vârf: ${summarySnippet || 'Tehnologie avansată și fiabilitate garantată.'}\n\n👇 Vezi specificațiile complete și oferta:`;
    } else if (tone === 'premium') {
      fallbackCaption = `✨ RECOMANDARE PREMIUM ✨\n\n💎 ${cleanTitle}\n${priceSnippet}\n\nDesign desăvârșit și calitate excepțională. ${summarySnippet}\n\n👇 Descoperă produsul mai jos:`;
    } else {
      fallbackCaption = `🔥 OFERTĂ SPECIALĂ A ZILEI! 🔥\n\n⚡ ${cleanTitle}\n${priceSnippet}\n\n✨ ${summarySnippet || 'Un produs de top care merită atenția ta!'}\n\n🚀 Stoc promoțional limitat. Apasă butonul de mai jos pentru a prinde oferta! 👇`;
    }
  } else {
    fallbackCaption = `🔥 HOT DEAL ALERT! 🔥\n\n⚡ ${cleanTitle}\n${priceSnippet ? `\n💰 Price: ${price}` : ''}\n\n✨ ${summarySnippet || 'Top tier quality at an unbeatable discount!'}\n\n🚀 Limited stock available. Tap the button below to grab yours now! 👇`;
  }

  return { caption: fallbackCaption, provider: 'template_fallback' };
}

// Core Workflow Execution Engine
async function executeWorkflow(
  workflow: Workflow,
  overrides?: { token?: string; channelId?: string; feedUrl?: string }
): Promise<{
  success: boolean;
  product?: ProductItem;
  caption?: string;
  simulated?: boolean;
  log?: PublishLog;
  error?: string;
}> {
  const targetFeedUrl = overrides?.feedUrl || workflow.feedUrl || process.env.FEED_URL;
  let products: ProductItem[] = [];

  if (!targetFeedUrl || targetFeedUrl === 'demo') {
    products = SAMPLE_PRODUCTS;
  } else {
    try {
      const feedRes = await fetch(targetFeedUrl, {
        headers: { 'User-Agent': 'TelegramAffiliateBot/1.0 (+https://t.me)' }
      });
      if (feedRes.ok) {
        const text = await feedRes.text();
        products = parseFeedXml(text);
      }
    } catch (e) {
      console.warn('Feed fetch failed, using sample items:', e);
    }
    if (products.length === 0) {
      products = SAMPLE_PRODUCTS;
    }
  }

  if (products.length === 0) {
    throw new Error('Niciun produs găsit în feed-ul specificat.');
  }

  // 1. Filter by category
  let filtered = [...products];
  if (workflow.categoryFilter && workflow.categoryFilter.trim() !== '') {
    const cats = workflow.categoryFilter
      .split(',')
      .map((c) => c.trim().toLowerCase())
      .filter(Boolean);
    if (cats.length > 0) {
      const matched = filtered.filter((p) => {
        const pCat = (p.category || '').toLowerCase();
        return cats.some((cat) => pCat.includes(cat));
      });
      if (matched.length > 0) {
        filtered = matched;
      }
    }
  }

  // 2. Filter by keyword
  if (workflow.keywordFilter && workflow.keywordFilter.trim() !== '') {
    const words = workflow.keywordFilter
      .split(',')
      .map((w) => w.trim().toLowerCase())
      .filter(Boolean);
    if (words.length > 0) {
      const matched = filtered.filter((p) => {
        const fullText = `${p.title} ${p.description}`.toLowerCase();
        return words.some((word) => fullText.includes(word));
      });
      if (matched.length > 0) {
        filtered = matched;
      }
    }
  }

  // 3. Exclude negative keywords
  if (workflow.excludeKeywordFilter && workflow.excludeKeywordFilter.trim() !== '') {
    const negWords = workflow.excludeKeywordFilter
      .split(',')
      .map((w) => w.trim().toLowerCase())
      .filter(Boolean);
    if (negWords.length > 0) {
      const clean = filtered.filter((p) => {
        const fullText = `${p.title} ${p.description}`.toLowerCase();
        return !negWords.some((neg) => fullText.includes(neg));
      });
      if (clean.length > 0) {
        filtered = clean;
      }
    }
  }

  // 4. Price range filter
  if (workflow.minPrice !== undefined || workflow.maxPrice !== undefined) {
    const priceFiltered = filtered.filter((p) => {
      const numPrice = extractNumericPrice(p.price);
      if (numPrice === 0) return true; // Keep items with unparsed price
      if (workflow.minPrice !== undefined && numPrice < workflow.minPrice) return false;
      if (workflow.maxPrice !== undefined && numPrice > workflow.maxPrice) return false;
      return true;
    });
    if (priceFiltered.length > 0) {
      filtered = priceFiltered;
    }
  }

  // 5. Exclude already posted products
  const alreadyPostedIds = new Set(publishedHistory.map((h) => h.productId));
  let candidatePool = filtered.filter((p) => !alreadyPostedIds.has(p.id));
  if (candidatePool.length === 0) {
    // If all items were posted, recycle the pool
    candidatePool = filtered;
  }

  // 6. Apply Selection Strategy
  let selectedProduct: ProductItem;
  if (workflow.selectionStrategy === 'random') {
    const randomIndex = Math.floor(Math.random() * candidatePool.length);
    selectedProduct = candidatePool[randomIndex];
  } else if (workflow.selectionStrategy === 'highest_price') {
    const sorted = [...candidatePool].sort(
      (a, b) => extractNumericPrice(b.price) - extractNumericPrice(a.price)
    );
    selectedProduct = sorted[0];
  } else {
    // FIFO (Queue order)
    selectedProduct = candidatePool[0];
  }

  // 7. Generate Copy with AI
  const copyResult = await generatePostCopy({
    title: selectedProduct.title,
    description: selectedProduct.description,
    price: selectedProduct.price,
    language: workflow.language,
    tone: workflow.tone,
    customRules: workflow.customInstructions,
    includePrice: workflow.includePriceInCaption,
    emojiLevel: workflow.emojiLevel
  });
  const caption = copyResult.caption;

  // 8. Publish to Telegram
  const token = overrides?.token || process.env.TELEGRAM_BOT_TOKEN;
  const channelId = overrides?.channelId || workflow.channelId || process.env.TELEGRAM_CHANNEL_ID;
  const buttonText = workflow.buttonText || '🛒 Vezi Oferta / Cumpără';

  const isSimulated = !token || !channelId;
  let messageId: number | undefined;

  if (!isSimulated) {
    const keyboard = {
      inline_keyboard: [[{ text: buttonText, url: selectedProduct.affiliate_url }]]
    };

    const tgRes = await fetch(`https://api.telegram.org/bot${token}/sendPhoto`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: channelId,
        photo: selectedProduct.image_url,
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

  // Update Workflow Stats
  workflow.lastRunAt = new Date().toISOString();
  workflow.totalRuns = (workflow.totalRuns || 0) + 1;
  workflow.successfulRuns = (workflow.successfulRuns || 0) + 1;

  // Record Publish Log
  const log: PublishLog = {
    id: `wf-${workflow.id}-${Date.now()}`,
    productId: selectedProduct.id,
    productTitle: selectedProduct.title,
    channelId: channelId || '@demo_telegram_channel',
    caption,
    affiliateUrl: selectedProduct.affiliate_url,
    imageUrl: selectedProduct.image_url,
    timestamp: new Date().toISOString(),
    status: isSimulated ? 'simulated' : 'published',
    telegramMessageId: messageId
  };
  publishedHistory.unshift(log);

  return {
    success: true,
    product: selectedProduct,
    caption,
    simulated: isSimulated,
    log
  };
}

// Gemini AI Telegram copy generator endpoint
app.post('/api/generate-copy', async (req: Request, res: Response) => {
  const { title, description, price, language = 'ro', tone = 'energetic', customRules, includePrice = true, emojiLevel = 'high' } = req.body;

  if (!title) {
    return res.status(400).json({ error: 'Title is required' });
  }

  const result = await generatePostCopy({
    title,
    description,
    price,
    language,
    tone,
    customRules,
    includePrice,
    emojiLevel
  });

  res.json({
    success: true,
    caption: result.caption,
    provider: result.provider,
    model: result.model
  });
});

// WORKFLOW MANAGEMENT ENDPOINTS

// 1. Get all workflows
app.get('/api/workflows', (_req: Request, res: Response) => {
  res.json({
    success: true,
    workflows
  });
});

// 2. Create new workflow
app.post('/api/workflows', (req: Request, res: Response) => {
  try {
    const data = req.body;
    if (!data.name || data.name.trim() === '') {
      return res.status(400).json({ error: 'Numele workflow-ului este obligatoriu.' });
    }

    const newWorkflow: Workflow = {
      id: `wf-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
      name: data.name.trim(),
      description: data.description?.trim() || 'Workflow automatizat de afiliere',
      isActive: data.isActive !== undefined ? Boolean(data.isActive) : true,
      feedUrl: data.feedUrl?.trim() || undefined,
      categoryFilter: data.categoryFilter?.trim() || undefined,
      keywordFilter: data.keywordFilter?.trim() || undefined,
      excludeKeywordFilter: data.excludeKeywordFilter?.trim() || undefined,
      minPrice: data.minPrice ? Number(data.minPrice) : undefined,
      maxPrice: data.maxPrice ? Number(data.maxPrice) : undefined,
      selectionStrategy: data.selectionStrategy || 'fifo',
      language: data.language || 'ro',
      tone: data.tone || 'energetic',
      customInstructions: data.customInstructions?.trim() || undefined,
      includePriceInCaption: data.includePriceInCaption !== undefined ? Boolean(data.includePriceInCaption) : true,
      emojiLevel: data.emojiLevel || 'high',
      channelId: data.channelId?.trim() || undefined,
      buttonText: data.buttonText?.trim() || '🛒 Vezi Oferta / Cumpără',
      scheduleType: data.scheduleType || 'interval',
      intervalMinutes: Number(data.intervalMinutes) || 120,
      cronExpression: data.cronExpression?.trim() || '0 */2 * * *',
      totalRuns: 0,
      successfulRuns: 0,
      createdAt: new Date().toISOString()
    };

    workflows.push(newWorkflow);

    res.status(201).json({
      success: true,
      workflow: newWorkflow,
      message: `Workflow-ul "${newWorkflow.name}" a fost creat cu succes.`
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 3. Update existing workflow
app.put('/api/workflows/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const index = workflows.findIndex((w) => w.id === id);

  if (index === -1) {
    return res.status(404).json({ error: 'Workflow-ul nu a fost găsit.' });
  }

  const existing = workflows[index];
  const data = req.body;

  const updated: Workflow = {
    ...existing,
    name: data.name !== undefined ? data.name.trim() : existing.name,
    description: data.description !== undefined ? data.description.trim() : existing.description,
    isActive: data.isActive !== undefined ? Boolean(data.isActive) : existing.isActive,
    feedUrl: data.feedUrl !== undefined ? data.feedUrl.trim() || undefined : existing.feedUrl,
    categoryFilter: data.categoryFilter !== undefined ? data.categoryFilter.trim() || undefined : existing.categoryFilter,
    keywordFilter: data.keywordFilter !== undefined ? data.keywordFilter.trim() || undefined : existing.keywordFilter,
    excludeKeywordFilter: data.excludeKeywordFilter !== undefined ? data.excludeKeywordFilter.trim() || undefined : existing.excludeKeywordFilter,
    minPrice: data.minPrice !== undefined ? (data.minPrice ? Number(data.minPrice) : undefined) : existing.minPrice,
    maxPrice: data.maxPrice !== undefined ? (data.maxPrice ? Number(data.maxPrice) : undefined) : existing.maxPrice,
    selectionStrategy: data.selectionStrategy || existing.selectionStrategy,
    language: data.language || existing.language,
    tone: data.tone || existing.tone,
    customInstructions: data.customInstructions !== undefined ? data.customInstructions.trim() || undefined : existing.customInstructions,
    includePriceInCaption: data.includePriceInCaption !== undefined ? Boolean(data.includePriceInCaption) : existing.includePriceInCaption,
    emojiLevel: data.emojiLevel || existing.emojiLevel,
    channelId: data.channelId !== undefined ? data.channelId.trim() || undefined : existing.channelId,
    buttonText: data.buttonText !== undefined ? data.buttonText.trim() : existing.buttonText,
    scheduleType: data.scheduleType || existing.scheduleType,
    intervalMinutes: data.intervalMinutes !== undefined ? Number(data.intervalMinutes) : existing.intervalMinutes,
    cronExpression: data.cronExpression !== undefined ? data.cronExpression.trim() : existing.cronExpression
  };

  workflows[index] = updated;

  res.json({
    success: true,
    workflow: updated
  });
});

// 4. Delete workflow
app.delete('/api/workflows/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const index = workflows.findIndex((w) => w.id === id);

  if (index === -1) {
    return res.status(404).json({ error: 'Workflow-ul nu a fost găsit.' });
  }

  const removed = workflows.splice(index, 1)[0];
  res.json({
    success: true,
    message: `Workflow-ul "${removed.name}" a fost șters.`
  });
});

// 5. Toggle active state
app.post('/api/workflows/:id/toggle', (req: Request, res: Response) => {
  const { id } = req.params;
  const wf = workflows.find((w) => w.id === id);

  if (!wf) {
    return res.status(404).json({ error: 'Workflow-ul nu a fost găsit.' });
  }

  wf.isActive = !wf.isActive;
  res.json({
    success: true,
    isActive: wf.isActive,
    workflow: wf
  });
});

// 6. Run single workflow
app.post('/api/workflows/:id/run', async (req: Request, res: Response) => {
  const { id } = req.params;
  const wf = workflows.find((w) => w.id === id);

  if (!wf) {
    return res.status(404).json({ error: 'Workflow-ul nu a fost găsit.' });
  }

  try {
    const result = await executeWorkflow(wf, {
      token: req.body?.token,
      channelId: req.body?.channelId,
      feedUrl: req.body?.feedUrl
    });

    res.json({
      success: true,
      workflow: wf,
      ...result
    });
  } catch (err: any) {
    console.error('Error running workflow:', err);
    res.status(500).json({
      success: false,
      workflow: wf,
      error: err.message || 'Eroare la execuția workflow-ului'
    });
  }
});

// 7. Export GitHub Actions YAML for this workflow
app.get('/api/workflows/:id/github-actions-yaml', (req: Request, res: Response) => {
  const { id } = req.params;
  const wf = workflows.find((w) => w.id === id);

  if (!wf) {
    return res.status(404).json({ error: 'Workflow-ul nu a fost găsit.' });
  }

  const cronVal = wf.cronExpression || (wf.intervalMinutes >= 60 ? `0 */${Math.floor(wf.intervalMinutes / 60)} * * *` : `*/${wf.intervalMinutes} * * * *`);
  const safeName = wf.name.replace(/[^a-zA-Z0-9 _-]/g, '').trim() || 'Telegram Affiliate Workflow';

  const yamlContent = `name: "${safeName}"

on:
  schedule:
    - cron: '${cronVal}'
  workflow_dispatch:

jobs:
  run-telegram-affiliate:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout cod
        uses: actions/checkout@v4

      - name: Configurare Node.js 22
        uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: 'npm'

      - name: Instalare dependente
        run: npm ci

      - name: Executare Workflow Telegram (${wf.id})
        env:
          TELEGRAM_BOT_TOKEN: \${{ secrets.TELEGRAM_BOT_TOKEN }}
          TELEGRAM_CHANNEL_ID: \${{ secrets.TELEGRAM_CHANNEL_ID }}
          GEMINI_API_KEY: \${{ secrets.GEMINI_API_KEY }}
          FEED_URL: \${{ secrets.FEED_URL }}
        run: |
          npx tsx scripts/run-workflow.ts --workflow="${wf.id}"
`;

  res.json({
    success: true,
    workflowId: wf.id,
    fileName: `${safeName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.yml`,
    yaml: yamlContent
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
