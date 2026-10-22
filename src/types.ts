export interface ProductItem {
  id: string;
  title: string;
  description: string;
  image_url: string;
  affiliate_url: string;
  price?: string;
  category?: string;
}

export interface PublishLog {
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

export interface BotConfig {
  hasTelegramToken: boolean;
  hasChannelId: boolean;
  channelId: string;
  hasGeminiKey: boolean;
  feedUrl: string;
  automationRunning: boolean;
  automationIntervalMinutes: number;
}
