import React, { useState } from 'react';
import {
  FileText,
  Plus,
  Trash2,
  MapPin,
  DollarSign,
  Info,
  Calendar,
  Building2,
  User,
  Phone,
  Mail,
  Award,
  Sparkles,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { ProjectData, LocalizacaoItem, MaterialServicoItem } from '../types';
import { FieldAiButton } from './FieldAiButton';
import { formatCurrencyBRL } from '../services/pdfGenerator';
import { createBlankProject } from '../data/templates';

interface ProjectFormProps {
  project: ProjectData;
  onChange: (updated: ProjectData) => void;
  onOpenAiAssistant: () => void;
  onOpenPdfPreview: () => void;
}

export const ProjectForm: React.FC<ProjectFormProps> = ({
  project,
  onChange,
  onOpenAiAssistant,
  onOpenPdfPreview,
}) => {
  const [showClearModal, setShowClearModal] = useState(false);
  const [showClearSuccess, setShowClearSuccess] = useState(false);

  const handleConfirmClear = () => {
    const blank = createBlankProject(project.areaTematica);
    onChange({
      ...blank,
      id: project.id,
      numeroProposta: project.numeroProposta || blank.numeroProposta,
      dataCriacao: project.dataCriacao || new Date().toISOString(),
      dataAtualizacao: new Date().toISOString(),
    });
    setShowClearModal(false);
    setShowClearSuccess(true);
    setTimeout(() => setShowClearSuccess(false), 3000);
  };

  const updateField = <K extends keyof ProjectData>(field: K, value: ProjectData[K]) => {
    onChange({
      ...project,
      [field]: value,
      dataAtualizacao: new Date().toISOString(),
    });
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
      (project.planoLocalizacao || []).map((row) => (row.id === id ? { ...row, [field]: value } : row))
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

  const totalGeral = (project.materiaisServicos || []).reduce(
    (acc, m) => acc + (m.valorTotal || (m.quantidade * (m.valorUnitario || 0))),
    0
  );

  // Analyze what has already been populated
  const hasTitle = Boolean(project.titulo?.trim());
  const hasObjGeral = Boolean(project.objetivoGeral?.trim());
  const hasJustificativa = Boolean(project.justificativa?.trim());
  const hasMateriais = (project.materiaisServicos || []).some((m) => m.materialServico?.trim());
  const hasMetas = Boolean(project.metas?.trim());
  const hasPublico = Boolean(project.publicoAlvoDireto?.trim());

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      {/* Official State Form Card Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {/* Top Institutional Header Accent */}
        <div className="h-2 bg-gradient-to-r from-blue-900 via-blue-700 to-indigo-900" />

        <div className="p-6 md:p-8 space-y-6">
          {/* Simple Clean Header Without Images */}
          <div className="border-b border-slate-200 pb-5 pt-1 text-center space-y-2">
            <div className="flex flex-col sm:flex-row items-center justify-between text-xs font-bold text-blue-900 border-b border-slate-200 pb-2 mb-2">
              <span>SECRETARIA DE ESTADO DA SEGURANÇA PÚBLICA</span>
              <span>GOVERNO DO ESTADO DE SERGIPE</span>
            </div>
            <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
              FORMULÁRIO DE PROPOSTA DE PROJETO (FPP)
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Portaria SSP nº 1998/2025 • Estado de Sergipe
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
            <div className="text-xs text-slate-500">
              Preencha os campos abaixo ou use o assistente IA para apoiar a redação técnica.
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowClearModal(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg text-slate-700 hover:text-red-700 hover:bg-red-50 border border-slate-300 transition-colors cursor-pointer"
                title="Limpar todos os campos e deixar o formulário em branco"
              >
                <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                <span>Limpar Formulário</span>
              </button>

              <button
                type="button"
                onClick={onOpenAiAssistant}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 transition-all cursor-pointer shadow-2xs"
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                <span>Gerar Proposta c/ IA</span>
              </button>

              <button
                type="button"
                onClick={onOpenPdfPreview}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold rounded-lg bg-blue-700 hover:bg-blue-600 text-white shadow-md shadow-blue-950/20 transition-all cursor-pointer"
              >
                <FileText className="w-4 h-4" />
                <span>Ver / Baixar PDF</span>
              </button>
            </div>
          </div>

          {/* Banner de Confirmação quando o formulário é limpo */}
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

          {/* Contextual AI Assistant Assistant Banner */}
          {(hasTitle || hasObjGeral || hasMateriais) && (
            <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-50 via-blue-50 to-purple-50 border border-indigo-200/80 text-xs text-indigo-950 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold flex items-center gap-1.5 text-indigo-900">
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                  Copiloto IA Contextual Ativo
                </span>
                <span className="text-[11px] bg-indigo-200/60 text-indigo-800 font-semibold px-2 py-0.5 rounded-full">
                  Lendo seus dados preenchidos
                </span>
              </div>
              <p className="text-slate-600 text-[11px]">
                A IA está conectada ao seu rascunho em tempo real. Sempre que você clicar em <strong>"Sugerir com IA"</strong> em qualquer seção abaixo, ela formulará o conteúdo estritamente derivado do que você já digitou.
              </p>
            </div>
          )}

          {/* Project Title and Code */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-3">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Título Oficial da Proposta:
              </label>
              <input
                type="text"
                value={project.titulo}
                onChange={(e) => updateField('titulo', e.target.value)}
                placeholder="Ex.: Aquisição de viaturas caracterizadas para o 4º BPM..."
                className="w-full px-3.5 py-2 text-sm font-semibold text-slate-800 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Nº da Proposta / Protocolo:
              </label>
              <input
                type="text"
                value={project.numeroProposta}
                onChange={(e) => updateField('numeroProposta', e.target.value)}
                placeholder="FPP-2025-001"
                className="w-full px-3.5 py-2 text-sm font-mono text-slate-800 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
          </div>

          {/* Institutional Identification Table (Grid matching the official document table) */}
          <div className="border border-slate-300 rounded-xl overflow-hidden shadow-2xs">
            <div className="bg-slate-100 px-4 py-2 border-b border-slate-300 font-bold text-xs text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <Building2 className="w-4 h-4 text-slate-600" />
              Identificação Institucional
            </div>

            <div className="divide-y divide-slate-200">
              <div className="p-3 bg-white">
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  INSTITUIÇÃO:
                </label>
                <input
                  type="text"
                  value={project.instituicao}
                  onChange={(e) => updateField('instituicao', e.target.value)}
                  placeholder="Ex.: Polícia Militar do Estado de Sergipe - PMSE / Secretaria de Estado da Segurança Pública"
                  className="w-full px-3 py-1.5 text-xs text-slate-800 border border-slate-200 rounded focus:border-blue-500 outline-none"
                />
              </div>

              <div className="p-3 bg-white">
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  RESPONSÁVEL TÉCNICO DO PROJETO:
                </label>
                <input
                  type="text"
                  value={project.responsavelTecnico}
                  onChange={(e) => updateField('responsavelTecnico', e.target.value)}
                  placeholder="Nome do Oficial / Servidor responsável"
                  className="w-full px-3 py-1.5 text-xs text-slate-800 border border-slate-200 rounded focus:border-blue-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-200 bg-white">
                <div className="p-3">
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    POSTO/GRADUAÇÃO/CARGO:
                  </label>
                  <input
                    type="text"
                    value={project.postoGraduacaoCargo}
                    onChange={(e) => updateField('postoGraduacaoCargo', e.target.value)}
                    placeholder="Ex.: Major PM, Tenente-Coronel PM, Delegado de Polícia"
                    className="w-full px-3 py-1.5 text-xs text-slate-800 border border-slate-200 rounded focus:border-blue-500 outline-none"
                  />
                </div>
                <div className="p-3">
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    LOTAÇÃO:
                  </label>
                  <input
                    type="text"
                    value={project.lotacao}
                    onChange={(e) => updateField('lotacao', e.target.value)}
                    placeholder="Ex.: 4º BPM, 11º BPM, 6º BPM, CPMI, CPPC, etc."
                    className="w-full px-3 py-1.5 text-xs text-slate-800 border border-slate-200 rounded focus:border-blue-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-200 bg-white">
                <div className="p-3">
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    TELEFONE:
                  </label>
                  <input
                    type="text"
                    value={project.telefone}
                    onChange={(e) => updateField('telefone', e.target.value)}
                    placeholder="(79) 3216-5405"
                    className="w-full px-3 py-1.5 text-xs text-slate-800 border border-slate-200 rounded focus:border-blue-500 outline-none"
                  />
                </div>
                <div className="p-3">
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    E-MAIL:
                  </label>
                  <input
                    type="text"
                    value={project.email}
                    onChange={(e) => updateField('email', e.target.value)}
                    placeholder="gabinete@ssp.se.gov.br"
                    className="w-full px-3 py-1.5 text-xs text-slate-800 border border-slate-200 rounded focus:border-blue-500 outline-none"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION I - OBJETIVO GERAL */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-extrabold text-blue-950 uppercase tracking-wide">
            I OBJETIVO GERAL DA AQUISIÇÃO
          </h3>
          <FieldAiButton
            fieldKey="objetivoGeral"
            fieldLabel="I Objetivo Geral"
            currentValue={project.objetivoGeral}
            projectContext={project}
            onApply={(val) => updateField('objetivoGeral', val)}
          />
        </div>
        <p className="text-xs text-slate-500 leading-relaxed">
          Descrição clara e sucinta da finalidade relacionada à aquisição. Observar as Áreas Temáticas e Ações da Portaria MJSP nº 685/2024 e Lei nº 13.756/2018 (Fundo Nacional de Segurança Pública).
        </p>
        <textarea
          rows={4}
          value={project.objetivoGeral}
          onChange={(e) => updateField('objetivoGeral', e.target.value)}
          placeholder="Exemplo: fortalecer o 4º Batalhão de Polícia Militar (4º BPM) com a aquisição de viaturas policiais militares caracterizadas..."
          className="w-full px-4 py-3 text-sm text-slate-800 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none leading-relaxed"
        />
      </div>

      {/* SECTION II - OBJETIVOS ESPECÍFICOS */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-extrabold text-blue-950 uppercase tracking-wide">
            II OBJETIVOS ESPECÍFICOS DA AQUISIÇÃO
          </h3>
          <FieldAiButton
            fieldKey="objetivosEspecificos"
            fieldLabel="II Objetivos Específicos"
            currentValue={project.objetivosEspecificos}
            projectContext={project}
            onApply={(val) => updateField('objetivosEspecificos', val)}
          />
        </div>
        <p className="text-xs text-slate-500 leading-relaxed">
          Demonstração dos desdobramentos operacionais e técnicos do objetivo geral.
        </p>
        <textarea
          rows={4}
          value={project.objetivosEspecificos}
          onChange={(e) => updateField('objetivosEspecificos', e.target.value)}
          placeholder="Exemplo: mobiliar a sede do 11º BPM com equipamentos de musculação; proporcionar horários diversos de uso..."
          className="w-full px-4 py-3 text-sm text-slate-800 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none leading-relaxed"
        />
      </div>

      {/* SECTION III - JUSTIFICATIVA */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-extrabold text-blue-950 uppercase tracking-wide">
            III JUSTIFICATIVA
          </h3>
          <FieldAiButton
            fieldKey="justificativa"
            fieldLabel="III Justificativa"
            currentValue={project.justificativa}
            projectContext={project}
            onApply={(val) => updateField('justificativa', val)}
          />
        </div>
        <p className="text-xs text-slate-500 leading-relaxed">
          Elencar os problemas existentes e como serão resolvidos com o objeto. Explicar funções e histórico da OPM/unidade contemplada, relacionando com a atividade operacional ou administrativa.
        </p>
        <textarea
          rows={5}
          value={project.justificativa}
          onChange={(e) => updateField('justificativa', e.target.value)}
          placeholder="Descreva a situação atual, a mancha criminal ou demanda do efetivo, a necessidade de suprimento e o impacto da intervenção..."
          className="w-full px-4 py-3 text-sm text-slate-800 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none leading-relaxed"
        />
      </div>

      {/* SECTION IV - PÚBLICO-ALVO */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-extrabold text-blue-950 uppercase tracking-wide">
            IV PÚBLICO-ALVO
          </h3>
          <FieldAiButton
            fieldKey="publicoAlvoDireto"
            fieldLabel="IV Público-Alvo"
            currentValue={`${project.publicoAlvoDireto}\n${project.publicoAlvoIndireto}`}
            projectContext={project}
            onApply={(val) => {
              updateField('publicoAlvoDireto', val);
            }}
          />
        </div>
        <p className="text-xs text-slate-500 leading-relaxed">
          Quantificar com precisão as pessoas beneficiadas. O número exato de beneficiados deverá ser apontado neste documento (policiais e população atendida).
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Público-Alvo Direto (Policial / Efetivo):
            </label>
            <textarea
              rows={3}
              value={project.publicoAlvoDireto}
              onChange={(e) => updateField('publicoAlvoDireto', e.target.value)}
              placeholder="Exemplo: 153 (cento e cinquenta e três) policiais militares lotados na 4ª CIPM..."
              className="w-full px-3.5 py-2.5 text-xs text-slate-800 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Público-Alvo Indireto (População / Comunidade):
            </label>
            <textarea
              rows={3}
              value={project.publicoAlvoIndireto}
              onChange={(e) => updateField('publicoAlvoIndireto', e.target.value)}
              placeholder="Exemplo: totalidade dos habitantes de Simão Dias (40.606 – IBGE/2020)..."
              className="w-full px-3.5 py-2.5 text-xs text-slate-800 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
        </div>
      </div>

      {/* SECTION V - RESULTADOS ESPERADOS */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-extrabold text-blue-950 uppercase tracking-wide">
            V RESULTADOS ESPERADOS
          </h3>
          <FieldAiButton
            fieldKey="resultadosEsperados"
            fieldLabel="V Resultados Esperados"
            currentValue={project.resultadosEsperados}
            projectContext={project}
            onApply={(val) => updateField('resultadosEsperados', val)}
          />
        </div>
        <p className="text-xs text-slate-500 leading-relaxed">
          Benefícios e vantagens observadas após a aquisição ou implantação.
        </p>
        <textarea
          rows={3}
          value={project.resultadosEsperados}
          onChange={(e) => updateField('resultadosEsperados', e.target.value)}
          placeholder="Exemplo: melhora das condições de saúde mental dos policiais militares lotados no 8º BPM; redução dos índices de criminalidade..."
          className="w-full px-4 py-3 text-sm text-slate-800 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none leading-relaxed"
        />
      </div>

      {/* SECTION VI - METAS */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-extrabold text-blue-950 uppercase tracking-wide">
            VI METAS
          </h3>
          <FieldAiButton
            fieldKey="metas"
            fieldLabel="VI Metas"
            currentValue={project.metas}
            projectContext={project}
            onApply={(val) => updateField('metas', val)}
          />
        </div>
        <div className="p-3 bg-blue-50/60 rounded-lg text-xs text-blue-900 border border-blue-100 flex items-start gap-2">
          <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
          <span>
            <strong>Regra Conceitual (PMKB):</strong> O objetivo é um alvo qualitativo, enquanto a meta é um <strong>alvo quantitativo mensurável no tempo</strong> (ex.: reduzir em 10%, trocar 100% das viaturas em 2 anos, treinar 20% do efetivo).
          </span>
        </div>
        <textarea
          rows={3}
          value={project.metas}
          onChange={(e) => updateField('metas', e.target.value)}
          placeholder="Exemplo: reduzir em 10% o número de roubos no centro comercial da cidade de Itabaiana; trocar 100% das viaturas no período de 02 anos..."
          className="w-full px-4 py-3 text-sm text-slate-800 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none leading-relaxed"
        />
      </div>

      {/* SECTION VII - SUSTENTABILIDADE */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-extrabold text-blue-950 uppercase tracking-wide">
            VII SUSTENTABILIDADE DO PROJETO
          </h3>
          <FieldAiButton
            fieldKey="sustentabilidade"
            fieldLabel="VII Sustentabilidade"
            currentValue={project.sustentabilidade}
            projectContext={project}
            onApply={(val) => updateField('sustentabilidade', val)}
          />
        </div>
        <p className="text-xs text-slate-500 leading-relaxed">
          Fatores que viabilizam o funcionamento perene: vida útil estimada (Manual de Contabilidade Aplicado ao Setor Público), manutenção preventiva e corretiva, condições de combustível, contratos e garantias.
        </p>
        <textarea
          rows={3}
          value={project.sustentabilidade}
          onChange={(e) => updateField('sustentabilidade', e.target.value)}
          placeholder="Indique os contratos de manutenção da frota, dotação de combustível da SSP/SE e tempo de vida útil dos equipamentos..."
          className="w-full px-4 py-3 text-sm text-slate-800 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none leading-relaxed"
        />
      </div>

      {/* SECTION VIII - MENSURAÇÃO */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-extrabold text-blue-950 uppercase tracking-wide">
            VIII MENSURAÇÃO DOS RESULTADOS ESPERADOS
          </h3>
          <FieldAiButton
            fieldKey="mensuracaoResultados"
            fieldLabel="VIII Mensuração de Resultados"
            currentValue={project.mensuracaoResultados}
            projectContext={project}
            onApply={(val) => updateField('mensuracaoResultados', val)}
          />
        </div>
        <p className="text-xs text-slate-500 leading-relaxed">
          Indicadores de desempenho, ferramentas utilizadas (Relatórios de Ocorrência Policial - ROP, registros estatísticos, prontuários de saúde) e mecanismo de tratamento estatístico comparativo.
        </p>
        <textarea
          rows={3}
          value={project.mensuracaoResultados}
          onChange={(e) => updateField('mensuracaoResultados', e.target.value)}
          placeholder="Exemplo: análise comparativa dos Relatórios de Ocorrência Policial (ROP) no período de 12 meses anterior e posterior à entrega..."
          className="w-full px-4 py-3 text-sm text-slate-800 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none leading-relaxed"
        />
      </div>

      {/* SECTION IX - PLANO DE LOCALIZAÇÃO */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-extrabold text-blue-950 uppercase tracking-wide">
              IX PLANO DE LOCALIZAÇÃO
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Localidade física para controle patrimonial e execução dos serviços.
            </p>
          </div>

          <button
            type="button"
            onClick={addLocalizacaoRow}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Adicionar Local</span>
          </button>
        </div>

        <div className="overflow-x-auto border border-slate-200 rounded-xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider">
              <tr>
                <th className="py-2.5 px-3 w-1/4">ITEM</th>
                <th className="py-2.5 px-3 w-20 text-center">QUANTIDADE</th>
                <th className="py-2.5 px-3">ENDEREÇO COMPLETO (OPM / CEP)</th>
                <th className="py-2.5 px-3 w-12 text-center">AÇÃO</th>
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
                      placeholder="Ex.: Viaturas 4x4, Pistolas 9mm"
                      className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded focus:border-blue-500 outline-none"
                    />
                  </td>
                  <td className="p-2">
                    <input
                      type="text"
                      value={loc.quantidade}
                      onChange={(e) => updateLocalizacaoRow(loc.id, 'quantidade', e.target.value)}
                      placeholder="Qtd"
                      className="w-full px-2 py-1.5 text-xs text-center border border-slate-200 rounded focus:border-blue-500 outline-none"
                    />
                  </td>
                  <td className="p-2">
                    <input
                      type="text"
                      value={loc.endereco}
                      onChange={(e) => updateLocalizacaoRow(loc.id, 'endereco', e.target.value)}
                      placeholder="Ex.: 6º BPM - Avenida João Lima da Silveira, nº 3725, Estância/SE, CEP: 49200-000"
                      className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded focus:border-blue-500 outline-none"
                    />
                  </td>
                  <td className="p-2 text-center">
                    <button
                      type="button"
                      onClick={() => removeLocalizacaoRow(loc.id)}
                      className="p-1 text-slate-400 hover:text-red-600 rounded transition-colors cursor-pointer"
                      title="Excluir linha"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* SECTION X - MATERIAIS / SERVIÇOS */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-extrabold text-blue-950 uppercase tracking-wide">
              X MATERIAIS / SERVIÇOS & PESQUISA DE PREÇOS
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Pesquisa de preços conforme parâmetros legais (mínimo de 3 cotações / atas governamentais).
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={addMaterialRow}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Adicionar Item</span>
            </button>
          </div>
        </div>

        {/* Dynamic Items Table */}
        <div className="overflow-x-auto border border-slate-200 rounded-xl">
          <table className="w-full text-left text-xs min-w-[700px]">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-2.5 px-3">Material/Serviço</th>
                <th className="py-2.5 px-3">Descrição Sucinta</th>
                <th className="py-2.5 px-3">Modelo/Marca Ref.</th>
                <th className="py-2.5 px-3">Natureza Despesa</th>
                <th className="py-2.5 px-2 w-16 text-center">Qtd</th>
                <th className="py-2.5 px-2 w-24 text-right">Unitário (R$)</th>
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
                      placeholder="Nome do item"
                      className="w-full px-2 py-1 text-xs border border-slate-200 rounded focus:border-blue-500 outline-none"
                    />
                  </td>
                  <td className="p-2">
                    <input
                      type="text"
                      value={m.descricaoSucinta}
                      onChange={(e) => updateMaterialRow(m.id, 'descricaoSucinta', e.target.value)}
                      placeholder="Especificação básica"
                      className="w-full px-2 py-1 text-xs border border-slate-200 rounded focus:border-blue-500 outline-none"
                    />
                  </td>
                  <td className="p-2">
                    <input
                      type="text"
                      value={m.modeloMarcaReferencia}
                      onChange={(e) => updateMaterialRow(m.id, 'modeloMarcaReferencia', e.target.value)}
                      placeholder="Marca de referência"
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
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-slate-50 border-t-2 border-slate-300 font-bold text-xs">
              <tr>
                <td colSpan={6} className="py-3 px-4 text-right text-slate-700">
                  VALOR TOTAL ESTIMADO DA PROPOSTA:
                </td>
                <td className="py-3 px-3 text-right text-sm font-black text-blue-900">
                  {formatCurrencyBRL(totalGeral)}
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Legal research parameters note */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
            Parâmetros da Pesquisa de Preços (Fontes, Atas e Fornecedores):
          </label>
          <textarea
            rows={2}
            value={project.pesquisaPrecosObservacoes}
            onChange={(e) => updateField('pesquisaPrecosObservacoes', e.target.value)}
            placeholder="Exemplo: Composição de custos unitários baseada no Painel de Preços oficial e três cotações formais não discrepantes..."
            className="w-full px-3.5 py-2 text-xs text-slate-800 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
      </div>

      {/* SECTION XI - IMPLEMENTAÇÃO */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-extrabold text-blue-950 uppercase tracking-wide">
            XI IMPLEMENTAÇÃO
          </h3>
          <FieldAiButton
            fieldKey="implementacao"
            fieldLabel="XI Implementação"
            currentValue={project.implementacao}
            projectContext={project}
            onApply={(val) => updateField('implementacao', val)}
          />
        </div>
        <p className="text-xs text-slate-500 leading-relaxed">
          Metodologia de como as ações serão implementadas após a aquisição (recebimento, tombamento, treinamento do efetivo e cronograma operacional).
        </p>
        <textarea
          rows={4}
          value={project.implementacao}
          onChange={(e) => updateField('implementacao', e.target.value)}
          placeholder="Descreva as etapas cronológicas pós-aquisição..."
          className="w-full px-4 py-3 text-sm text-slate-800 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none leading-relaxed"
        />
      </div>

      {/* Floating Bottom Quick Action Bar */}
      <div className="sticky bottom-4 z-30 bg-slate-900/90 backdrop-blur-md rounded-2xl p-4 shadow-2xl border border-slate-700 flex flex-wrap items-center justify-between gap-4 text-white">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-xs">
            {project.areaTematica}
          </div>
          <div>
            <div className="text-xs font-bold leading-tight truncate max-w-xs sm:max-w-md">
              {project.titulo}
            </div>
            <div className="text-[11px] text-slate-400">
              Total da Proposta: <span className="text-emerald-400 font-bold">{formatCurrencyBRL(totalGeral)}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onOpenAiAssistant}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-purple-300 border border-purple-500/30 transition-colors cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Assistente IA</span>
          </button>

          <button
            type="button"
            onClick={onOpenPdfPreview}
            className="inline-flex items-center gap-2 px-5 py-2 text-xs font-bold rounded-xl bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-950/40 transition-all cursor-pointer hover:scale-102"
          >
            <FileText className="w-4 h-4" />
            <span>Visualizar PDF & Enviar para a AEPLAN</span>
          </button>
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
              Tem certeza de que deseja apagar todos os dados digitados na proposta? O formulário será redefinido totalmente em branco (itens 1 ao 12, tabelas de localização e materiais).
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
