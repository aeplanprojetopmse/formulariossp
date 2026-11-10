import React, { useState } from 'react';
import { Sparkles, Loader2, Check, ArrowRight } from 'lucide-react';
import { suggestFieldImprovement } from '../services/geminiService';
import { ProjectData } from '../types';

interface FieldAiButtonProps {
  fieldKey: string;
  fieldLabel: string;
  currentValue: string;
  projectContext: Partial<ProjectData>;
  onApply: (newValue: string) => void;
}

export const FieldAiButton: React.FC<FieldAiButtonProps> = ({
  fieldKey,
  fieldLabel,
  currentValue,
  projectContext,
  onApply,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleImprove = async (
    type: 'enrich' | 'more_technical' | 'add_metrics' | 'legal_framework' | 'from_context'
  ) => {
    setLoading(true);
    setError(null);
    setSuggestion(null);
    try {
      const result = await suggestFieldImprovement(
        fieldKey,
        fieldLabel,
        currentValue,
        projectContext,
        type
      );
      setSuggestion(result.trim());
    } catch (err: any) {
      setError(err.message || 'Erro ao consultar IA.');
    } finally {
      setLoading(false);
    }
  };

  const applySuggestion = () => {
    if (suggestion) {
      onApply(suggestion);
      setSuggestion(null);
      setIsOpen(false);
    }
  };

  // Count how many fields the user has filled in so far
  const filledCount = [
    projectContext.titulo,
    projectContext.lotacao,
    projectContext.objetivoGeral,
    projectContext.justificativa,
    projectContext.publicoAlvoDireto,
    (projectContext.materiaisServicos || []).length > 0 &&
    projectContext.materiaisServicos?.[0]?.materialServico
      ? 'mat'
      : '',
  ].filter(Boolean).length;

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-md bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 transition-colors shadow-2xs cursor-pointer"
        title="Sugerir texto baseado no que você já preencheu"
      >
        <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
        <span>Sugerir com IA</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 z-50 mt-1 w-84 sm:w-96 rounded-xl bg-white shadow-2xl ring-1 ring-black/10 border border-slate-200 p-3.5 text-left">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              IA Contextual: {fieldLabel}
            </span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-slate-600 text-xs px-1 font-bold"
            >
              ✕
            </button>
          </div>

          <div className="my-2 p-2 bg-indigo-50/80 rounded-lg border border-indigo-100 text-[11px] text-indigo-950">
            {filledCount > 0 ? (
              <p>
                💡 A IA usará os <strong>{filledCount} campo(s) já preenchidos</strong> por você (título, lotação, materiais, etc.) para formular esta seção de forma estritamente alinhada.
              </p>
            ) : (
              <p>
                💡 Você ainda não preencheu outros campos. A IA formulará uma sugestão técnica para a área <strong>{projectContext.areaTematica || 'MVI'}</strong>.
              </p>
            )}
          </div>

          <div className="space-y-1.5 mb-3">
            <button
              type="button"
              disabled={loading}
              onClick={() => handleImprove('from_context')}
              className="w-full text-[11px] font-semibold text-left p-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors cursor-pointer flex items-center justify-between shadow-xs"
            >
              <span>🎯 Sugerir a partir do que já preenchi</span>
              <ArrowRight className="w-3.5 h-3.5 text-indigo-200" />
            </button>

            <div className="grid grid-cols-2 gap-1.5 pt-1">
              <button
                type="button"
                disabled={loading}
                onClick={() => handleImprove('more_technical')}
                className="text-[11px] text-left p-1.5 rounded-lg bg-slate-50 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 border border-slate-200 transition-colors cursor-pointer"
              >
                💼 Doutrina Policial / Técnico
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={() => handleImprove('add_metrics')}
                className="text-[11px] text-left p-1.5 rounded-lg bg-slate-50 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 border border-slate-200 transition-colors cursor-pointer"
              >
                📊 Adicionar Métricas & %
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={() => handleImprove('legal_framework')}
                className="text-[11px] text-left p-1.5 rounded-lg bg-slate-50 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 border border-slate-200 transition-colors cursor-pointer"
              >
                📜 Portaria SSP & MJSP
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={() => handleImprove('enrich')}
                className="text-[11px] text-left p-1.5 rounded-lg bg-slate-50 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 border border-slate-200 transition-colors cursor-pointer"
              >
                ✨ Expandir & Detalhar
              </button>
            </div>
          </div>

          {loading && (
            <div className="flex items-center justify-center py-4 text-xs text-indigo-600 gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Gerando sugestão técnica com Gemini...</span>
            </div>
          )}

          {error && (
            <div className="p-2 mb-2 text-[11px] bg-red-50 text-red-700 rounded border border-red-200">
              {error}
            </div>
          )}

          {suggestion && (
            <div className="mt-2 space-y-2">
              <div className="max-h-48 overflow-y-auto p-2 bg-slate-50 rounded text-xs text-slate-800 border border-slate-200 whitespace-pre-wrap leading-relaxed">
                {suggestion}
              </div>
              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setSuggestion(null)}
                  className="px-2.5 py-1 text-xs text-slate-600 hover:bg-slate-100 rounded cursor-pointer"
                >
                  Descartar
                </button>
                <button
                  type="button"
                  onClick={applySuggestion}
                  className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded shadow-xs cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  Aplicar ao Campo
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
