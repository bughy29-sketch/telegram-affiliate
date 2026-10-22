import React, { useState } from 'react';
import { ProductItem } from '../types';
import { Send, CheckCircle2, ExternalLink, ShieldCheck, ShoppingCart, MessageCircle, AlertCircle, RefreshCw } from 'lucide-react';

interface TelegramSimulatorProps {
  product: ProductItem | null;
  caption: string;
  channelId: string;
  setChannelId: (id: string) => void;
  onSendToTelegram: (options: {
    photoUrl: string;
    caption: string;
    buttonText: string;
    affiliateUrl: string;
    productTitle: string;
    channelId: string;
  }) => Promise<any>;
  isSending: boolean;
  hasTelegramToken: boolean;
}

export const TelegramSimulator: React.FC<TelegramSimulatorProps> = ({
  product,
  caption,
  channelId,
  setChannelId,
  onSendToTelegram,
  isSending,
  hasTelegramToken
}) => {
  const [buttonText, setButtonText] = useState('🛒 Vezi Oferta / Cumpără');
  const [lastResult, setLastResult] = useState<{
    success: boolean;
    simulated?: boolean;
    message?: string;
    messageId?: number;
    error?: string;
  } | null>(null);

  if (!product) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center flex flex-col items-center justify-center min-h-[360px]">
        <MessageCircle className="w-10 h-10 text-slate-700 mb-3" />
        <h3 className="text-sm font-semibold text-white">Previzualizare Telegram</h3>
        <p className="text-xs text-slate-400 max-w-xs mt-1">
          Alege un produs și generează textul pentru a vedea cardul exact cum va fi afișat abonaților din canal.
        </p>
      </div>
    );
  }

  const handlePublish = async () => {
    if (!product || !caption) return;
    setLastResult(null);

    try {
      const res = await onSendToTelegram({
        photoUrl: product.image_url,
        caption: caption,
        buttonText: buttonText || '🛒 Vezi Oferta / Cumpără',
        affiliateUrl: product.affiliate_url,
        productTitle: product.title,
        channelId: channelId || '@oferte_reducere'
      });
      setLastResult(res);
    } catch (err: any) {
      setLastResult({
        success: false,
        error: err.message || 'Eroare la publicare'
      });
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20">
            <Send className="w-4 h-4 text-sky-400" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white">Live Telegram Post Preview</h2>
            <p className="text-[11px] text-slate-400">
              Redare fidelă a mesajului foto cu inline keyboard conform specificației Telegram Bot API.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {hasTelegramToken ? (
            <span className="text-[10px] font-medium bg-emerald-950/60 text-emerald-400 border border-emerald-800/50 px-2 py-0.5 rounded-full flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Bot Conectat
            </span>
          ) : (
            <span className="text-[10px] font-medium bg-amber-950/60 text-amber-400 border border-amber-800/50 px-2 py-0.5 rounded-full flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span> Simulator Activ
            </span>
          )}
        </div>
      </div>

      {/* Realistic Telegram Post Container */}
      <div className="max-w-md mx-auto bg-[#17212b] rounded-2xl border border-slate-800/80 p-3 shadow-2xl overflow-hidden font-sans">
        {/* Telegram Channel Header */}
        <div className="flex items-center gap-2.5 pb-2.5 border-b border-[#232e3c]">
          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-sky-400 to-blue-600 flex items-center justify-center text-white font-bold text-xs shadow">
            {(channelId || '@Deals').replace('@', '').slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1">
              <span className="font-semibold text-xs text-white truncate">
                {channelId ? channelId : '@oferte_reducere_ro'}
              </span>
              <ShieldCheck className="w-3.5 h-3.5 text-sky-400 shrink-0 fill-sky-400/20" />
            </div>
            <p className="text-[10px] text-slate-400">14.820 subscribers • Deals Channel</p>
          </div>
          <span className="text-[10px] text-slate-500 font-mono">acum</span>
        </div>

        {/* Telegram Photo */}
        <div className="mt-2.5 rounded-xl overflow-hidden bg-[#0e1621] relative aspect-video border border-[#232e3c]">
          <img
            src={product.image_url}
            alt={product.title}
            onError={(e) => {
              (e.target as HTMLImageElement).src =
                'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=800&auto=format&fit=crop&q=80';
            }}
            className="w-full h-full object-cover"
          />
          {product.price && (
            <div className="absolute top-2 right-2 bg-black/60 backdrop-blur text-white text-[10px] font-bold px-2 py-0.5 rounded">
              {product.price}
            </div>
          )}
        </div>

        {/* Telegram Caption */}
        <div className="mt-3 px-1">
          <p className="text-xs text-slate-100 whitespace-pre-wrap leading-relaxed select-text">
            {caption || (
              <span className="text-slate-500 italic">
                Apasă pe "Generează Text cu Gemini" pentru a crea textul persuasiv al postării...
              </span>
            )}
          </p>
        </div>

        {/* Telegram Inline Keyboard Button (matches main.py InlineKeyboardButton) */}
        <div className="mt-3 pt-2">
          <a
            href={product.affiliate_url}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-2 px-3 rounded-lg bg-[#2b5278] hover:bg-[#32618e] active:scale-[0.99] text-white text-xs font-semibold flex items-center justify-center gap-2 transition shadow text-center"
          >
            <ShoppingCart className="w-3.5 h-3.5 text-sky-300" />
            <span>{buttonText || '🛒 Vezi Oferta / Cumpără'}</span>
            <ExternalLink className="w-3 h-3 text-sky-300/70" />
          </a>
        </div>
      </div>

      {/* Send Configuration & Action */}
      <div className="space-y-3 pt-2">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          <div>
            <label className="block text-[11px] text-slate-400 font-medium mb-1">
              Canal Destinație (Channel ID / Username)
            </label>
            <input
              type="text"
              value={channelId}
              onChange={(e) => setChannelId(e.target.value)}
              placeholder="@nume_canal sau -100xxxxxxxxxx"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-sky-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-[11px] text-slate-400 font-medium mb-1">
              Text Buton CTA (Inline Button)
            </label>
            <input
              type="text"
              value={buttonText}
              onChange={(e) => setButtonText(e.target.value)}
              placeholder="🛒 Vezi Oferta / Cumpără"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
            />
          </div>
        </div>

        <button
          type="button"
          onClick={handlePublish}
          disabled={isSending || !caption}
          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white font-semibold text-xs py-2.5 rounded-xl shadow-lg shadow-sky-600/20 transition disabled:opacity-50"
        >
          {isSending ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Se trimite către Telegram...</span>
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              <span>
                {hasTelegramToken ? 'Publică pe Canalul Telegram' : 'Simulează Trimiterea pe Telegram'}
              </span>
            </>
          )}
        </button>

        {/* Feedback message */}
        {lastResult && (
          <div
            className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 transition-all ${
              lastResult.success
                ? lastResult.simulated
                  ? 'bg-amber-950/30 border-amber-800/50 text-amber-300'
                  : 'bg-emerald-950/30 border-emerald-800/50 text-emerald-300'
                : 'bg-rose-950/30 border-rose-800/50 text-rose-300'
            }`}
          >
            {lastResult.success ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            )}
            <div className="min-w-0 flex-1">
              <p className="font-semibold">
                {lastResult.success
                  ? lastResult.simulated
                    ? 'Simulare reușită!'
                    : 'Mesaj publicat pe Telegram!'
                  : 'Eroare la publicare'}
              </p>
              <p className="text-[11px] opacity-90 mt-0.5">
                {lastResult.error ||
                  lastResult.message ||
                  (lastResult.messageId
                    ? `Mesaj livrat cu succes. Telegram Message ID: #${lastResult.messageId}`
                    : 'Succes!')}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
