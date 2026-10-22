import React, { useState } from 'react';
import { Workflow, WorkflowLanguage, WorkflowStrategy, WorkflowTone, WorkflowScheduleType } from '../types';
import { X, Sparkles, Sliders, Send, Clock, Layers, Plus, Check, Info, FileCode } from 'lucide-react';

interface CreateWorkflowModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveWorkflow: (workflowData: Partial<Workflow>) => Promise<void>;
  editingWorkflow?: Workflow | null;
}

export const CreateWorkflowModal: React.FC<CreateWorkflowModalProps> = ({
  isOpen,
  onClose,
  onSaveWorkflow,
  editingWorkflow
}) => {
  const [name, setName] = useState(editingWorkflow?.name || '');
  const [description, setDescription] = useState(editingWorkflow?.description || '');
  const [feedUrl, setFeedUrl] = useState(editingWorkflow?.feedUrl || '');
  const [categoryFilter, setCategoryFilter] = useState(editingWorkflow?.categoryFilter || '');
  const [keywordFilter, setKeywordFilter] = useState(editingWorkflow?.keywordFilter || '');
  const [excludeKeywordFilter, setExcludeKeywordFilter] = useState(editingWorkflow?.excludeKeywordFilter || '');
  const [minPrice, setMinPrice] = useState<string>(editingWorkflow?.minPrice ? String(editingWorkflow.minPrice) : '');
  const [maxPrice, setMaxPrice] = useState<string>(editingWorkflow?.maxPrice ? String(editingWorkflow.maxPrice) : '');
  const [selectionStrategy, setSelectionStrategy] = useState<WorkflowStrategy>(editingWorkflow?.selectionStrategy || 'fifo');
  
  // AI Settings
  const [language, setLanguage] = useState<WorkflowLanguage>(editingWorkflow?.language || 'ro');
  const [tone, setTone] = useState<WorkflowTone>(editingWorkflow?.tone || 'energetic');
  const [customInstructions, setCustomInstructions] = useState(editingWorkflow?.customInstructions || '');
  const [includePriceInCaption, setIncludePriceInCaption] = useState(editingWorkflow?.includePriceInCaption ?? true);
  const [emojiLevel, setEmojiLevel] = useState<'high' | 'normal' | 'minimal'>(editingWorkflow?.emojiLevel || 'high');
  
  // Telegram Settings
  const [channelId, setChannelId] = useState(editingWorkflow?.channelId || '');
  const [buttonText, setButtonText] = useState(editingWorkflow?.buttonText || '🛒 Vezi Oferta / Cumpără');
  
  // Schedule Settings
  const [scheduleType, setScheduleType] = useState<WorkflowScheduleType>(editingWorkflow?.scheduleType || 'interval');
  const [intervalMinutes, setIntervalMinutes] = useState<number>(editingWorkflow?.intervalMinutes || 120);
  const [cronExpression, setCronExpression] = useState(editingWorkflow?.cronExpression || '0 */2 * * *');

  const [activeStep, setActiveStep] = useState<'basics' | 'filter' | 'ai' | 'telegram' | 'schedule'>('basics');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Vă rugăm să introduceți un nume pentru workflow.');
      setActiveStep('basics');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      await onSaveWorkflow({
        name: name.trim(),
        description: description.trim() || 'Workflow automatizat de afiliere',
        feedUrl: feedUrl.trim() || undefined,
        categoryFilter: categoryFilter.trim() || undefined,
        keywordFilter: keywordFilter.trim() || undefined,
        excludeKeywordFilter: excludeKeywordFilter.trim() || undefined,
        minPrice: minPrice ? parseFloat(minPrice) : undefined,
        maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
        selectionStrategy,
        language,
        tone,
        customInstructions: customInstructions.trim() || undefined,
        includePriceInCaption,
        emojiLevel,
        channelId: channelId.trim() || undefined,
        buttonText: buttonText.trim() || '🛒 Vezi Oferta / Cumpără',
        scheduleType,
        intervalMinutes,
        cronExpression: cronExpression.trim() || '0 */2 * * *',
        isActive: true
      });
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Eroare la salvarea workflow-ului.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/60">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-sky-500/20">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">
                {editingWorkflow ? 'Editează Workflow' : 'Creează Workflow Nou'}
              </h3>
              <p className="text-xs text-slate-400">
                Configurează reguli de selecție, ton AI Gemini și publicare automată pe Telegram
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Navigation Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-950/60 px-6 py-2 gap-1 overflow-x-auto text-xs">
          <button
            type="button"
            onClick={() => setActiveStep('basics')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition ${
              activeStep === 'basics'
                ? 'bg-sky-600 text-white'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            1. Date & Feed
          </button>

          <button
            type="button"
            onClick={() => setActiveStep('filter')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition ${
              activeStep === 'filter'
                ? 'bg-sky-600 text-white'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            2. Filtrare Produse
          </button>

          <button
            type="button"
            onClick={() => setActiveStep('ai')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition ${
              activeStep === 'ai'
                ? 'bg-sky-600 text-white'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            3. AI & Ton Gemini
          </button>

          <button
            type="button"
            onClick={() => setActiveStep('telegram')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition ${
              activeStep === 'telegram'
                ? 'bg-sky-600 text-white'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Send className="w-3.5 h-3.5 text-sky-400" />
            4. Telegram & CTA
          </button>

          <button
            type="button"
            onClick={() => setActiveStep('schedule')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition ${
              activeStep === 'schedule'
                ? 'bg-sky-600 text-white'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-emerald-400" />
            5. Programare Cron
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {errorMsg && (
            <div className="bg-rose-950/80 border border-rose-800 text-rose-200 text-xs p-3 rounded-xl">
              {errorMsg}
            </div>
          )}

          {/* STEP 1: BASICS & FEED */}
          {activeStep === 'basics' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Nume Workflow <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="ex: 🔥 Top Reduceri Tech & Gadgets"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Descriere Scop
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="ex: Publică zilnic cele mai bune oferte din electronice cu prezentare dinamică..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  URL Feed XML Personalizat (Opțional)
                </label>
                <input
                  type="url"
                  value={feedUrl}
                  onChange={(e) => setFeedUrl(e.target.value)}
                  placeholder="Lasă gol pentru a folosi Feed-ul principal activ"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Suportă feed-uri 2Performant, Profitshare, Google Merchant XML, RSS 2.0.
                </p>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setActiveStep('filter')}
                  className="w-full bg-slate-800 hover:bg-slate-700 text-sky-400 text-xs font-semibold py-2.5 rounded-xl transition flex items-center justify-center gap-1.5"
                >
                  Continuă la Pasul 2: Filtrare Produse →
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: PRODUCT FILTERS */}
          {activeStep === 'filter' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Filtru Categorii (separate prin virgulă)
                </label>
                <input
                  type="text"
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  placeholder="ex: Audio, Monitoare, Periferice PC, Smartwatches"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Doar produsele din aceste categorii vor fi luate în considerare.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Include Cuvinte Cheie
                  </label>
                  <input
                    type="text"
                    value={keywordFilter}
                    onChange={(e) => setKeywordFilter(e.target.value)}
                    placeholder="ex: Sony, OLED, Wireless"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Exclude Cuvinte Cheie
                  </label>
                  <input
                    type="text"
                    value={excludeKeywordFilter}
                    onChange={(e) => setExcludeKeywordFilter(e.target.value)}
                    placeholder="ex: second hand, resigilat, defect"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Preț Minim (Lei)
                  </label>
                  <input
                    type="number"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                    placeholder="ex: 100"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Preț Maxim (Lei)
                  </label>
                  <input
                    type="number"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    placeholder="ex: 5000"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Strategie Selecție Produs din Coadă
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectionStrategy('fifo')}
                    className={`p-3 rounded-xl border text-left text-xs transition ${
                      selectionStrategy === 'fifo'
                        ? 'border-sky-500 bg-sky-950/40 text-sky-200'
                        : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <p className="font-bold">Queue FIFO</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Următorul produs în ordine</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectionStrategy('random')}
                    className={`p-3 rounded-xl border text-left text-xs transition ${
                      selectionStrategy === 'random'
                        ? 'border-sky-500 bg-sky-950/40 text-sky-200'
                        : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <p className="font-bold">Aleatoriu</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Random dintre nepublicate</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectionStrategy('highest_price')}
                    className={`p-3 rounded-xl border text-left text-xs transition ${
                      selectionStrategy === 'highest_price'
                        ? 'border-sky-500 bg-sky-950/40 text-sky-200'
                        : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <p className="font-bold">Cel mai scump</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Comision potențial mai mare</p>
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setActiveStep('ai')}
                  className="w-full bg-slate-800 hover:bg-slate-700 text-sky-400 text-xs font-semibold py-2.5 rounded-xl transition flex items-center justify-center gap-1.5"
                >
                  Continuă la Pasul 3: AI & Ton Gemini →
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: AI SETTINGS */}
          {activeStep === 'ai' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Ton & Stil Postare (Prompt Engine)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setTone('energetic')}
                    className={`p-3 rounded-xl border text-left text-xs transition ${
                      tone === 'energetic'
                        ? 'border-amber-500 bg-amber-950/40 text-amber-200'
                        : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <p className="font-bold flex items-center gap-1">🔥 Energetic & Hype</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Entuziasm maxim, atenție garantată</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTone('flash_deal')}
                    className={`p-3 rounded-xl border text-left text-xs transition ${
                      tone === 'flash_deal'
                        ? 'border-amber-500 bg-amber-950/40 text-amber-200'
                        : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <p className="font-bold flex items-center gap-1">⚡ Ofertă Fulger / Urgență</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Stoc limitat, acțiune imediată</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTone('premium')}
                    className={`p-3 rounded-xl border text-left text-xs transition ${
                      tone === 'premium'
                        ? 'border-amber-500 bg-amber-950/40 text-amber-200'
                        : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <p className="font-bold flex items-center gap-1">💎 Premium & Elegant</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Design curat, calitate superioară</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTone('tech_specs')}
                    className={`p-3 rounded-xl border text-left text-xs transition ${
                      tone === 'tech_specs'
                        ? 'border-amber-500 bg-amber-950/40 text-amber-200'
                        : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <p className="font-bold flex items-center gap-1">🚀 Specificații & Hardware</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Detalii tehnice pentru entuziaști</p>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Instrucțiuni Suplimentare Personalizate
                </label>
                <textarea
                  rows={2}
                  value={customInstructions}
                  onChange={(e) => setCustomInstructions(e.target.value)}
                  placeholder="ex: Menționează că livrarea este rapidă și că produsul are 2 ani garanție..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Limbă Generare
                  </label>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value as WorkflowLanguage)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                  >
                    <option value="ro">🇷🇴 Română</option>
                    <option value="en">🇬🇧 Engleză (English)</option>
                    <option value="es">🇪🇸 Spaniolă (Español)</option>
                    <option value="fr">🇫🇷 Franceză (Français)</option>
                    <option value="de">🇩🇪 Germană (Deutsch)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Densitate Emojis
                  </label>
                  <select
                    value={emojiLevel}
                    onChange={(e) => setEmojiLevel(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                  >
                    <option value="high">Multe Emojis (Recomandat)</option>
                    <option value="normal">Echilibrat (3-4 Emojis)</option>
                    <option value="minimal">Minimalist (1-2 Emojis)</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-1">
                <input
                  type="checkbox"
                  id="includePriceInCaption"
                  checked={includePriceInCaption}
                  onChange={(e) => setIncludePriceInCaption(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-800 bg-slate-950 text-sky-600 focus:ring-sky-500"
                />
                <label htmlFor="includePriceInCaption" className="text-xs text-slate-300 select-none">
                  Afișează prețul produsului în descrierea generată dacă este disponibil
                </label>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setActiveStep('telegram')}
                  className="w-full bg-slate-800 hover:bg-slate-700 text-sky-400 text-xs font-semibold py-2.5 rounded-xl transition flex items-center justify-center gap-1.5"
                >
                  Continuă la Pasul 4: Telegram & Buton CTA →
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: TELEGRAM & CTA BUTTON */}
          {activeStep === 'telegram' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Canal Telegram Țintă (Opțional)
                </label>
                <input
                  type="text"
                  value={channelId}
                  onChange={(e) => setChannelId(e.target.value)}
                  placeholder="ex: @canal_oferte_ro sau -100123456789"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Lasă necompletat pentru a folosi canalul definit global în setări.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Text Buton Inline CTA
                </label>
                <input
                  type="text"
                  value={buttonText}
                  onChange={(e) => setButtonText(e.target.value)}
                  placeholder="🛒 Vezi Oferta / Cumpără"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Acest buton va deschide automat linkul de afiliere al produsului selectat.
                </p>
              </div>

              {/* Quick suggestions */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                <span className="text-[10px] text-slate-500 self-center">Sugestii rapide:</span>
                {[
                  '🛒 Vezi Oferta / Cumpără',
                  '🔥 Profită de Reducere',
                  '⚡ Cumpără Acum la Ofertă',
                  '👉 Detalii & Comandă'
                ].map((txt) => (
                  <button
                    key={txt}
                    type="button"
                    onClick={() => setButtonText(txt)}
                    className="text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 px-2.5 py-1 rounded-lg border border-slate-700/60"
                  >
                    {txt}
                  </button>
                ))}
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setActiveStep('schedule')}
                  className="w-full bg-slate-800 hover:bg-slate-700 text-sky-400 text-xs font-semibold py-2.5 rounded-xl transition flex items-center justify-center gap-1.5"
                >
                  Continuă la Pasul 5: Programare & Salvare →
                </button>
              </div>
            </div>
          )}

          {/* STEP 5: SCHEDULE & FINAL REVIEW */}
          {activeStep === 'schedule' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Mod Declanșare Workflow
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setScheduleType('interval')}
                    className={`p-3 rounded-xl border text-left text-xs transition ${
                      scheduleType === 'interval'
                        ? 'border-emerald-500 bg-emerald-950/40 text-emerald-200'
                        : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <p className="font-bold flex items-center gap-1">⏰ Interval Fix (Recomandat)</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Execuție la fiecare X minute/ore</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setScheduleType('cron')}
                    className={`p-3 rounded-xl border text-left text-xs transition ${
                      scheduleType === 'cron'
                        ? 'border-emerald-500 bg-emerald-950/40 text-emerald-200'
                        : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <p className="font-bold flex items-center gap-1">🗓️ Expresie Cron Avansată</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Ideal pentru GitHub Actions</p>
                  </button>
                </div>
              </div>

              {scheduleType === 'interval' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Interval de Rulare
                  </label>
                  <select
                    value={intervalMinutes}
                    onChange={(e) => setIntervalMinutes(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-sky-500"
                  >
                    <option value={15}>La fiecare 15 minute (Testare)</option>
                    <option value={30}>La fiecare 30 de minute</option>
                    <option value={60}>La fiecare 1 oră</option>
                    <option value={120}>La fiecare 2 ore</option>
                    <option value={240}>La fiecare 4 ore (Standard main.py)</option>
                    <option value={360}>La fiecare 6 ore</option>
                    <option value={720}>La fiecare 12 ore</option>
                    <option value={1440}>O dată pe zi (24 ore)</option>
                  </select>
                </div>
              )}

              {scheduleType === 'cron' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Expresie Cron (5 câmpuri)
                  </label>
                  <input
                    type="text"
                    value={cronExpression}
                    onChange={(e) => setCronExpression(e.target.value)}
                    placeholder="0 */4 * * *"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono placeholder-slate-500 focus:outline-none focus:border-sky-500"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    Exemple: <code>0 */4 * * *</code> (la fiecare 4 ore), <code>0 9,15,20 * * *</code> (la orele 9, 15, 20).
                  </p>
                </div>
              )}

              {/* Summary box */}
              <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-4 text-xs space-y-2">
                <p className="font-semibold text-sky-400 flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5" />
                  Rezumat Configurație Workflow:
                </p>
                <ul className="text-slate-400 space-y-1 text-[11px]">
                  <li>• Nume: <span className="text-white font-medium">{name || '(Fără nume)'}</span></li>
                  <li>• Strategie Coadă: <span className="text-white">{selectionStrategy}</span></li>
                  <li>• Stil AI: <span className="text-amber-400">{tone}</span> ({language})</li>
                  <li>• Buton Telegram: <span className="text-emerald-400">{buttonText}</span></li>
                  <li>• Programare: <span className="text-sky-300">{scheduleType === 'cron' ? cronExpression : `${intervalMinutes} minute`}</span></li>
                </ul>
              </div>
            </div>
          )}

          {/* Footer Controls */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white transition"
            >
              Anulează
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white font-semibold text-xs px-6 py-2.5 rounded-xl shadow-lg shadow-sky-900/30 transition disabled:opacity-50"
            >
              {isSubmitting ? (
                <span>Se salvează...</span>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>{editingWorkflow ? 'Actualizează Workflow' : 'Creează Workflow'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
