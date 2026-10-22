import asyncio
import os
import requests
import xml.etree.ElementTree as ET
from google import genai
from telegram import InlineKeyboardButton, InlineKeyboardMarkup, Bot

# Preluare din variabilele de mediu (GitHub Secrets)
TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")
TELEGRAM_CHANNEL_ID = os.getenv("TELEGRAM_CHANNEL_ID")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
FEED_URL = os.getenv("FEED_URL")

gemini_client = genai.Client(api_key=GEMINI_API_KEY)
bot = Bot(token=TELEGRAM_BOT_TOKEN)

def parse_product_feed(feed_url):
    response = requests.get(feed_url)
    root = ET.fromstring(response.content)
    
    products = []
    for item in root.findall(".//item"):
        title = item.find("title").text if item.find("title") is not None else "Produs"
        link = item.find("link").text if item.find("link") is not None else ""
        description = item.find("description").text if item.find("description") is not None else ""
        
        image_elem = item.find("enclosure")
        image_url = image_elem.attrib.get("url") if image_elem is not None else ""

        products.append({
            "title": title,
            "description": description,
            "image_url": image_url,
            "affiliate_url": link
        })
    return products

async def run_automation():
    print("📥 Preluare produse din feed...")
    products = parse_product_feed(FEED_URL)
    
    if not products:
        print("❌ Niciun produs găsit.")
        return

    prod = products[0]
    
    prompt = f"""
Creează o postare scurtă, energică și persuasivă pentru Telegram pe baza acestui produs:
- Titlu: {prod['title']}
- Descriere: {prod['description']}
Reguli: Folosește emoji-uri, sub 100 de cuvinte, fără linkuri în text.
"""
    
    response = gemini_client.models.generate_content(
        model="gemini-2.5-flash",
        contents=prompt
    )
    
    keyboard = [[InlineKeyboardButton("🛒 Vezi Oferta / Cumpără", url=prod['affiliate_url'])]]
    
    async with bot:
        await bot.send_photo(
            chat_id=TELEGRAM_CHANNEL_ID,
            photo=prod['image_url'],
            caption=response.text.strip(),
            parse_mode="Markdown",
            reply_markup=InlineKeyboardMarkup(keyboard)
        )
    print("✅ Produs publicat automat pe Telegram!")

if __name__ == "__main__":
    asyncio.run(run_automation())
