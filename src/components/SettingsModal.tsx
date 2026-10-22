import React, { useState } from 'react';
import { BotConfig } from '../types';
import { X, Key, Send, Rss, Sparkles, CheckCircle2, AlertCircle, RefreshCw, HelpCircle } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: BotConfig | null;
  channelId: string;
  setChannelId: (id: string) => void;
  feedUrl: string;
  setFeedUrl: (url: string) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  config,
  channelId,
  setChannelId,
  feedUrl,
  setFeedUrl
}) => {
  const [tokenInput, setTokenInput] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    bot?: any;
    error?: string;
  } | null>(null);

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/telegram/test-bot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: tokenInput || undefined,
          channelId: channelId || undefined
        })
      });
      const data = await res.json();
      setTestResult(data);
    } catch (err: any) {
      setTestResult({
        success: false,
        error: err.message || 'Eroare conexiune la Telegram'
      });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-5 animate-in fade-in duration-200">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Send className="w-5 h-5 text-sky-400" />
            <h3 className="font-bold text-base text-white">Configurare Bot & Variabile de Mediu</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Info Box matching main.py GitHub Secrets */}
        <div className="bg-sky-950/40 border border-sky-800/40 p-3 rounded-xl text-xs text-sky-300 flex items-start gap-2.5">
          <HelpCircle className="w-4 h-4 shrink-0 mt-0.5 text-sky-400" />
          <div>
            <p className="font-semibold">GitHub Secrets & Variabile Environment (.env):</p>
            <p className="text-[11px] opacity-80 mt-0.5">
              Originalul <code className="bg-sky-900/60 px-1 rounded">main.py</code> folosește: <br />
              <code className="text-white">TELEGRAM_BOT_TOKEN</code>, <code className="text-white">TELEGRAM_CHANNEL_ID</code>, <code className="text-white">GEMINI_API_KEY</code>, <code className="text-white">FEED_URL</code>.
            </p>
          </div>
        </div>

        <div className="space-y-4 text-xs">
          {/* Telegram Channel ID */}
          <div>
            <label className="block text-slate-300 font-medium mb-1">
              TELEGRAM_CHANNEL_ID (Canal sau Chat ID)
            </label>
            <input
              type="text"
              value={channelId}
              onChange={(e) => setChannelId(e.target.value)}
              placeholder="Ex: @oferte_reducere sau -1001234567890"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-sky-500 font-mono"
            />
            <p className="text-[10px] text-slate-500 mt-1">
              Adaugă botul ca Administrator în canal cu permisiunea "Post Messages".
            </p>
          </div>

          {/* Feed URL */}
          <div>
            <label className="block text-slate-300 font-medium mb-1">
              FEED_URL (Link Feed XML / RSS produse)
            </label>
            <input
              type="text"
              value={feedUrl}
              onChange={(e) => setFeedUrl(e.target.value)}
              placeholder="Ex: https://profitshare.ro/feed.xml sau gol pentru demo"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-sky-500 font-mono"
            />
          </div>

          {/* Bot Token Tester */}
          <div>
            <label className="block text-slate-300 font-medium mb-1">
              TELEGRAM_BOT_TOKEN (Token de la @BotFather)
            </label>
            <div className="flex gap-2">
              <input
                type="password"
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                placeholder={config?.hasTelegramToken ? '•••••••••••••••• (Configurat în server .env)' : 'Introdu token pentru test (123456:ABC...)'}
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-sky-500 font-mono"
              />
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={isTesting}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl border border-slate-700 transition flex items-center gap-1.5 shrink-0 disabled:opacity-50"
              >
                {isTesting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                <span>Test Bot</span>
              </button>
            </div>
          </div>

          {/* Test Result Message */}
          {testResult && (
            <div
              className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 ${
                testResult.success
                  ? 'bg-emerald-950/30 border-emerald-800/50 text-emerald-300'
                  : 'bg-rose-950/30 border-rose-800/50 text-rose-300'
              }`}
            >
              {testResult.success ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              )}
              <div>
                <p className="font-semibold">
                  {testResult.success ? 'Conexiune reușită!' : 'Eroare verificare'}
                </p>
                <p className="text-[11px] opacity-90 mt-0.5">
                  {testResult.success
                    ? `Bot: @${testResult.bot?.username} (${testResult.bot?.first_name})`
                    : testResult.error}
                </p>
              </div>
            </div>
          )}

          {/* Gemini AI Status */}
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span className="text-slate-300 font-medium">GEMINI_API_KEY</span>
            </div>
            <span
              className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                config?.hasGeminiKey
                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              {config?.hasGeminiKey ? 'Activ în Server' : 'Template Mode'}
            </span>
          </div>
        </div>

        <div className="pt-3 border-t border-slate-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-sky-600 hover:bg-sky-500 text-white font-medium text-xs rounded-xl transition shadow"
          >
            Salvează & Închide
          </button>
        </div>
      </div>
    </div>
  );
};
