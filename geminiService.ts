import { ProjectData, ThematicArea } from '../types';

export const DEFAULT_GEMINI_KEY =
  'AQ.Ab8RN6Il0g7MQH8IY05Q8A4M5icq9SPH_ishaNjBlTFAB4PoLw';

export function getStoredApiKey(): string {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('SSP_GEMINI_API_KEY');
    if (saved && saved.trim()) return saved.trim();
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
    }
  } catch {
    // If backend proxy is unavailable (e.g. static site or GitHub Pages), continue to direct fetch
    console.info('Proxy do servidor indisponível. Alternando para chamada direta do navegador...');
  }

  // Direct client fallback to Google Generative AI REST API
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${encodeURIComponent(
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
- materiaisServicos (array de objetos { materialServico, descricaoSucinta, modeloMarcaReferencia, naturezaDespesa, quantidade, valorUnitario, valorTotal })
- pesquisaPrecosObservacoes (string justificando parâmetros de preço conforme legislação)
- implementacao (string detalhando etapas e cronograma pós-aquisição)
- anexos (string listando documentos recomendados como ETP, cotações, etc.)`;

  const prompt = `Gere uma proposta de projeto completa do FPP para a Secretaria de Estado da Segurança Pública de Sergipe com base na seguinte solicitação:
Área Temática: ${areaDescMap[area]}
Instituição: ${instituicao}
Ideia Central da Aquisição: "${ideia}"

Lembre-se de usar termos e municípios reais de Sergipe (ex.: Aracaju, Nossa Senhora do Socorro, Itabaiana, Lagarto, Estância, Tobias Barreto, Canindé de São Francisco, Simão Dias), órgãos reais (PMSE, SSP/SE, CEACRIM, CIOSP) e formato financeiro em Reais.`;

  const rawText = await callGeminiApi(prompt, systemInstruction);

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
              naturezaDespesa: mat.naturezaDespesa || '44.90.52 - Equipamentos e Material Permanente',
              quantidade: qtd,
              valorUnitario: unit,
              valorTotal: total,
            };
          })
        : [],
      pesquisaPrecosObservacoes: parsed.pesquisaPrecosObservacoes || '',
      implementacao: parsed.implementacao || '',
      anexos: parsed.anexos || '',
    };
  } catch (err) {
    console.error('Falha ao processar JSON da IA:', err, rawText);
    throw new Error('A IA gerou a resposta, mas o formato JSON necessita de revisão. Tente novamente.');
  }
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

  const systemPrompt = `Você é um Oficial Especialista em Planejamento Estratégico da Secretaria de Estado da Segurança Pública de Sergipe (SSP/SE).
Sua missão é sugerir ou redigir o conteúdo para o campo "${fieldLabel}" do FORMULÁRIO DE PROPOSTA DE PROJETO (FPP).
REGRA CRÍTICA: Sua sugestão DEVE SER ESTRITAMENTE BASEADA E DERIVADA DOS DADOS QUE O USUÁRIO JÁ PREENCHEU NO FORMULÁRIO.
- Se o usuário especificou um determinado objeto (ex.: pistolas, viaturas, academia, etc.) ou batalhão/cidade de Sergipe, mantenha coerência total com esse objeto e localidade.
- Se o usuário já começou a digitar algo no campo atual, aproveite e continue essa ideia, aprimorando-a.
- Responda APENAS com o texto sugerido pronto para ser colado no formulário, sem introduções ou aspas.`;

  const prompt = `DADOS JÁ PREENCHIDOS PELO USUÁRIO NO PROJETO:
${contextParts.length > 0 ? contextParts.join('\n\n') : 'O usuário ainda não preencheu outros campos; use o foco da área temática selecionada.'}

CAMPO SENDO EDITADO AGORA: ${fieldLabel}
O QUE O USUÁRIO JÁ DIGITOU NESTE CAMPO (Rascunho):
"${currentValue && currentValue.trim() ? currentValue.trim() : '(Vazio - elabore uma sugestão técnica coerente com os dados acima)'}"

DIRETRIZ DE APRIMORAMENTO: ${instructions[instructionType] || instructions.from_context}`;

  return await callGeminiApi(prompt, systemPrompt);
}
