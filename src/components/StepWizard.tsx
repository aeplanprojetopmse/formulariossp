import React, { useState } from 'react';
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  FileText,
  Send,
  Plus,
  Trash2,
  RotateCcw,
  Shield,
  HeartHandshake,
  Dumbbell,
  Eye,
  Edit3,
  Settings,
  FolderOpen,
} from 'lucide-react';
import { ProjectData, ThematicArea, LocalizacaoItem, MaterialServicoItem } from '../types';
import { FieldAiButton } from './FieldAiButton';
import { formatCurrencyBRL } from '../services/pdfGenerator';
import { generateRandomProposalNumber, createBlankProject } from '../data/templates';

interface StepWizardProps {
  project: ProjectData;
  onChange: (updated: ProjectData) => void;
  onOpenAiAssistant: () => void;
  onOpenPdfPreview: () => void;
  onOpenSendConfirmation: () => void;
  onOpenProjectList: () => void;
  onOpenSettings: () => void;
  onNewBlankProject: (area: ThematicArea) => void;
}

export const StepWizard: React.FC<StepWizardProps> = ({
  project,
  onChange,
  onOpenAiAssistant: _onOpenAiAssistant,
  onOpenPdfPreview,
  onOpenSendConfirmation,
  onOpenProjectList,
  onOpenSettings,
  onNewBlankProject,
}) => {
  // Steps:
  // 0: Boas-vindas / Iniciar
  // 1: Área Temática & Número da Proposta
  // 2: Identificação do Projeto & Responsável Técnico
  // 3: I. Objetivo Geral & II. Objetivos Específicos
  // 4: III. Justificativa Técnica
  // 5: IV. Público-Alvo (Direto e Indireto)
  // 6: V. Resultados Esperados & VI. Metas
  // 7: VII. Sustentabilidade & VIII. Mensuração
  // 8: IX. Plano de Localização
  // 9: X. Materiais, Serviços & Pesquisa de Preços
  // 10: XI. Implementação
  // 11: Resumo Executivo & Envio à AEPLAN
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [viewMode, setViewMode] = useState<'wizard' | 'full'>('wizard');
  const [showClearModal, setShowClearModal] = useState(false);
  const [showClearSuccess, setShowClearSuccess] = useState(false);

  const updateField = <K extends keyof ProjectData>(field: K, value: ProjectData[K]) => {
    onChange({
      ...project,
      [field]: value,
      dataAtualizacao: new Date().toISOString(),
    });
  };

  const handleAreaSelect = (area: ThematicArea) => {
    const newRandomNumber = generateRandomProposalNumber(area);
    onChange({
      ...project,
      areaTematica: area,
      numeroProposta: newRandomNumber,
      dataAtualizacao: new Date().toISOString(),
    });
  };

  const handleConfirmClear = () => {
    const blank = createBlankProject(project.areaTematica);
    onChange({
      ...blank,
      id: project.id,
      numeroProposta: generateRandomProposalNumber(project.areaTematica),
      dataCriacao: new Date().toISOString(),
      dataAtualizacao: new Date().toISOString(),
    });
    setShowClearModal(false);
    setShowClearSuccess(true);
    setCurrentStep(1);
    setTimeout(() => setShowClearSuccess(false), 3000);
  };

  // Localizacao Handlers
  const addLocalizacaoRow = () => {
    const newRow: LocalizacaoItem = {
      id: 'loc-' + Date.now(),
      item: '',
      quantidade: 1,
      endereco: '',
    };
    updateField('planoLocalizacao', [...(project.planoLocalizacao || []), newRow]);
  };

  const removeLocalizacaoRow = (id: string) => {
    updateField(
      'planoLocalizacao',
      (project.planoLocalizacao || []).filter((item) => item.id !== id)
    );
  };

  const updateLocalizacaoRow = (id: string, field: keyof LocalizacaoItem, value: any) => {
    updateField(
      'planoLocalizacao',
      (project.planoLocalizacao || []).map((row) =>
        row.id === id ? { ...row, [field]: value } : row
      )
    );
  };

  // Materiais Handlers
  const addMaterialRow = () => {
    const newRow: MaterialServicoItem = {
      id: 'mat-' + Date.now(),
      materialServico: '',
      descricaoSucinta: '',
      modeloMarcaReferencia: '',
      naturezaDespesa: '4.4.90',
      quantidade: 1,
      valorUnitario: 0,
      valorTotal: 0,
    };
    updateField('materiaisServicos', [...(project.materiaisServicos || []), newRow]);
  };

  const removeMaterialRow = (id: string) => {
    updateField(
      'materiaisServicos',
      (project.materiaisServicos || []).filter((item) => item.id !== id)
    );
  };

  const updateMaterialRow = (id: string, field: keyof MaterialServicoItem, value: any) => {
    updateField(
      'materiaisServicos',
      (project.materiaisServicos || []).map((row) => {
        if (row.id === id) {
          const updated = { ...row, [field]: value };
          if (field === 'quantidade' || field === 'valorUnitario') {
            const qtd = field === 'quantidade' ? Number(value) : row.quantidade;
            const unit = field === 'valorUnitario' ? Number(value) : row.valorUnitario;
            updated.valorTotal = (qtd || 0) * (unit || 0);
          }
          return updated;
        }
        return row;
      })
    );
  };

  // Financial calculations
  const totalGeral = (project.materiaisServicos || []).reduce(
    (acc, m) => acc + (m.valorTotal || (m.quantidade * (m.valorUnitario || 0))),
    0
  );

  const totalInvestimento = (project.materiaisServicos || [])
    .filter((m) => m.naturezaDespesa === '4.4.90')
    .reduce((acc, m) => acc + (m.valorTotal || (m.quantidade * (m.valorUnitario || 0))), 0);

  const totalCusteio = (project.materiaisServicos || [])
    .filter((m) => m.naturezaDespesa === '3.3.90')
    .reduce((acc, m) => acc + (m.valorTotal || (m.quantidade * (m.valorUnitario || 0))), 0);

  // Steps definition for progress bar and breadcrumbs
  const stepsList = [
    { num: 1, title: 'Área Temática', desc: 'MVI, EVM ou MQV' },
    { num: 2, title: 'Identificação', desc: 'Título e Responsável' },
    { num: 3, title: 'Objetivos', desc: 'Geral e Específicos' },
    { num: 4, title: 'Justificativa', desc: 'Diagnóstico Técnico' },
    { num: 5, title: 'Público-Alvo', desc: 'Direto e Indireto' },
    { num: 6, title: 'Resultados & Metas', desc: 'Impactos e Prazos' },
    { num: 7, title: 'Sustentabilidade', desc: 'Manutenção e Métricas' },
    { num: 8, title: 'Localização', desc: 'Onde será instalado' },
    { num: 9, title: 'Materiais & Orçamento', desc: 'Itens 4.4.90 / 3.3.90' },
    { num: 10, title: 'Implementação', desc: 'Cronograma' },
    { num: 11, title: 'Resumo & Envio', desc: 'Revisão e AEPLAN' },
  ];

  const hasDraftData =
    Boolean(project.titulo?.trim()) ||
    Boolean(project.objetivoGeral?.trim()) ||
    (project.materiaisServicos || []).some((m) => m.materialServico?.trim());

  // STEP 0: TELA INICIAL COM BOTÃO INICIAR
  if (currentStep === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Institutional Header with global actions */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center space-y-4 relative">
          <div className="absolute top-4 right-4 flex items-center gap-2">
            <button
              type="button"
              onClick={onOpenProjectList}
              className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200 transition-colors cursor-pointer"
              title="Minhas Propostas Salvas"
            >
              <FolderOpen className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onOpenSettings}
              className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200 transition-colors cursor-pointer"
              title="Configurações (IA e Envio)"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between text-xs font-bold text-blue-900 border-b border-slate-100 pb-3">
            <span>SECRETARIA DE ESTADO DA SEGURANÇA PÚBLICA</span>
            <span>GOVERNO DO ESTADO DE SERGIPE</span>
          </div>

          <div className="py-4 space-y-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
              <Shield className="w-3.5 h-3.5" /> Portaria SSP nº 1998/2025
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Formulário de Proposta de Projeto (FPP)
            </h1>
            <p className="text-sm text-slate-600 max-w-2xl mx-auto leading-relaxed">
              Elabore sua proposta de projeto oficial passo a passo com o apoio da Inteligência Artificial gratuita do Google AI Studio, formatando o documento em PDF e enviando diretamente para a <strong>AEPLAN</strong>.
            </p>
          </div>

          {/* Start Actions */}
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => {
                onNewBlankProject(project.areaTematica);
                setCurrentStep(1);
              }}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 text-sm font-bold text-white bg-blue-700 hover:bg-blue-600 rounded-xl shadow-lg shadow-blue-950/20 transition-all hover:scale-102 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>Iniciar Nova Proposta</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            {hasDraftData && (
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl border border-slate-300 transition-colors cursor-pointer"
              >
                <span>Continuar Proposta em Andamento</span>
              </button>
            )}
          </div>

          {/* Quick Stats of current draft */}
          {hasDraftData && (
            <div className="mt-4 p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-slate-800">{project.numeroProposta}</span>
                <span>•</span>
                <span className="font-semibold text-slate-700 truncate max-w-xs">{project.titulo || 'Sem título'}</span>
              </div>
              <span className="text-emerald-700 font-bold">
                Total Estimado: {formatCurrencyBRL(totalGeral)}
              </span>
            </div>
          )}
        </div>

        {/* Feature Highlights Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl p-5 border border-slate-200 space-y-2">
            <div className="p-2.5 rounded-lg bg-red-50 text-red-700 w-fit">
              <Shield className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">3 Áreas Temáticas</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Elabore propostas direcionadas para MVI (Mortes Violentas), EVM (Violência contra a Mulher) ou MQV (Qualidade de Vida Policial).
            </p>
          </div>

          <div className="bg-white rounded-xl p-5 border border-slate-200 space-y-2">
            <div className="p-2.5 rounded-lg bg-indigo-50 text-indigo-700 w-fit">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">IA Gratuita & Contextual</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Sugestões inteligentes em cada campo que leem seus dados já preenchidos e usam modelos gratuitos da API sem nenhum custo.
            </p>
          </div>

          <div className="bg-white rounded-xl p-5 border border-slate-200 space-y-2">
            <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-700 w-fit">
              <Send className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">Envio Direto à AEPLAN</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Gere o documento PDF oficial formatado da SSP/SE e envie diretamente ao sistema integrado da AEPLAN com um clique.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // WIZARD MAIN VIEW (Steps 1 to 11)
  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      {/* Simplified Top Wizard Control Bar */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setCurrentStep(0)}
              className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-all cursor-pointer"
              title="Voltar para a tela inicial"
            >
              <RotateCcw className="w-5 h-5" />
            </button>
            <div>
              <h2 className="text-sm font-black text-blue-900 leading-tight">Passo {currentStep} de 11</h2>
              <p className="text-xs font-bold text-slate-500">{stepsList[currentStep - 1]?.title}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onOpenProjectList}
              className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200 transition-all cursor-pointer"
              title="Minhas Propostas"
            >
              <FolderOpen className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={onOpenSettings}
              className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200 transition-all cursor-pointer"
              title="Configurações"
            >
              <Settings className="w-5 h-5" />
            </button>
            <div className="h-8 w-px bg-slate-200 mx-1"></div>
            <button
              type="button"
              onClick={onOpenPdfPreview}
              className="hidden sm:inline-flex items-center gap-2 px-4 py-2.5 text-xs font-black text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-xl transition-all cursor-pointer shadow-sm"
            >
              <FileText className="w-4 h-4" />
              <span>PDF</span>
            </button>
          </div>
        </div>

        {/* Visual Progress Bar - Simple and clean */}
        <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden shadow-inner">
          <div
            className="bg-blue-600 h-full rounded-full transition-all duration-500 ease-out shadow-lg shadow-blue-500/20"
            style={{ width: `${(currentStep / 11) * 100}%` }}
          ></div>
        </div>
      </div>

      {/* Success Banner when Form is Cleared */}
      {showClearSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-semibold flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Formulário limpo com sucesso! Todos os campos estão em branco e prontos para novo preenchimento.</span>
          </div>
          <button
            type="button"
            onClick={() => setShowClearSuccess(false)}
            className="text-emerald-700 hover:text-emerald-900 p-1 text-xs cursor-pointer font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PASSO 1: ÁREA TEMÁTICA & NÚMERO DA PROPOSTA ALEATÓRIO                     */}
      {/* ========================================================================= */}
      {currentStep === 1 && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8 space-y-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Passo 1: Selecione a Área Temática do Projeto</h2>
            <p className="text-xs text-slate-500">
              A Portaria SSP nº 1998/2025 estabelece 3 eixos prioritários de investimento para captação de recursos.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* MVI Card */}
            <div
              onClick={() => handleAreaSelect('MVI')}
              className={`p-5 rounded-2xl border-2 transition-all cursor-pointer space-y-3 ${
                project.areaTematica === 'MVI'
                  ? 'border-red-600 bg-red-50/50 shadow-md ring-2 ring-red-200'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="p-2.5 rounded-xl bg-red-100 text-red-700">
                  <Shield className="w-6 h-6" />
                </div>
                {project.areaTematica === 'MVI' && (
                  <span className="text-[10px] font-bold uppercase bg-red-600 text-white px-2 py-0.5 rounded-full">
                    Selecionado
                  </span>
                )}
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-slate-900">MVI</h3>
                <p className="text-xs font-semibold text-red-800">Mortes Violentas Intencionais</p>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Aquisições de viaturas táticas, armamento, munições e tecnologia para redução de homicídios e crimes letais.
              </p>
            </div>

            {/* EVM Card */}
            <div
              onClick={() => handleAreaSelect('EVM')}
              className={`p-5 rounded-2xl border-2 transition-all cursor-pointer space-y-3 ${
                project.areaTematica === 'EVM'
                  ? 'border-purple-600 bg-purple-50/50 shadow-md ring-2 ring-purple-200'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="p-2.5 rounded-xl bg-purple-100 text-purple-700">
                  <HeartHandshake className="w-6 h-6" />
                </div>
                {project.areaTematica === 'EVM' && (
                  <span className="text-[10px] font-bold uppercase bg-purple-600 text-white px-2 py-0.5 rounded-full">
                    Selecionado
                  </span>
                )}
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-slate-900">EVM</h3>
                <p className="text-xs font-semibold text-purple-800">Violência contra a Mulher</p>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Estruturação da Patrulha Maria da Penha, viaturas lilás e salas de acolhimento humanizado para atendimento às vítimas.
              </p>
            </div>

            {/* MQV Card */}
            <div
              onClick={() => handleAreaSelect('MQV')}
              className={`p-5 rounded-2xl border-2 transition-all cursor-pointer space-y-3 ${
                project.areaTematica === 'MQV'
                  ? 'border-emerald-600 bg-emerald-50/50 shadow-md ring-2 ring-emerald-200'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="p-2.5 rounded-xl bg-emerald-100 text-emerald-700">
                  <Dumbbell className="w-6 h-6" />
                </div>
                {project.areaTematica === 'MQV' && (
                  <span className="text-[10px] font-bold uppercase bg-emerald-600 text-white px-2 py-0.5 rounded-full">
                    Selecionado
                  </span>
                )}
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-slate-900">MQV</h3>
                <p className="text-xs font-semibold text-emerald-800">Melhoria da Qualidade de Vida</p>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Equipamentos de musculação, academias policiais, climatização de alojamentos e saúde ocupacional preventiva.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <div>
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                Número Oficial da Proposta:
              </label>
              <p className="text-xs text-slate-500">
                Identificador único fixo gerado para esta proposta na SSP/SE.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="text"
                value={project.numeroProposta}
                readOnly
                placeholder="Ex: FPP-MVI-2025-481"
                className="w-full sm:w-72 px-3.5 py-2 text-sm font-mono font-bold text-slate-500 bg-slate-100 border border-slate-300 rounded-xl outline-none cursor-not-allowed shadow-inner"
              />
              <span className="text-xs text-slate-500 font-medium italic">
                (Campo bloqueado para assegurar integridade do protocolo)
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PASSO 2: IDENTIFICAÇÃO DO PROJETO & RESPONSÁVEL TÉCNICO                   */}
      {/* ========================================================================= */}
      {currentStep === 2 && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8 space-y-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Passo 2: Identificação do Projeto & Responsável Técnico</h2>
            <p className="text-xs text-slate-500">
              Defina o título do projeto e os dados do oficial/servidor responsável pela proposta técnica.
            </p>
          </div>

          {/* Título do Projeto com IA */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Título do Projeto:
              </label>
              <FieldAiButton
                fieldKey="titulo"
                fieldLabel="Título do Projeto"
                currentValue={project.titulo}
                projectContext={project}
                onApply={(val) => updateField('titulo', val)}
              />
            </div>
            <input
              type="text"
              value={project.titulo}
              onChange={(e) => updateField('titulo', e.target.value)}
              placeholder="Ex: Aquisição de Viaturas Policiais Operacionais 4x4 para Redução de Homicídios no Alto Sertão"
              className="w-full px-4 py-2.5 text-sm font-semibold text-slate-900 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          {/* Instituição & Responsável */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Órgão / Instituição:</label>
              <input
                type="text"
                value={project.instituicao}
                onChange={(e) => updateField('instituicao', e.target.value)}
                className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Responsável Técnico pelo Projeto:</label>
              <input
                type="text"
                value={project.responsavelTecnico}
                onChange={(e) => updateField('responsavelTecnico', e.target.value)}
                placeholder="Ex: Major PM João da Silva"
                className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Posto / Graduação / Cargo:</label>
              <input
                type="text"
                value={project.postoGraduacaoCargo}
                onChange={(e) => updateField('postoGraduacaoCargo', e.target.value)}
                placeholder="Ex: Major PM - Subcomandante"
                className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Lotação (OPM / Batalhão / Companhia):</label>
              <input
                type="text"
                value={project.lotacao}
                onChange={(e) => updateField('lotacao', e.target.value)}
                placeholder="Ex: 3º Batalhão de Polícia Militar (3º BPM - Itabaiana/SE)"
                className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Telefone Institucional:</label>
              <input
                type="text"
                value={project.telefone}
                onChange={(e) => updateField('telefone', e.target.value)}
                placeholder="Ex: (79) 3216-5400 / (79) 99999-1122"
                className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">E-mail Institucional:</label>
              <input
                type="email"
                value={project.email}
                onChange={(e) => updateField('email', e.target.value)}
                placeholder="Ex: planejamento@pm.se.gov.br"
                className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PASSO 3: I. OBJETIVO GERAL & II. OBJETIVOS ESPECÍFICOS                     */}
      {/* ========================================================================= */}
      {currentStep === 3 && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8 space-y-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Passo 3: Objetivos do Projeto (Itens I e II)</h2>
            <p className="text-xs text-slate-500">
              Descreva o resultado macro a ser alcançado e as metas específicas da proposta.
            </p>
          </div>

          {/* I. Objetivo Geral */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-extrabold text-blue-950 uppercase tracking-wide">
                I. OBJETIVO GERAL:
              </label>
              <FieldAiButton
                fieldKey="objetivoGeral"
                fieldLabel="I Objetivo Geral"
                currentValue={project.objetivoGeral}
                projectContext={project}
                onApply={(val) => updateField('objetivoGeral', val)}
              />
            </div>
            <textarea
              rows={3}
              value={project.objetivoGeral}
              onChange={(e) => updateField('objetivoGeral', e.target.value)}
              placeholder="Descreva o propósito central do projeto..."
              className="w-full px-4 py-3 text-sm text-slate-800 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none leading-relaxed"
            />
          </div>

          {/* II. Objetivos Específicos */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-extrabold text-blue-950 uppercase tracking-wide">
                II. OBJETIVOS ESPECÍFICOS:
              </label>
              <FieldAiButton
                fieldKey="objetivosEspecificos"
                fieldLabel="II Objetivos Específicos"
                currentValue={project.objetivosEspecificos}
                projectContext={project}
                onApply={(val) => updateField('objetivosEspecificos', val)}
              />
            </div>
            <textarea
              rows={4}
              value={project.objetivosEspecificos}
              onChange={(e) => updateField('objetivosEspecificos', e.target.value)}
              placeholder="1. Adquirir equipamentos...&#10;2. Reduzir tempo de resposta...&#10;3. Capacitar o efetivo..."
              className="w-full px-4 py-3 text-sm text-slate-800 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none leading-relaxed"
            />
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PASSO 4: III. JUSTIFICATIVA TÉCNICA                                        */}
      {/* ========================================================================= */}
      {currentStep === 4 && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8 space-y-4">
          <div>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">Passo 4: III. Justificativa Técnica</h2>
              <FieldAiButton
                fieldKey="justificativa"
                fieldLabel="III Justificativa"
                currentValue={project.justificativa}
                projectContext={project}
                onApply={(val) => updateField('justificativa', val)}
              />
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Fundamente a necessidade da aquisição com dados estatísticos da mancha criminal em Sergipe, carências logísticas e impacto na segurança da sociedade.
            </p>
          </div>

          <textarea
            rows={8}
            value={project.justificativa}
            onChange={(e) => updateField('justificativa', e.target.value)}
            placeholder="Apresente os motivos técnicos, operacionais e legais que fundamentam o projeto..."
            className="w-full px-4 py-3 text-sm text-slate-800 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none leading-relaxed"
          />
        </div>
      )}

      {/* ========================================================================= */}
      {/* PASSO 5: IV. PÚBLICO-ALVO (DIRETO E INDIRETO)                             */}
      {/* ========================================================================= */}
      {currentStep === 5 && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8 space-y-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Passo 5: IV. Público-Alvo do Projeto</h2>
            <p className="text-xs text-slate-500">
              Identifique os beneficiários imediatos (servidores) e mediatos (sociedade).
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800">Público-Alvo Direto:</label>
              <FieldAiButton
                fieldKey="publicoAlvoDireto"
                fieldLabel="Público-Alvo Direto"
                currentValue={project.publicoAlvoDireto}
                projectContext={project}
                onApply={(val) => updateField('publicoAlvoDireto', val)}
              />
            </div>
            <textarea
              rows={3}
              value={project.publicoAlvoDireto}
              onChange={(e) => updateField('publicoAlvoDireto', e.target.value)}
              placeholder="Ex: 240 policiais militares lotados no 3º BPM que realizam radiopatrulhamento diário..."
              className="w-full px-4 py-2.5 text-sm text-slate-800 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none leading-relaxed"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800">Público-Alvo Indireto:</label>
              <FieldAiButton
                fieldKey="publicoAlvoIndireto"
                fieldLabel="Público-Alvo Indireto"
                currentValue={project.publicoAlvoIndireto}
                projectContext={project}
                onApply={(val) => updateField('publicoAlvoIndireto', val)}
              />
            </div>
            <textarea
              rows={3}
              value={project.publicoAlvoIndireto}
              onChange={(e) => updateField('publicoAlvoIndireto', e.target.value)}
              placeholder="Ex: Toda a população de aproximadamente 100.000 habitantes do município de Itabaiana e região agreste..."
              className="w-full px-4 py-2.5 text-sm text-slate-800 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none leading-relaxed"
            />
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PASSO 6: V. RESULTADOS ESPERADOS & VI. METAS                               */}
      {/* ========================================================================= */}
      {currentStep === 6 && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8 space-y-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Passo 6: V. Resultados Esperados & VI. Metas</h2>
            <p className="text-xs text-slate-500">
              Estabeleça os efeitos positivos mensuráveis e metas quantificáveis do projeto.
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-extrabold text-blue-950 uppercase tracking-wide">
                V. RESULTADOS ESPERADOS:
              </label>
              <FieldAiButton
                fieldKey="resultadosEsperados"
                fieldLabel="V Resultados Esperados"
                currentValue={project.resultadosEsperados}
                projectContext={project}
                onApply={(val) => updateField('resultadosEsperados', val)}
              />
            </div>
            <textarea
              rows={4}
              value={project.resultadosEsperados}
              onChange={(e) => updateField('resultadosEsperados', e.target.value)}
              placeholder="- Redução de índices criminais em X%...&#10;- Aumento de rondas preventivas...&#10;- Maior segurança e proteção aos policiais..."
              className="w-full px-4 py-3 text-sm text-slate-800 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none leading-relaxed"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-extrabold text-blue-950 uppercase tracking-wide">
                VI. METAS:
              </label>
              <FieldAiButton
                fieldKey="metas"
                fieldLabel="VI Metas"
                currentValue={project.metas}
                projectContext={project}
                onApply={(val) => updateField('metas', val)}
              />
            </div>
            <textarea
              rows={4}
              value={project.metas}
              onChange={(e) => updateField('metas', e.target.value)}
              placeholder="1. Adquirir e entregar 100% dos bens no prazo de 60 dias...&#10;2. Aumentar em 40% a fiscalização de medidas protetivas..."
              className="w-full px-4 py-3 text-sm text-slate-800 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none leading-relaxed"
            />
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PASSO 7: VII. SUSTENTABILIDADE & VIII. MENSURAÇÃO                          */}
      {/* ========================================================================= */}
      {currentStep === 7 && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8 space-y-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Passo 7: VII. Sustentabilidade & VIII. Mensuração</h2>
            <p className="text-xs text-slate-500">
              Especifique a manutenção após a aquisição e como os resultados serão comprovados.
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-extrabold text-blue-950 uppercase tracking-wide">
                VII. SUSTENTABILIDADE DO PROJETO:
              </label>
              <FieldAiButton
                fieldKey="sustentabilidade"
                fieldLabel="VII Sustentabilidade"
                currentValue={project.sustentabilidade}
                projectContext={project}
                onApply={(val) => updateField('sustentabilidade', val)}
              />
            </div>
            <textarea
              rows={4}
              value={project.sustentabilidade}
              onChange={(e) => updateField('sustentabilidade', e.target.value)}
              placeholder="Descreva a garantia, manutenção contínua e recursos operacionais futuros..."
              className="w-full px-4 py-3 text-sm text-slate-800 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none leading-relaxed"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-extrabold text-blue-950 uppercase tracking-wide">
                VIII. MENSURAÇÃO DOS RESULTADOS ESPERADOS:
              </label>
              <FieldAiButton
                fieldKey="mensuracaoResultados"
                fieldLabel="VIII Mensuração"
                currentValue={project.mensuracaoResultados}
                projectContext={project}
                onApply={(val) => updateField('mensuracaoResultados', val)}
              />
            </div>
            <textarea
              rows={4}
              value={project.mensuracaoResultados}
              onChange={(e) => updateField('mensuracaoResultados', e.target.value)}
              placeholder="Indique os indicadores e relatórios utilizados (ex: relatórios estatísticos da CEACRIM/SSP, ROPs da PMSE)..."
              className="w-full px-4 py-3 text-sm text-slate-800 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none leading-relaxed"
            />
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PASSO 8: IX. PLANO DE LOCALIZAÇÃO                                          */}
      {/* ========================================================================= */}
      {currentStep === 8 && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Passo 8: IX. Plano de Localização</h2>
              <p className="text-xs text-slate-500">
                Endereço exato onde os materiais e equipamentos serão instalados ou empregados em Sergipe.
              </p>
            </div>
            <button
              type="button"
              onClick={addLocalizacaoRow}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Adicionar Local</span>
            </button>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs min-w-[600px]">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-2.5 px-3 w-1/3">Item / Material</th>
                  <th className="py-2.5 px-3 w-24 text-center">Quantidade</th>
                  <th className="py-2.5 px-3">Endereço de Instalação / Lotação</th>
                  <th className="py-2.5 px-2 w-10 text-center"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {(project.planoLocalizacao || []).map((loc) => (
                  <tr key={loc.id} className="hover:bg-slate-50/50">
                    <td className="p-2">
                      <input
                        type="text"
                        value={loc.item}
                        onChange={(e) => updateLocalizacaoRow(loc.id, 'item', e.target.value)}
                        placeholder="Ex: Viaturas operacionais"
                        className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded-lg focus:border-blue-500 outline-none"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="text"
                        value={loc.quantidade}
                        onChange={(e) => updateLocalizacaoRow(loc.id, 'quantidade', e.target.value)}
                        placeholder="Ex: 02"
                        className="w-full px-2 py-1.5 text-xs text-center border border-slate-200 rounded-lg focus:border-blue-500 outline-none"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="text"
                        value={loc.endereco}
                        onChange={(e) => updateLocalizacaoRow(loc.id, 'endereco', e.target.value)}
                        placeholder="Ex: Sede do 3º BPM - Av. Dr. Luiz Magalhães, Bairro Centro, Itabaiana/SE"
                        className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded-lg focus:border-blue-500 outline-none"
                      />
                    </td>
                    <td className="p-2 text-center">
                      <button
                        type="button"
                        onClick={() => removeLocalizacaoRow(loc.id)}
                        className="p-1 text-slate-400 hover:text-red-600 rounded transition-colors cursor-pointer"
                        title="Remover linha"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PASSO 9: X. MATERIAIS, SERVIÇOS & PESQUISA DE PREÇOS                       */}
      {/* ========================================================================= */}
      {currentStep === 9 && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Passo 9: X. Materiais, Serviços & Orçamento</h2>
              <p className="text-xs text-slate-500">
                Itens orçados com Natureza da Despesa resumida: <strong>4.4.90 (Investimento)</strong> ou <strong>3.3.90 (Custeio)</strong>.
              </p>
            </div>
            <button
              type="button"
              onClick={addMaterialRow}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Adicionar Item</span>
            </button>
          </div>

          {/* Dynamic Table */}
          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs min-w-[700px]">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-2.5 px-3">Material/Serviço</th>
                  <th className="py-2.5 px-3">Descrição Sucinta</th>
                  <th className="py-2.5 px-3">Marca/Ref.</th>
                  <th className="py-2.5 px-3 w-40">Natureza Despesa</th>
                  <th className="py-2.5 px-2 w-16 text-center">Qtd</th>
                  <th className="py-2.5 px-2 w-28 text-right">Unitário (R$)</th>
                  <th className="py-2.5 px-3 w-28 text-right">Total (R$)</th>
                  <th className="py-2.5 px-2 w-10 text-center"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {(project.materiaisServicos || []).map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50/50">
                    <td className="p-2">
                      <input
                        type="text"
                        value={m.materialServico}
                        onChange={(e) => updateMaterialRow(m.id, 'materialServico', e.target.value)}
                        placeholder="Nome do bem"
                        className="w-full px-2 py-1 text-xs border border-slate-200 rounded focus:border-blue-500 outline-none"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="text"
                        value={m.descricaoSucinta}
                        onChange={(e) => updateMaterialRow(m.id, 'descricaoSucinta', e.target.value)}
                        placeholder="Especificação técnica"
                        className="w-full px-2 py-1 text-xs border border-slate-200 rounded focus:border-blue-500 outline-none"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="text"
                        value={m.modeloMarcaReferencia}
                        onChange={(e) => updateMaterialRow(m.id, 'modeloMarcaReferencia', e.target.value)}
                        placeholder="Ex: Padrão oficial"
                        className="w-full px-2 py-1 text-xs border border-slate-200 rounded focus:border-blue-500 outline-none"
                      />
                    </td>
                    <td className="p-2">
                      <select
                        value={
                          m.naturezaDespesa === '3.3.90' ||
                          m.naturezaDespesa?.includes('3.3.90') ||
                          m.naturezaDespesa?.toLowerCase().includes('custeio')
                            ? '3.3.90'
                            : '4.4.90'
                        }
                        onChange={(e) => updateMaterialRow(m.id, 'naturezaDespesa', e.target.value)}
                        className="w-full px-2 py-1 text-xs border border-slate-200 rounded focus:border-blue-500 outline-none bg-white font-medium text-slate-800"
                      >
                        <option value="4.4.90">4.4.90 (Investimento)</option>
                        <option value="3.3.90">3.3.90 (Custeio)</option>
                      </select>
                    </td>
                    <td className="p-2">
                      <input
                        type="number"
                        min="1"
                        value={m.quantidade}
                        onChange={(e) => updateMaterialRow(m.id, 'quantidade', Number(e.target.value))}
                        className="w-full px-1.5 py-1 text-xs text-center border border-slate-200 rounded focus:border-blue-500 outline-none"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="number"
                        step="0.01"
                        value={m.valorUnitario}
                        onChange={(e) => updateMaterialRow(m.id, 'valorUnitario', Number(e.target.value))}
                        className="w-full px-2 py-1 text-xs text-right border border-slate-200 rounded focus:border-blue-500 outline-none"
                      />
                    </td>
                    <td className="p-2 text-right font-bold text-slate-800">
                      {formatCurrencyBRL(m.valorTotal || m.quantidade * m.valorUnitario)}
                    </td>
                    <td className="p-2 text-center">
                      <button
                        type="button"
                        onClick={() => removeMaterialRow(m.id)}
                        className="p-1 text-slate-400 hover:text-red-600 rounded transition-colors cursor-pointer"
                        title="Remover item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Financial summary bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-xl bg-slate-900 text-white">
            <div>
              <span className="text-[11px] text-slate-400 uppercase font-semibold">Total Investimento (4.4.90):</span>
              <p className="text-base font-bold text-blue-300">{formatCurrencyBRL(totalInvestimento)}</p>
            </div>
            <div>
              <span className="text-[11px] text-slate-400 uppercase font-semibold">Total Custeio (3.3.90):</span>
              <p className="text-base font-bold text-amber-300">{formatCurrencyBRL(totalCusteio)}</p>
            </div>
            <div>
              <span className="text-[11px] text-slate-400 uppercase font-semibold">Valor Total Geral:</span>
              <p className="text-lg font-black text-emerald-400">{formatCurrencyBRL(totalGeral)}</p>
            </div>
          </div>

          {/* Pesquisa de Preços */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800">
                Observações sobre Pesquisa de Preços (Art. 5º da Portaria SSP nº 1998/2025):
              </label>
              <FieldAiButton
                fieldKey="pesquisaPrecosObservacoes"
                fieldLabel="Pesquisa de Preços"
                currentValue={project.pesquisaPrecosObservacoes}
                projectContext={project}
                onApply={(val) => updateField('pesquisaPrecosObservacoes', val)}
              />
            </div>
            <textarea
              rows={3}
              value={project.pesquisaPrecosObservacoes}
              onChange={(e) => updateField('pesquisaPrecosObservacoes', e.target.value)}
              placeholder="Descreva a fundamentação dos preços (ex: atas públicas vigentes, cotações de no mínimo 3 empresas do mercado)..."
              className="w-full px-4 py-2.5 text-sm text-slate-800 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none leading-relaxed"
            />
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PASSO 10: XI. IMPLEMENTAÇÃO                                               */}
      {/* ========================================================================= */}
      {currentStep === 10 && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8 space-y-4">
          <div>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">Passo 10: XI. Estratégia de Implementação</h2>
              <FieldAiButton
                fieldKey="implementacao"
                fieldLabel="XI Implementação"
                currentValue={project.implementacao}
                projectContext={project}
                onApply={(val) => updateField('implementacao', val)}
              />
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Descreva as etapas posteriores à liberação dos recursos: comissão de recebimento, tombamento patrimonial pela Diretoria de Apoio Logístico (DAL/PMSE), capacitação e entrega operacional.
            </p>
          </div>

          <textarea
            rows={7}
            value={project.implementacao}
            onChange={(e) => updateField('implementacao', e.target.value)}
            placeholder="1. Recebimento e inspeção técnica...&#10;2. Tombamento e patrimônio...&#10;3. Capacitação técnica do efetivo...&#10;4. Início do emprego operacional..."
            className="w-full px-4 py-3 text-sm text-slate-800 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none leading-relaxed"
          />
        </div>
      )}

      {/* ========================================================================= */}
      {/* PASSO 11: RESUMO EXECUTIVO & ENVIO PARA A AEPLAN                          */}
      {/* ========================================================================= */}
      {currentStep === 11 && (
        <div className="space-y-6">
          {/* Header Card of the Final Review */}
          <div className="bg-slate-900 rounded-2xl p-6 md:p-8 text-white space-y-4 shadow-xl">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-600 text-white">
                  Área: {project.areaTematica}
                </span>
                <span className="font-mono text-xs font-bold text-slate-300 bg-slate-800 px-3 py-1 rounded-full">
                  Nº: {project.numeroProposta || 'Não gerado'}
                </span>
              </div>
              <div className="text-xs text-slate-400">
                Portaria SSP nº 1998/2025 • Governo de Sergipe
              </div>
            </div>

            <div className="space-y-1">
              <h2 className="text-xl sm:text-2xl font-black text-white leading-tight">
                {project.titulo || 'Proposta de Projeto sem Título'}
              </h2>
              <p className="text-xs text-slate-400">
                {project.instituicao} • {project.lotacao || 'Lotação não especificada'}
              </p>
            </div>

            {/* Financial Highlights */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-xl bg-slate-800/80 border border-slate-700">
              <div>
                <span className="text-[11px] text-slate-400 uppercase font-semibold">Investimento (4.4.90):</span>
                <p className="text-base font-bold text-blue-300">{formatCurrencyBRL(totalInvestimento)}</p>
              </div>
              <div>
                <span className="text-[11px] text-slate-400 uppercase font-semibold">Custeio (3.3.90):</span>
                <p className="text-base font-bold text-amber-300">{formatCurrencyBRL(totalCusteio)}</p>
              </div>
              <div>
                <span className="text-[11px] text-slate-400 uppercase font-semibold">Valor Total da Proposta:</span>
                <p className="text-xl font-black text-emerald-400">{formatCurrencyBRL(totalGeral)}</p>
              </div>
            </div>

            {/* Main Primary Call to Action */}
            <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
              <button
                type="button"
                onClick={onOpenPdfPreview}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 text-xs font-bold text-white bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-xl transition-all cursor-pointer shadow-sm"
              >
                <Eye className="w-4 h-4 text-emerald-400" />
                <span>Visualizar e Baixar PDF Formatado</span>
              </button>

              <button
                type="button"
                onClick={onOpenSendConfirmation}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3 text-xs font-black text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-lg shadow-blue-950/40 transition-all hover:scale-102 cursor-pointer"
              >
                <Send className="w-4 h-4 text-white" />
                <span>Enviar Proposta para a AEPLAN</span>
              </button>
            </div>
          </div>

          {/* Detailed Summary Cards for Each Section */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8 space-y-6">
            <h3 className="text-base font-extrabold text-slate-900 border-b border-slate-100 pb-3 flex items-center justify-between">
              <span>Resumo dos Dados Técnicos da Proposta</span>
              <span className="text-xs text-slate-500 font-normal">Clique no botão editar para ajustar qualquer campo</span>
            </h3>

            {/* Identificação, Título e Responsável */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Identificação do Projeto & Responsável Técnico
                </span>
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="text-xs text-blue-700 hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                >
                  <Edit3 className="w-3 h-3" /> Editar
                </button>
              </div>
              <p className="text-xs text-slate-900">
                <strong>Título do Projeto:</strong> {project.titulo || 'Não informado'}
              </p>
              <p className="text-xs text-slate-700">
                <strong>Nº Proposta / Área:</strong> {project.numeroProposta || '-'} · {project.areaTematica}
              </p>
              <p className="text-xs text-slate-700">
                <strong>Responsável Técnico:</strong> {project.responsavelTecnico || '-'}{' '}
                {project.postoGraduacaoCargo ? `(${project.postoGraduacaoCargo})` : ''}
              </p>
              <p className="text-xs text-slate-700">
                <strong>Lotação:</strong> {project.lotacao || '-'}
              </p>
              <p className="text-xs text-slate-600">
                <strong>Contato:</strong> {project.telefone || '-'} | {project.email || '-'}
              </p>
            </div>

            {/* Objetivos */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  I. Objetivo Geral & II. Objetivos Específicos
                </span>
                <button
                  type="button"
                  onClick={() => setCurrentStep(3)}
                  className="text-xs text-blue-700 hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                >
                  <Edit3 className="w-3 h-3" /> Editar
                </button>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-bold text-slate-900">Objetivo Geral:</p>
                <p className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed">{project.objetivoGeral || '-'}</p>
              </div>
              <div className="space-y-1 pt-2">
                <p className="text-xs font-bold text-slate-900">Objetivos Específicos:</p>
                <p className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed">{project.objetivosEspecificos || '-'}</p>
              </div>
            </div>

            {/* Justificativa */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  III. Justificativa
                </span>
                <button
                  type="button"
                  onClick={() => setCurrentStep(4)}
                  className="text-xs text-blue-700 hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                >
                  <Edit3 className="w-3 h-3" /> Editar
                </button>
              </div>
              <p className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed line-clamp-4">
                {project.justificativa || '-'}
              </p>
            </div>

            {/* Público e Resultados */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    IV. Público-Alvo
                  </span>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(5)}
                    className="text-xs text-blue-700 hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                  >
                    <Edit3 className="w-3 h-3" /> Editar
                  </button>
                </div>
                <p className="text-xs text-slate-700"><strong>Direto:</strong> {project.publicoAlvoDireto || '-'}</p>
                <p className="text-xs text-slate-700"><strong>Indireto:</strong> {project.publicoAlvoIndireto || '-'}</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    V. Resultados & VI. Metas
                  </span>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(6)}
                    className="text-xs text-blue-700 hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                  >
                    <Edit3 className="w-3 h-3" /> Editar
                  </button>
                </div>
                <p className="text-xs text-slate-700 line-clamp-2"><strong>Resultados:</strong> {project.resultadosEsperados || '-'}</p>
                <p className="text-xs text-slate-700 line-clamp-2"><strong>Metas:</strong> {project.metas || '-'}</p>
              </div>
            </div>

            {/* Materiais e Serviços Orçados */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  X. Materiais e Serviços Orçados ({project.materiaisServicos?.length || 0} itens)
                </span>
                <button
                  type="button"
                  onClick={() => setCurrentStep(9)}
                  className="text-xs text-blue-700 hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                >
                  <Edit3 className="w-3 h-3" /> Editar
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs bg-white rounded-lg border border-slate-200">
                  <thead className="bg-slate-100 text-slate-700 font-bold">
                    <tr>
                      <th className="p-2">Item</th>
                      <th className="p-2">Natureza</th>
                      <th className="p-2 text-center">Qtd</th>
                      <th className="p-2 text-right">Unitário</th>
                      <th className="p-2 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 tabular-nums">
                    {(project.materiaisServicos || []).map((m) => (
                      <tr key={m.id}>
                        <td className="p-2 font-medium">{m.materialServico || '-'}</td>
                        <td className="p-2 font-mono text-slate-600">{m.naturezaDespesa || '4.4.90'}</td>
                        <td className="p-2 text-center">{m.quantidade}</td>
                        <td className="p-2 text-right">{formatCurrencyBRL(m.valorUnitario)}</td>
                        <td className="p-2 text-right font-bold text-slate-800">
                          {formatCurrencyBRL(m.valorTotal || m.quantidade * m.valorUnitario)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Sustentabilidade & Mensuração */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    VII. Sustentabilidade & VIII. Mensuração
                  </span>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(7)}
                    className="text-xs text-blue-700 hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                  >
                    <Edit3 className="w-3 h-3" /> Editar
                  </button>
                </div>
                <p className="text-xs text-slate-700 line-clamp-3">
                  <strong>Sustentabilidade:</strong> {project.sustentabilidade || '-'}
                </p>
                <p className="text-xs text-slate-700 line-clamp-3">
                  <strong>Mensuração:</strong> {project.mensuracaoResultados || '-'}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    IX. Localização & XI. Implementação
                  </span>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setCurrentStep(8)}
                      className="text-xs text-blue-700 hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                    >
                      <Edit3 className="w-3 h-3" /> Locais
                    </button>
                    <button
                      type="button"
                      onClick={() => setCurrentStep(10)}
                      className="text-xs text-blue-700 hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                    >
                      <Edit3 className="w-3 h-3" /> Cronograma
                    </button>
                  </div>
                </div>
                <p className="text-xs text-slate-700">
                  <strong>Locais de Instalação:</strong>{' '}
                  {(project.planoLocalizacao || []).filter((l) => l.item || l.endereco).length} registro(s)
                </p>
                <p className="text-xs text-slate-700 line-clamp-3">
                  <strong>Implementação:</strong> {project.implementacao || '-'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating Bottom Step Navigation Bar */}
      <div className="sticky bottom-4 z-30 bg-slate-900/95 backdrop-blur-md rounded-2xl p-4 shadow-2xl border border-slate-700 flex flex-wrap items-center justify-between gap-4 text-white">
        <div className="flex items-center gap-2">
          {currentStep > 1 && (
            <button
              type="button"
              onClick={() => setCurrentStep((prev) => Math.max(1, prev - 1))}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Voltar</span>
            </button>
          )}

          {currentStep === 1 && (
            <button
              type="button"
              onClick={() => setCurrentStep(0)}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Início</span>
            </button>
          )}

          <div className="text-xs text-slate-400 hidden sm:block">
            {currentStep < 11 ? (
              <span>
                Próximo:{' '}
                <strong className="text-slate-200">{stepsList[currentStep]?.title}</strong>
              </span>
            ) : (
              <span>Pronto para enviar à AEPLAN</span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {currentStep < 11 ? (
            <button
              type="button"
              onClick={() => setCurrentStep((prev) => Math.min(11, prev + 1))}
              className="inline-flex items-center gap-2 px-6 py-2 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-950/40 transition-all cursor-pointer hover:scale-102"
            >
              <span>Avançar para {stepsList[currentStep]?.title || 'Próximo'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={onOpenSendConfirmation}
              className="inline-flex items-center gap-2 px-6 py-2 text-xs font-black rounded-xl bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-950/40 transition-all cursor-pointer hover:scale-102"
            >
              <Send className="w-4 h-4" />
              <span>Enviar Proposta para a AEPLAN</span>
            </button>
          )}
        </div>
      </div>

      {/* Modal de Confirmação para Limpar Formulário */}
      {showClearModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-red-100 text-red-700">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Limpar Formulário?</h3>
                <p className="text-xs text-slate-500">Deixar todos os campos em branco</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Tem certeza de que deseja apagar todos os dados digitados na proposta? O formulário será redefinido totalmente em branco e um novo número de proposta aleatório será sorteado.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowClearModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmClear}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-sm cursor-pointer transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                <span>Sim, Limpar Tudo</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
