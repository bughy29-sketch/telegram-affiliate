import React, { useState } from 'react';
import { ProductItem } from '../types';
import { Sparkles, Wand2, Copy, Check, MessageSquare, RotateCcw, AlertTriangle } from 'lucide-react';

interface AiComposerProps {
  product: ProductItem | null;
  caption: string;
  setCaption: (caption: string) => void;
  onGenerate: (language: string, customTone?: string) => Promise<void>;
  isGenerating: boolean;
  modelName?: string;
}

export const AiComposer: React.FC<AiComposerProps> = ({
  product,
  caption,
  setCaption,
  onGenerate,
  isGenerating,
  modelName = 'gemini-flash-latest'
}) => {
  const [language, setLanguage] = useState<'ro' | 'en'>('ro');
  const [tone, setTone] = useState<string>('energetic');
  const [customInstructions, setCustomInstructions] = useState('');
  const [copied, setCopied] = useState(false);

  if (!product) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center">
        <Sparkles className="w-10 h-10 text-slate-600 mx-auto mb-3" />
        <h3 className="text-base font-semibold text-white">Niciun produs selectat</h3>
        <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
          Mergi la tab-ul <strong>Product Feed</strong> și selectează un produs pentru a genera o postare Telegram cu Gemini.
        </p>
      </div>
    );
  }

  const handleCopy = () => {
    if (!caption) return;
    navigator.clipboard.writeText(caption);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const wordCount = caption.trim() ? caption.trim().split(/\s+/).length : 0;
  const isOver100Words = wordCount > 100;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20">
            <Sparkles className="w-4 h-4 text-sky-400" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white">Gemini AI Post Generator</h2>
            <p className="text-[11px] text-slate-400">
              Creează postări scurte, energice și persuasive pentru audiența de pe Telegram.
            </p>
          </div>
        </div>
        <span className="text-[11px] font-mono bg-slate-800 text-sky-400 px-2 py-0.5 rounded border border-slate-700">
          {modelName}
        </span>
      </div>

      {/* Selected Product Banner */}
      <div className="flex items-center gap-3 p-3 bg-slate-950/70 border border-slate-800 rounded-xl">
        <img
          src={product.image_url}
          alt={product.title}
          className="w-14 h-14 rounded-lg object-cover bg-slate-900 shrink-0 border border-slate-800"
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h4 className="text-xs font-semibold text-slate-100 truncate">{product.title}</h4>
            {product.price && (
              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800/50">
                {product.price}
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
            {product.description}
          </p>
          <span className="text-[10px] text-sky-400/80 font-mono truncate block mt-0.5">
            {product.affiliate_url}
          </span>
        </div>
      </div>

      {/* Generator Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        <div>
          <label className="block text-slate-400 text-[11px] font-medium mb-1">
            Limbă postare (Language)
          </label>
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-950 border border-slate-800 rounded-xl">
            <button
              type="button"
              onClick={() => setLanguage('ro')}
              className={`py-1.5 px-3 rounded-lg font-medium transition ${
                language === 'ro'
                  ? 'bg-sky-600 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              🇷🇴 Română (Default)
            </button>
            <button
              type="button"
              onClick={() => setLanguage('en')}
              className={`py-1.5 px-3 rounded-lg font-medium transition ${
                language === 'en'
                  ? 'bg-sky-600 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              🇬🇧 English
            </button>
          </div>
        </div>

        <div>
          <label className="block text-slate-400 text-[11px] font-medium mb-1">
            Stil & Ton
          </label>
          <select
            value={tone}
            onChange={(e) => setTone(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
          >
            <option value="energetic">🔥 Energic & Persuasiv (Original main.py)</option>
            <option value="flash_sale">⚡ Alertă Reducere / Flash Sale Urgent</option>
            <option value="tech_review">💻 Specificații & Recomandare Premium</option>
            <option value="minimalist">✨ Minimalist & Curat</option>
          </select>
        </div>
      </div>

      {/* Custom instructions / prompt override */}
      <div>
        <label className="block text-slate-400 text-[11px] font-medium mb-1">
          Instrucțiuni suplimentare (Opțional)
        </label>
        <input
          type="text"
          value={customInstructions}
          onChange={(e) => setCustomInstructions(e.target.value)}
          placeholder="Ex: Menționează codul de voucher 'REDUCERE10' sau transport gratuit"
          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-sky-500"
        />
      </div>

      {/* Generate Action Button */}
      <button
        type="button"
        onClick={() => onGenerate(language, customInstructions ? `${tone}; ${customInstructions}` : tone)}
        disabled={isGenerating}
        className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white font-medium text-xs py-2.5 rounded-xl shadow-lg shadow-sky-600/20 transition disabled:opacity-50"
      >
        {isGenerating ? (
          <>
            <Wand2 className="w-4 h-4 animate-spin text-amber-300" />
            <span>Se generează cu Gemini...</span>
          </>
        ) : (
          <>
            <Wand2 className="w-4 h-4 text-amber-300" />
            <span>Generează Text cu Gemini (Prompt original)</span>
          </>
        )}
      </button>

      {/* Generated Caption Area */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-[11px] text-slate-400">
          <span className="flex items-center gap-1 font-medium">
            <MessageSquare className="w-3.5 h-3.5 text-sky-400" />
            Text Caption Telegram (Markdown):
          </span>
          <div className="flex items-center gap-3">
            <span
              className={`font-mono ${
                isOver100Words ? 'text-amber-400 font-bold' : 'text-slate-400'
              }`}
            >
              {wordCount} / 100 cuvinte
            </span>
            <button
              type="button"
              onClick={handleCopy}
              disabled={!caption}
              className="flex items-center gap-1 text-slate-300 hover:text-white transition disabled:opacity-40"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copiat' : 'Copiază'}</span>
            </button>
          </div>
        </div>

        <textarea
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          rows={6}
          placeholder="Textul generat va apărea aici. Îl poți edita liber înainte de publicare..."
          className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-sky-500 leading-relaxed font-sans"
        />

        {isOver100Words && (
          <div className="flex items-center gap-1.5 text-[11px] text-amber-400 bg-amber-950/30 border border-amber-900/50 p-2 rounded-lg">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            <span>Atenție: Regula originală recomandă sub 100 de cuvinte pentru engagement optim pe Telegram.</span>
          </div>
        )}
      </div>
    </div>
  );
};
