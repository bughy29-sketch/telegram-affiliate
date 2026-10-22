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

export type WorkflowTone = 'energetic' | 'flash_deal' | 'premium' | 'tech_specs' | 'custom';
export type WorkflowLanguage = 'ro' | 'en' | 'es' | 'fr' | 'de';
export type WorkflowStrategy = 'fifo' | 'random' | 'highest_price';
export type WorkflowScheduleType = 'manual' | 'interval' | 'cron';

export interface Workflow {
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
  selectionStrategy: WorkflowStrategy;
  // AI Settings
  language: WorkflowLanguage;
  tone: WorkflowTone;
  customInstructions?: string;
  includePriceInCaption: boolean;
  emojiLevel: 'high' | 'normal' | 'minimal';
  // Telegram Settings
  channelId?: string;
  buttonText: string;
  // Trigger & Schedule
  scheduleType: WorkflowScheduleType;
  intervalMinutes: number;
  cronExpression?: string;
  // Run statistics
  lastRunAt?: string;
  totalRuns: number;
  successfulRuns: number;
  createdAt: string;
}

export interface WorkflowRunResult {
  success: boolean;
  workflowId: string;
  product?: ProductItem;
  caption?: string;
  simulated?: boolean;
  log?: PublishLog;
  error?: string;
}
