import React, { useState } from 'react';
import { ProductItem, BotConfig, Workflow, PublishLog } from '../types';
import {
  Play,
  Pause,
  Terminal,
  CheckCircle2,
  Clock,
  Zap,
  ArrowRight,
  RefreshCw,
  Plus,
  Sliders,
  Sparkles,
  Send,
  FileCode,
  Trash2,
  Edit,
  Tag,
  DollarSign,
  Layers,
  ChevronRight,
  ExternalLink
} from 'lucide-react';
import { ExportWorkflowModal } from './ExportWorkflowModal';

interface AutomationRunnerProps {
  workflows: Workflow[];
  products: ProductItem[];
  publishedIds: Set<string>;
  onRunWorkflow: (workflowId: string) => Promise<any>;
  onToggleWorkflow: (workflowId: string) => Promise<void>;
  onDeleteWorkflow: (workflowId: string) => Promise<void>;
  onOpenCreateWorkflow: () => void;
  onEditWorkflow: (workflow: Workflow) => void;
  isRunningWorkflowId: string | null;
  logs: string[];
  config: BotConfig | null;
  onUpdateSchedule: (intervalMinutes: number, enabled: boolean) => Promise<void>;
}

export const AutomationRunner: React.FC<AutomationRunnerProps> = ({
  workflows,
  products,
  publishedIds,
  onRunWorkflow,
  onToggleWorkflow,
  onDeleteWorkflow,
  onOpenCreateWorkflow,
  onEditWorkflow,
  isRunningWorkflowId,
  logs,
  config,
  onUpdateSchedule
}) => {
  const [selectedWorkflowForExport, setSelectedWorkflowForExport] = useState<Workflow | null>(null);
  const [activeTab, setActiveTab] = useState<'workflows' | 'terminal'>('workflows');
  const [recentExecution, setRecentExecution] = useState<{
    workflowName: string;
    product: ProductItem;
    caption: string;
    simulated?: boolean;
    timestamp: string;
  } | null>(null);

  const activeWorkflowsCount = workflows.filter((w) => w.isActive).length;
  const unpostedCount = products.filter((p) => !publishedIds.has(p.id)).length;

  const handleRun = async (workflow: Workflow) => {
    try {
      const res = await onRunWorkflow(workflow.id);
      if (res && res.success && res.product) {
        setRecentExecution({
          workflowName: workflow.name,
          product: res.product,
          caption: res.caption,
          simulated: res.simulated,
          timestamp: new Date().toLocaleTimeString()
        });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const getToneBadge = (tone: string) => {
    switch (tone) {
      case 'flash_deal':
        return { label: '⚡ Ofertă Fulger', color: 'bg-rose-500/10 text-rose-400 border-rose-500/20' };
      case 'premium':
        return { label: '💎 Premium / Elegant', color: 'bg-purple-500/10 text-purple-400 border-purple-500/20' };
      case 'tech_specs':
        return { label: '🚀 Tech & Specs', color: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' };
      default:
        return { label: '🔥 Energetic & Hype', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' };
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Actions */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-400" />
              <h2 className="text-base font-bold text-white">
                Affiliate Workflows & Automations
              </h2>
              <span className="text-[10px] bg-sky-950 text-sky-400 border border-sky-800 px-2 py-0.5 rounded-full font-semibold">
                {workflows.length} Configurate
              </span>
            </div>
            <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
              Creează și gestionează fluxuri autonome de publicare pe Telegram. Fiecare workflow are propriile filtre de produse, prompturi AI Gemini și programare periodică sau prin GitHub Actions.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={onOpenCreateWorkflow}
              className="flex items-center gap-2 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white font-semibold text-xs px-4 py-2.5 rounded-xl shadow-lg shadow-sky-900/30 transition transform active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Creează Workflow Nou</span>
            </button>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 border-t border-slate-800/80">
          <div className="bg-slate-950/60 border border-slate-800 p-3 rounded-xl">
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
              Workflows Active
            </span>
            <p className="text-lg font-bold text-emerald-400 mt-0.5">
              {activeWorkflowsCount} <span className="text-xs text-slate-500 font-normal">/ {workflows.length}</span>
            </p>
          </div>

          <div className="bg-slate-950/60 border border-slate-800 p-3 rounded-xl">
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
              Produse în Coadă
            </span>
            <p className="text-lg font-bold text-sky-400 mt-0.5">
              {unpostedCount} <span className="text-xs text-slate-500 font-normal">nepublicate</span>
            </p>
          </div>

          <div className="bg-slate-950/60 border border-slate-800 p-3 rounded-xl">
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
              Rulări Totale
            </span>
            <p className="text-lg font-bold text-purple-400 mt-0.5">
              {workflows.reduce((acc, w) => acc + (w.totalRuns || 0), 0)}
            </p>
          </div>

          <div className="bg-slate-950/60 border border-slate-800 p-3 rounded-xl">
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
              Motor AI Activ
            </span>
            <p className="text-xs font-bold text-amber-400 mt-1 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              Gemini 2.5 Flash
            </p>
          </div>
        </div>
      </div>

      {/* Tabs Switcher: Workflows Cards vs Live Execution Terminal */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('workflows')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === 'workflows'
                ? 'bg-slate-800 text-sky-400'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Toate Workflow-urile ({workflows.length})
          </button>

          <button
            onClick={() => setActiveTab('terminal')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === 'terminal'
                ? 'bg-slate-800 text-sky-400'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Terminal className="w-3.5 h-3.5 text-emerald-400" />
            Consolă Terminal & Jurnal Rulare
          </button>
        </div>
      </div>

      {/* Recent Execution Banner (if just ran) */}
      {recentExecution && (
        <div className="bg-slate-900 border border-emerald-500/30 rounded-2xl p-4 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-fade-in">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white">Ultima Rulare: {recentExecution.workflowName}</span>
                <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded">
                  {recentExecution.timestamp}
                </span>
                {recentExecution.simulated && (
                  <span className="text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded">
                    Mod Simulare
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-300 font-medium line-clamp-1 mt-0.5">
                Produs: {recentExecution.product.title}
              </p>
              <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5 italic">
                "{recentExecution.caption.slice(0, 80)}..."
              </p>
            </div>
          </div>

          <button
            onClick={() => setRecentExecution(null)}
            className="text-slate-500 hover:text-slate-300 text-xs px-2 py-1"
          >
            Închide
          </button>
        </div>
      )}

      {/* WORKFLOWS TAB CONTENT */}
      {activeTab === 'workflows' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {workflows.map((wf) => {
            const isRunning = isRunningWorkflowId === wf.id;
            const toneBadge = getToneBadge(wf.tone);

            return (
              <div
                key={wf.id}
                className={`bg-slate-900 border rounded-2xl p-5 shadow-xl flex flex-col justify-between transition-all ${
                  wf.isActive
                    ? 'border-slate-800 hover:border-slate-700'
                    : 'border-slate-800/50 opacity-70 bg-slate-900/60'
                }`}
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <h3 className="font-bold text-sm text-white flex items-center gap-1.5">
                        {wf.name}
                      </h3>
                      <p className="text-[11px] text-slate-400 line-clamp-2 mt-1">
                        {wf.description}
                      </p>
                    </div>

                    {/* Toggle Active Switch */}
                    <button
                      type="button"
                      onClick={() => onToggleWorkflow(wf.id)}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        wf.isActive ? 'bg-emerald-600' : 'bg-slate-700'
                      }`}
                      title={wf.isActive ? 'Workflow Activ (apasă pt. pauză)' : 'Workflow În Pauză (apasă pt. activare)'}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          wf.isActive ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Badges row */}
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${toneBadge.color}`}>
                      {toneBadge.label}
                    </span>

                    <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full border border-slate-700 flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5 text-sky-400" />
                      {wf.scheduleType === 'cron' ? wf.cronExpression : `la ${wf.intervalMinutes}m`}
                    </span>

                    {wf.categoryFilter && (
                      <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full border border-slate-700 flex items-center gap-1">
                        <Tag className="w-2.5 h-2.5 text-amber-400" />
                        {wf.categoryFilter.split(',')[0]}
                      </span>
                    )}

                    <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full border border-slate-700">
                      Strategy: {wf.selectionStrategy}
                    </span>
                  </div>

                  {/* Info metrics */}
                  <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-3 space-y-1.5 text-[11px] mb-4">
                    <div className="flex items-center justify-between text-slate-400">
                      <span>Buton CTA:</span>
                      <span className="text-white font-medium truncate max-w-[150px]">{wf.buttonText}</span>
                    </div>

                    <div className="flex items-center justify-between text-slate-400">
                      <span>Canal Telegram:</span>
                      <span className="text-sky-300 font-mono text-[10px]">{wf.channelId || '(Canal Default)'}</span>
                    </div>

                    <div className="flex items-center justify-between text-slate-400">
                      <span>Rulări / Succese:</span>
                      <span className="text-emerald-400 font-semibold">{wf.successfulRuns || 0} din {wf.totalRuns || 0}</span>
                    </div>

                    <div className="flex items-center justify-between text-slate-400">
                      <span>Ultima Rulare:</span>
                      <span className="text-slate-300">
                        {wf.lastRunAt ? new Date(wf.lastRunAt).toLocaleTimeString() : 'Niciodată'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <button
                    onClick={() => handleRun(wf)}
                    disabled={isRunning}
                    className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-xs py-2 px-3 rounded-xl shadow-md shadow-emerald-900/20 transition disabled:opacity-50"
                  >
                    {isRunning ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Se execută workflow...</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Rulează Workflow Acum</span>
                      </>
                    )}
                  </button>

                  <div className="flex items-center justify-between gap-1 pt-1">
                    <button
                      onClick={() => setSelectedWorkflowForExport(wf)}
                      className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-sky-300 p-1 rounded hover:bg-slate-800 transition"
                      title="Vezi codul GitHub Actions YAML"
                    >
                      <FileCode className="w-3.5 h-3.5 text-sky-400" />
                      <span>GitHub Action</span>
                    </button>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onEditWorkflow(wf)}
                        className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition"
                        title="Editează setările workflow-ului"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => onDeleteWorkflow(wf.id)}
                        className="text-slate-400 hover:text-rose-400 p-1.5 rounded-lg hover:bg-slate-800 transition"
                        title="Șterge acest workflow"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Add New Workflow Card Placeholder */}
          <div
            onClick={onOpenCreateWorkflow}
            className="border-2 border-dashed border-slate-800 hover:border-sky-500/50 rounded-2xl p-6 flex flex-col items-center justify-center gap-3 text-center cursor-pointer hover:bg-slate-900/40 transition group min-h-[300px]"
          >
            <div className="w-12 h-12 rounded-2xl bg-sky-500/10 text-sky-400 group-hover:bg-sky-500/20 group-hover:scale-110 flex items-center justify-center transition">
              <Plus className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-semibold text-sm text-slate-200 group-hover:text-white">
                Creează un Workflow Nou
              </h4>
              <p className="text-xs text-slate-500 max-w-[200px] mt-1">
                Configurează un nou flux de produse, ton AI personalizat și reguli de publicare
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TERMINAL LOGS TAB CONTENT */}
      {activeTab === 'terminal' && (
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col font-mono text-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 mb-3">
            <div className="flex items-center gap-2 text-slate-400">
              <Terminal className="w-4 h-4 text-emerald-400" />
              <span className="font-semibold text-slate-200 text-xs">Jurnal Execuție Workflows</span>
            </div>
            <span className="text-[10px] text-slate-500">Node.js Engine Output</span>
          </div>

          <div className="flex-1 bg-black/70 rounded-xl p-3 overflow-y-auto space-y-1.5 min-h-[360px] max-h-[480px] text-slate-300">
            {logs.length === 0 ? (
              <div className="text-slate-600 italic">
                Apasă pe "Rulează Workflow Acum" pe oricare card pentru a declanșa pipeline-ul...
                <br />
                $ npx tsx scripts/run-workflow.ts
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
      )}

      {/* Export YAML Modal */}
      <ExportWorkflowModal
        isOpen={Boolean(selectedWorkflowForExport)}
        onClose={() => setSelectedWorkflowForExport(null)}
        workflow={selectedWorkflowForExport}
      />
    </div>
  );
};
