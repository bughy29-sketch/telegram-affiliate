import { XMLParser } from 'fast-xml-parser';
import { GoogleGenAI } from '@google/genai';

// Built-in sample products for fallback / testing
const SAMPLE_PRODUCTS = [
  {
    id: 'prod-1',
    title: 'Căști Wireless Sony WH-1000XM5 cu Anulare Activă a Zgomotului',
    description: 'Bucură-te de o experiență audio imersivă cu cel mai avansat sistem Noise Cancelling Sony. Autonomie de până la 30 ore.',
    image_url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80',
    affiliate_url: 'https://example.com/affiliate/sony-wh1000xm5?ref=telegram_affiliate',
    price: '1.499,99 Lei',
    category: 'Audio & Gadgets'
  },
  {
    id: 'prod-2',
    title: 'Ceas Smartwatch Garmin Fenix 7 Pro Sapphire Solar',
    description: 'Ediție multisport premium cu încărcare solară, lanternă LED integrată și hărți TopoActive.',
    image_url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80',
    affiliate_url: 'https://example.com/affiliate/garmin-fenix-7?ref=telegram_affiliate',
    price: '3.899,00 Lei',
    category: 'Smartwatches'
  },
  {
    id: 'prod-3',
    title: 'Espressor Automat Philips Seria 5400 LatteGo',
    description: '12 specialități de cafea la o simplă atingere. Sistem inovator de spumare LatteGo curățabil în 15 secunde.',
    image_url: 'https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?w=800&auto=format&fit=crop&q=80',
    affiliate_url: 'https://example.com/affiliate/philips-lattego?ref=telegram_affiliate',
    price: '2.599,00 Lei',
    category: 'Electrocasnice'
  }
];

function parseFeedXml(xmlContent: string) {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_'
  });
  const parsed = parser.parse(xmlContent);
  const items = parsed?.rss?.channel?.item || 
                parsed?.channel?.item || 
                parsed?.feed?.entry || 
                parsed?.products?.product || 
                parsed?.items?.item ||
                [];

  const itemList = Array.isArray(items) ? items : (items ? [items] : []);
  const products: any[] = [];

  for (let i = 0; i < itemList.length; i++) {
    const item = itemList[i];
    const title = item.title || item['g:title'] || item.name || `Produs #${i + 1}`;
    const link = item.link?.['@_href'] || item.link || item['g:link'] || item.url || '';
    const description = item.description || item['g:description'] || item.summary || '';
    
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

    if (!imageUrl) {
      imageUrl = 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=800&auto=format&fit=crop&q=80';
    }

    const cleanDesc = typeof description === 'string' 
      ? description.replace(/<\/?[^>]+(>|$)/g, ' ').replace(/\s+/g, ' ').trim() 
      : String(description || '');

    products.push({
      id: `item-${i}-${Date.now().toString(36)}`,
      title: typeof title === 'string' ? title.trim() : String(title || ''),
      description: cleanDesc,
      image_url: imageUrl,
      affiliate_url: typeof link === 'string' ? link.trim() : String(link || ''),
      price: item['g:price'] || item.price || '',
      category: item.category || item['g:product_type'] || ''
    });
  }

  return products;
}

async function generateCopy(title: string, description: string, price?: string): Promise<string> {
  const geminiKey = process.env.GEMINI_API_KEY;

  if (geminiKey && geminiKey.startsWith('AIza') && geminiKey.length >= 35) {
    try {
      const ai = new GoogleGenAI({
        apiKey: geminiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build'
          }
        }
      });

      const prompt = `
Creează o postare scurtă, energică și persuasivă pentru Telegram pe baza acestui produs:
- Titlu: ${title}
- Descriere: ${description || 'Calitate superioară, ofertă limitată'}
${price ? `- Preț: ${price}` : ''}
Reguli: Folosește emoji-uri, sub 100 de cuvinte, fără linkuri în text (linkul va fi pe buton).
`.trim();

      const response = await ai.models.generateContent({
        model: 'gemini-flash-latest',
        contents: prompt
      });

      if (response.text) {
        return response.text.trim();
      }
    } catch (e) {
      console.warn('⚠️ Eroare la generarea prin Gemini, se folosește șablonul de rezervă:', e);
    }
  }

  return `🔥 OFERTĂ SPECIALĂ ZILEI! 🔥\n\n⚡ ${title}\n${price ? `💰 Preț: ${price}\n` : ''}\n✨ ${description ? description.slice(0, 140) : 'Ofertă excelentă de neratat!'}\n\n🚀 Stoc limitat la preț promoțional. Apasă butonul de mai jos pentru a comanda! 👇`;
}

async function main() {
  console.log('⚡ Telegram Affiliate Automation Runner');
  console.log('--------------------------------------------------');

  const feedUrl = process.env.FEED_URL;
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const channelId = process.env.TELEGRAM_CHANNEL_ID;

  // 1. Fetch Feed
  console.log(`📥 Preluare produse din feed: ${feedUrl || 'Sample Feed Demo'}`);
  let products = SAMPLE_PRODUCTS;

  if (feedUrl && feedUrl !== 'demo') {
    try {
      const res = await fetch(feedUrl, {
        headers: { 'User-Agent': 'TelegramAffiliateBot/1.0 (+https://t.me)' }
      });
      if (res.ok) {
        const text = await res.text();
        const parsed = parseFeedXml(text);
        if (parsed.length > 0) {
          products = parsed;
          console.log(`✅ ${products.length} produse identificate în feed-ul XML.`);
        }
      }
    } catch (e: any) {
      console.warn(`⚠️ Nu s-a putut descărca feed-ul (${e.message}), se folosesc produsele demo.`);
    }
  }

  const selectedProduct = products[0];
  console.log(`🔎 Produs selectat: "${selectedProduct.title}"`);
  if (selectedProduct.price) {
    console.log(`💰 Preț detectat: ${selectedProduct.price}`);
  }

  // 2. Generate Copy
  console.log('🤖 Generare descriere persuasivă cu Google Gemini AI...');
  const caption = await generateCopy(selectedProduct.title, selectedProduct.description, selectedProduct.price);
  console.log('--- Text Generat ---');
  console.log(caption);
  console.log('--------------------');

  // 3. Post to Telegram
  if (!token || !channelId) {
    console.log('⚠️ TELEGRAM_BOT_TOKEN sau TELEGRAM_CHANNEL_ID lipsesc.');
    console.log('👉 Rulare în mod SIMULARE (nu s-a publicat pe canalul live).');
    process.exit(0);
  }

  console.log(`🚀 Trimitere postare către canalul Telegram: ${channelId}...`);

  const keyboard = {
    inline_keyboard: [
      [
        {
          text: '🛒 Vezi Oferta / Cumpără',
          url: selectedProduct.affiliate_url
        }
      ]
    ]
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
  if (!tgData.ok) {
    console.error(`❌ Eroare Telegram API: ${tgData.description || 'Necunoscută'}`);
    process.exit(1);
  }

  console.log(`✅ Succes! Mesaj publicat pe canal. Message ID: ${tgData.result.message_id}`);
}

main().catch((err) => {
  console.error('Fatal execution error:', err);
  process.exit(1);
});
