import React, { useState } from 'react';
import { Settings, Globe, Check, RotateCcw, Sparkles } from 'lucide-react';
import { getStoredScriptUrl, saveStoredScriptUrl, DEFAULT_SCRIPT_URL } from '../services/appsScriptService';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const [scriptUrl, setScriptUrl] = useState(getStoredScriptUrl());
  const [saved, setSaved] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    saveStoredScriptUrl(scriptUrl);
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 1200);
  };

  const handleReset = () => {
    setScriptUrl(DEFAULT_SCRIPT_URL);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8">
        <div className="bg-slate-900 p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-slate-800 border border-slate-700">
              <Settings className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h3 className="text-base font-bold">Configurações de Integração</h3>
              <p className="text-xs text-slate-400">
                Endpoint da AEPLAN (Google Apps Script) e Ponte de IA
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white p-1 rounded-lg hover:bg-slate-800 text-sm font-semibold transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="p-3.5 rounded-xl bg-indigo-50 border border-indigo-200 flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
            <p className="text-[11px] text-indigo-900 leading-relaxed">
              Cascata automática de IA gratuita: <code>Gemini 3.1 Flash Lite</code> →{' '}
              <code>Gemini 4 Flash</code> → <code>Gemini 3.8 Flash</code> → <code>Offline</code>.
              As credenciais são gerenciadas com segurança no servidor ou nas Propriedades do Google Apps Script.
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-blue-600" />
              URL do Endpoint de Envio para a AEPLAN (Google Apps Script):
            </label>
            <input
              type="text"
              value={scriptUrl}
              onChange={(e) => setScriptUrl(e.target.value)}
              placeholder="https://script.google.com/macros/s/.../exec"
              className="w-full px-3.5 py-2 text-xs font-mono border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              O Apps Script recebe o PDF em JSON, envia cópia para o e-mail do proponente (se informado) e também atua como ponte segura da IA Gemini no GitHub Pages.
            </p>
          </div>

          <div className="pt-2 flex items-center justify-between">
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg border border-slate-200 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Restaurar Padrões
            </button>

            <button
              type="button"
              onClick={handleSave}
              className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm cursor-pointer"
            >
              {saved ? (
                <>
                  <Check className="w-4 h-4 text-emerald-300" />
                  Salvo!
                </>
              ) : (
                'Salvar Alterações'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
