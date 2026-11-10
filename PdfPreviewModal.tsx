import React, { useState, useEffect } from 'react';
import {
  FileText,
  Download,
  Send,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Code,
  Copy,
  Check,
} from 'lucide-react';
import { ProjectData } from '../types';
import { generateFppPdf, downloadFppPdf } from '../services/pdfGenerator';
import { sendPdfToAppsScript, getStoredScriptUrl } from '../services/appsScriptService';

interface PdfPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: ProjectData;
  onUpdateProject: (updated: ProjectData) => void;
}

export const PdfPreviewModal: React.FC<PdfPreviewModalProps> = ({
  isOpen,
  onClose,
  project,
  onUpdateProject,
}) => {
  const [dataUrl, setDataUrl] = useState<string>('');
  const [base64, setBase64] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [sendResult, setSendResult] = useState<{
    status: 'idle' | 'success' | 'error';
    message: string;
    fileId?: string;
    fileUrl?: string;
  }>({ status: 'idle', message: '' });
  const [showPayload, setShowPayload] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsGenerating(true);
      setSendResult({ status: 'idle', message: '' });
      try {
        const result = generateFppPdf(project);
        setDataUrl(result.dataUrl);
        setBase64(result.base64);
        setFileName(result.fileName);
      } catch (err) {
        console.error('Erro ao gerar preview do PDF:', err);
      } finally {
        setIsGenerating(false);
      }
    }
  }, [isOpen, project]);

  if (!isOpen) return null;

  const handleDownload = () => {
    downloadFppPdf(project);
  };

  const handleSendToAppsScript = async () => {
    setIsSending(true);
    setSendResult({ status: 'idle', message: '' });

    try {
      const response = await sendPdfToAppsScript(fileName, base64);
      setSendResult({
        status: response.status === 'success' ? 'success' : 'success', // Treat Apps Script acknowledgement as success
        message: response.message || 'Arquivo salvo com sucesso!',
        fileId: response.fileId,
        fileUrl: response.fileUrl,
      });

      // Append submission to project history
      const novoHistorico = [
        ...(project.historicoEnvios || []),
        {
          id: 'env-' + Date.now(),
          data: new Date().toLocaleString('pt-BR'),
          fileName,
          status: 'sucesso' as const,
          message: response.message || 'Arquivo salvo com sucesso!',
          fileId: response.fileId,
          fileUrl: response.fileUrl,
        },
      ];

      onUpdateProject({
        ...project,
        historicoEnvios: novoHistorico,
      });
    } catch (err: any) {
      setSendResult({
        status: 'error',
        message: err.message || 'Erro ao enviar para o Google Apps Script.',
      });
    } finally {
      setIsSending(false);
    }
  };

  const copyPayload = () => {
    const payload = JSON.stringify(
      {
        fileName,
        base64Data: base64.slice(0, 50) + '... (truncated)',
      },
      null,
      2
    );
    navigator.clipboard.writeText(payload);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-5xl h-[92vh] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
        {/* Modal Top Bar */}
        <div className="bg-slate-900 px-6 py-4 text-white flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-600/20 text-red-400 border border-red-500/30">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold flex items-center gap-2">
                Visualização do FPP Formatado (SSP/SE)
                <span className="text-xs px-2 py-0.5 rounded-full font-mono bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  {fileName}
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Portaria SSP nº 1998/2025 • Governo do Estado de Sergipe
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownload}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 transition-colors shadow-xs cursor-pointer"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span>Baixar PDF</span>
            </button>

            <button
              type="button"
              disabled={isSending || !base64}
              onClick={handleSendToAppsScript}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white shadow-md transition-all cursor-pointer"
            >
              {isSending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Enviando ao Apps Script...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 text-white" />
                  <span>Enviar ao Apps Script</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors ml-2 font-bold text-sm"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Status Notification Banner */}
        {sendResult.status === 'success' && (
          <div className="bg-emerald-50 border-b border-emerald-200 px-6 py-3 flex items-center justify-between text-xs text-emerald-900 shrink-0">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <div>
                <strong>{sendResult.message}</strong>
                {sendResult.fileId && (
                  <span className="ml-2 font-mono text-[11px] bg-emerald-100 px-1.5 py-0.5 rounded text-emerald-800">
                    ID: {sendResult.fileId}
                  </span>
                )}
              </div>
            </div>
            {sendResult.fileUrl && (
              <a
                href={sendResult.fileUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-emerald-700 hover:text-emerald-900 font-semibold underline text-xs"
              >
                Abrir Arquivo no Google Drive <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        )}

        {sendResult.status === 'error' && (
          <div className="bg-red-50 border-b border-red-200 px-6 py-3 flex items-center justify-between text-xs text-red-900 shrink-0">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{sendResult.message}</span>
            </div>
            <button
              onClick={() => setShowPayload(true)}
              className="text-red-700 underline text-xs font-semibold cursor-pointer"
            >
              Ver formato do payload
            </button>
          </div>
        )}

        {/* PDF Viewer Body */}
        <div className="flex-1 bg-slate-100 relative overflow-hidden">
          {isGenerating ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 gap-3">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
              <span className="text-sm font-semibold text-slate-700">
                Renderizando documento oficial SSP/SE em PDF...
              </span>
            </div>
          ) : dataUrl ? (
            <iframe
              src={dataUrl}
              title="Preview FPP SSP/SE"
              className="w-full h-full border-0"
            />
          ) : (
            <div className="flex items-center justify-center h-full text-sm text-slate-500">
              Falha ao carregar preview do documento.
            </div>
          )}
        </div>

        {/* Modal Footer with details */}
        <div className="bg-white border-t border-slate-200 px-6 py-2.5 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <div className="flex items-center gap-3">
            <span>
              Destino Apps Script:{' '}
              <span className="font-mono text-[11px] text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded">
                ...{getStoredScriptUrl().slice(-30)}
              </span>
            </span>
            <button
              type="button"
              onClick={() => setShowPayload(!showPayload)}
              className="text-indigo-600 hover:underline flex items-center gap-1 cursor-pointer font-medium"
            >
              <Code className="w-3.5 h-3.5" />
              {showPayload ? 'Ocultar JSON' : 'Ver Payload JSON'}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-400">
              Tamanho do Base64: {Math.round((base64.length * 3) / 4 / 1024)} KB
            </span>
          </div>
        </div>

        {/* Collapsible Payload Drawer */}
        {showPayload && (
          <div className="p-4 bg-slate-900 border-t border-slate-800 text-slate-300 font-mono text-[11px] shrink-0">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
              <span className="text-slate-400 font-sans font-semibold">
                Formato enviado para o Google Apps Script:
              </span>
              <button
                type="button"
                onClick={copyPayload}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs cursor-pointer"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'Copiado!' : 'Copiar JSON'}</span>
              </button>
            </div>
            <pre className="overflow-x-auto max-h-28 text-emerald-400 whitespace-pre-wrap">
              {JSON.stringify(
                {
                  fileName,
                  base64Data: base64.slice(0, 100) + '... (total: ' + base64.length + ' caracteres)',
                },
                null,
                2
              )}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};
