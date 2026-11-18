import React, { useState } from 'react';
import { Sparkles, Loader2, Check, RefreshCw } from 'lucide-react';
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
  const [modelUsedLabel, setModelUsedLabel] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const filledCount = [
    projectContext.titulo,
    projectContext.lotacao,
    projectContext.objetivoGeral,
    projectContext.justificativa,
    projectContext.publicoAlvoDireto,
    (projectContext.materiaisServicos || []).some((m) => m.materialServico?.trim())
      ? 'mat'
      : '',
  ].filter(Boolean).length;

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    setSuggestion(null);
    setModelUsedLabel('');
    try {
      const result = await suggestFieldImprovement(
        fieldKey,
        fieldLabel,
        currentValue,
        projectContext
      );
      setSuggestion(result.text.trim());
      setModelUsedLabel(result.modelLabel);
    } catch (err: any) {
      setError(err.message || 'Erro ao gerar sugestão com IA.');
    } finally {
      setLoading(false);
    }
  };

  const handleTriggerClick = () => {
    if (isOpen && !loading) {
      setIsOpen(false);
      return;
    }
    setIsOpen(true);
    void handleGenerate();
  };

  const applySuggestion = () => {
    if (suggestion) {
      onApply(suggestion);
      setSuggestion(null);
      setIsOpen(false);
    }
  };

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={handleTriggerClick}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 transition-colors cursor-pointer whitespace-nowrap shrink-0"
        title="Sugerir texto técnico com base no contexto já preenchido"
      >
        <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
        <span>Sugerir com IA</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 z-50 mt-1.5 w-84 sm:w-[26rem] rounded-xl bg-white shadow-2xl ring-1 ring-black/10 border border-slate-200 p-4 text-left">
          <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
            <div className="min-w-0">
              <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                <span className="truncate">Sugestão com IA · {fieldLabel}</span>
              </span>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {filledCount > 0
                  ? `Considerando ${filledCount} seção(ões) preenchida(s) da proposta`
                  : `Baseado na área temática ${projectContext.areaTematica || 'MVI'}`}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-slate-600 text-xs px-1.5 py-1 font-bold cursor-pointer"
              aria-label="Fechar prévia"
            >
              ✕
            </button>
          </div>

          {loading && (
            <div className="flex flex-col items-center justify-center py-6 text-xs text-indigo-700 gap-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="font-medium">Elaborando sugestão técnica...</span>
            </div>
          )}

          {error && (
            <div className="mt-3 p-2.5 text-xs bg-red-50 text-red-700 rounded-lg border border-red-200">
              {error}
            </div>
          )}

          {suggestion && !loading && (
            <div className="mt-3 space-y-3">
              {modelUsedLabel && (
                <div className="text-[11px] font-medium text-slate-500">
                  Motor utilizado: <span className="font-semibold text-slate-700">{modelUsedLabel}</span>
                </div>
              )}

              <div className="max-h-56 overflow-y-auto p-3 bg-slate-50 rounded-lg text-xs text-slate-800 border border-slate-200 whitespace-pre-wrap leading-relaxed">
                {suggestion}
              </div>

              <div className="flex items-center justify-between gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => void handleGenerate()}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Gerar outra</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSuggestion(null);
                      setIsOpen(false);
                    }}
                    className="px-2.5 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                  >
                    Descartar
                  </button>
                  <button
                    type="button"
                    onClick={applySuggestion}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Aplicar ao Campo</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
