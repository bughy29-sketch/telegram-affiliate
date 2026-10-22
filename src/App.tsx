import React, { useState, useEffect, useCallback } from 'react';
import { ProductItem, PublishLog, BotConfig } from './types';
import { Navbar } from './components/Navbar';
import { FeedSection } from './components/FeedSection';
import { AiComposer } from './components/AiComposer';
import { TelegramSimulator } from './components/TelegramSimulator';
import { AutomationRunner } from './components/AutomationRunner';
import { HistoryLog } from './components/HistoryLog';
import { SettingsModal } from './components/SettingsModal';

export const App: React.FC = () => {
  const [config, setConfig] = useState<BotConfig | null>(null);
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [feedUrl, setFeedUrl] = useState<string>('');
  const [channelId, setChannelId] = useState<string>('');
  const [selectedProduct, setSelectedProduct] = useState<ProductItem | null>(null);
  const [caption, setCaption] = useState<string>('');
  const [history, setHistory] = useState<PublishLog[]>([]);
  const [activeTab, setActiveTab] = useState<'feed' | 'composer' | 'automation' | 'history'>('feed');

  // Loading states
  const [isLoadingFeed, setIsLoadingFeed] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isRunningAutomation, setIsRunningAutomation] = useState(false);
  const [isPublishingId, setIsPublishingId] = useState<string | null>(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Automation runner logs matching main.py stdout
  const [automationLogs, setAutomationLogs] = useState<string[]>([
    '⚡ Telegram Affiliate Bot v1.0 inițializat.',
    '💡 Conectat la motorul de procesare XML Feed & Gemini Flash.'
  ]);

  // Set of published product IDs for badges & duplicate prevention
  const publishedProductIds = new Set(history.map((h) => h.productId));

  // Fetch initial config
  const fetchConfig = useCallback(async () => {
    try {
      const res = await fetch('/api/config');
      if (res.ok) {
        const data: BotConfig = await res.json();
        setConfig(data);
        if (data.channelId && !channelId) {
          setChannelId(data.channelId);
        }
        if (data.feedUrl && !feedUrl) {
          setFeedUrl(data.feedUrl);
        }
      }
    } catch (e) {
      console.warn('Could not load config:', e);
    }
  }, [channelId, feedUrl]);

  // Fetch products from feed URL
  const fetchFeed = useCallback(async (customUrl?: string) => {
    setIsLoadingFeed(true);
    const targetUrl = customUrl !== undefined ? customUrl : feedUrl;

    try {
      const res = await fetch('/api/feed/fetch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feedUrl: targetUrl })
      });

      const data = await res.json();
      if (data.products && Array.isArray(data.products)) {
        setProducts(data.products);
        if (data.products.length > 0 && !selectedProduct) {
          setSelectedProduct(data.products[0]);
        }
      }
    } catch (err) {
      console.error('Failed to load feed:', err);
    } finally {
      setIsLoadingFeed(false);
    }
  }, [feedUrl, selectedProduct]);

  // Fetch history
  const fetchHistory = useCallback(async () => {
    setIsLoadingHistory(true);
    try {
      const res = await fetch('/api/history');
      if (res.ok) {
        const data = await res.json();
        if (data.history) {
          setHistory(data.history);
        }
      }
    } catch (e) {
      console.warn('Failed to load history:', e);
    } finally {
      setIsLoadingHistory(false);
    }
  }, []);

  useEffect(() => {
    fetchConfig();
    fetchFeed();
    fetchHistory();
  }, []);

  // When a product is selected, generate or suggest copy
  const handleSelectProduct = async (product: ProductItem) => {
    setSelectedProduct(product);
    setActiveTab('composer');

    // Auto-generate initial copy with Gemini
    setIsGenerating(true);
    try {
      const res = await fetch('/api/generate-copy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: product.title,
          description: product.description,
          language: 'ro'
        })
      });
      const data = await res.json();
      if (data.caption) {
        setCaption(data.caption);
      }
    } catch (err) {
      console.warn('Failed to generate copy on select:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  // Generate copy explicitly
  const handleGenerateCopy = async (language: string, customTone?: string) => {
    if (!selectedProduct) return;
    setIsGenerating(true);

    try {
      const res = await fetch('/api/generate-copy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: selectedProduct.title,
          description: selectedProduct.description,
          language,
          customRules: customTone
        })
      });
      const data = await res.json();
      if (data.caption) {
        setCaption(data.caption);
      }
    } catch (err) {
      console.error('Copy generation error:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  // Dispatch post to Telegram
  const handleSendToTelegram = async (options: {
    photoUrl: string;
    caption: string;
    buttonText: string;
    affiliateUrl: string;
    productTitle: string;
    channelId: string;
  }) => {
    setIsSending(true);
    try {
      const res = await fetch('/api/telegram/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...options,
          productId: selectedProduct?.id || 'prod'
        })
      });
      const data = await res.json();
      await fetchHistory();
      return data;
    } finally {
      setIsSending(false);
    }
  };

  // Quick 1-click post directly from feed card
  const handleDirectPublish = async (product: ProductItem) => {
    setIsPublishingId(product.id);
    try {
      // 1. Generate text
      const copyRes = await fetch('/api/generate-copy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: product.title,
          description: product.description,
          language: 'ro'
        })
      });
      const copyData = await copyRes.json();
      const generatedCaption = copyData.caption || `🔥 Ofertă de top: ${product.title}\n\n👉 Apasă mai jos pentru detalii!`;

      // 2. Send
      await fetch('/api/telegram/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          photoUrl: product.image_url,
          caption: generatedCaption,
          buttonText: '🛒 Vezi Oferta / Cumpără',
          affiliateUrl: product.affiliate_url,
          productTitle: product.title,
          productId: product.id,
          channelId: channelId || undefined
        })
      });

      await fetchHistory();
    } catch (err) {
      console.error('Error during direct publish:', err);
    } finally {
      setIsPublishingId(null);
    }
  };

  // Run full pipeline matching main.py run_automation()
  const handleRunAutomation = async () => {
    setIsRunningAutomation(true);
    const newLogs: string[] = [];

    const log = (msg: string) => {
      newLogs.push(msg);
      setAutomationLogs((prev) => [...prev, msg]);
    };

    log('📥 Preluare produse din feed...');

    try {
      const res = await fetch('/api/automation/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          feedUrl: feedUrl || undefined,
          channelId: channelId || undefined
        })
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        log(`❌ Eroare la execuție: ${data.error || data.message || 'Eșuat'}`);
        return;
      }

      log(`🔎 Produs selectat: "${data.product.title}"`);
      log(`🤖 Prompt generat cu Gemini: "${data.caption.slice(0, 60)}..."`);
      log(`🚀 Trimitere către Telegram (${channelId || '@canal_afiliat'})...`);
      log('✅ Produs publicat automat pe Telegram!');

      await fetchHistory();
    } catch (err: any) {
      log(`❌ Eroare rețea: ${err.message}`);
    } finally {
      setIsRunningAutomation(false);
    }
  };

  // Clear history
  const handleClearHistory = async () => {
    try {
      await fetch('/api/history/clear', { method: 'POST' });
      setHistory([]);
    } catch (e) {
      console.error('Failed to clear history:', e);
    }
  };

  // Update schedule
  const handleUpdateSchedule = async (intervalMinutes: number, enabled: boolean) => {
    try {
      const res = await fetch('/api/automation/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ intervalMinutes, enabled })
      });
      const data = await res.json();
      if (data.success && config) {
        setConfig({
          ...config,
          automationRunning: data.running,
          automationIntervalMinutes: data.intervalMinutes
        });
      }
    } catch (e) {
      console.error('Failed to update schedule:', e);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Navbar
        config={config}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onRunAutomation={handleRunAutomation}
        isRunningAutomation={isRunningAutomation}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        totalProducts={products.length}
        publishedCount={history.length}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'feed' && (
          <FeedSection
            products={products}
            feedUrl={feedUrl}
            setFeedUrl={setFeedUrl}
            onRefreshFeed={() => fetchFeed(feedUrl)}
            isLoading={isLoadingFeed}
            onSelectProduct={handleSelectProduct}
            selectedProduct={selectedProduct}
            publishedProductIds={publishedProductIds}
            onDirectPublish={handleDirectPublish}
            isPublishingId={isPublishingId}
          />
        )}

        {activeTab === 'composer' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            <AiComposer
              product={selectedProduct}
              caption={caption}
              setCaption={setCaption}
              onGenerate={handleGenerateCopy}
              isGenerating={isGenerating}
            />
            <TelegramSimulator
              product={selectedProduct}
              caption={caption}
              channelId={channelId}
              setChannelId={setChannelId}
              onSendToTelegram={handleSendToTelegram}
              isSending={isSending}
              hasTelegramToken={Boolean(config?.hasTelegramToken)}
            />
          </div>
        )}

        {activeTab === 'automation' && (
          <AutomationRunner
            products={products}
            publishedIds={publishedProductIds}
            onRunAutomation={handleRunAutomation}
            isRunning={isRunningAutomation}
            logs={automationLogs}
            config={config}
            onUpdateSchedule={handleUpdateSchedule}
          />
        )}

        {activeTab === 'history' && (
          <HistoryLog
            history={history}
            onClearHistory={handleClearHistory}
            isLoading={isLoadingHistory}
          />
        )}
      </main>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        config={config}
        channelId={channelId}
        setChannelId={setChannelId}
        feedUrl={feedUrl}
        setFeedUrl={setFeedUrl}
      />

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-4 text-center text-xs text-slate-500">
        <p>
          Telegram Affiliate Automation • Powered by Google Gemini AI & Telegram Bot API
        </p>
      </footer>
    </div>
  );
};

export default App;
