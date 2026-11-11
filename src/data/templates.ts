import { ProjectData, ThematicArea } from '../types';

export function createBlankProject(area: ThematicArea = 'MVI'): ProjectData {
  return {
    id: `proj-${Date.now()}`,
    numeroProposta: `FPP-${area}-${new Date().getFullYear()}-001`,
    titulo: '',
    areaTematica: area,
    dataCriacao: new Date().toISOString(),
    dataAtualizacao: new Date().toISOString(),
    instituicao: 'Polícia Militar do Estado de Sergipe - PMSE / Secretaria de Estado da Segurança Pública',
    responsavelTecnico: '',
    postoGraduacaoCargo: '',
    lotacao: '',
    telefone: '',
    email: '',
    objetivoGeral: '',
    objetivosEspecificos: '',
    justificativa: '',
    publicoAlvoDireto: '',
    publicoAlvoIndireto: '',
    resultadosEsperados: '',
    metas: '',
    sustentabilidade: '',
    mensuracaoResultados: '',
    planoLocalizacao: [
      {
        id: 'loc-1',
        item: '',
        quantidade: '',
        endereco: '',
      },
    ],
    materiaisServicos: [
      {
        id: 'mat-1',
        materialServico: '',
        descricaoSucinta: '',
        modeloMarcaReferencia: '',
        naturezaDespesa: '4.4.90',
        quantidade: 1,
        valorUnitario: 0,
        valorTotal: 0,
      },
    ],
    pesquisaPrecosObservacoes: '',
    implementacao: '',
    incluirPmbok: false,
  };
}

export const TEMPLATE_MVI: ProjectData = {
  id: 'template-mvi-01',
  numeroProposta: 'FPP-MVI-2025-001',
  titulo: 'Modernização e Reaparelhamento da Radiopatrulha para Redução de Crimes Violentos Letais Intencionais (CVLI/MVI)',
  areaTematica: 'MVI',
  dataCriacao: new Date().toISOString(),
  dataAtualizacao: new Date().toISOString(),
  
  instituicao: 'Polícia Militar do Estado de Sergipe - PMSE / Secretaria de Estado da Segurança Pública',
  responsavelTecnico: 'Major PM Jackson Silva Santos',
  postoGraduacaoCargo: 'Major PM - Comandante Operacional',
  lotacao: '4º Batalhão de Polícia Militar (4º BPM - Canindé de São Francisco / Alto Sertão)',
  telefone: '(79) 3216-5405 / (79) 99876-5432',
  email: 'gabinete@ssp.se.gov.br',

  objetivoGeral:
    'Fortalecer a capacidade operacional do 4º Batalhão de Polícia Militar (4º BPM) mediante a aquisição de viaturas policiais caracterizadas tipo SUV/Pick-up 4x4 e armamento moderno de calibre 9mm, com o intuito de intensificar o policiamento ostensivo na modalidade radiopatrulhamento nas áreas prioritárias de manchas criminais, reduzindo os índices de Mortes Violentas Intencionais (MVI) em conformidade com as diretrizes do Fundo Nacional de Segurança Pública (Lei nº 13.756/2018 e Portaria MJSP nº 685/2024, arts. 6º, 7º e 8º).',

  objetivosEspecificos:
    '1. Adquirir 04 (quatro) viaturas policiais operacionais caracterizadas com cela e sinalizadores acústico-visuais de última geração;\n2. Equipar o efetivo do 4º BPM com 20 (vinte) pistolas calibre 9x19mm para substituição de material bélico obsoleto;\n3. Ampliar a mancha de cobertura do radiopatrulhamento motorizado nas vias de maior vulnerabilidade a homicídios;\n4. Reduzir o tempo de resposta aos chamados de urgência e emergência via Centro Integrado de Operações em Segurança Pública (CIOSP);\n5. Desarticular grupos criminosos atuantes no tráfico ilícito de entorpecentes que fomentam os homicídios na região do Alto Sertão Sergipano.',

  justificativa:
    'A região do Alto Sertão Sergipano, sob a responsabilidade territorial do 4º BPM, apresenta extensas faixas rurais e divisas interestaduais com estados vizinhos, exigindo mobilidade tática rápida e poder de resposta compatível com as ameaças da criminalidade armada organizada. A carência de viaturas com tração integral e de armamento contemporâneo compromete a regularidade do policiamento preventivo e repressivo imediato. Com a aquisição pretendida, o 4º BPM garantirá a saturação policial nas áreas críticas apontadas pela Coordenadoria de Estatística e Análise Criminal (CEACRIM/SSP), dissuadindo confrontos armados e mitigando os fatores de risco associados aos crimes contra a vida.',

  publicoAlvoDireto:
    '142 (cento e quarenta e dois) policiais militares lotados no 4º BPM que executarão o serviço ostensivo em condições adequadas de segurança individual e coletiva.',
  publicoAlvoIndireto:
    'Aproximadamente 95.000 habitantes dos municípios de Canindé de São Francisco, Poço Redondo e Porto da Folha (IBGE/Censo 2022), beneficiados com a preservação da ordem pública e da vida.',

  resultadosEsperados:
    '- Redução sustentada dos índices de Mortes Violentas Intencionais (MVI) em pelo menos 15% nas áreas de cobertura do 4º BPM;\n- Diminuição do tempo médio de atendimento de ocorrências graves de 28 para 12 minutos;\n- Aumento substancial da sensação subjetiva de segurança pública na população sertaneja;\n- Minimização dos riscos de letalidade entre policiais e cidadãos decorrente do emprego de armamento padrão e viaturas protegidas.',

  metas:
    '1. Entregar e colocar em operação 100% das 04 viaturas e 20 pistolas 9mm no prazo de 90 dias após a liquidação da despesa;\n2. Reduzir em 15% o número de homicídios consumados no 4º BPM no período de 12 meses, comparado ao ano anterior;\n3. Executar no mínimo 240 operações de saturação de radiopatrulhamento no primeiro ano de implantação.',

  sustentabilidade:
    'As viaturas possuem garantia de fábrica de 36 meses e plano de manutenção preventiva e corretiva coberto pelo Contrato de Gestão de Frotas corporativo da SSP/SE. A vida útil estimada dos veículos é de 5 anos e a do armamento é superior a 15 anos, atendendo às diretrizes do Manual de Contabilidade Aplicado ao Setor Público (MCASP). O abastecimento de combustível está assegurado pela dotação orçamentária continuada da PMSE.',

  mensuracaoResultados:
    'Os resultados serão aferidos mensalmente mediante análise comparativa das estatísticas criminais consolidadas pela Coordenadoria Geral de Estatística da SSP/SE e pelos Relatórios de Ocorrência Policial (ROP/BO eletrônico), mensurando a evolução trimestral das taxas de MVI e a produtividade operacional (apreensão de armas e detenção de foragidos).',

  planoLocalizacao: [
    {
      id: 'loc-1',
      item: 'Viaturas Policiais 4x4 Caracterizadas',
      quantidade: 4,
      endereco: 'Sede do 4º BPM - Rodovia SE-230, s/n, Bairro Olaria, Canindé de São Francisco/SE, CEP: 49820-000.',
    },
    {
      id: 'loc-2',
      item: 'Pistolas Calibre 9x19mm',
      quantidade: 20,
      endereco: 'Reserva de Armamento e Munição do 4º BPM - Rodovia SE-230, Canindé de São Francisco/SE, CEP: 49820-000.',
    },
  ],

  materiaisServicos: [
    {
      id: 'mat-1',
      materialServico: 'Viatura Policial Operacional 4x4',
      descricaoSucinta: 'Veículo tipo Pick-up cabine dupla, motor turbodiesel, tração 4x4, caracterizado padrão PMSE, com cela e giroflex em LED.',
      modeloMarcaReferencia: 'Toyota Hilux 4x4 / Ford Ranger ou equivalente',
      naturezaDespesa: '4.4.90',
      quantidade: 4,
      valorUnitario: 260000.0,
      valorTotal: 1040000.0,
    },
    {
      id: 'mat-2',
      materialServico: 'Pistola Semiautomática 9x19mm',
      descricaoSucinta: 'Pistola 9mm, acabamento anticorrosivo teniferizado, capacidade mínima 17 tiros, 3 carregadores e coldre tático de retenção.',
      modeloMarcaReferencia: 'Glock G17 Gen5 / Beretta APX / Taurus TS9',
      naturezaDespesa: '4.4.90',
      quantidade: 20,
      valorUnitario: 4200.0,
      valorTotal: 84000.0,
    },
  ],
  pesquisaPrecosObservacoes:
    'Pesquisa fundamentada em atas de registro de preços vigentes do Painel de Preços do Governo Federal (Compras.gov.br) e contratações similares de órgãos da Segurança Pública (art. 5º da Portaria SSP 1998/2025). Média de 03 propostas formais anexadas ao processo.',

  implementacao:
    '1. Recebimento e conferência técnica dos bens pela Comissão de Recebimento da PMSE;\n2. Registro patrimonial e tombamento junto à Diretoria de Apoio Logístico (DAL/PMSE);\n3. Realização de instrução de nivelamento tático e tiro policial de 40 horas-aula para os militares escalados;\n4. Distribuição imediata das viaturas e armamentos e alocação nas escalas de radiopatrulhamento diário.',
};

export const TEMPLATE_EVM: ProjectData = {
  id: 'template-evm-02',
  numeroProposta: 'FPP-EVM-2025-002',
  titulo: 'Expansão da Patrulha Maria da Penha e Implementação de Salas de Acolhimento Humanizado para Enfrentamento à Violência contra a Mulher',
  areaTematica: 'EVM',
  dataCriacao: new Date().toISOString(),
  dataAtualizacao: new Date().toISOString(),

  instituicao: 'Polícia Militar do Estado de Sergipe - PMSE / SSP Sergipe',
  responsavelTecnico: 'Capitã PM Fabiana Oliveira Menezes',
  postoGraduacaoCargo: 'Capitã PM - Coordenadora da Patrulha Maria da Penha',
  lotacao: 'Comando do Policiamento Militar do Interior (CPMI / 6º BPM - Estância/SE)',
  telefone: '(79) 3216-5405 / (79) 99123-4567',
  email: 'gabinete@ssp.se.gov.br',

  objetivoGeral:
    'Ampliar e estruturar a rede de fiscalização de Medidas Protetivas de Urgência (MPU) e acolhimento humanizado de mulheres em situação de violência doméstica e de gênero na Região Sul Sergipana, mediante a aquisição de viatura caracterizada lilás para a Patrulha Maria da Penha e mobiliário ergonômico para instalação da Sala Lilás de acolhimento especializado.',

  objetivosEspecificos:
    '1. Disponibilizar 01 (uma) viatura caracterizada com identidade visual lilás exclusiva para o atendimento e acompanhamento de medidas protetivas;\n2. Estruturar a Sala Lilás no 6º BPM dotada de ambiente reservado, brinquedoteca e mobiliário adequado para depoimentos e triagem acolhedora;\n3. Fornecer 02 (dois) computadores e impressora multifuncional para gestão eletrônica de fichas e monitoramento de agressores;\n4. Capacitar o efetivo da guarnição especializada com o protocolo operacional padrão em direitos humanos e acolhimento não revitimizador.',

  justificativa:
    'A violência doméstica e familiar contra a mulher no interior do Estado demanda intervenção qualificada e contínua do Estado. A inexistência de veículo dedicado à Patrulha Maria da Penha no Polo Sul Sergipano e de espaço físico acolhedor gerava constrangimento às vítimas e limitava o número de visitas fiscalizatórias. Com a viatura e o espaço privativo adequado, o 6º BPM garante cumprimento célere das decisões judiciais expedidas pelos Juizados de Violência Doméstica, quebrando o ciclo de agressões antes de seu desfecho fatal (feminicídio).',

  publicoAlvoDireto:
    '28 policiais militares da equipe especializada e aproximadamente 650 mulheres sob proteção judicial de medidas protetivas ativas na comarca.',
  publicoAlvoIndireto:
    'Totalidade da população feminina dos municípios de Estância, Santa Luzia do Itanhy e Indiaroba (aproximadamente 68.000 mulheres, conforme IBGE).',

  resultadosEsperados:
    '- Redução a zero da taxa de reincidência de violência grave entre mulheres monitoradas pela Patrulha Maria da Penha;\n- Ampliação de 100% no número de fiscalizações presenciais preventivas semanais;\n- Acolhimento sem revitimização com atendimento humanizado em ambiente climatizado e seguro;\n- Fortalecimento da integração entre a PMSE, Polícia Civil (DAGV) e Tribunal de Justiça de Sergipe.',

  metas:
    '1. Realizar no mínimo 120 visitas de monitoramento de medidas protetivas por mês no primeiro semestre de implantação;\n2. Inaugurar a Sala Lilás e colocar a viatura em operação regular no prazo de 60 dias após a entrega dos bens;\n3. Manter índice de 100% de atendimento imediato em acionamentos de descumprimento de medidas protetivas.',

  sustentabilidade:
    'A viatura integrará o contrato contínuo de manutenção da frota da SSP/SE com garantia estendida. O mobiliário da Sala Lilás possui vida útil de 10 anos. A equipe policial militar continuará vinculada de forma perene ao Quadro Organizacional da Unidade.',

  mensuracaoResultados:
    'Acompanhamento mensal por meio do Sistema de Gestão da Patrulha Maria da Penha e relatórios do TJ/SE, cruzando o quantitativo de medidas protetivas deferidas x medidas fiscalizadas e verificação de reincidência de flagrantes de violência doméstica.',

  planoLocalizacao: [
    {
      id: 'loc-evm-1',
      item: 'Viatura Lilás Patrulha Maria da Penha',
      quantidade: 1,
      endereco: '6º BPM - Avenida João Lima da Silveira, nº 3725, Bairro Alagoas, Estância/SE, CEP: 49200-000.',
    },
    {
      id: 'loc-evm-2',
      item: 'Equipamentos e Mobiliário da Sala Lilás',
      quantidade: 1,
      endereco: '6º BPM - Avenida João Lima da Silveira, nº 3725, Bairro Alagoas, Estância/SE, CEP: 49200-000.',
    },
  ],

  materiaisServicos: [
    {
      id: 'mat-evm-1',
      materialServico: 'Viatura SUV Caracterizada Maria da Penha',
      descricaoSucinta: 'Veículo tipo SUV, câmbio automático, plotagem institucional padrão Maria da Penha (Lilás/Branco), giroflex e rádio comunicador.',
      modeloMarcaReferencia: 'Renault Duster / Hyundai Creta ou similar',
      naturezaDespesa: '4.4.90',
      quantidade: 1,
      valorUnitario: 185000.0,
      valorTotal: 185000.0,
    },
    {
      id: 'mat-evm-2',
      materialServico: 'Kit Mobiliário e Brinquedoteca Sala Lilás',
      descricaoSucinta: 'Conjunto de sofá ergonômico, mesas de atendimento, poltronas confortáveis, tapete antialérgico, mesa infantil e brinquedos lúdicos.',
      modeloMarcaReferencia: 'Mobiliário corporativo hospitalar/psicológico normatizado',
      naturezaDespesa: '4.4.90',
      quantidade: 1,
      valorUnitario: 24500.0,
      valorTotal: 24500.0,
    },
  ],
  pesquisaPrecosObservacoes:
    'Valores obtidos em pesquisas no Banco de Preços em Saúde/Governo e 3 orçamentos mercadológicos de empresas especializadas no Estado de Sergipe.',

  implementacao:
    'Instalação e reforma básica do cômodo sede no 6º BPM em 30 dias; entrega da viatura plotada em 45 dias; capacitação de 20 policiais militares pelo DAGV/SSP e Tribunal de Justiça antes do lançamento das rondas preventivas.',
};

export const TEMPLATE_MQV: ProjectData = {
  id: 'template-mqv-03',
  numeroProposta: 'FPP-MQV-2025-003',
  titulo: 'Implantação de Academia de Musculação e Adequação Ergonômica de Alojamentos para Promoção da Saúde e Qualidade de Vida Policial',
  areaTematica: 'MQV',
  dataCriacao: new Date().toISOString(),
  dataAtualizacao: new Date().toISOString(),

  instituicao: 'Polícia Militar do Estado de Sergipe - PMSE / SSP Sergipe',
  responsavelTecnico: 'Tenente-Coronel PM Carlos Eduardo Fontes',
  postoGraduacaoCargo: 'Tenente-Coronel PM - Comandante do 11º BPM',
  lotacao: '11º Batalhão de Polícia Militar (11º BPM - Tobias Barreto/SE)',
  telefone: '(79) 3216-5405 / (79) 99911-2233',
  email: 'gabinete@ssp.se.gov.br',

  objetivoGeral:
    'Proporcionar a melhoria das condições físicas, de saúde mental e salubridade dos policiais militares lotados no 11º BPM, mediante a aquisição de equipamentos profissionais de musculação e condicionamento cardiorrespiratório e climatização dos alojamentos de serviço, em conformidade com o Eixo de Valorização dos Profissionais da Segurança Pública.',

  objetivosEspecificos:
    '1. Mobiliar e equipar a academia de musculação na sede do 11º BPM com aparelhos biomecânicos e halteres de alta durabilidade;\n2. Proporcionar horários flexíveis e orientados de uso da academia para o efetivo de serviço e folga;\n3. Instalar 04 condicionadores de ar split inverter nos alojamentos masculino e feminino da unidade;\n4. Criar rotina institucional de preparação física continuada e acompanhamento de saúde física/mental.',

  justificativa:
    'A atividade policial militar impõe elevados níveis de estresse psicofisiológico, porte contínuo de equipamentos pesados (coletes balísticos, cinturões e armamento) e trabalho em turnos ininterruptos. A ausência de instalações adequadas de treinamento e repouso salubre repercutia diretamente em afastamentos médicos por lesões musculoesqueléticas e síndrome de burnout. A modernização do espaço físico e da academia promove prevenção primária em saúde, eleva a moral da tropa e melhora a qualidade da prestação do serviço à sociedade.',

  publicoAlvoDireto:
    '153 (cento e cinquenta e três) policiais militares que exercem suas funções nas companhias e pelotões do 11º BPM.',
  publicoAlvoIndireto:
    'A população de 52.000 habitantes de Tobias Barreto e Poço Verde, que contam com uma tropa física e psicologicamente mais resiliente e capacitada.',

  resultadosEsperados:
    '- Redução de pelo menos 30% nos atestados médicos decorrentes de queixas lombares e estresse ocupacional no período de 12 meses;\n- Adequação plena das instalações físicas de descanso e salubridade da unidade policial;\n- Aumento da disposição operacional e da longevidade profissional dos militares.',

  metas:
    '1. Concluir a montagem da academia e instalação dos condicionadores de ar em até 45 dias do recebimento;\n2. Atingir a adesão regular de pelo menos 70% do efetivo lotado às práticas esportivas no batalhão;\n3. Reduzir em 25% o absenteísmo médico no primeiro ano.',

  sustentabilidade:
    'Os equipamentos de musculação de linha profissional contam com estrutura de aço carbono reforçado e vida útil superior a 10 anos. A manutenção preventiva será realizada periodicamente pela comissão de infraestrutura do 11º BPM em parceria com a DAL/PMSE.',

  mensuracaoResultados:
    'Monitoramento através dos relatórios trimestrais do Núcleo de Saúde da PMSE e da Formação Sanitária, correlacionando o número de afastamentos médicos antes e após a implantação da academia e alojamentos climatizados.',

  planoLocalizacao: [
    {
      id: 'loc-mqv-1',
      item: 'Aparelhos de Musculação e Condicionamento',
      quantidade: 18,
      endereco: 'Sede do 11º BPM - Rua João Alves Filho, s/n, Bairro Centro, Tobias Barreto/SE, CEP: 49300-000.',
    },
    {
      id: 'loc-mqv-2',
      item: 'Condicionadores de Ar Split 18.000 BTUs',
      quantidade: 4,
      endereco: 'Alojamentos da Sede do 11º BPM - Tobias Barreto/SE, CEP: 49300-000.',
    },
  ],

  materiaisServicos: [
    {
      id: 'mat-mqv-1',
      materialServico: 'Estação Multifuncional e Aparelhos de Musculação Profissional',
      descricaoSucinta: 'Kit composto por crossover, leg press 45º, puxador pulley, banco supino regulável e conjunto de halteres emborrachados de 2kg a 30kg.',
      modeloMarcaReferencia: 'Movement / Matrix / Konnen Fitness profissional',
      naturezaDespesa: '4.4.90',
      quantidade: 1,
      valorUnitario: 89000.0,
      valorTotal: 89000.0,
    },
    {
      id: 'mat-mqv-2',
      materialServico: 'Esteiras Ergométricas Profissionais',
      descricaoSucinta: 'Esteiras de alto tráfego com amortecimento e motor 3.0 HP AC para treinamento cardiorrespiratório.',
      modeloMarcaReferencia: 'Movement RT 250 / Lion Fitness',
      naturezaDespesa: '4.4.90',
      quantidade: 2,
      valorUnitario: 14500.0,
      valorTotal: 29000.0,
    },
    {
      id: 'mat-mqv-3',
      materialServico: 'Aparelhos de Ar Condicionado Split Inverter 18.000 BTUs',
      descricaoSucinta: 'Aparelhos de ar condicionado inverter econômicos classe A, com instalação e suporte inclusos.',
      modeloMarcaReferencia: 'Gree / Elgin / Springer Midea',
      naturezaDespesa: '4.4.90',
      quantidade: 4,
      valorUnitario: 3400.0,
      valorTotal: 13600.0,
    },
  ],
  pesquisaPrecosObservacoes:
    'Pesquisa formal com três empresas do ramo fitness e climatização estabelecidas no Estado de Sergipe e atas federais de SRP.',

  implementacao:
    'Adequação do piso com manta emborrachada de alto impacto (15 dias); montagem técnica e laudo de entrega técnica dos equipamentos (10 dias); expedição de Portaria Interna regulamentando horários e normas de utilização.',
};

export const TEMPLATES: Record<ThematicArea, ProjectData> = {
  MVI: TEMPLATE_MVI,
  EVM: TEMPLATE_EVM,
  MQV: TEMPLATE_MQV,
};
