import React, { useState } from 'react';
import { ProductItem, BotConfig } from '../types';
import { Play, Pause, Terminal, CheckCircle2, Clock, Zap, ArrowRight, RefreshCw, AlertCircle } from 'lucide-react';

interface AutomationRunnerProps {
  products: ProductItem[];
  publishedIds: Set<string>;
  onRunAutomation: () => Promise<any>;
  isRunning: boolean;
  logs: string[];
  config: BotConfig | null;
  onUpdateSchedule: (intervalMinutes: number, enabled: boolean) => Promise<void>;
}

export const AutomationRunner: React.FC<AutomationRunnerProps> = ({
  products,
  publishedIds,
  onRunAutomation,
  isRunning,
  logs,
  config,
  onUpdateSchedule
}) => {
  const [intervalOption, setIntervalOption] = useState<number>(config?.automationIntervalMinutes || 60);
  const [isUpdatingSchedule, setIsUpdatingSchedule] = useState(false);

  const unpostedProducts = products.filter((p) => !publishedIds.has(p.id));
  const nextProduct = unpostedProducts[0] || products[0];

  const handleToggleSchedule = async () => {
    setIsUpdatingSchedule(true);
    try {
      const willEnable = !config?.automationRunning;
      await onUpdateSchedule(intervalOption, willEnable);
    } finally {
      setIsUpdatingSchedule(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Overview Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-400" />
              <h2 className="text-base font-bold text-white">
                Automated Pipeline (main.py Workflow)
              </h2>
            </div>
            <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
              Execută fluxul complet automatizat: preia feed-ul XML al magazinului, alege următorul produs nepublicat, generează textul promoțional persuasiv cu Gemini AI și publică direct în canalul Telegram cu butonul inline de afiliere.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onRunAutomation}
              disabled={isRunning}
              className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-xs px-5 py-2.5 rounded-xl shadow-lg shadow-emerald-900/30 transition disabled:opacity-50"
            >
              {isRunning ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Pipeline în desfășurare...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  <span>Run Automation Now</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Pipeline Step Indicators */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-4 gap-2 pt-6 border-t border-slate-800/80">
          <div className="bg-slate-950/60 border border-slate-800 p-3 rounded-xl flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-sky-500/10 text-sky-400 flex items-center justify-center font-bold text-xs">
              1
            </div>
            <div>
              <p className="text-xs font-semibold text-white">XML Feed Parse</p>
              <p className="text-[10px] text-slate-400">{products.length} produse active</p>
            </div>
          </div>

          <div className="bg-slate-950/60 border border-slate-800 p-3 rounded-xl flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-bold text-xs">
              2
            </div>
            <div>
              <p className="text-xs font-semibold text-white">Queue Selection</p>
              <p className="text-[10px] text-slate-400">{unpostedProducts.length} nepublicate</p>
            </div>
          </div>

          <div className="bg-slate-950/60 border border-slate-800 p-3 rounded-xl flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold text-xs">
              3
            </div>
            <div>
              <p className="text-xs font-semibold text-white">Gemini Flash AI</p>
              <p className="text-[10px] text-slate-400">Copy persuasiv emoji</p>
            </div>
          </div>

          <div className="bg-slate-950/60 border border-slate-800 p-3 rounded-xl flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold text-xs">
              4
            </div>
            <div>
              <p className="text-xs font-semibold text-white">Telegram Publish</p>
              <p className="text-[10px] text-slate-400">Inline CTA & Foto</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Next Product in Queue & Scheduler */}
        <div className="space-y-6 lg:col-span-1">
          {/* Next Queued Item Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <ArrowRight className="w-4 h-4 text-sky-400" />
                Următorul produs la rând
              </span>
              <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded">
                Queue #1
              </span>
            </div>

            {nextProduct ? (
              <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-3 space-y-2.5">
                <div className="aspect-video w-full rounded-lg overflow-hidden bg-slate-900">
                  <img
                    src={nextProduct.image_url}
                    alt={nextProduct.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-white line-clamp-1">
                    {nextProduct.title}
                  </h4>
                  <p className="text-[11px] text-slate-400 line-clamp-2 mt-1">
                    {nextProduct.description}
                  </p>
                </div>
                {nextProduct.price && (
                  <span className="inline-block text-[10px] font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40">
                    {nextProduct.price}
                  </span>
                )}
              </div>
            ) : (
              <p className="text-xs text-slate-500">Niciun produs disponibil în feed.</p>
            )}
          </div>

          {/* Auto-Scheduler Settings */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-sky-400" />
              <h3 className="text-xs font-bold text-white">Programator Automat (Scheduler)</h3>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">
                  Interval publicare automată
                </label>
                <select
                  value={intervalOption}
                  onChange={(e) => setIntervalOption(Number(e.target.value))}
                  disabled={config?.automationRunning}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
                >
                  <option value={5}>La fiecare 5 minute (Testare rapidă)</option>
                  <option value={15}>La fiecare 15 minute</option>
                  <option value={30}>La fiecare 30 de minute</option>
                  <option value={60}>La fiecare 1 oră (Recomandat)</option>
                  <option value={180}>La fiecare 3 ore</option>
                  <option value={360}>La fiecare 6 ore</option>
                </select>
              </div>

              <button
                type="button"
                onClick={handleToggleSchedule}
                disabled={isUpdatingSchedule}
                className={`w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-medium transition ${
                  config?.automationRunning
                    ? 'bg-rose-600/90 hover:bg-rose-600 text-white'
                    : 'bg-sky-600 hover:bg-sky-500 text-white'
                }`}
              >
                {config?.automationRunning ? (
                  <>
                    <Pause className="w-3.5 h-3.5" />
                    <span>Oprește Programatorul Activ</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Pornește Programatorul Automat</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Real-Time Terminal Logs matching main.py console output */}
        <div className="lg:col-span-2 bg-slate-950 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col font-mono text-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 mb-3">
            <div className="flex items-center gap-2 text-slate-400">
              <Terminal className="w-4 h-4 text-emerald-400" />
              <span className="font-semibold text-slate-200 text-xs">Terminal Execuție Automation</span>
            </div>
            <span className="text-[10px] text-slate-500">Node.js / Python Output</span>
          </div>

          <div className="flex-1 bg-black/60 rounded-xl p-3 overflow-y-auto space-y-1.5 min-h-[300px] max-h-[420px] text-slate-300">
            {logs.length === 0 ? (
              <div className="text-slate-600 italic">
                Apasă pe "Run Automation Now" pentru a iniția ciclul complet...
                <br />
                $ python main.py
              </div>
            ) : (
              logs.map((log, idx) => (
                <div key={idx} className="leading-relaxed">
                  <span className="text-slate-600 select-none mr-2">
                    [{new Date().toLocaleTimeString()}]
                  </span>
                  <span
                    className={
                      log.includes('✅')
                        ? 'text-emerald-400 font-bold'
                        : log.includes('❌') || log.includes('Error')
                        ? 'text-rose-400'
                        : log.includes('🤖')
                        ? 'text-amber-300'
                        : log.includes('📥')
                        ? 'text-sky-300'
                        : 'text-slate-300'
                    }
                  >
                    {log}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
