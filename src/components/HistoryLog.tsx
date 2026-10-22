import React from 'react';
import { PublishLog } from '../types';
import { RefreshCw, ExternalLink, Trash2, CheckCircle2, AlertCircle, ShoppingCart } from 'lucide-react';

interface HistoryLogProps {
  history: PublishLog[];
  onClearHistory: () => Promise<void>;
  isLoading: boolean;
}

export const HistoryLog: React.FC<HistoryLogProps> = ({
  history,
  onClearHistory,
  isLoading
}) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-base font-bold text-white">Istoric Publicări Telegram</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Înregistrări ale postărilor trimise pe canal cu textul generat și linkul de afiliat.
          </p>
        </div>

        {history.length > 0 && (
          <button
            type="button"
            onClick={onClearHistory}
            disabled={isLoading}
            className="flex items-center gap-1.5 text-xs text-rose-400 hover:text-rose-300 bg-rose-950/40 hover:bg-rose-950 border border-rose-900/60 px-3 py-1.5 rounded-lg transition disabled:opacity-50"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Șterge Istoric</span>
          </button>
        )}
      </div>

      {history.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-12 h-12 rounded-2xl bg-slate-800/60 flex items-center justify-center text-slate-500 mx-auto mb-3">
            <RefreshCw className="w-6 h-6" />
          </div>
          <p className="text-sm font-semibold text-slate-300">Nicio postare în istoric</p>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Folosește "Run Automation" sau publică un produs din Composer pentru a adăuga primele oferte în canal.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {history.map((log) => (
            <div
              key={log.id}
              className="bg-slate-950 border border-slate-800/80 rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition hover:border-slate-700"
            >
              <div className="flex items-start gap-3 min-w-0 flex-1">
                <img
                  src={log.imageUrl}
                  alt={log.productTitle}
                  className="w-14 h-14 rounded-lg object-cover bg-slate-900 shrink-0 border border-slate-800"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=800&auto=format&fit=crop&q=80';
                  }}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="text-xs font-semibold text-white truncate">
                      {log.productTitle}
                    </h4>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                        log.status === 'published'
                          ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/50'
                          : log.status === 'simulated'
                          ? 'bg-amber-950/80 text-amber-400 border border-amber-800/50'
                          : 'bg-rose-950/80 text-rose-400 border border-rose-800/50'
                      }`}
                    >
                      {log.status === 'published'
                        ? 'Published on Telegram'
                        : log.status === 'simulated'
                        ? 'Simulated Preview'
                        : 'Failed'}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-400 line-clamp-1 mt-1 font-mono">
                    {log.caption}
                  </p>

                  <div className="flex flex-wrap items-center gap-3 mt-1.5 text-[10px] text-slate-500 font-mono">
                    <span>Canal: {log.channelId}</span>
                    <span>•</span>
                    <span>{new Date(log.timestamp).toLocaleString()}</span>
                    {log.telegramMessageId && (
                      <>
                        <span>•</span>
                        <span className="text-sky-400">ID Mesaj #{log.telegramMessageId}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                <a
                  href={log.affiliateUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-lg border border-slate-700 transition"
                >
                  <ShoppingCart className="w-3.5 h-3.5 text-amber-400" />
                  <span>Link Afiliat</span>
                  <ExternalLink className="w-3 h-3 text-slate-400" />
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
