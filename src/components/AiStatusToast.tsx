import React, { useEffect, useState } from 'react';
import { Sparkles, AlertTriangle, WifiOff, X } from 'lucide-react';
import { AiModelNotice, subscribeAiModelNotice } from '../services/geminiService';

export const AiStatusToast: React.FC = () => {
  const [notice, setNotice] = useState<AiModelNotice | null>(null);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;

    const unsubscribe = subscribeAiModelNotice((newNotice) => {
      setNotice(newNotice);
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        setNotice(null);
      }, 6000);
    });

    return () => {
      unsubscribe();
      if (timer) clearTimeout(timer);
    };
  }, []);

  if (!notice) return null;

  const isWarning = notice.quotaExhausted && !notice.isOffline;
  const isOffline = notice.isOffline;

  const containerStyle = isOffline
    ? 'bg-amber-950 text-amber-50 border-amber-700'
    : isWarning
    ? 'bg-slate-900 text-amber-50 border-amber-500/50'
    : 'bg-slate-900 text-white border-slate-700';

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed top-4 right-4 z-[60] max-w-sm w-[calc(100vw-2rem)] rounded-xl border px-4 py-3 shadow-2xl transition-all duration-200 ${containerStyle}`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`mt-0.5 p-1.5 rounded-lg shrink-0 ${
            isOffline
              ? 'bg-amber-800/70 text-amber-200'
              : isWarning
              ? 'bg-amber-500/20 text-amber-300'
              : 'bg-indigo-500/20 text-indigo-300'
          }`}
        >
          {isOffline ? (
            <WifiOff className="w-4 h-4" />
          ) : isWarning ? (
            <AlertTriangle className="w-4 h-4" />
          ) : (
            <Sparkles className="w-4 h-4" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold leading-snug">{notice.message}</p>
          <p className="text-[11px] text-slate-300 mt-0.5 leading-relaxed">
            {notice.detail}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setNotice(null)}
          aria-label="Fechar aviso"
          className="text-slate-400 hover:text-white p-1 rounded-md transition-colors cursor-pointer shrink-0"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
