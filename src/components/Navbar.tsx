import React from 'react';
import { Send, Sparkles, Rss, Settings, Play, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';
import { BotConfig } from '../types';

interface NavbarProps {
  config: BotConfig | null;
  onOpenSettings: () => void;
  onRunAutomation: () => void;
  isRunningAutomation: boolean;
  activeTab: 'feed' | 'composer' | 'automation' | 'history';
  setActiveTab: (tab: 'feed' | 'composer' | 'automation' | 'history') => void;
  totalProducts: number;
  publishedCount: number;
  workflowsCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  config,
  onOpenSettings,
  onRunAutomation,
  isRunningAutomation,
  activeTab,
  setActiveTab,
  totalProducts,
  publishedCount,
  workflowsCount = 0,
}) => {
  return (
    <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 to-blue-600 flex items-center justify-center shadow-lg shadow-sky-500/20 text-white font-bold text-xl">
              <Send className="w-5 h-5 -rotate-12 translate-x-0.5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-lg text-white tracking-tight">Telegram Affiliate</h1>
                <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20">
                  Gemini Flash AI
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Automated XML Feed to Telegram Deals Channel
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden md:flex items-center space-x-1 bg-slate-950/60 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveTab('feed')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'feed'
                  ? 'bg-sky-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Rss className="w-3.5 h-3.5" />
              Product Feed
              {totalProducts > 0 && (
                <span className="ml-1 text-[10px] bg-slate-800 px-1.5 py-0.2 rounded-full">
                  {totalProducts}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('composer')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'composer'
                  ? 'bg-sky-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              AI Composer & Preview
            </button>

            <button
              onClick={() => setActiveTab('automation')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'automation'
                  ? 'bg-sky-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Play className="w-3.5 h-3.5" />
              Workflows & Auto
              {workflowsCount > 0 && (
                <span className="ml-1 text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-800/60 px-1.5 py-0.2 rounded-full font-bold">
                  {workflowsCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('history')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'history'
                  ? 'bg-sky-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Post History
              {publishedCount > 0 && (
                <span className="ml-1 text-[10px] bg-sky-900/60 text-sky-300 px-1.5 py-0.2 rounded-full border border-sky-700/50">
                  {publishedCount}
                </span>
              )}
            </button>
          </nav>

          {/* Right Action buttons */}
          <div className="flex items-center gap-2">
            {/* Quick Run button matching main.py automation */}
            <button
              onClick={onRunAutomation}
              disabled={isRunningAutomation}
              className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-medium text-xs px-3.5 py-2 rounded-lg shadow-md shadow-emerald-900/30 transition-all disabled:opacity-50"
              title="Execută automatizarea completă (preluare feed -> AI Gemini -> publicare Telegram)"
            >
              {isRunningAutomation ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Se publică...</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Run Automation</span>
                </>
              )}
            </button>

            {/* Settings button */}
            <button
              onClick={onOpenSettings}
              className="p-2 text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-800 rounded-lg border border-slate-700/50 transition-colors"
              title="Configurare Bot & Chei API"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile nav bar */}
      <div className="flex md:hidden border-t border-slate-800/80 bg-slate-950 px-2 py-1.5 justify-around">
        <button
          onClick={() => setActiveTab('feed')}
          className={`flex flex-col items-center text-[10px] py-1 px-2 rounded ${activeTab === 'feed' ? 'text-sky-400 font-bold' : 'text-slate-400'}`}
        >
          <Rss className="w-4 h-4 mb-0.5" />
          Feed
        </button>
        <button
          onClick={() => setActiveTab('composer')}
          className={`flex flex-col items-center text-[10px] py-1 px-2 rounded ${activeTab === 'composer' ? 'text-sky-400 font-bold' : 'text-slate-400'}`}
        >
          <Sparkles className="w-4 h-4 mb-0.5" />
          Composer
        </button>
        <button
          onClick={() => setActiveTab('automation')}
          className={`flex flex-col items-center text-[10px] py-1 px-2 rounded ${activeTab === 'automation' ? 'text-sky-400 font-bold' : 'text-slate-400'}`}
        >
          <Play className="w-4 h-4 mb-0.5" />
          Automation
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex flex-col items-center text-[10px] py-1 px-2 rounded ${activeTab === 'history' ? 'text-sky-400 font-bold' : 'text-slate-400'}`}
        >
          <RefreshCw className="w-4 h-4 mb-0.5" />
          History
        </button>
      </div>
    </header>
  );
};
