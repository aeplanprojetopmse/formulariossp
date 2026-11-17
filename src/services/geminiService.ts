import { ProjectData, ThematicArea } from '../types';

export const DEFAULT_GEMINI_KEY = '';

export function getStoredApiKey(): string {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('SSP_GEMINI_API_KEY');
    if (saved && saved.trim()) {
      return saved.trim();
    }
  }
  return DEFAULT_GEMINI_KEY;
}

export function saveStoredApiKey(key: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('SSP_GEMINI_API_KEY', key.trim());
  }
}

/**
 * Sends a prompt to Gemini via Server-Side Proxy or direct browser REST fallback
 */
export async function callGeminiApi(
  prompt: string,
  systemInstruction?: string,
  customKey?: string
): Promise<string> {
  const activeKey = customKey || getStoredApiKey();

  // Try Server-Side API first (recommended architecture)
  try {
    const res = await fetch('/api/gemini/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt,
        systemInstruction,
        customApiKey: activeKey,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.text) {
        return data.text;
      }
    } else {
      const errJson = await res.json().catch(() => null);
      if (errJson?.error) {
        throw new Error(errJson.error);
      }
    }
  } catch (serverErr: any) {
    if (serverErr.message && !serverErr.message.includes('Failed to fetch')) {
      throw serverErr;
    }
    // If backend proxy is unavailable (e.g. static site or GitHub Pages), continue to direct fetch
    console.info('Proxy do servidor indisponível. Alternando para chamada direta do navegador...');
  }

  // Direct client fallback to Google Generative AI REST API
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${encodeURIComponent(
    activeKey
  )}`;

  const bodyPayload: any = {
    contents: [{ parts: [{ text: prompt }] }],
  };

  if (systemInstruction) {
    bodyPayload.systemInstruction = {
      parts: [{ text: systemInstruction }],
    };
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(bodyPayload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    let errorDetail = errorText;
    try {
      const errJson = JSON.parse(errorText);
      errorDetail = errJson.error?.message || errorText;
    } catch {}

    if (
      errorDetail.includes('PROXY_GENERATION_DISABLED') ||
      errorDetail.includes('ACCESS_TOKEN_TYPE_UNSUPPORTED') ||
      errorDetail.includes('API key not valid')
    ) {
      throw new Error(
        `Chave de API inválida: A chave informada inicia com "AQ.", que é um token de sessão/OAuth. As chaves gratuitas da API do Gemini no Google AI Studio iniciam com "AIzaSy...". Você pode gerar uma chave em https://aistudio.google.com/apikey e colá-la no ícone ⚙️ (Configurações).`
      );
    }

    throw new Error(`Erro na API do Gemini: ${errorDetail}`);
  }

  const result = await response.json();
  const text = result?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error('Nenhuma resposta retornada pela IA.');
  }

  return text;
}

/**
 * Generates an entire proposal draft from a brief idea
 */
export async function generateFullProposal(
  ideia: string,
  area: ThematicArea,
  instituicao: string = 'Polícia Militar do Estado de Sergipe - PMSE'
): Promise<Partial<ProjectData>> {
  const areaDescMap: Record<ThematicArea, string> = {
    MVI: 'MVI - Redução de Mortes Violentas Intencionais (Portaria MJSP nº 685/2024 / Eixo Enfrentamento à Criminalidade Violenta)',
    EVM: 'EVM - Enfrentamento à Violência contra a Mulher (Patrulha Maria da Penha / Sala Lilás / Eixo Proteção aos Vulneráveis)',
    MQV: 'MQV - Melhoria da Qualidade de Vida e Valorização dos Profissionais de Segurança Pública (Saúde física, mental e salubridade)',
  };

  const systemInstruction = `Você é um Oficial Especialista em Planejamento Estratégico e Gestão de Projetos da Segurança Pública do Estado de Sergipe (SSP/SE).
Sua missão é redigir o preenchimento técnico e formal do FORMULÁRIO DE PROPOSTA DE PROJETO (FPP), conforme a Portaria SSP nº 1998/2025, Lei nº 13.756/2018 (FNSP) e Lei nº 14.133/2021.
A resposta DEVE ser estritamente um objeto JSON válido (sem marcadores de código Markdown adicionais fora do JSON, ou envolvido em \`\`\`json ... \`\`\`), contendo os seguintes campos:
- titulo (string claro e formal)
- objetivoGeral (string no infinitivo com alinhamento legal)
- objetivosEspecificos (string com lista numerada de 3 a 5 itens)
- justificativa (string técnica descrevendo o problema, contexto da OPM em Sergipe e como o objeto soluciona)
- publicoAlvoDireto (string com quantitativo exato de policiais/servidores)
- publicoAlvoIndireto (string com quantitativo e dados populacionais do município/região de Sergipe)
- resultadosEsperados (string com impactos e benefícios mensuráveis)
- metas (string com alvos quantitativos e prazos)
- sustentabilidade (string com vida útil, manutenção, combustível e contratos)
- mensuracaoResultados (string citando ferramentas como ROP/BO, estatísticas SSP e indicadores)
- planoLocalizacao (array de objetos { item, quantidade, endereco em Sergipe })
- materiaisServicos (array de objetos { materialServico, descricaoSucinta, modeloMarcaReferencia, naturezaDespesa ("4.4.90" para investimento ou "3.3.90" para custeio), quantidade, valorUnitario, valorTotal })
- pesquisaPrecosObservacoes (string justificando parâmetros de preço conforme legislação)
- implementacao (string detalhando etapas e cronograma pós-aquisição)`;

  const prompt = `Gere uma proposta de projeto completa do FPP para a Secretaria de Estado da Segurança Pública de Sergipe com base na seguinte solicitação:
Área Temática: ${areaDescMap[area]}
Instituição: ${instituicao}
Ideia Central da Aquisição: "${ideia}"

Lembre-se de usar termos e municípios reais de Sergipe (ex.: Aracaju, Nossa Senhora do Socorro, Itabaiana, Lagarto, Estância, Tobias Barreto, Canindé de São Francisco, Simão Dias), órgãos reais (PMSE, SSP/SE, CEACRIM, CIOSP) e formato financeiro em Reais.`;

  let rawText = '';
  try {
    rawText = await callGeminiApi(prompt, systemInstruction);
  } catch (apiErr: any) {
    console.warn('API Gemini retornou erro de autenticação/proxy. Usando gerador especialista interno...', apiErr?.message);
    // Provide intelligent offline generator based on user's exact idea & area
    return generateOfflineProposal(ideia, area, instituicao);
  }

  // Clean JSON response
  let jsonString = rawText.trim();
  if (jsonString.startsWith('```json')) {
    jsonString = jsonString.replace(/^```json/, '').replace(/```$/, '').trim();
  } else if (jsonString.startsWith('```')) {
    jsonString = jsonString.replace(/^```/, '').replace(/```$/, '').trim();
  }

  try {
    const parsed = JSON.parse(jsonString);
    return {
      titulo: parsed.titulo || `Projeto ${area} - ${ideia.slice(0, 40)}`,
      objetivoGeral: parsed.objetivoGeral || '',
      objetivosEspecificos: parsed.objetivosEspecificos || '',
      justificativa: parsed.justificativa || '',
      publicoAlvoDireto: parsed.publicoAlvoDireto || '',
      publicoAlvoIndireto: parsed.publicoAlvoIndireto || '',
      resultadosEsperados: parsed.resultadosEsperados || '',
      metas: parsed.metas || '',
      sustentabilidade: parsed.sustentabilidade || '',
      mensuracaoResultados: parsed.mensuracaoResultados || '',
      planoLocalizacao: Array.isArray(parsed.planoLocalizacao)
        ? parsed.planoLocalizacao.map((item: any, i: number) => ({
            id: `loc-gen-${i + 1}`,
            item: item.item || 'Item',
            quantidade: item.quantidade || 1,
            endereco: item.endereco || 'Sede da Unidade Policial - Sergipe',
          }))
        : [],
      materiaisServicos: Array.isArray(parsed.materiaisServicos)
        ? parsed.materiaisServicos.map((mat: any, i: number) => {
            const qtd = Number(mat.quantidade) || 1;
            const unit = Number(mat.valorUnitario) || 0;
            const total = Number(mat.valorTotal) || qtd * unit;
            return {
              id: `mat-gen-${i + 1}`,
              materialServico: mat.materialServico || 'Material/Serviço',
              descricaoSucinta: mat.descricaoSucinta || '',
              modeloMarcaReferencia: mat.modeloMarcaReferencia || 'Referência de mercado',
              naturezaDespesa:
                mat.naturezaDespesa?.includes('3.3.90') || mat.naturezaDespesa?.toLowerCase().includes('custeio')
                  ? '3.3.90'
                  : '4.4.90',
              quantidade: qtd,
              valorUnitario: unit,
              valorTotal: total,
            };
          })
        : [],
      pesquisaPrecosObservacoes: parsed.pesquisaPrecosObservacoes || '',
      implementacao: parsed.implementacao || '',
    };
  } catch (err) {
    console.error('Falha ao processar JSON da IA, acionando fallback:', err);
    return generateOfflineProposal(ideia, area, instituicao);
  }
}

/**
 * Intelligent domain-specific generator that constructs complete SSP/SE proposals
 * customized with the user's exact input even when the cloud API key is unauthenticated.
 */
function generateOfflineProposal(
  ideia: string,
  area: ThematicArea,
  instituicao: string
): Partial<ProjectData> {
  const cleanIdea = ideia.trim();
  const title = `Projeto ${area}: ${cleanIdea.length > 70 ? cleanIdea.slice(0, 70) + '...' : cleanIdea}`;

  if (area === 'MVI') {
    return {
      titulo: title,
      objetivoGeral: `Fortalecer a atuação preventiva e repressiva qualificada na contenção de Mortes Violentas Intencionais (MVI) em Sergipe, mediante a aquisição e emprego de ${cleanIdea}, alinhando-se aos eixos da Portaria MJSP nº 685/2024 e Lei nº 13.756/2018 (Fundo Nacional de Segurança Pública).`,
      objetivosEspecificos: `1. Executar a aquisição de ${cleanIdea} para emprego imediato nas operações policiais ostensivas;\n2. Intensificar o policiamento nas manchas criminais com maior incidência de homicídios e roubos violentos;\n3. Reduzir o tempo de resposta do atendimento emergencial às ocorrências graves;\n4. Proporcionar maior segurança e capacidade técnica de resposta ao efetivo operacional.`,
      justificativa: `A incidência de crimes violentos letais intencionais exige permanente reaparelhamento das tropas operacionais da Segurança Pública. A intervenção proposta com a aquisição de "${cleanIdea}" soluciona a defasagem logística e amplia a saturação policial nas áreas de maior vulnerabilidade criminal identificadas pela Coordenadoria de Estatística e Análise Criminal da SSP/SE.`,
      publicoAlvoDireto: '120 policiais militares e servidores da segurança pública diretamente escalados no policiamento ostensivo.',
      publicoAlvoIndireto: 'Aproximadamente 85.000 habitantes dos municípios contemplados, beneficiados com a redução de delitos e preservação da vida.',
      resultadosEsperados: '- Redução de pelo menos 15% nos índices de crimes violentos letais na área de atuação;\n- Elevação da taxa de apreensão de armas e substâncias ilícitas;\n- Aumento substancial da sensação de segurança da população.',
      metas: '1. Colocar 100% dos bens adquiridos em operação no prazo de 60 dias após entrega;\n2. Reduzir em 15% os homicídios na mancha territorial atendida ao longo de 12 meses;\n3. Manter disponibilidade operacional dos equipamentos superior a 95%.',
      sustentabilidade: 'Os bens possuem garantia do fabricante e integração aos contratos contínuos de manutenção da frota e logística da SSP/SE, com vida útil estimada conforme o Manual de Contabilidade Aplicado ao Setor Público (MCASP).',
      mensuracaoResultados: 'Aferição mensal por meio dos Relatórios de Ocorrência Policial (ROP) e boletins da Coordenadoria de Estatística da SSP/SE, comparando o período anterior e posterior à implantação.',
      planoLocalizacao: [
        {
          id: 'loc-off-1',
          item: cleanIdea.slice(0, 40),
          quantidade: 1,
          endereco: 'Sede da Unidade Policial - Estado de Sergipe',
        },
      ],
      materiaisServicos: [
        {
          id: 'mat-off-1',
          materialServico: cleanIdea.slice(0, 40),
          descricaoSucinta: `Aquisição de ${cleanIdea} em conformidade com as especificações técnicas da SSP/SE.`,
          modeloMarcaReferencia: 'Padrão normatizado de referência',
          naturezaDespesa: '4.4.90',
          quantidade: 1,
          valorUnitario: 150000.0,
          valorTotal: 150000.0,
        },
      ],
      pesquisaPrecosObservacoes: 'Pesquisa elaborada com base no Painel de Preços oficial do Governo e três cotações de fornecedores especializados (Portaria SSP 1998/2025).',
      implementacao: 'Recebimento e tombamento patrimonial pela Diretoria de Apoio Logístico (DAL/PMSE), seguido de instrução de nivelamento técnico e imediata alocação nas escalas de serviço.',
    };
  }

  if (area === 'EVM') {
    return {
      titulo: title,
      objetivoGeral: `Intensificar o enfrentamento e prevenção qualificada à violência doméstica e familiar contra a mulher no Estado de Sergipe, com ênfase na fiscalização rigorosa de Medidas Protetivas de Urgência através de ${cleanIdea}.`,
      objetivosEspecificos: `1. Estruturar a capacidade de mobilidade e acolhimento humanizado para a Patrulha Maria da Penha com ${cleanIdea};\n2. Aumentar em 100% o número de visitas fiscalizatórias preventivas a mulheres sob medida protetiva;\n3. Agilizar o tempo de atendimento em casos de quebra de medidas protetivas e situação de flagrância;\n4. Qualificar o acolhimento não revitimizador das vítimas.`,
      justificativa: `O ciclo da violência doméstica demanda respostas rápidas e monitoramento proativo para evitar o feminicídio. A implementação de "${cleanIdea}" dota a equipe policial dos meios necessários para prestar atendimento ágil, digno e protetivo às vítimas no interior do Estado.`,
      publicoAlvoDireto: '30 policiais militares da Patrulha Maria da Penha e cerca de 450 mulheres sob acompanhamento judicial.',
      publicoAlvoIndireto: 'Toda a comunidade feminina da região atendida (estimada em mais de 50.000 mulheres).',
      resultadosEsperados: '- Reincidência nula de agressões graves entre as mulheres monitoradas pela guarnição especializada;\n- Cumprimento célere de 100% das decisões judiciais de medidas protetivas expedidas.',
      metas: '1. Realizar no mínimo 80 visitas fiscalizatórias de medidas protetivas por mês;\n2. Iniciar a operação regular dos bens em até 45 dias do recebimento.',
      sustentabilidade: 'Manutenção assegurada pelos contratos vigentes da Secretaria de Segurança Pública e dotação continuada do orçamento estadual.',
      mensuracaoResultados: 'Acompanhamento integrado com relatórios da Coordenadoria da Mulher da SSP/SE e dados do Tribunal de Justiça de Sergipe.',
      planoLocalizacao: [
        {
          id: 'loc-evm-off-1',
          item: cleanIdea.slice(0, 40),
          quantidade: 1,
          endereco: 'Sede da Unidade de Atendimento à Mulher - Sergipe',
        },
      ],
      materiaisServicos: [
        {
          id: 'mat-evm-off-1',
          materialServico: cleanIdea.slice(0, 40),
          descricaoSucinta: `Itens de acolhimento e patrulhamento: ${cleanIdea}`,
          modeloMarcaReferencia: 'Especificação técnica para proteção à mulher',
          naturezaDespesa: '4.4.90',
          quantidade: 1,
          valorUnitario: 95000.0,
          valorTotal: 95000.0,
        },
      ],
      pesquisaPrecosObservacoes: 'Pesquisa realizada com base em atas públicas similares e três orçamentos comerciais não discrepantes.',
      implementacao: 'Instalação e distribuição dos itens em 30 dias, capacitação da guarnição em acolhimento especializado e articulação com a rede de proteção local.',
    };
  }

  // MQV
  return {
    titulo: title,
    objetivoGeral: `Promover a melhoria das condições de trabalho, saúde biopsicossocial, salubridade e qualidade de vida dos profissionais de segurança pública através de ${cleanIdea}, nos termos da Portaria SSP nº 1998/2025.`,
    objetivosEspecificos: `1. Implantar e disponibilizar ${cleanIdea} para uso regular do efetivo policial;\n2. Reduzir os fatores de estresse ocupacional, lesões osteomusculares e fadiga crônica dos profissionais de plantão;\n3. Fomentar hábitos saudáveis e preparação física continuada na unidade policial;\n4. Adequar a infraestrutura de repouso e permanência aos padrões de ergonomia.`,
    justificativa: `A atividade de segurança pública envolve sobrecarga física e estresse contínuo. A disponibilização de "${cleanIdea}" atua diretamente na prevenção de agravos à saúde, reduzindo afastamentos médicos e promovendo a valorização dos policiais que servem à sociedade.`,
    publicoAlvoDireto: '150 policiais militares e servidores lotados na respectiva Organização Policial Militar.',
    publicoAlvoIndireto: 'A comunidade atendida, que conta com servidores fisicamente preparados e motivados.',
    resultadosEsperados: '- Redução de pelo menos 25% no número de atestados médicos por estresse e dores lombares no período de 12 meses;\n- Melhora sensível no clima organizacional e na disposição para o serviço operacional.',
    metas: '1. Concluir a instalação e disponibilização dos bens em até 45 dias do recebimento;\n2. Alcançar a participação regular de pelo menos 65% do efetivo nas práticas saudáveis.',
    sustentabilidade: 'Equipamentos de alta durabilidade com vida útil superior a 8 anos. Manutenção periódica preventiva realizada pelo setor de infraestrutura.',
    mensuracaoResultados: 'Relatórios semestrais da Formação Sanitária e do Núcleo de Saúde Ocupacional comparando taxas de afastamento antes e após a implantação.',
    planoLocalizacao: [
      {
        id: 'loc-mqv-off-1',
        item: cleanIdea.slice(0, 40),
        quantidade: 1,
        endereco: 'Instalações da Sede Policial Militar - Sergipe',
      },
    ],
    materiaisServicos: [
      {
        id: 'mat-mqv-off-1',
        materialServico: cleanIdea.slice(0, 40),
        descricaoSucinta: `Conjunto para qualidade de vida e saúde: ${cleanIdea}`,
        modeloMarcaReferencia: 'Linha profissional normatizada',
        naturezaDespesa: '4.4.90',
        quantidade: 1,
        valorUnitario: 75000.0,
        valorTotal: 75000.0,
      },
    ],
    pesquisaPrecosObservacoes: 'Pesquisa de preços balizada no Banco de Preços e cotações de empresas fornecedoras do setor.',
    implementacao: 'Montagem dos aparelhos e adequação do espaço em 20 dias, com publicação de Portaria com escala e regulamento de uso.',
  };
}

/**
 * Improves or suggests content for an individual section of the FPP
 * strictly based on all other fields the user has already filled in!
 */
export async function suggestFieldImprovement(
  fieldKey: string,
  fieldLabel: string,
  currentValue: string,
  projectContext: Partial<ProjectData>,
  instructionType: 'enrich' | 'more_technical' | 'add_metrics' | 'legal_framework' | 'from_context'
): Promise<string> {
  const instructions: Record<string, string> = {
    from_context: 'Analise cuidadosamente tudo o que o usuário já preencheu até o momento no projeto e redija este campo de forma estritamente alinhada, coerente e complementar aos demais dados já preenchidos.',
    enrich: 'Torne o texto mais completo, detalhado e persuasivo para captação de recursos públicos, respeitando estritamente o objeto e contexto preenchido pelo usuário.',
    more_technical: 'Reescreva utilizando vocabulário técnico formal da Segurança Pública do Estado de Sergipe e doutrina operacional policial militar.',
    add_metrics: 'Adicione metas quantitativas mensuráveis, prazos em dias/meses, percentuais e estimativas numéricas compatíveis com os itens e valores preenchidos.',
    legal_framework: 'Harmonize o texto com os artigos da Portaria SSP nº 1998/2025, Portaria MJSP nº 685/2024 e Lei nº 13.756/2018 (Fundo Nacional de Segurança Pública).',
  };

  // Compile full user context from whatever fields the user has filled so far
  const contextParts: string[] = [];
  if (projectContext.areaTematica) contextParts.push(`Área Temática: ${projectContext.areaTematica}`);
  if (projectContext.titulo?.trim()) contextParts.push(`Título do Projeto: "${projectContext.titulo.trim()}"`);
  if (projectContext.instituicao?.trim()) contextParts.push(`Instituição: ${projectContext.instituicao.trim()}`);
  if (projectContext.lotacao?.trim()) contextParts.push(`Lotação / Unidade / OPM: ${projectContext.lotacao.trim()}`);
  if (projectContext.responsavelTecnico?.trim()) contextParts.push(`Responsável Técnico: ${projectContext.responsavelTecnico.trim()}`);

  if (fieldKey !== 'objetivoGeral' && projectContext.objetivoGeral?.trim()) {
    contextParts.push(`Objetivo Geral já definido: "${projectContext.objetivoGeral.trim()}"`);
  }
  if (fieldKey !== 'objetivosEspecificos' && projectContext.objetivosEspecificos?.trim()) {
    contextParts.push(`Objetivos Específicos já definidos:\n${projectContext.objetivosEspecificos.trim()}`);
  }
  if (fieldKey !== 'justificativa' && projectContext.justificativa?.trim()) {
    contextParts.push(`Justificativa já definida:\n${projectContext.justificativa.trim()}`);
  }
  if (fieldKey !== 'publicoAlvoDireto' && (projectContext.publicoAlvoDireto?.trim() || projectContext.publicoAlvoIndireto?.trim())) {
    contextParts.push(`Público-Alvo já definido: Direto: ${projectContext.publicoAlvoDireto || '-'} | Indireto: ${projectContext.publicoAlvoIndireto || '-'}`);
  }

  // Include materials & services filled by the user
  const filledMaterials = (projectContext.materiaisServicos || []).filter(
    (m) => m.materialServico && m.materialServico.trim() !== ''
  );
  if (filledMaterials.length > 0) {
    const matList = filledMaterials
      .map((m) => `- ${m.quantidade}x ${m.materialServico} (${m.modeloMarcaReferencia || 'Ref'}), Total: R$ ${m.valorTotal || m.quantidade * m.valorUnitario}`)
      .join('\n');
    contextParts.push(`Itens e Materiais Orçados pelo Usuário:\n${matList}`);
  }

  // Include other sections if filled
  if (fieldKey !== 'metas' && projectContext.metas?.trim()) {
    contextParts.push(`Metas já definidas: "${projectContext.metas.trim()}"`);
  }
  if (fieldKey !== 'sustentabilidade' && projectContext.sustentabilidade?.trim()) {
    contextParts.push(`Sustentabilidade já definida: "${projectContext.sustentabilidade.trim()}"`);
  }
  if (fieldKey !== 'mensuracaoResultados' && projectContext.mensuracaoResultados?.trim()) {
    contextParts.push(`Mensuração já definida: "${projectContext.mensuracaoResultados.trim()}"`);
  }

  const systemPrompt = `Você é um Coronel Especialista em Planejamento Estratégico e Captação de Recursos da Secretaria de Estado da Segurança Pública de Sergipe (SSP/SE), com vasta experiência em gestão de infraestrutura, logística e saúde pública.

Sua missão é redigir o conteúdo técnico para o campo "${fieldLabel}" do FORMULÁRIO DE PROPOSTA DE PROJETO (FPP), conforme a Portaria SSP nº 1998/2025.

DIRETRIZES DE ALTA QUALIDADE (Obrigatórias):
1. INTENCIONALIDADE E DOMÍNIO: Sua sugestão deve entender o PROPÓSITO REAL do projeto. 
   - Se o projeto for sobre "Reforma", "Obra" ou "Construção": Foque em modernização, adequação técnica, ampliação de capacidade e conformidade com normas. Exemplo: "Reformar as instalações do hospital da policia modernizando o prédio para expandir os atendimentos".
   - Se o projeto for sobre "Hospital", "HPM" ou "Saúde": Foque em expansão assistencial e valorização da vida.
   - Se o projeto for sobre "Treinamento" ou "Tiro": Foque em precisão e segurança técnica.
   - Se o projeto for sobre "Viatura": Foque em mobilidade e pronta resposta.
2. FUJA DO GENÉRICO: NUNCA use "reduzir tempo de resposta" se o objeto for hospitalar ou de infraestrutura física. Seja específico ao domínio.
3. CONTEXTO SERGIPE: Use nomes de batalhões (ex: 1º BPM, 3º BPM, HPM/SE, CEACRIM) e cidades reais.
4. ESTILO DOUTRINÁRIO: Use linguagem formal e persuasiva.
5. RESPOSTA DIRETA: Responda apenas com o texto sugerido.`;

  const prompt = `DADOS DO PROJETO EM ELABORAÇÃO (CONTEXTO):
${contextParts.length > 0 ? contextParts.join('\n\n') : 'Área Temática Selecionada: ' + (projectContext.areaTematica || 'MVI')}

CAMPO A SER PREENCHIDO AGORA: ${fieldLabel}
RASCUNHO ATUAL DO USUÁRIO:
"${currentValue && currentValue.trim() ? currentValue.trim() : '(Vazio - elabore uma sugestão técnica original e pertinente ao objeto e materiais listados acima)'}"

TIPO DE APRIMORAMENTO: ${instructions[instructionType] || instructions.from_context}

INSTRUÇÃO ADICIONAL: Certifique-se de que a sugestão faça sentido direto com os itens e o título informados. Se o título é "Reforma do HPM", o objetivo deve ser sobre infraestrutura hospitalar e modernização do prédio.`;

  try {
    return await callGeminiApi(prompt, systemPrompt);
  } catch (apiErr: any) {
    console.warn('API Gemini indisponível ou chave inválida, gerando sugestão técnica inteligente offline...', apiErr?.message);
    return generateOfflineFieldSuggestion(fieldKey, fieldLabel, currentValue, projectContext, instructionType);
  }
}

/**
 * Heuristic contextual field suggestion generator when offline or invalid key.
 * Now improved with more keywords (Hospital, Reform, Infrastructure).
 */
function generateOfflineFieldSuggestion(
  fieldKey: string,
  fieldLabel: string,
  currentValue: string,
  ctx: Partial<ProjectData>,
  type: string
): string {
  const title = (ctx.titulo || '').toLowerCase();
  const lotacao = ctx.lotacao?.trim() || 'Unidade Policial';
  const area = ctx.areaTematica || 'MVI';
  const draft = currentValue?.trim() || '';

  // Keyword Detection for specialized logic
  const isTiro = title.includes('tiro') || title.includes('estande') || title.includes('treinamento') || title.includes('instrutor');
  const isViatura = title.includes('viatura') || title.includes('carro') || title.includes('pick-up') || title.includes('veículo');
  const isArma = title.includes('arma') || title.includes('pistola') || title.includes('fuzil') || title.includes('bélico');
  const isMulher = area === 'EVM' || title.includes('mulher') || title.includes('penha') || title.includes('lilás');
  const isSaude = area === 'MQV' || title.includes('saúde') || title.includes('academia') || title.includes('clima') || title.includes('ergonomia');
  const isReforma = title.includes('reforma') || title.includes('obra') || title.includes('construção') || title.includes('prédio') || title.includes('instalações') || title.includes('adequação');
  const isHospital = title.includes('hospital') || title.includes('hpm') || title.includes('médico') || title.includes('clínica') || title.includes('ambulatorio') || title.includes('saúde');

  if (fieldKey === 'objetivoGeral') {
    if (isHospital && isReforma) return `Modernizar e adequar a infraestrutura física das instalações do ${lotacao} (HPM/SE), visando expandir a capacidade de atendimento, garantir a salubridade das alas médicas e proporcionar excelência assistencial aos profissionais de segurança pública e seus dependentes.`;
    if (isHospital) return `Elevar a qualidade dos serviços médico-hospitalares prestados pelo ${lotacao}, por meio da aquisição de equipamentos de ponta e modernização técnica dos processos assistenciais.`;
    if (isReforma) return `Realizar a reforma e adequação estrutural das instalações da ${lotacao}, corrigindo falhas de infraestrutura, garantindo acessibilidade e modernizando o ambiente de trabalho para melhor servir à sociedade.`;
    if (isTiro) return `Aperfeiçoar o treinamento técnico-operacional de tiro policial dos servidores da ${lotacao} mediante a implantação de estande de tiro moderno e seguro, visando a excelência no uso progressivo da força.`;
    if (isViatura) return `Fortalecer o patrulhamento preventivo e a capacidade de pronta resposta da ${lotacao} por meio da aquisição de viaturas operacionais caracterizadas, garantindo a saturação de áreas críticas.`;
    if (isArma) return `Modernizar o arsenal bélico da ${lotacao} com armamento de última geração, garantindo segurança jurídica e operacional aos policiais militares no exercício de suas funções.`;
    if (isMulher) return `Intensificar o enfrentamento à violência doméstica em Sergipe através da estruturação de meios para fiscalização de medidas protetivas e acolhimento especializado às vítimas no âmbito da ${lotacao}.`;
    if (isSaude) return `Proporcionar melhores condições de salubridade, saúde física e mental aos profissionais de segurança pública da ${lotacao}, fomentando a valorização profissional.`;
    
    return draft
      ? `${draft} — em conformidade com as diretrizes da Portaria SSP nº 1998/2025 e do Fundo Nacional de Segurança Pública.`
      : `Promover o fortalecimento e reaparelhamento da ${lotacao} visando otimizar a prestação do serviço de segurança pública no Estado de Sergipe.`;
  }

  if (fieldKey === 'objetivosEspecificos') {
    if (isHospital && isReforma) return `1. Reformar as alas de internamento e pronto-socorro do hospital;\n2. Modernizar a rede elétrica e hidráulica para suporte a novos equipamentos médicos;\n3. Expandir a capacidade de atendimentos em 30% após a conclusão da obra;\n4. Adequar as instalações às normas de vigilância sanitária vigentes.`;
    if (isHospital) return `1. Adquirir equipamentos médicos modernos para triagem e diagnóstico;\n2. Capacitar a equipe de saúde no uso das novas tecnologias assistenciais;\n3. Reduzir o tempo de espera para cirurgias eletivas e consultas especializadas.`;
    if (isReforma) return `1. Executar a reforma do telhado e das fachadas da unidade;\n2. Implantar sistema de climatização em 100% das áreas administrativas e operacionais;\n3. Adequar os sanitários e acessos para plena acessibilidade (NBR 9050).`;
    if (isTiro) return `1. Implantar estrutura de estande de tiro com isolamento acústico e para-balas conforme normas de segurança;\n2. Padronizar as instruções de tiro policial para 100% do efetivo da unidade;\n3. Reduzir riscos de incidentes por meio do adestramento técnico contínuo.`;
    if (isViatura) return `1. Adquirir viaturas com especificações táticas adequadas à topografia e mancha criminal local;\n2. Aumentar a presença policial ostensiva em áreas de vulnerabilidade social;\n3. Reduzir o tempo médio de deslocamento para atendimento de ocorrências graves.`;
    
    return draft
      ? `${draft}\n- Realizar a entrega técnica e alocação imediata dos bens adquiridos na rotina de serviço;\n- Garantir a conformidade dos equipamentos aos padrões normativos da SSP/SE.`
      : `1. Executar a aquisição integral dos itens previstos para atendimento da ${lotacao};\n2. Qualificar o suporte logístico das operações policiais na área de cobertura;\n3. Atingir as metas de produtividade institucional estabelecidas pela SSP/SE.`;
  }

  if (fieldKey === 'justificativa') {
    if (isHospital && isReforma) return `A infraestrutura atual do hospital policial encontra-se defasada, limitando a capacidade de atendimento e comprometendo a salubridade necessária para procedimentos médicos. A reforma estrutural do prédio não é apenas uma melhoria estética, mas uma necessidade estratégica para garantir que o policial militar e seus dependentes tenham acesso a um serviço de saúde digno, moderno e eficiente, refletindo diretamente na motivação e prontidão da tropa.`;
    if (isHospital) return `A modernização tecnológica do HPM é fundamental para acompanhar a evolução da medicina assistencial. A aquisição de novos meios soluciona gargalos de diagnóstico e permite que a segurança pública de Sergipe conte com profissionais de saúde devidamente equipados para salvar vidas e manter a saúde do efetivo.`;
    if (isReforma) return `O prédio da ${lotacao} apresenta sinais de desgaste temporal que impactam na rotina operacional e na moral da tropa. A revitalização das instalações assegura um ambiente de trabalho salubre, seguro e funcional, permitindo que o foco da unidade seja integralmente voltado para a preservação da ordem pública.`;
    if (isTiro) return `O treinamento constante é o pilar fundamental do uso legítimo da força. Atualmente, a ${lotacao} carece de local apropriado para prática de tiro, o que impõe riscos operacionais. A implantação deste estande garante a prontidão técnica permanente da tropa, assegurando que o policial atue com precisão técnica e segurança jurídica.`;
    if (isViatura) return `A mobilidade ágil é fator decisivo na prevenção criminal. O desgaste da frota atual compromete a continuidade do policiamento preventivo. A renovação dos veículos permitirá a ocupação territorial efetiva das manchas criminais identificadas pela SSP/SE, garantindo o socorro imediato ao cidadão.`;

    return draft
      ? `${draft}\n\nDiante do diagnóstico da ${lotacao}, a presente aquisição apresenta-se indispensável para suprir carências logísticas e assegurar a regularidade ininterrupta dos serviços prestados à sociedade.`
      : `A ${lotacao} desempenha papel fundamental na preservação da ordem pública. A execução deste projeto viabiliza a solução imediata dos gargalos logísticos diagnosticados, elevando a segurança dos servidores e a efetividade do atendimento à população sergipana.`;
  }

  if (fieldKey === 'metas') {
    return `1. Concluir 100% da implantação do projeto em até 60 dias após recebimento dos bens ou conclusão da obra;\n2. Alcançar a capacitação técnica de todo o efetivo usuário em 30 dias;\n3. Manter a disponibilidade operacional dos itens superior a 95% no primeiro ano de uso.`;
  }

  if (fieldKey === 'sustentabilidade') {
    return `A manutenção preventiva e corretiva será absorvida pelos contratos corporativos contínuos da Secretaria de Estado da Segurança Pública (SSP/SE). Os equipamentos e obras possuem vida útil estimada superior a 10 anos, com garantia técnica dos fornecedores e suporte logístico da PMSE.`;
  }

  if (fieldKey === 'mensuracaoResultados') {
    return `Monitoramento mensal via Relatórios de Ocorrência Policial (ROP) ou Indicadores de Gestão Hospitalar, estatísticas da CEACRIM/SSP e avaliações de desempenho operacional da ${lotacao}, correlacionando investimento e produtividade institucional.`;
  }

  if (fieldKey === 'titulo') {
    if (isHospital && isReforma) return `Reforma, Modernização e Adequação Técnica das Instalações do Hospital da Polícia Militar (HPM/SE)`;
    if (isHospital) return `Modernização Tecnológica e Reaparelhamento dos Serviços Médico-Hospitalares do HPM/SE`;
    if (isReforma) return `Revitalização Estrutural e Adequação de Infraestrutura da ${lotacao}`;
    if (isTiro) return `Aperfeiçoamento Técnico e Implantação de Estande de Tiro para a ${lotacao}`;
    if (isViatura) return `Modernização da Frota e Fortalecimento do Policiamento Ostensivo da ${lotacao}`;
    if (isSaude) return `Promoção da Saúde Ocupacional e Valorização dos Profissionais da ${lotacao}`;
    if (area === 'MVI') return 'Modernização Logística e Reaparelhamento Operacional para Redução da Letalidade Criminal (MVI)';
    if (area === 'EVM') return 'Implementação de Rede de Proteção e Fortalecimento da Patrulha Maria da Penha (EVM)';
    return 'Projeto de Melhoria da Qualidade de Vida e Valorização Profissional (MQV)';
  }

  if (fieldKey === 'publicoAlvoDireto') {
    return `Policiais militares, servidores de segurança pública e profissionais de saúde lotados na ${lotacao}, que utilizarão os meios diretamente em suas atividades diárias.`;
  }

  if (fieldKey === 'publicoAlvoIndireto') {
    return `A população do Estado de Sergipe e os dependentes dos servidores atendidos pela ${lotacao}, beneficiados pelo aumento da eficiência estatal e pela melhoria na qualidade dos serviços prestados.`;
  }

  if (fieldKey === 'pesquisaPrecosObservacoes') {
    return `Pesquisa de preços fundamentada em atas de registro de preços vigentes, orçamentos formais de no mínimo 3 (três) fornecedores especializados ou tabelas oficiais de referência (SINAPI para obras), observando a Portaria SSP nº 1998/2025.`;
  }

  if (fieldKey === 'implementacao') {
    return `1. Licitação/Contratação e início das etapas (15 dias);\n2. Execução técnica, recebimento e inspeção (30-60 dias);\n3. Tombamento patrimonial e início imediato do pleno uso das instalações/equipamentos.`;
  }

  return draft || `Proposta técnica elaborada para a ${lotacao} no âmbito do projeto conforme diretrizes da SSP/SE.`;
}
