import { GoogleGenAI } from "@google/genai";
import { XMLParser } from "fast-xml-parser";

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "";
const TELEGRAM_CHANNEL_ID = process.env.TELEGRAM_CHANNEL_ID || "";
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
const FEED_URL = process.env.FEED_URL || "";

const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

interface Product {
  title: string;
  description: string;
  imageUrl: string;
  affiliateUrl: string;
}

async function parseFeed(): Promise<Product[]> {
  try {
    const response = await fetch(FEED_URL);
    const xmlData = await response.text();

    const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "@_" });
    const result = parser.parse(xmlData);

    const items = result.products?.product || result.rss?.channel?.item || result.feed?.entry || [];
    const products: Product[] = [];

    for (const item of items) {
      const title = item.product_name || item.title || "Produs";
      const link = item.product_aff_link || item.link || "";
      const description = item.product_desc || item.description || "";
      
      const imageUrl = item.product_pic || item.image_link || item.image_url || item.image || item.picture || "";

      let formattedAffiliateUrl = typeof link === "string" ? link : "";
      if (formattedAffiliateUrl.startsWith("//")) {
        formattedAffiliateUrl = "https:" + formattedAffiliateUrl;
      }

      products.push({
        title: typeof title === "string" ? title : "Produs",
        description: typeof description === "string" ? description : "",
        imageUrl: typeof imageUrl === "string" ? imageUrl : "",
        affiliateUrl: formattedAffiliateUrl
      });
    }

    return products;
  } catch (error) {
    console.error("❌ Eroare la parsarea feed-ului:", error);
    return [];
  }
}

async function sendToTelegram(imageUrl: string, caption: string, affiliateUrl: string) {
  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendPhoto`;
  
  const payload = {
    chat_id: TELEGRAM_CHANNEL_ID,
    photo: imageUrl,
    caption: caption,
    parse_mode: "Markdown",
    reply_markup: {
      inline_keyboard: [
        [{ text: "🛒 Vezi Oferta / Cumpără", url: affiliateUrl }]
      ]
    }
  };

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error(`Telegram API error: ${await response.text()}`);
  }
}

async function generateWithFallback(prod: Product): Promise<string> {
  const MODELS_TO_TRY = ["gemini-3.8-flash", "gemini-2.5-flash", "gemini-2.0-flash"];

  const prompt = `Creează o postare scurtă, energică și persuasivă pentru Telegram pe baza acestui produs:\n- Titlu: ${prod.title}\n- Descriere: ${prod.description}\nReguli: Folosește emoji-uri, sub 100 de cuvinte, fără linkuri în text.`;

  for (const modelName of MODELS_TO_TRY) {
    try {
      console.log(`🤖 Încercăm generarea cu modelul: ${modelName}`);
      const response = await ai.models.generateContent({
        model: modelName,
        contents: prompt,
      });
      if (response.text) {
        return response.text;
      }
    } catch (err: any) {
      console.warn(`⚠️ Modelul ${modelName} a eșuat: ${err.message || err}`);
      continue;
    }
  }

  // Fallback inteligent dacă toate modelele eșuează: folosește titlul produsului
  console.log("⚠️ Se folosește textul de rezervă bazat pe produs.");
  return `🔥 **Super Ofertă disponibilă!**\n\n📦 ${prod.title}\n\nNu rata această oportunitate! Verifică detaliile de mai jos 👇`;
}

async function run() {
  console.log("📥 Se descarcă feed-ul de produse...");
  const products = await parseFeed();

  if (products.length ===0) {
    console.log("❌ Nu s-au găsit produse în feed.");
    return;
}

  const prod = products[0];
  console.log(`🤖 Generăm textul pentru: ${prod.title}`);
  
  const postText = await generateWithFallback(prod);

  console.log("📤 Publicăm pe Telegram...");
  await sendToTelegram(prod.imageUrl, postText, prod.affiliateUrl);

  console.log("✅ Postarea a fost trimisă cu succes pe Telegram!");
}

run().catch((err) => {
  console.error("❌ Eroare în script:", err);
  process.exit(1);
});
