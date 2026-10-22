import React, { useState } from 'react';
import { Workflow } from '../types';
import { X, Copy, Check, Download, FileCode, Terminal } from 'lucide-react';

interface ExportWorkflowModalProps {
  isOpen: boolean;
  onClose: () => void;
  workflow: Workflow | null;
}

export const ExportWorkflowModal: React.FC<ExportWorkflowModalProps> = ({
  isOpen,
  onClose,
  workflow
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !workflow) return null;

  const cronVal =
    workflow.cronExpression ||
    (workflow.intervalMinutes >= 60
      ? `0 */${Math.floor(workflow.intervalMinutes / 60)} * * *`
      : `*/${workflow.intervalMinutes} * * * *`);

  const safeName = workflow.name.replace(/[^a-zA-Z0-9 _-]/g, '').trim() || 'Telegram Affiliate Workflow';
  const fileName = `${safeName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.yml`;

  const yamlContent = `name: "${safeName}"

# 1. CÂND RULEAZĂ WORKFLOW-UL?
on:
  schedule:
    - cron: '${cronVal}'
  workflow_dispatch:       # Îți permite să declanșezi rularea manual din GitHub

# 2. CE FACE WORKFLOW-UL?
jobs:
  run-telegram-affiliate:
    runs-on: ubuntu-latest  # Mașină virtuală Linux gratuită oferită de GitHub

    steps:
      # Pasul A: Descarcă codul din repository
      - name: Checkout cod
        uses: actions/checkout@v4

      # Pasul B: Instalează mediul Node.js 22
      - name: Configurare Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: 'npm'

      # Pasul C: Instalează dependențele
      - name: Instalare dependențe
        run: npm ci

      # Pasul D: Execută automatizarea Telegram pentru acest workflow
      - name: Executare Workflow Telegram (${workflow.id})
        env:
          TELEGRAM_BOT_TOKEN: \${{ secrets.TELEGRAM_BOT_TOKEN }}
          TELEGRAM_CHANNEL_ID: \${{ secrets.TELEGRAM_CHANNEL_ID }}
          GEMINI_API_KEY: \${{ secrets.GEMINI_API_KEY }}
          FEED_URL: \${{ secrets.FEED_URL }}
        run: |
          npx tsx scripts/run-workflow.ts
`;

  const handleCopy = () => {
    navigator.clipboard.writeText(yamlContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([yamlContent], { type: 'text/yaml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/60">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
              <FileCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">
                Export GitHub Actions Workflow
              </h3>
              <p className="text-xs text-slate-400">
                Fișier YAML gata de adăugat în <code>.github/workflows/{fileName}</code>
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

        {/* Info card */}
        <div className="p-6 pb-2 space-y-3">
          <div className="bg-sky-950/40 border border-sky-800/60 rounded-xl p-3.5 text-xs text-sky-200 flex items-start gap-3">
            <Terminal className="w-4 h-4 text-sky-400 mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold text-white">Instrucțiuni de activare pe GitHub:</p>
              <ol className="list-decimal ml-4 mt-1 space-y-1 text-slate-300 text-[11px]">
                <li>Copiază codul de mai jos sau descarcă fișierul.</li>
                <li>Salvează-l în folderul <code>.github/workflows/{fileName}</code> din repo-ul tău.</li>
                <li>Asigură-te că ai adăugat în GitHub Repo ➔ Settings ➔ Secrets: <code>TELEGRAM_BOT_TOKEN</code>, <code>TELEGRAM_CHANNEL_ID</code>, <code>GEMINI_API_KEY</code>, <code>FEED_URL</code>.</li>
              </ol>
            </div>
          </div>
        </div>

        {/* Code view */}
        <div className="flex-1 overflow-y-auto px-6 py-2">
          <pre className="bg-slate-950 border border-slate-800 rounded-xl p-4 font-mono text-xs text-slate-300 overflow-x-auto leading-relaxed">
            {yamlContent}
          </pre>
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-900/60">
          <button
            type="button"
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
          >
            <Download className="w-4 h-4" />
            Descarcă {fileName}
          </button>

          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white shadow-md shadow-sky-900/30 transition"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4" />
                Copiat în Clipboard!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                Copiază Codul YAML
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
