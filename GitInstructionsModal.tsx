import React, { useState } from 'react';
import { GitBranch, Github, Terminal, Copy, Check, Globe, Download, CheckCircle2 } from 'lucide-react';

interface GitInstructionsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GitInstructionsModal: React.FC<GitInstructionsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const gitSteps = [
    {
      title: '1. Inicializar o repositório Git local',
      command: `git init\ngit add .\ngit commit -m "feat: Sistema de Projetos FPP SSP-SE com IA Gemini e Apps Script"`,
      desc: 'Execute no terminal dentro da pasta descompactada do projeto.',
    },
    {
      title: '2. Conectar ao seu repositório no GitHub',
      command: `git branch -M main\ngit remote add origin https://github.com/SEU-USUARIO/SEU-REPOSITORIO.git\ngit push -u origin main`,
      desc: 'Substitua pelo link do seu repositório criado no GitHub.',
    },
    {
      title: '3. Para rodar em desenvolvimento na sua máquina',
      command: `npm install\nnpm run dev`,
      desc: 'Inicia o servidor e a aplicação na porta 3000 com suporte completo a TypeScript e Vite.',
    },
    {
      title: '4. Para publicar como App Web na Nuvem (Vercel, Render ou Netlify)',
      command: `npm run build`,
      desc: 'Gera a pasta otimizada /dist pronta para hospedagem estática ou serverless.',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8">
        <div className="bg-slate-900 p-6 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-slate-800 border border-slate-700">
              <Github className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold">Guia de Envio para o Git e Deploy Web</h3>
              <p className="text-xs text-slate-400">
                Como baixar esta pasta, subir para o GitHub e rodar sua aplicação
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

        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto text-slate-700">
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl text-xs space-y-2 text-blue-950">
            <div className="flex items-center gap-2 font-bold text-sm text-blue-900">
              <CheckCircle2 className="w-4 h-4 text-blue-600" />
              Arquitetura Standalone Pronta para GitHub
            </div>
            <p>
              Esta aplicação foi construída com tecnologia <strong>React 19 + Vite + Tailwind CSS + jsPDF</strong>. Ela funciona tanto com servidor Node/Express quanto <strong>plenamente no frontend puro</strong> (chamando a API gratuita do Gemini diretamente pelo navegador e enviando o PDF em base64 para o seu Google Apps Script).
            </p>
          </div>

          <div className="space-y-4">
            {gitSteps.map((step, idx) => (
              <div key={idx} className="border border-slate-200 rounded-xl p-4 bg-slate-50/50">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Terminal className="w-3.5 h-3.5 text-slate-500" />
                    {step.title}
                  </span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(step.command, idx)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 transition-colors shadow-2xs cursor-pointer"
                  >
                    {copiedIndex === idx ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-700 font-semibold">Copiado!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-slate-500" />
                        <span>Copiar Comando</span>
                      </>
                    )}
                  </button>
                </div>
                <pre className="p-3 bg-slate-900 text-emerald-400 font-mono text-xs rounded-lg overflow-x-auto whitespace-pre">
                  {step.command}
                </pre>
                <p className="text-[11px] text-slate-500 mt-2">{step.desc}</p>
              </div>
            ))}
          </div>

          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-950 space-y-1">
            <span className="font-bold">Dica para o Google Apps Script:</span>
            <p>
              Ao publicar o Web App no Google Apps Script, lembre-se de configurar em <em>"Implantar &gt; Gerenciar Implantações &gt; Quem pode acessar"</em> como <strong>"Qualquer pessoa" (Anyone)</strong>. Isso permite que a requisição de gravação do PDF ocorra com sucesso tanto do servidor quanto diretamente do navegador.
            </p>
          </div>
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 rounded-lg cursor-pointer"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};
