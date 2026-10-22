# Telegram Affiliate Bot & Dashboard

A modern, full-stack React and Node.js application rewritten from the original Python Telegram affiliate automation script (`bughy29-sketch/telegram-affiliate`).

## Features

- **Product XML/RSS Feed Parsing**: Automatically ingests e-commerce feeds (2Performant, Profitshare, Google Merchant XML, RSS 2.0) into structured product deal objects with image, title, price, description, and affiliate link.
- **AI-Powered Copywriting (Gemini 2.5 Flash)**: Preserves the original prompt structure to generate energetic, persuasive Telegram posts with emojis, under 100 words, and no in-text links.
- **Telegram Channel Publisher with Inline Keyboard**: Posts high-res product photos with Markdown captions directly to Telegram channels with an interactive `🛒 Vezi Oferta / Cumpără` inline button redirecting to the affiliate URL.
- **Live Simulator & Editor**: Preview exactly how posts appear to Telegram channel subscribers before publishing, with custom copy editing and CTA button text tweaking.
- **Automated Workflow Runner**: 1-click execution or recurring scheduler of the complete pipeline (`parse feed` ➔ `select queued product` ➔ `generate Gemini copy` ➔ `dispatch to Telegram`).
- **Post History & Analytics**: Tracks all sent and simulated deals with Telegram message IDs, timestamps, and affiliate URLs.

## Environment Variables

Configure in `.env`:
- `TELEGRAM_BOT_TOKEN`: Bot token obtained from @BotFather
- `TELEGRAM_CHANNEL_ID`: Channel ID or username (e.g., `@my_deals_channel` or `-100...`)
- `GEMINI_API_KEY`: Google Gemini API key
- `FEED_URL`: Product XML or RSS feed URL
- `PORT`: Server port (default: 3000)

## Running the Application

```bash
# Start development server (serves Express API and Vite React frontend)
npm run dev

# Build for production
npm run build
```
