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
  ArrowLeft,
  ShieldCheck,
  Calendar,
} from 'lucide-react';
import { ProjectData } from '../types';
import { generateFppPdf, downloadFppPdf, formatCurrencyBRL } from '../services/pdfGenerator';
import { sendPdfToAppsScript, getStoredScriptUrl } from '../services/appsScriptService';

interface PdfPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: ProjectData;
  onUpdateProject: (updated: ProjectData) => void;
  initialStep?: 'preview' | 'confirm';
}

export const PdfPreviewModal: React.FC<PdfPreviewModalProps> = ({
  isOpen,
  onClose,
  project,
  onUpdateProject,
  initialStep = 'preview',
}) => {
  const [modalStep, setModalStep] = useState<'preview' | 'confirm' | 'receipt'>(initialStep);
  const [dataUrl, setDataUrl] = useState<string>('');
  const [base64, setBase64] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [sendResult, setSendResult] = useState<{
    status: 'idle' | 'success' | 'error';
    message: string;
    sentAt?: string;
    fileId?: string;
    fileUrl?: string;
  }>({ status: 'idle', message: '' });
  const [showPayload, setShowPayload] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setModalStep(initialStep);
      setIsGenerating(true);
      setSendResult({ status: 'idle', message: '' });
      setShowPayload(false);
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
  }, [isOpen, project, initialStep]);

  if (!isOpen) return null;

  const totalGeral = (project.materiaisServicos || []).reduce(
    (acc, m) => acc + (m.valorTotal || m.quantidade * (m.valorUnitario || 0)),
    0
  );
  const totalInvestimento = (project.materiaisServicos || [])
    .filter((m) => m.naturezaDespesa === '4.4.90' || !m.naturezaDespesa?.includes('3.3.90'))
    .reduce((acc, m) => acc + (m.valorTotal || m.quantidade * (m.valorUnitario || 0)), 0);
  const totalCusteio = (project.materiaisServicos || [])
    .filter((m) => m.naturezaDespesa === '3.3.90' || m.naturezaDespesa?.includes('3.3.90'))
    .reduce((acc, m) => acc + (m.valorTotal || m.quantidade * (m.valorUnitario || 0)), 0);

  const handleDownload = () => {
    downloadFppPdf(project);
  };

  const handleSendToAeplan = async () => {
    setIsSending(true);
    setSendResult({ status: 'idle', message: '' });

    try {
      const response = await sendPdfToAppsScript(fileName, base64);
      const sentAt = new Date().toLocaleString('pt-BR');
      const successMessage = response.message || 'Proposta enviada para a AEPLAN com sucesso!';

      setSendResult({
        status: 'success',
        message: successMessage,
        sentAt,
        fileId: response.fileId,
        fileUrl: response.fileUrl,
      });

      const novoHistorico = [
        ...(project.historicoEnvios || []),
        {
          id: 'env-' + Date.now(),
          data: sentAt,
          fileName,
          status: 'sucesso' as const,
          message: successMessage,
          fileId: response.fileId,
          fileUrl: response.fileUrl,
        },
      ];

      onUpdateProject({
        ...project,
        historicoEnvios: novoHistorico,
      });

      setModalStep('receipt');
    } catch (err: any) {
      setSendResult({
        status: 'error',
        message: err.message || 'Erro ao enviar proposta para a AEPLAN.',
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
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 rounded-lg bg-red-600/20 text-red-400 border border-red-500/30 shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-bold truncate">
                {project.titulo?.trim() || 'Proposta de Projeto SSP/SE'}
              </h3>
              <p className="text-xs text-slate-400 truncate">
                {project.numeroProposta || 'Sem protocolo'} · Área {project.areaTematica} · {fileName || 'FPP.pdf'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleDownload}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 transition-colors cursor-pointer whitespace-nowrap"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span>Baixar PDF</span>
            </button>

            {modalStep === 'preview' && (
              <button
                type="button"
                disabled={!base64 || isGenerating}
                onClick={() => setModalStep('confirm')}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white shadow-md transition-all cursor-pointer whitespace-nowrap"
              >
                <Send className="w-4 h-4 text-white" />
                <span>Enviar para a AEPLAN</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors ml-1 font-bold text-sm cursor-pointer"
              aria-label="Fechar janela"
            >
              ✕
            </button>
          </div>
        </div>

        {/* STEP 1: PREVIEW VIEW */}
        {modalStep === 'preview' && (
          <>
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

            <div className="bg-white border-t border-slate-200 px-6 py-2.5 flex items-center justify-between text-xs text-slate-500 shrink-0">
              <div className="flex items-center gap-3">
                <span>
                  Destino (AEPLAN):{' '}
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

              <div className="flex items-center gap-2 tabular-nums">
                <span className="text-[11px] text-slate-400">
                  Tamanho do Base64: {Math.round((base64.length * 3) / 4 / 1024)} KB
                </span>
              </div>
            </div>
          </>
        )}

        {/* STEP 2: PRE-SEND CONFIRMATION SCREEN */}
        {modalStep === 'confirm' && (
          <div className="flex-1 bg-slate-50 overflow-y-auto p-6 sm:p-10 flex items-center justify-center">
            <div className="w-full max-w-2xl bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
              <div className="flex items-start gap-4 border-b border-slate-100 pb-5">
                <div className="p-3 rounded-xl bg-blue-50 text-blue-700 border border-blue-200 shrink-0">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-lg font-extrabold text-slate-900">
                    Confirmar Envio para a AEPLAN
                  </h4>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Confira os dados consolidados da proposta antes de protocolar o PDF oficial no sistema da AEPLAN.
                  </p>
                </div>
              </div>

              {sendResult.status === 'error' && (
                <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800 flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-bold">Falha no envio</p>
                    <p>{sendResult.message}</p>
                  </div>
                </div>
              )}

              <div className="space-y-4 text-xs">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="text-slate-500 font-medium">Título do Projeto</div>
                  <div className="text-sm font-bold text-slate-900 leading-snug">
                    {project.titulo?.trim() || 'Proposta sem título informado'}
                  </div>
                  <div className="pt-1 text-slate-600 flex flex-wrap items-center gap-2 tabular-nums">
                    <span className="font-mono font-bold text-slate-800">
                      {project.numeroProposta || 'Sem protocolo'}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>Área {project.areaTematica}</span>
                    <span aria-hidden="true">·</span>
                    <span>{fileName}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                    <div className="text-slate-500 font-medium">Responsável Técnico</div>
                    <div className="font-bold text-slate-900">
                      {project.responsavelTecnico || 'Não informado'}
                    </div>
                    <div className="text-slate-600">
                      {project.lotacao || 'Lotação não informada'}
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1 tabular-nums">
                    <div className="text-slate-500 font-medium">Resumo Orçamentário</div>
                    <div className="text-base font-black text-slate-900">
                      {formatCurrencyBRL(totalGeral)}
                    </div>
                    <div className="text-slate-600">
                      4.4.90: {formatCurrencyBRL(totalInvestimento)} · 3.3.90: {formatCurrencyBRL(totalCusteio)}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 bg-white text-slate-600">
                  <span>Destino da Integração</span>
                  <span className="font-mono text-[11px] text-slate-800">
                    AEPLAN (...{getStoredScriptUrl().slice(-24)})
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  disabled={isSending}
                  onClick={() => setModalStep('preview')}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Voltar e Revisar PDF</span>
                </button>

                <button
                  type="button"
                  disabled={isSending || !base64}
                  onClick={handleSendToAeplan}
                  className="inline-flex items-center gap-2 px-6 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-xl shadow-md transition-all cursor-pointer"
                >
                  {isSending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Enviando Proposta...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Confirmar e Enviar para AEPLAN</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: POST-SEND CONFIRMATION RECEIPT SCREEN */}
        {modalStep === 'receipt' && (
          <div className="flex-1 bg-slate-50 overflow-y-auto p-6 sm:p-10 flex items-center justify-center">
            <div className="w-full max-w-2xl bg-white rounded-2xl border border-emerald-200 shadow-sm p-6 sm:p-8 space-y-6">
              <div className="flex flex-col items-center text-center space-y-3 border-b border-slate-100 pb-6">
                <div className="p-3.5 rounded-full bg-emerald-100 text-emerald-700">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-xl font-black text-slate-900">
                    Envio Confirmado para a AEPLAN
                  </h4>
                  <p className="text-xs text-slate-600 max-w-md mx-auto">
                    {sendResult.message}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1 sm:col-span-2">
                  <span className="text-slate-500 font-medium">Título do Projeto</span>
                  <p className="text-sm font-bold text-slate-900">
                    {project.titulo?.trim() || 'Proposta sem título'}
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1 tabular-nums">
                  <span className="text-slate-500 font-medium">Protocolo da Proposta</span>
                  <p className="font-mono font-bold text-slate-900">
                    {project.numeroProposta || 'Não informado'}
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1 tabular-nums">
                  <span className="text-slate-500 font-medium flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" /> Data e Hora do Envio
                  </span>
                  <p className="font-bold text-slate-900">{sendResult.sentAt || new Date().toLocaleString('pt-BR')}</p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <span className="text-slate-500 font-medium">Arquivo Protocolado</span>
                  <p className="font-mono text-slate-800 truncate">{fileName}</p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1 tabular-nums">
                  <span className="text-slate-500 font-medium">Valor Total Estimado</span>
                  <p className="font-bold text-emerald-700">{formatCurrencyBRL(totalGeral)}</p>
                </div>

                {sendResult.fileId && (
                  <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 space-y-1 sm:col-span-2">
                    <span className="text-emerald-800 font-medium">Identificador de Recebimento (Drive ID)</span>
                    <p className="font-mono font-bold text-emerald-950 break-all">{sendResult.fileId}</p>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-100">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleDownload}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                  >
                    <Download className="w-4 h-4 text-emerald-600" />
                    <span>Baixar Cópia do PDF</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setModalStep('preview')}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-colors cursor-pointer"
                  >
                    <FileText className="w-4 h-4 text-slate-600" />
                    <span>Ver PDF</span>
                  </button>

                  {sendResult.fileUrl && (
                    <a
                      href={sendResult.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition-colors"
                    >
                      <span>Abrir no Drive</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>

                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-2.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                >
                  Concluir e Fechar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Collapsible Payload Drawer */}
        {showPayload && modalStep === 'preview' && (
          <div className="p-4 bg-slate-900 border-t border-slate-800 text-slate-300 font-mono text-[11px] shrink-0">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
              <span className="text-slate-400 font-sans font-semibold">
                Formato de envio para a AEPLAN:
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
