export type ThematicArea = 'MVI' | 'EVM' | 'MQV';

export interface LocalizacaoItem {
  id: string;
  item: string;
  quantidade: string | number;
  endereco: string;
}

export interface MaterialServicoItem {
  id: string;
  materialServico: string;
  descricaoSucinta: string;
  modeloMarcaReferencia: string;
  naturezaDespesa: string;
  quantidade: number;
  valorUnitario: number;
  valorTotal: number;
}

export interface EnvioRegistro {
  id: string;
  data: string;
  fileName: string;
  status: 'sucesso' | 'erro';
  message: string;
  fileId?: string;
  fileUrl?: string;
}

export interface ProjectData {
  id: string;
  numeroProposta: string;
  titulo: string;
  areaTematica: ThematicArea;
  dataCriacao: string;
  dataAtualizacao: string;
  
  // Identificação Institucional
  instituicao: string;
  responsavelTecnico: string;
  postoGraduacaoCargo: string;
  lotacao: string;
  telefone: string;
  email: string;

  // I. Objetivo Geral
  objetivoGeral: string;

  // II. Objetivos Específicos
  objetivosEspecificos: string;

  // III. Justificativa
  justificativa: string;

  // IV. Público-Alvo
  publicoAlvoDireto: string;
  publicoAlvoIndireto: string;

  // V. Resultados Esperados
  resultadosEsperados: string;

  // VI. Metas
  metas: string;

  // VII. Sustentabilidade do Projeto
  sustentabilidade: string;

  // VIII. Mensuração dos Resultados Esperados
  mensuracaoResultados: string;

  // IX. Plano de Localização
  planoLocalizacao: LocalizacaoItem[];

  // X. Materiais / Serviços
  materiaisServicos: MaterialServicoItem[];
  pesquisaPrecosObservacoes: string;

  // XI. Implementação
  implementacao: string;

  // XII. Anexos
  anexos: string;

  // Opções de Formatação
  incluirPmbok?: boolean;

  // Histórico de Envios
  historicoEnvios?: EnvioRegistro[];
}
