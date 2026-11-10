import React, { useState } from 'react';
import { Sparkles, Loader2, CheckCircle2, Shield, HeartHandshake, Dumbbell, AlertTriangle, Lightbulb } from 'lucide-react';
import { ThematicArea, ProjectData } from '../types';
import { generateFullProposal } from '../services/geminiService';

interface AiAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyProposal: (generated: Partial<ProjectData>) => void;
  currentArea: ThematicArea;
}

export const AiAssistantModal: React.FC<AiAssistantModalProps> = ({
  isOpen,
  onClose,
  onApplyProposal,
  currentArea,
}) => {
  const [area, setArea] = useState<ThematicArea>(currentArea || 'MVI');
  const [ideia, setIdeia] = useState('');
  const [instituicao, setInstituicao] = useState('Polícia Militar do Estado de Sergipe - PMSE');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedData, setGeneratedData] = useState<Partial<ProjectData> | null>(null);

  if (!isOpen) return null;

  const quickPrompts: Record<ThematicArea, string[]> = {
    MVI: [
      'Aquisição de 4 viaturas 4x4 e 25 pistolas 9mm para combate a homicídios e saturação de radiopatrulhamento no 4º BPM (Canindé de São Francisco e Sertão)',
      'Compra de 10 fuzis calibre 5,56 e miras holográficas para unidades especializadas operando em manchas de crimes violentos na Grande Aracaju',
      'Modernização do sistema de radiocomunicação digital e tablets embarcados para viaturas da PMSE visando redução de tempo de resposta a homicídios em Itabaiana',
    ],
    EVM: [
      'Implantação de viatura SUV caracterizada lilás e kit de acolhimento para expansão da Patrulha Maria da Penha no 6º BPM (Estância e Região Sul)',
      'Estruturação de Sala Lilás de Acolhimento Humanizado com brinquedoteca e mobiliário ergonômico no Batalhão de Lagarto (7º BPM)',
      'Aquisição de viatura dedicada e equipamentos de informática para fiscalização intensiva de Medidas Protetivas de Urgência em Nossa Senhora do Socorro',
    ],
    MQV: [
      'Implantação de Centro de Treinamento Físico e Academia de Musculação com aparelhos profissionais na sede do 11º BPM em Tobias Barreto',
      'Reforma, salubridade e instalação de aparelhos de ar-condicionado inverter nos alojamentos policiais do 3º BPM (Itabaiana/Agreste)',
      'Aquisição de equipamentos ergonômicos e mobiliário de repouso para redução de lesões musculoesqueléticas e estresse operacional dos policiais de plantão',
    ],
  };

  const handleGenerate = async () => {
    if (!ideia.trim()) {
      setError('Por favor, informe a ideia ou objetivo principal do projeto.');
      return;
    }

    setLoading(true);
    setError(null);
    setGeneratedData(null);

    try {
      const result = await generateFullProposal(ideia, area, instituicao);
      setGeneratedData(result);
    } catch (err: any) {
      setError(err.message || 'Falha ao gerar proposta com IA. Verifique sua chave de API.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmApply = () => {
    if (generatedData) {
      onApplyProposal({
        ...generatedData,
        areaTematica: area,
        instituicao,
      });
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8">
        {/* Top Header */}
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-white/10 backdrop-blur-md">
                <Sparkles className="w-6 h-6 text-amber-300" />
              </div>
              <div>
                <h3 className="text-lg font-bold">Assistente de Criação de Projetos IA Gemini</h3>
                <p className="text-xs text-blue-200">
                  Gere o preenchimento técnico completo do FPP conforme a Portaria SSP nº 1998/2025
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white/70 hover:text-white p-1 rounded-lg hover:bg-white/10 text-sm font-semibold transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Thematic Area Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              1. Selecione a Área Temática Prioritária:
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setArea('MVI')}
                className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  area === 'MVI'
                    ? 'border-red-500 bg-red-50/70 text-red-950 ring-2 ring-red-400'
                    : 'border-slate-200 hover:border-red-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Shield className="w-4 h-4 text-red-600" />
                  <span className="font-bold text-sm">MVI</span>
                </div>
                <span className="text-xs font-semibold">Mortes Violentas Intencionais</span>
                <span className="text-[11px] text-slate-500 mt-1">
                  Radiopatrulha, armas, viaturas e repressão qualificada ao crime letal
                </span>
              </button>

              <button
                type="button"
                onClick={() => setArea('EVM')}
                className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  area === 'EVM'
                    ? 'border-purple-500 bg-purple-50/70 text-purple-950 ring-2 ring-purple-400'
                    : 'border-slate-200 hover:border-purple-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <HeartHandshake className="w-4 h-4 text-purple-600" />
                  <span className="font-bold text-sm">EVM</span>
                </div>
                <span className="text-xs font-semibold">Violência contra Mulher</span>
                <span className="text-[11px] text-slate-500 mt-1">
                  Patrulha Maria da Penha, Sala Lilás e acolhimento especializado
                </span>
              </button>

              <button
                type="button"
                onClick={() => setArea('MQV')}
                className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  area === 'MQV'
                    ? 'border-emerald-500 bg-emerald-50/70 text-emerald-950 ring-2 ring-emerald-400'
                    : 'border-slate-200 hover:border-emerald-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Dumbbell className="w-4 h-4 text-emerald-600" />
                  <span className="font-bold text-sm">MQV</span>
                </div>
                <span className="text-xs font-semibold">Qualidade de Vida Policial</span>
                <span className="text-[11px] text-slate-500 mt-1">
                  Academias, saúde mental, salubridade, ergonomia e bem-estar
                </span>
              </button>
            </div>
          </div>

          {/* Institution Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Instituição / Órgão Responsável:
            </label>
            <input
              type="text"
              value={instituicao}
              onChange={(e) => setInstituicao(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              placeholder="Ex.: Polícia Militar do Estado de Sergipe - PMSE"
            />
          </div>

          {/* Project Idea Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              2. Descreva a Ideia ou Necessidade do seu Projeto:
            </label>
            <textarea
              rows={3}
              value={ideia}
              onChange={(e) => setIdeia(e.target.value)}
              placeholder="Ex.: Precisamos de 5 viaturas 4x4 e 20 pistolas 9mm para cobrir a área rural de Canindé e reduzir homicídios decorrentes de disputas territoriais..."
              className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none leading-relaxed"
            />

            {/* Quick Inspiration Prompts */}
            <div className="mt-2">
              <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1 mb-1.5">
                <Lightbulb className="w-3 h-3 text-amber-500" /> Exemplos rápidos para a área {area}:
              </span>
              <div className="space-y-1">
                {quickPrompts[area].map((promptText, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setIdeia(promptText)}
                    className="block w-full text-left text-xs text-indigo-700 hover:text-indigo-900 bg-indigo-50/60 hover:bg-indigo-100/70 p-2 rounded-md transition-colors cursor-pointer border border-indigo-100"
                  >
                    💡 {promptText}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Loading Animation */}
          {loading && (
            <div className="p-6 bg-indigo-50/50 rounded-xl border border-indigo-100 flex flex-col items-center justify-center text-center space-y-2">
              <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
              <div className="text-sm font-semibold text-indigo-900">
                O Gemini está estruturando sua proposta oficial...
              </div>
              <p className="text-xs text-slate-500 max-w-md">
                Redigindo Justificativa, Metas, Sustentabilidade, Tabela de Localização e Estimativa de Preços conforme o padrão oficial da SSP/SE.
              </p>
            </div>
          )}

          {/* Generated Proposal Preview */}
          {generatedData && !loading && (
            <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 space-y-3">
              <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                Proposta Técnica Gerada com Sucesso!
              </div>

              <div className="space-y-1 text-xs text-slate-700 bg-white p-3 rounded-lg border border-emerald-100 max-h-48 overflow-y-auto">
                <p>
                  <strong>Título:</strong> {generatedData.titulo}
                </p>
                <p>
                  <strong>Objetivo Geral:</strong> {generatedData.objetivoGeral}
                </p>
                <p>
                  <strong>Itens de Aquisição:</strong>{' '}
                  {generatedData.materiaisServicos?.map((m) => `${m.quantidade}x ${m.materialServico}`).join(', ') || 'Diversos'}
                </p>
                <p>
                  <strong>Público Direto:</strong> {generatedData.publicoAlvoDireto}
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setGeneratedData(null)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-200 rounded-lg"
                >
                  Tentar Outra Ideia
                </button>
                <button
                  type="button"
                  onClick={handleConfirmApply}
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm flex items-center gap-1.5 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Preencher Formulário com Esta Proposta
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <span className="text-[11px] text-slate-500">
            Powered by Google Gemini 3.8 Flash • Modelo Gratuito
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={loading || !ideia.trim()}
              onClick={handleGenerate}
              className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-md transition-all flex items-center gap-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Gerando...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>Gerar Proposta Completa com IA</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
