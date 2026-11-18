import { ProjectData, ThematicArea } from '../types';
import { callGeminiViaAppsScript } from './appsScriptService';

export const DEFAULT_GEMINI_KEY = '';

export const FREE_MODEL_CASCADE = [
  { id: 'gemini-3.1-flash-lite', label: 'Gemini 3.1 Flash Lite' },
  { id: 'gemini-4-hydrogen', label: 'Gemini 4 Flash' },
  { id: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash' },
] as const;

const CLIENT_QUOTA_COOLDOWN_MS = 60_000;
const clientCooldownUntil: Record<string, number> = {};
let backendProxyUnavailable = false;

function shouldSkipBackendProxy(): boolean {
  if (backendProxyUnavailable) return true;
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    if (
      host.endsWith('github.io') ||
      host.endsWith('netlify.app') ||
      host.endsWith('vercel.app')
    ) {
      return true;
    }
  }
  return false;
}

export interface AiModelNotice {
  id: string;
  modelId: string;
  modelLabel: string;
  isOffline: boolean;
  quotaExhausted: boolean;
  quotaExhaustedModels: string[];
  message: string;
  detail: string;
}

export interface AiGenerationResult {
  text: string;
  modelId: string;
  modelLabel: string;
  isOffline: boolean;
  quotaExhaustedModels: string[];
}

type NoticeListener = (notice: AiModelNotice) => void;
const listeners = new Set<NoticeListener>();

export function subscribeAiModelNotice(listener: NoticeListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function emitAiModelNotice(notice: Omit<AiModelNotice, 'id'>) {
  const fullNotice: AiModelNotice = {
    ...notice,
    id: `ai-notice-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
  };
  listeners.forEach((fn) => fn(fullNotice));
}

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

function isAuthStatusOrMessage(status: number, errorDetail: string): boolean {
  return (
    status === 401 ||
    status === 403 ||
    errorDetail.includes('ACCESS_TOKEN_TYPE_UNSUPPORTED') ||
    errorDetail.includes('API key not valid') ||
    errorDetail.includes('API_KEY_INVALID') ||
    errorDetail.includes('PERMISSION_DENIED') ||
    errorDetail.includes('UNAUTHENTICATED')
  );
}

function isQuotaError(status: number, errorDetail: string): boolean {
  const lower = errorDetail.toLowerCase();
  return (
    status === 429 ||
    status === 503 ||
    lower.includes('resource_exhausted') ||
    lower.includes('429') ||
    lower.includes('quota') ||
    lower.includes('rate limit') ||
    lower.includes('too many requests') ||
    lower.includes('overloaded') ||
    lower.includes('unavailable')
  );
}

function isModelNotFound(status: number, errorDetail: string): boolean {
  const lower = errorDetail.toLowerCase();
  return status === 404 || lower.includes('not_found') || lower.includes('404');
}

/**
 * Sends a prompt to Gemini using the server-side proxy cascade first,
 * falling back to direct browser REST cascade (for static hosting) and returning
 * model metadata so the UI can notify the user.
 */
export async function callGeminiWithCascade(
  prompt: string,
  systemInstruction?: string,
  customKey?: string
): Promise<AiGenerationResult> {
  const activeKey = (customKey || getStoredApiKey() || '').trim();
  const accumulatedQuotaModels: string[] = [];

  // 1. Try Server-Side API Proxy first when backend exists (uses server GEMINI_API_KEY or custom key)
  if (!shouldSkipBackendProxy()) {
    try {
      const res = await fetch('/api/gemini/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          systemInstruction,
          customApiKey: activeKey || undefined,
        }),
      });

      if (res.status === 404 || res.status === 405) {
        backendProxyUnavailable = true;
      } else {
        const data = await res.json().catch(() => null);

        if (res.ok && data?.text) {
          const modelId = data.modelUsed || 'gemini-3.1-flash-lite';
          const modelLabel = data.modelLabel || 'Gemini 3.1 Flash Lite';
          const exhausted: string[] = Array.isArray(data.quotaExhaustedModels)
            ? data.quotaExhaustedModels
            : [];

          emitAiModelNotice({
            modelId,
            modelLabel,
            isOffline: false,
            quotaExhausted: exhausted.length > 0,
            quotaExhaustedModels: exhausted,
            message:
              exhausted.length > 0
                ? `Cota atingida — usando ${modelLabel}`
                : `Usando ${modelLabel}`,
            detail:
              exhausted.length > 0
                ? `Cota esgotada em ${exhausted.join(', ')}. Alternado automaticamente.`
                : 'Sugestão gerada com o modelo gratuito prioritário.',
          });

          return {
            text: data.text,
            modelId,
            modelLabel,
            isOffline: false,
            quotaExhaustedModels: exhausted,
          };
        }

        if (data?.quotaExhaustedModels && Array.isArray(data.quotaExhaustedModels)) {
          accumulatedQuotaModels.push(...data.quotaExhaustedModels);
        }

        if (res.status === 429 || data?.quotaExhausted) {
          throw new Error('QUOTA_EXHAUSTED_ALL');
        }

        if (data?.invalidApiKey) {
          throw new Error('INVALID_API_KEY');
        }

        if (data?.noApiKey) {
          throw new Error('NO_VALID_CLIENT_KEY');
        }

        if (data?.error) {
          throw new Error(data.error);
        }
      }
    } catch (serverErr: any) {
      const msg = serverErr?.message || '';
      if (msg === 'QUOTA_EXHAUSTED_ALL') {
        throw serverErr;
      }
      if (
        !msg.includes('Failed to fetch') &&
        !msg.includes('NetworkError') &&
        msg !== 'NO_VALID_CLIENT_KEY' &&
        msg !== 'INVALID_API_KEY'
      ) {
        console.warn('Proxy respondeu com erro, verificando fallback...', msg);
      }
    }
  }

  // 2. If no explicit client key is saved locally, try the Google Apps Script AI bridge first
  if (!activeKey || activeKey.startsWith('AQ.')) {
    const bridgeRes = await callGeminiViaAppsScript(prompt, systemInstruction);
    if (bridgeRes.supported) {
      if (bridgeRes.text && bridgeRes.text.trim()) {
        const modelId = bridgeRes.modelUsed || 'gemini-3.1-flash-lite';
        const modelLabel = bridgeRes.modelLabel || 'Gemini 3.1 Flash Lite';
        const exhausted = bridgeRes.quotaExhaustedModels || [];

        emitAiModelNotice({
          modelId,
          modelLabel,
          isOffline: false,
          quotaExhausted: exhausted.length > 0,
          quotaExhaustedModels: exhausted,
          message:
            exhausted.length > 0
              ? `Cota atingida — usando ${modelLabel}`
              : `Usando ${modelLabel}`,
          detail:
            exhausted.length > 0
              ? `Cota esgotada em ${exhausted.join(', ')}. Alternado automaticamente via Apps Script.`
              : 'Sugestão gerada via ponte segura do Apps Script.',
        });

        return {
          text: bridgeRes.text,
          modelId,
          modelLabel,
          isOffline: false,
          quotaExhaustedModels: exhausted,
        };
      }

      if (bridgeRes.quotaExhausted) {
        throw new Error('QUOTA_EXHAUSTED_ALL');
      }
      if (bridgeRes.invalidApiKey) {
        throw new Error('INVALID_API_KEY');
      }
      if (bridgeRes.noApiKey) {
        throw new Error('NO_VALID_CLIENT_KEY');
      }
    }

    throw new Error(activeKey.startsWith('AQ.') ? 'INVALID_API_KEY' : 'NO_VALID_CLIENT_KEY');
  }

  const now = Date.now();

  for (const modelEntry of FREE_MODEL_CASCADE) {
    if ((clientCooldownUntil[modelEntry.id] || 0) > now) {
      accumulatedQuotaModels.push(modelEntry.label);
      continue;
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelEntry.id}:generateContent?key=${encodeURIComponent(
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

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyPayload),
      });

      if (response.ok) {
        const result = await response.json();
        const text = result?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text && text.trim()) {
          emitAiModelNotice({
            modelId: modelEntry.id,
            modelLabel: modelEntry.label,
            isOffline: false,
            quotaExhausted: accumulatedQuotaModels.length > 0,
            quotaExhaustedModels: accumulatedQuotaModels,
            message:
              accumulatedQuotaModels.length > 0
                ? `Cota atingida — usando ${modelEntry.label}`
                : `Usando ${modelEntry.label}`,
            detail:
              accumulatedQuotaModels.length > 0
                ? `Cota esgotada em ${accumulatedQuotaModels.join(', ')}. Alternado automaticamente.`
                : 'Sugestão gerada com o modelo gratuito prioritário.',
          });

          return {
            text,
            modelId: modelEntry.id,
            modelLabel: modelEntry.label,
            isOffline: false,
            quotaExhaustedModels: accumulatedQuotaModels,
          };
        }
      }

      const errorText = await response.text().catch(() => '');
      let errorDetail = errorText;
      try {
        const errJson = JSON.parse(errorText);
        errorDetail = errJson.error?.message || errorText;
      } catch {
        // ignore parse failure
      }

      if (isAuthStatusOrMessage(response.status, errorDetail)) {
        throw new Error('INVALID_API_KEY');
      }

      if (isQuotaError(response.status, errorDetail)) {
        clientCooldownUntil[modelEntry.id] = Date.now() + CLIENT_QUOTA_COOLDOWN_MS;
        accumulatedQuotaModels.push(modelEntry.label);
        continue;
      }

      if (isModelNotFound(response.status, errorDetail)) {
        continue;
      }

      throw new Error(`Erro na API do Gemini: ${errorDetail}`);
    } catch (fetchErr: any) {
      if (fetchErr?.message === 'INVALID_API_KEY' || fetchErr?.message?.startsWith('Erro na API')) {
        throw fetchErr;
      }
      clientCooldownUntil[modelEntry.id] = Date.now() + CLIENT_QUOTA_COOLDOWN_MS;
      accumulatedQuotaModels.push(modelEntry.label);
    }
  }

  throw new Error('QUOTA_EXHAUSTED_ALL');
}

function getOfflineFallbackInfo(apiErr: any): {
  quotaExhausted: boolean;
  quotaExhaustedModels: string[];
  message: string;
  detail: string;
  modelLabel: string;
} {
  const errCode = apiErr?.message || '';

  if (errCode === 'NO_VALID_CLIENT_KEY') {
    return {
      quotaExhausted: false,
      quotaExhaustedModels: [],
      message: 'Chave Gemini não configurada — usando sugestão offline',
      detail: shouldSkipBackendProxy()
        ? 'O GitHub Pages é estático (sem servidor). Abra o app pelo link do AI Studio ou informe uma chave Gemini gratuita nas Configurações.'
        : 'Nenhuma chave de API configurada no servidor. Configure GEMINI_API_KEY em Settings > Secrets ou nas Configurações.',
      modelLabel: 'Sugestão Offline (Sem chave configurada)',
    };
  }

  if (errCode === 'INVALID_API_KEY') {
    return {
      quotaExhausted: false,
      quotaExhaustedModels: [],
      message: 'Chave de API inválida — usando sugestão offline',
      detail:
        'A chave configurada em Settings > Secrets ou nas Configurações foi recusada pela API Gemini (use uma chave iniciada com AIza...).',
      modelLabel: 'Sugestão Offline (Chave recusada)',
    };
  }

  if (errCode === 'QUOTA_EXHAUSTED_ALL') {
    return {
      quotaExhausted: true,
      quotaExhaustedModels: FREE_MODEL_CASCADE.map((m) => m.label),
      message: 'Cota esgotada — carregando sugestão offline',
      detail: 'As cotas gratuitas dos modelos online foram atingidas; sugestão gerada localmente.',
      modelLabel: 'Sugestão Offline (Cota esgotada)',
    };
  }

  return {
    quotaExhausted: false,
    quotaExhaustedModels: [],
    message: 'IA online indisponível — carregando sugestão offline',
    detail: errCode || 'Sem resposta dos modelos online no momento; sugestão gerada localmente.',
    modelLabel: 'Sugestão Offline',
  };
}

function buildComprehensiveProjectContext(projectContext: Partial<ProjectData>, excludeFieldKey?: string): string {
  const contextParts: string[] = [];
  if (projectContext.areaTematica) {
    const areaLabels: Record<ThematicArea, string> = {
      MVI: 'MVI - Redução de Mortes Violentas Intencionais',
      EVM: 'EVM - Enfrentamento à Violência contra a Mulher',
      MQV: 'MQV - Melhoria da Qualidade de Vida e Valorização Profissional',
    };
    contextParts.push(`Área Temática: ${areaLabels[projectContext.areaTematica]}`);
  }
  if (projectContext.numeroProposta) contextParts.push(`Protocolo da Proposta: ${projectContext.numeroProposta}`);
  if (excludeFieldKey !== 'titulo' && projectContext.titulo?.trim()) {
    contextParts.push(`Título do Projeto: "${projectContext.titulo.trim()}"`);
  }
  if (projectContext.instituicao?.trim()) contextParts.push(`Instituição: ${projectContext.instituicao.trim()}`);
  if (projectContext.lotacao?.trim()) contextParts.push(`Lotação / Unidade / OPM: ${projectContext.lotacao.trim()}`);
  if (projectContext.responsavelTecnico?.trim()) {
    contextParts.push(
      `Responsável Técnico: ${projectContext.responsavelTecnico.trim()}${
        projectContext.postoGraduacaoCargo ? ` (${projectContext.postoGraduacaoCargo.trim()})` : ''
      }`
    );
  }
  if (excludeFieldKey !== 'objetivoGeral' && projectContext.objetivoGeral?.trim()) {
    contextParts.push(`I. Objetivo Geral:\n${projectContext.objetivoGeral.trim()}`);
  }
  if (excludeFieldKey !== 'objetivosEspecificos' && projectContext.objetivosEspecificos?.trim()) {
    contextParts.push(`II. Objetivos Específicos:\n${projectContext.objetivosEspecificos.trim()}`);
  }
  if (excludeFieldKey !== 'justificativa' && projectContext.justificativa?.trim()) {
    contextParts.push(`III. Justificativa:\n${projectContext.justificativa.trim()}`);
  }
  if (
    excludeFieldKey !== 'publicoAlvoDireto' &&
    excludeFieldKey !== 'publicoAlvoIndireto' &&
    (projectContext.publicoAlvoDireto?.trim() || projectContext.publicoAlvoIndireto?.trim())
  ) {
    contextParts.push(
      `IV. Público-Alvo:\n- Direto: ${projectContext.publicoAlvoDireto?.trim() || 'Não informado'}\n- Indireto: ${
        projectContext.publicoAlvoIndireto?.trim() || 'Não informado'
      }`
    );
  }
  if (excludeFieldKey !== 'resultadosEsperados' && projectContext.resultadosEsperados?.trim()) {
    contextParts.push(`V. Resultados Esperados:\n${projectContext.resultadosEsperados.trim()}`);
  }
  if (excludeFieldKey !== 'metas' && projectContext.metas?.trim()) {
    contextParts.push(`VI. Metas:\n${projectContext.metas.trim()}`);
  }
  if (excludeFieldKey !== 'sustentabilidade' && projectContext.sustentabilidade?.trim()) {
    contextParts.push(`VII. Sustentabilidade:\n${projectContext.sustentabilidade.trim()}`);
  }
  if (excludeFieldKey !== 'mensuracaoResultados' && projectContext.mensuracaoResultados?.trim()) {
    contextParts.push(`VIII. Mensuração de Resultados:\n${projectContext.mensuracaoResultados.trim()}`);
  }

  const filledLocations = (projectContext.planoLocalizacao || []).filter(
    (l) => l.item?.trim() || l.endereco?.trim()
  );
  if (filledLocations.length > 0) {
    const locList = filledLocations
      .map((l) => `- ${l.quantidade || 1}x ${l.item || 'Item'} -> ${l.endereco || 'Sergipe'}`)
      .join('\n');
    contextParts.push(`IX. Plano de Localização:\n${locList}`);
  }

  const filledMaterials = (projectContext.materiaisServicos || []).filter(
    (m) => m.materialServico && m.materialServico.trim() !== ''
  );
  if (filledMaterials.length > 0) {
    let total = 0;
    const matList = filledMaterials
      .map((m) => {
        const sub = m.valorTotal || m.quantidade * (m.valorUnitario || 0);
        total += sub;
        const natureza = m.naturezaDespesa === '3.3.90' ? '3.3.90 Custeio' : '4.4.90 Investimento';
        return `- ${m.quantidade}x ${m.materialServico} [${natureza}]${
          m.descricaoSucinta ? ` — ${m.descricaoSucinta}` : ''
        } (Total: R$ ${sub.toLocaleString('pt-BR', { minimumFractionDigits: 2 })})`;
      })
      .join('\n');
    contextParts.push(
      `X. Materiais e Serviços Orçados (Total Geral: R$ ${total.toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
      })}):\n${matList}`
    );
  }

  if (excludeFieldKey !== 'pesquisaPrecosObservacoes' && projectContext.pesquisaPrecosObservacoes?.trim()) {
    contextParts.push(`Pesquisa de Preços:\n${projectContext.pesquisaPrecosObservacoes.trim()}`);
  }
  if (excludeFieldKey !== 'implementacao' && projectContext.implementacao?.trim()) {
    contextParts.push(`XI. Implementação:\n${projectContext.implementacao.trim()}`);
  }

  return contextParts.join('\n\n');
}

function detectProjectDomainSummary(ctx: Partial<ProjectData>): string {
  const matText = (ctx.materiaisServicos || [])
    .map((m) => `${m.materialServico || ''} ${m.descricaoSucinta || ''}`)
    .join(' ');
  const raw = `${ctx.titulo || ''} ${ctx.lotacao || ''} ${ctx.objetivoGeral || ''} ${matText}`.toLowerCase();

  const tags: string[] = [];
  if (/hospital|hpm|médic|clínic|ambulatór|enferm|leito|odont|fisioter/.test(raw)) {
    tags.push('Saúde / Assistência Médico-Hospitalar (HPM/PMSE)');
  }
  if (/reforma|obra|constru|predial|instalaç|telhad|piso|alvenar|engenharia|manutenção predial/.test(raw)) {
    tags.push('Obra / Reforma Predial e Infraestrutura (referência SINAPI/ORSE-SE e acessibilidade NBR 9050)');
  }
  if (/tiro|estande|alvos|muniç|instruç|balístic|treinamento/.test(raw)) {
    tags.push('Capacitação Técnica / Estande de Tiro e Adestramento Policial');
  }
  if (/viatura|pick-up|4x4|veículo|moto|motocicleta|furgão|patrulha/.test(raw)) {
    tags.push('Mobilidade Operacional / Frota e Radiopatrulhamento');
  }
  if (/arma|pistola|fuzil|carabina|espingarda|colete|capacete|escudo|taser|incapacitante/.test(raw)) {
    tags.push('Reaparelhamento Bélico e Equipamento de Proteção Individual (EPI)');
  }
  if (/câmera|videomonitor|dvr|rádio|comunicaç|tablet|software|ti\b|informática|inteligência|drone/.test(raw)) {
    tags.push('Tecnologia, Inteligência Policial e Telecomunicações (CIOSP/SSP)');
  }
  if (ctx.areaTematica === 'EVM' || /mulher|penha|lilás|doméstica|feminic/.test(raw)) {
    tags.push('Enfrentamento à Violência contra a Mulher (Lei Maria da Penha / Patrulha Maria da Penha / Sala Lilás)');
  }
  if (ctx.areaTematica === 'MQV' || /academia|musculaç|ergonom|clima|ar-condicionado|psicossocial|bem-estar|alojamento/.test(raw)) {
    tags.push('Saúde Ocupacional, Salubridade e Valorização Profissional (MQV)');
  }

  return tags.length > 0
    ? tags.join(' + ')
    : 'Segurança Pública e Fortalecimento Institucional da SSP/SE';
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
    MQV: 'MQV - Melhoria da Qualidade de Vida e Valorização dos Profissionais de Segurança Pública (Saúde física, mental, infraestrutura e salubridade)',
  };

  const systemInstruction = `Você é um Coronel Especialista Sênior em Planejamento Estratégico, Elaboração de Projetos Públicos, Orçamentação (Lei nº 14.133/2021) e Captação de Recursos da Secretaria de Estado da Segurança Pública de Sergipe (SSP/SE).
Sua missão é redigir o preenchimento técnico completo, minucioso, coerente e pronto para aprovação pela AEPLAN no FORMULÁRIO DE PROPOSTA DE PROJETO (FPP), conforme a Portaria SSP nº 1998/2025, Lei nº 13.756/2018 (FNSP) e MCASP.

PADRÃO DE EXCELÊNCIA E COERÊNCIA:
- Todas as seções devem derivar estritamente do objeto especificado na "Ideia Central", com total consistência terminológica e quantitativa entre título, objetivos, justificativa, público-alvo, metas SMART, indicadores, localização e itens orçamentários.
- É PROIBIDO usar clichês desconexos do objeto real (não mencione "tempo de resposta de viatura" se o projeto for reforma, hospital, academia ou estande de tiro).
- Redija textos densos, claros, objetivos e formais em Português do Brasil (padrão oficial da administração pública sergipana).
- A resposta DEVE ser estritamente um objeto JSON válido (sem markdown extra nem texto fora do JSON) contendo as chaves:
  titulo, objetivoGeral, objetivosEspecificos, justificativa, publicoAlvoDireto, publicoAlvoIndireto, resultadosEsperados, metas, sustentabilidade, mensuracaoResultados, planoLocalizacao ([{ item, quantidade, endereco }]), materiaisServicos ([{ materialServico, descricaoSucinta, modeloMarcaReferencia, naturezaDespesa ("4.4.90" para investimento ou "3.3.90" para custeio), quantidade, valorUnitario, valorTotal }]), pesquisaPrecosObservacoes, implementacao.`;

  const prompt = `Elabore uma proposta de projeto completa, detalhada e tecnicamente impecável para o FPP da SSP/SE com base nos parâmetros abaixo:
- Área Temática: ${areaDescMap[area]}
- Instituição Proponente: ${instituicao}
- Ideia Central / Objeto Solicitado: "${ideia}"

Diretrizes de preenchimento:
1. Em "justificativa", estruture 3 parágrafos robustos: diagnóstico situacional da unidade em Sergipe, pertinência técnica da solução e impacto institucional/social com base legal.
2. Em "metas", apresente de 3 a 4 metas numeradas no padrão SMART (percentuais e prazos claros em dias/meses).
3. Em "materiaisServicos", classifique corretamente 4.4.90 (material permanente/equipamento/obra de capital) e 3.3.90 (serviços/insumos de custeio) com valores unitários e totais realistas em Reais (R$) e coerentes com a soma.
4. Em "planoLocalizacao", use unidades e municípios reais de Sergipe (ex.: Aracaju, Nossa Senhora do Socorro, Itabaiana, Lagarto, Estância, Tobias Barreto, Canindé de São Francisco, HPM/SE, CEACRIM, CIOSP, DAL/PMSE).`;

  let rawText = '';
  try {
    const result = await callGeminiWithCascade(prompt, systemInstruction);
    rawText = result.text;
  } catch (apiErr: any) {
    console.warn('Modelos Gemini indisponíveis, acionando gerador offline completo...', apiErr?.message);
    const info = getOfflineFallbackInfo(apiErr);
    emitAiModelNotice({
      modelId: 'offline',
      modelLabel: info.modelLabel,
      isOffline: true,
      quotaExhausted: info.quotaExhausted,
      quotaExhaustedModels: info.quotaExhaustedModels,
      message: info.message,
      detail: info.detail,
    });
    return generateOfflineProposal(ideia, area, instituicao);
  }

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

function generateOfflineProposal(
  ideia: string,
  area: ThematicArea,
  _instituicao: string
): Partial<ProjectData> {
  const cleanIdea = ideia.trim();
  const title = `Projeto ${area}: ${cleanIdea.length > 70 ? cleanIdea.slice(0, 70) + '...' : cleanIdea}`;

  if (area === 'EVM') {
    return {
      titulo: title,
      objetivoGeral: `Intensificar o enfrentamento e prevenção qualificada à violência doméstica e familiar contra a mulher no Estado de Sergipe, com ênfase na fiscalização de Medidas Protetivas de Urgência através de ${cleanIdea}.`,
      objetivosEspecificos: `1. Estruturar a capacidade de acolhimento humanizado e mobilidade operacional com ${cleanIdea};\n2. Ampliar em 100% o número de visitas fiscalizatórias preventivas a mulheres sob medida protetiva;\n3. Qualificar o atendimento não revitimizador das vítimas em articulação com a rede estadual de proteção.`,
      justificativa: `A violência doméstica demanda intervenção célere, especializada e contínua para interromper o ciclo de agressões e prevenir o feminicídio. A implementação de "${cleanIdea}" dota a unidade dos meios adequados para assegurar o cumprimento das decisões judiciais e proteger as vítimas em Sergipe.`,
      publicoAlvoDireto: '30 profissionais da Patrulha Maria da Penha e cerca de 450 mulheres sob acompanhamento judicial.',
      publicoAlvoIndireto: 'População feminina da região atendida (estimada em mais de 50.000 mulheres).',
      resultadosEsperados: '- Redução drástica da reincidência de agressões graves entre mulheres monitoradas;\n- Cumprimento célere de 100% das medidas protetivas expedidas.',
      metas: '1. Realizar no mínimo 80 visitas fiscalizatórias mensais;\n2. Colocar os meios em operação regular em até 45 dias após o recebimento.',
      sustentabilidade: 'Manutenção assegurada pelos contratos corporativos contínuos da Secretaria de Segurança Pública de Sergipe.',
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
          descricaoSucinta: `Objeto especificado: ${cleanIdea}`,
          modeloMarcaReferencia: 'Padrão normatizado SSP/SE',
          naturezaDespesa: '4.4.90',
          quantidade: 1,
          valorUnitario: 95000.0,
          valorTotal: 95000.0,
        },
      ],
      pesquisaPrecosObservacoes: 'Pesquisa realizada com base em atas públicas vigentes e três cotações mercadológicas (Art. 5º da Portaria SSP nº 1998/2025).',
      implementacao: 'Recebimento técnico, tombamento patrimonial e capacitação da equipe especializada em até 30 dias.',
    };
  }

  if (area === 'MQV') {
    return {
      titulo: title,
      objetivoGeral: `Promover a melhoria das condições de trabalho, saúde biopsicossocial, salubridade e qualidade de vida dos profissionais de segurança pública através de ${cleanIdea}, nos termos da Portaria SSP nº 1998/2025.`,
      objetivosEspecificos: `1. Implantar e disponibilizar ${cleanIdea} conforme normas técnicas vigentes;\n2. Reduzir fatores de estresse ocupacional e agravos físicos ou mentais no efetivo;\n3. Melhorar a infraestrutura assistencial e operacional voltada aos profissionais de segurança pública.`,
      justificativa: `A atividade de segurança pública impõe elevada sobrecarga física e emocional. A execução de "${cleanIdea}" atua diretamente na prevenção de agravos à saúde e na valorização dos servidores, reduzindo afastamentos e elevando a qualidade dos serviços prestados à população sergipana.`,
      publicoAlvoDireto: '150 profissionais de segurança pública e colaboradores diretamente beneficiados.',
      publicoAlvoIndireto: 'Dependentes dos servidores e a comunidade atendida em todo o Estado de Sergipe.',
      resultadosEsperados: '- Redução de pelo menos 25% nos afastamentos médicos relacionados no período de 12 meses;\n- Elevação da capacidade e qualidade estrutural da unidade.',
      metas: '1. Concluir 100% da implantação em até 60 dias após recebimento/contratação;\n2. Alcançar atendimento ou adesão de pelo menos 70% do público-alvo previsto no primeiro semestre.',
      sustentabilidade: 'Manutenção preventiva absorvida pela dotação continuada da PMSE/SSP-SE, com vida útil superior a 8 anos.',
      mensuracaoResultados: 'Relatórios periódicos da Formação Sanitária, HPM/SE e Núcleo de Saúde Ocupacional comparando indicadores antes e após a implantação.',
      planoLocalizacao: [
        {
          id: 'loc-mqv-off-1',
          item: cleanIdea.slice(0, 40),
          quantidade: 1,
          endereco: 'Instalações da Unidade Policial / Saúde - Sergipe',
        },
      ],
      materiaisServicos: [
        {
          id: 'mat-mqv-off-1',
          materialServico: cleanIdea.slice(0, 40),
          descricaoSucinta: `Conjunto técnico para qualidade de vida e infraestrutura: ${cleanIdea}`,
          modeloMarcaReferencia: 'Linha profissional normatizada',
          naturezaDespesa: '4.4.90',
          quantidade: 1,
          valorUnitario: 85000.0,
          valorTotal: 85000.0,
        },
      ],
      pesquisaPrecosObservacoes: 'Pesquisa de preços balizada em atas vigentes, Painel de Preços e três orçamentos formais (Art. 5º da Portaria SSP nº 1998/2025).',
      implementacao: 'Contratação, execução/instalação em até 45 dias e entrega formal com regulamento de uso e manutenção.',
    };
  }

  return {
    titulo: title,
    objetivoGeral: `Fortalecer a capacidade operacional e estrutural na contenção de Mortes Violentas Intencionais (MVI) em Sergipe mediante ${cleanIdea}, alinhando-se à Portaria MJSP nº 685/2024 e Lei nº 13.756/2018.`,
    objetivosEspecificos: `1. Viabilizar integralmente ${cleanIdea} conforme especificações técnicas da SSP/SE;\n2. Capacitar o efetivo responsável para o emprego eficiente e seguro dos meios;\n3. Ampliar a efetividade operacional nas áreas prioritárias definidas pela CEACRIM/SSP.`,
    justificativa: `O enfrentamento aos crimes violentos demanda suporte técnico, logístico e capacitação contínua. A iniciativa "${cleanIdea}" resolve gargalos identificados na unidade proponente e eleva o padrão de proteção à sociedade sergipana.`,
    publicoAlvoDireto: '120 profissionais de segurança pública diretamente envolvidos na execução e uso dos meios.',
    publicoAlvoIndireto: 'População estimada de 85.000 habitantes na circunscrição atendida em Sergipe.',
    resultadosEsperados: '- Elevação da prontidão técnica e da segurança operacional do efetivo;\n- Impacto positivo mensurável nos indicadores da área temática.',
    metas: '1. Concluir 100% da implantação no prazo de 60 dias após entrega;\n2. Garantir operacionalidade superior a 95% durante o primeiro ano.',
    sustentabilidade: 'Integração aos contratos de manutenção e logística da SSP/SE com observância às normas do MCASP.',
    mensuracaoResultados: 'Aferição mensal via Relatórios de Ocorrência Policial (ROP) e estatísticas consolidadas pela CEACRIM/SSP-SE.',
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
        descricaoSucinta: `Especificação técnica para ${cleanIdea} em conformidade com a SSP/SE.`,
        modeloMarcaReferencia: 'Padrão normatizado de referência',
        naturezaDespesa: '4.4.90',
        quantidade: 1,
        valorUnitario: 150000.0,
        valorTotal: 150000.0,
      },
    ],
    pesquisaPrecosObservacoes: 'Pesquisa elaborada no Painel de Preços oficial e três cotações válidas (Art. 5º da Portaria SSP nº 1998/2025).',
    implementacao: 'Recebimento técnico, tombamento patrimonial pela DAL/PMSE e entrada em operação imediata após nivelamento.',
  };
}

/**
 * Suggests professional, context-aware content for an individual section of the FPP.
 * Returns both the suggested text and metadata about which model generated it.
 */
export async function suggestFieldImprovement(
  fieldKey: string,
  fieldLabel: string,
  currentValue: string,
  projectContext: Partial<ProjectData>
): Promise<AiGenerationResult> {
  const fullContext = buildComprehensiveProjectContext(projectContext, fieldKey);
  const domainSummary = detectProjectDomainSummary(projectContext);

  const fieldSpecificGuidance: Record<string, string> = {
    titulo:
      'Redija um título técnico-institucional completo padrão AEPLAN/SSP-SE (1 única frase objetiva, sem ponto final nem aspas), explicitando: (1) a ação principal (ex.: Aquisição, Reforma e Modernização, Implantação), (2) o objeto central específico, (3) a unidade/lotação beneficiada (se informada) e (4) a finalidade estratégica alinhada à área temática.',
    objetivoGeral:
      'Redija 1 parágrafo robusto e bem articulado (4 a 6 linhas), iniciando obrigatoriamente com verbo no infinitivo, conectando de modo preciso: o objeto exato da proposta, a unidade/região beneficiada em Sergipe, o problema estrutural ou operacional a superar e o alinhamento normativo à Portaria SSP nº 1998/2025 (e Lei nº 13.756/2018 quando aplicável).',
    objetivosEspecificos:
      'Elabore uma lista numerada de 4 a 5 objetivos específicos concretos (1., 2., 3., 4...), cada um iniciado por verbo no infinitivo, descrevendo entregas tangíveis, capacitação/adequação vinculada e impacto verificável, estritamente coerentes com os itens e a lotação informados.',
    justificativa:
      'Redija uma justificativa técnica densa e convincente em 3 parágrafos encadeados:\n- Parágrafo 1 (Diagnóstico Situacional): descreva com precisão a carência atual ou vulnerabilidade enfrentada pela unidade proponente em Sergipe e os prejuízos operacionais/assistenciais decorrentes;\n- Parágrafo 2 (Pertinência Técnica da Solução): demonstre como os itens, serviços ou intervenções orçadas atacam diretamente a causa do problema, citando ganhos concretos de capacidade, segurança, salubridade ou eficiência;\n- Parágrafo 3 (Interesse Público e Fundamentação Legal): conecte o investimento aos objetivos estratégicos da SSP/SE, Portaria SSP nº 1998/2025 e legislação pertinente ao domínio (Lei nº 13.675/2018, Lei nº 13.756/2018, Lei nº 11.340/2006 ou normas técnicas/sanitárias aplicáveis).',
    publicoAlvoDireto:
      'Especifique com clareza quem são os beneficiários imediatos que utilizarão ou serão atendidos diretamente pelo objeto (efetivo policial, equipe técnica/médica ou cidadãos acolhidos), apresentando estimativa numérica coerente com o porte da unidade e o impacto direto na rotina.',
    publicoAlvoIndireto:
      'Especifique os beneficiários mediatos (população do município ou região de cobertura em Sergipe, dependentes de servidores e sociedade em geral), apresentando estimativa quantitativa realista e explicando o ganho social indireto.',
    resultadosEsperados:
      'Liste de 4 a 5 resultados esperados e impactos concretos em tópicos ("- ..."), combinando efeitos imediatos e de médio prazo mensuráveis, 100% aderentes ao domínio real do projeto (sem métricas de outro setor).',
    metas:
      'Redija de 3 a 4 metas numeradas rigorosamente no padrão SMART (Específica, Mensurável com percentuais/quantidades exatas, Atingível, Relevante e Temporal com prazos em dias ou meses após contratação/recebimento), alinhadas aos itens orçados e à capacidade da unidade.',
    sustentabilidade:
      'Redija 1 a 2 parágrafos técnicos detalhando os 4 pilares da continuidade pós-implantação: (1) garantia contratual e assistência técnica do fornecedor/executor; (2) absorção de manutenção preventiva, corretiva e insumos pela dotação continuada e contratos corporativos da SSP/SE ou PMSE; (3) vida útil estimada e registro patrimonial conforme o MCASP; e (4) ausência de custos imprevistos que comprometam o funcionamento.',
    mensuracaoResultados:
      'Descreva de forma objetiva 3 a 4 instrumentos auditáveis de verificação compatíveis com o objeto (ex.: relatórios da CEACRIM/SSP, ROPs e CIOSP; ou prontuários/indicadores assistenciais do HPM; ou laudos de medição de engenharia e vistorias; ou atas de frequência e aproveitamento), definindo periodicidade (mensal/trimestral/semestral) e comparação antes x depois.',
    pesquisaPrecosObservacoes:
      'Fundamente metodológica e juridicamente a estimativa orçamentária com base no Art. 23 da Lei nº 14.133/2021 e no Art. 5º da Portaria SSP nº 1998/2025, indicando fontes oficiais (Painel de Preços/Compras.gov.br, Atas de Registro de Preços vigentes, SINAPI/ORSE-SE quando houver obra/reforma, além de no mínimo 3 cotações válidas de fornecedores e análise de vantajosidade/exequibilidade).',
    implementacao:
      'Apresente um cronograma executivo numerado em 4 a 5 etapas sequenciais após a aprovação/liberação dos recursos, indicando duração estimada em dias (ex.: 15 dias, 30 dias, 60 dias) e responsáveis: formalização/contratação, entrega ou execução técnica com fiscalização por comissão designada, tombamento patrimonial junto à DAL/PMSE (quando bem permanente), capacitação de nivelamento e entrada em operação plena.',
  };

  const systemPrompt = `Você é um Coronel Especialista Sênior em Planejamento Estratégico, Elaboração de Projetos Públicos e Orçamentação (Lei nº 14.133/2021) da Secretaria de Estado da Segurança Pública de Sergipe (SSP/SE).
Sua tarefa é redigir com máxima excelência técnica o campo "${fieldLabel}" do FORMULÁRIO DE PROPOSTA DE PROJETO (FPP), em total conformidade com a Portaria SSP nº 1998/2025.

DIRETRIZES DE EXCELÊNCIA (SIGA RIGOROSAMENTE):
1. ANCORAGEM NO CONTEXTO REAL DO PROJETO:
   - Domínio identificado automaticamente: ${domainSummary}.
   - Leia atentamente o Título, a Lotação, os Materiais/Serviços, a Localização e os campos já preenchidos abaixo. Cada frase gerada precisa refletir especificamente esse projeto (não escreva texto genérico de catálogo).
   - Se for reforma/obra/HPM: foque em infraestrutura física, normas sanitárias (ANVISA), acessibilidade (ABNT NBR 9050), segurança elétrica/hidráulica e capacidade assistencial.
   - Se for estande/armamento/instrução: foque em proficiência técnica, segurança balística, controle emocional e uso diferenciado da força.
   - Se for viatura/radiopatrulhamento: foque em mobilidade tática, cobertura territorial, manchas criminais e pronta resposta.
   - Se for saúde ocupacional/academia/climatização: foque em ergonomia, salubridade, prevenção de absenteísmo e valorização humana.
   - É PROIBIDO misturar temas incompatíveis entre si.
2. PROFUNDIDADE, CLAREZA E FORMALIDADE:
   - Use Português formal da administração pública brasileira, com termos precisos, argumentos sólidos, indicadores plausíveis e coesão textual.
   - Evite adjetivos vazios ("muito importante", "de extrema relevância") sem explicação técnica concreta do porquê e do como.
3. RESPEITO AO RASCUNHO DO USUÁRIO:
   - Se o usuário já digitou algo no campo, preserve a intenção central dele e eleve o texto para nível executivo pronto para aprovação na AEPLAN.
   - Se o campo estiver vazio, construa a redação completa do zero usando o contexto das demais abas.
4. FORMATO DE SAÍDA LIMPO:
   - Retorne APENAS o texto final pronto para colar no campo do formulário. Não inclua títulos repetitivos ("III. Justificativa:"), saudações, comentários introdutórios nem formatação markdown com asteriscos (**).`;

  const prompt = `CONTEXTO INTEGRAL DA PROPOSTA EM ELABORAÇÃO:
${fullContext || 'Área Temática Selecionada: ' + (projectContext.areaTematica || 'MVI')}

DOMÍNIO TÉCNICO IDENTIFICADO: ${domainSummary}
CAMPO A REDIGIR AGORA: ${fieldLabel}
CRITÉRIOS DE QUALIDADE PARA ESTE CAMPO:
${fieldSpecificGuidance[fieldKey] || 'Redija texto técnico formal, completo, detalhado e estritamente coerente com os demais dados.'}

RASCUNHO ATUAL DIGITADO PELO USUÁRIO:
"${currentValue && currentValue.trim() ? currentValue.trim() : '(Campo vazio — elabore redação técnica completa, rica e totalmente alinhada ao contexto acima)'}"`;

  try {
    return await callGeminiWithCascade(prompt, systemPrompt);
  } catch (apiErr: any) {
    console.warn('Modelos Gemini indisponíveis, acionando sugestão offline contextual...', apiErr?.message);
    const offlineText = generateOfflineFieldSuggestion(fieldKey, currentValue, projectContext);
    const info = getOfflineFallbackInfo(apiErr);
    emitAiModelNotice({
      modelId: 'offline',
      modelLabel: info.modelLabel,
      isOffline: true,
      quotaExhausted: info.quotaExhausted,
      quotaExhaustedModels: info.quotaExhaustedModels,
      message: info.message,
      detail: info.detail,
    });
    return {
      text: offlineText,
      modelId: 'offline',
      modelLabel: info.modelLabel,
      isOffline: true,
      quotaExhaustedModels: info.quotaExhaustedModels,
    };
  }
}

function generateOfflineFieldSuggestion(
  fieldKey: string,
  currentValue: string,
  ctx: Partial<ProjectData>
): string {
  const titleRaw = (ctx.titulo || '').trim();
  const title = titleRaw.toLowerCase();
  const lotacao = ctx.lotacao?.trim() || 'unidade proponente da PMSE/SSP-SE';
  const area = ctx.areaTematica || 'MVI';
  const draft = currentValue?.trim() || '';
  const filledMaterials = (ctx.materiaisServicos || [])
    .map((m) => m.materialServico?.trim())
    .filter(Boolean) as string[];
  const materialsSummary =
    filledMaterials.length > 0
      ? filledMaterials.slice(0, 3).join(', ')
      : titleRaw || 'os itens e serviços especificados na proposta';
  const combinedText = `${title} ${filledMaterials.join(' ').toLowerCase()} ${(ctx.objetivoGeral || '').toLowerCase()}`;

  const isHospital =
    combinedText.includes('hospital') ||
    combinedText.includes('hpm') ||
    combinedText.includes('médic') ||
    combinedText.includes('clínica') ||
    combinedText.includes('ambulatór') ||
    combinedText.includes('enferm') ||
    combinedText.includes('leito');
  const isReforma =
    combinedText.includes('reforma') ||
    combinedText.includes('obra') ||
    combinedText.includes('construção') ||
    combinedText.includes('prédio') ||
    combinedText.includes('instalações') ||
    combinedText.includes('adequação') ||
    combinedText.includes('telhado') ||
    combinedText.includes('estrutura');
  const isTiro =
    combinedText.includes('tiro') ||
    combinedText.includes('estande') ||
    combinedText.includes('treinamento') ||
    combinedText.includes('instrutor') ||
    combinedText.includes('munição');
  const isViatura =
    combinedText.includes('viatura') ||
    combinedText.includes('carro') ||
    combinedText.includes('pick-up') ||
    combinedText.includes('veículo') ||
    combinedText.includes('moto');
  const isArma =
    combinedText.includes('arma') ||
    combinedText.includes('pistola') ||
    combinedText.includes('fuzil') ||
    combinedText.includes('bélico') ||
    combinedText.includes('colete');
  const isMulher =
    area === 'EVM' ||
    combinedText.includes('mulher') ||
    combinedText.includes('penha') ||
    combinedText.includes('lilás');
  const isSaude =
    area === 'MQV' ||
    combinedText.includes('saúde') ||
    combinedText.includes('academia') ||
    combinedText.includes('musculação') ||
    combinedText.includes('clima') ||
    combinedText.includes('ergonomia');

  if (fieldKey === 'titulo') {
    if (isHospital && isReforma) {
      return `Reforma, Modernização Predial e Adequação Técnica das Instalações do Hospital da Polícia Militar (${lotacao})`;
    }
    if (isHospital) {
      return `Modernização Tecnológica e Ampliação dos Serviços Médico-Hospitalares do HPM (${lotacao})`;
    }
    if (isReforma) {
      return `Reforma Estrutural e Modernização das Instalações Físicas da ${lotacao}`;
    }
    if (isTiro) {
      return `Implantação e Modernização de Estande de Tiro para Capacitação Técnica da ${lotacao}`;
    }
    if (isViatura) {
      return `Aquisição de Viaturas Operacionais para Fortalecimento do Policiamento Ostensivo da ${lotacao}`;
    }
    if (isArma) {
      return `Reaparelhamento Bélico e Proteção Individual do Efetivo da ${lotacao}`;
    }
    if (isMulher) {
      return `Fortalecimento da Patrulha Maria da Penha e Rede de Acolhimento à Mulher (${lotacao})`;
    }
    if (isSaude) {
      return `Promoção da Saúde Ocupacional e Adequação Ergonômica para Qualidade de Vida na ${lotacao}`;
    }
    if (filledMaterials.length > 0) {
      return `Aquisição de ${materialsSummary} para Fortalecimento Operacional da ${lotacao}`;
    }
    return `Modernização Estrutural e Logística da ${lotacao} no âmbito da Portaria SSP nº 1998/2025`;
  }

  if (fieldKey === 'objetivoGeral') {
    if (isHospital && isReforma) {
      return `Reformar e modernizar as instalações físicas do ${lotacao}, adequando os ambientes assistenciais às normas sanitárias e estruturais vigentes para expandir a capacidade e a qualidade dos atendimentos médicos prestados aos profissionais de segurança pública e seus dependentes, em conformidade com a Portaria SSP nº 1998/2025.`;
    }
    if (isHospital) {
      return `Modernizar o parque tecnológico e assistencial do ${lotacao} mediante a incorporação de ${materialsSummary}, ampliando a resolutividade clínica e a qualidade do atendimento médico-hospitalar em Sergipe.`;
    }
    if (isReforma) {
      return `Executar a reforma e revitalização estrutural das instalações da ${lotacao}, assegurando condições adequadas de salubridade, acessibilidade, segurança predial e eficiência administrativa e operacional.`;
    }
    if (isTiro) {
      return `Aperfeiçoar a capacitação técnico-profissional em armamento e tiro policial do efetivo da ${lotacao} por meio da implantação de ${materialsSummary}, promovendo a precisão técnica, a segurança nas instruções e o uso legítimo e proporcional da força.`;
    }
    if (isViatura) {
      return `Fortalecer o policiamento ostensivo preventivo e a pronta resposta nas manchas criminais atendidas pela ${lotacao} mediante a incorporação de ${materialsSummary}, contribuindo para a redução das Mortes Violentas Intencionais (MVI) conforme a Portaria MJSP nº 685/2024.`;
    }
    if (isArma) {
      return `Modernizar os meios de defesa e proteção individual dos servidores da ${lotacao} mediante a aquisição de ${materialsSummary}, elevando a segurança operacional e a confiabilidade técnica nas ações de segurança pública.`;
    }
    if (isMulher) {
      return `Ampliar o enfrentamento à violência doméstica e a fiscalização de Medidas Protetivas de Urgência na área da ${lotacao} por meio de ${materialsSummary}, assegurando atendimento humanizado e proteção efetiva às mulheres em situação de vulnerabilidade.`;
    }
    if (isSaude) {
      return `Promover a saúde física e mental, a ergonomia e a melhoria das condições de trabalho dos profissionais da ${lotacao} mediante a disponibilização de ${materialsSummary}, nos termos da Portaria SSP nº 1998/2025.`;
    }
    if (titleRaw) {
      return `Viabilizar a execução do projeto "${titleRaw}" na ${lotacao} mediante a implementação de ${materialsSummary}, fortalecendo a eficiência institucional e o atendimento à sociedade sergipana conforme a Portaria SSP nº 1998/2025.`;
    }
    return draft
      ? `${draft} — alinhado às diretrizes da Portaria SSP nº 1998/2025.`
      : `Fortalecer a infraestrutura e a capacidade de atendimento da ${lotacao} mediante a execução dos itens previstos nesta proposta, em conformidade com a Portaria SSP nº 1998/2025.`;
  }

  if (fieldKey === 'objetivosEspecificos') {
    if (isHospital && isReforma) {
      return `1. Reestruturar e modernizar as alas de atendimento ambulatorial, pronto atendimento e internação do hospital;\n2. Atualizar as redes elétrica, hidráulica e de climatização para suporte seguro aos equipamentos hospitalares;\n3. Expandir em 30% a capacidade mensal de consultas, exames e procedimentos assistenciais;\n4. Adequar os acessos e dependências às normas da vigilância sanitária (ANVISA) e acessibilidade (NBR 9050).`;
    }
    if (isHospital) {
      return `1. Incorporar ${materialsSummary} aos setores médicos prioritários da unidade;\n2. Reduzir em 25% o tempo médio de espera para atendimentos e exames diagnósticos;\n3. Capacitar 100% da equipe assistencial na operação e manutenção preventiva dos equipamentos.`;
    }
    if (isReforma) {
      return `1. Corrigir patologias estruturais de cobertura, alvenaria, piso e instalações prediais da ${lotacao};\n2. Garantir ambientes climatizados, acessíveis e salubres para o efetivo e para o cidadão;\n3. Otimizar a distribuição dos setores internos para elevar a produtividade dos serviços prestados.`;
    }
    if (isTiro) {
      return `1. Adequar o estande com sistemas de proteção balística, contenção de projéteis e isolamento acústico normatizados;\n2. Viabilizar ciclos contínuos de instrução de tiro policial para 100% do efetivo da ${lotacao};\n3. Reduzir riscos de incidentes e elevar o nível de proficiência técnica da tropa em ocorrências reais.`;
    }
    if (isViatura) {
      return `1. Incorporar ${materialsSummary} às escalas regulares de policiamento ostensivo da ${lotacao};\n2. Ampliar a cobertura preventiva nos setores críticos mapeados pela CEACRIM/SSP;\n3. Reduzir o tempo médio de resposta às solicitações emergenciais via CIOSP.`;
    }
    if (isMulher) {
      return `1. Estruturar meios dedicados para o atendimento acolhedor e não revitimizador às vítimas;\n2. Ampliar em 50% as visitas de acompanhamento de Medidas Protetivas de Urgência;\n3. Integrar o fluxo de atendimento entre a ${lotacao}, o DAGV/SSP e o Poder Judiciário sergipano.`;
    }
    if (isSaude) {
      return `1. Implantar ${materialsSummary} em ambiente adequado na sede da ${lotacao};\n2. Estruturar cronograma regular de utilização e acompanhamento preventivo de saúde do efetivo;\n3. Reduzir índices de fadiga, lesões ocupacionais e absenteísmo médico na unidade.`;
    }
    return `1. Implementar integralmente ${materialsSummary} em atendimento direto às demandas da ${lotacao};\n2. Adequar os processos internos e capacitar os servidores envolvidos para o uso pleno dos recursos em até 30 dias após a entrega;\n3. Elevar os indicadores de qualidade e regularidade do serviço prestado à população sergipana.`;
  }

  if (fieldKey === 'justificativa') {
    if (isHospital && isReforma) {
      return `As instalações físicas atuais do ${lotacao} apresentam desgaste acumulado pelo tempo de uso contínuo, comprometendo o conforto assistencial, a eficiência dos fluxos clínicos e a adequação integral às normas sanitárias e de acessibilidade vigentes.\n\nA reforma e modernização predial propostas são estratégicas para ampliar a capacidade de atendimento, incorporar novos serviços com segurança elétrica e estrutural e proporcionar ambiente digno aos policiais militares, demais profissionais da segurança pública e seus dependentes, refletindo diretamente na prontidão e valorização do efetivo em Sergipe.`;
    }
    if (isReforma) {
      return `A estrutura física da ${lotacao} apresenta limitações decorrentes da degradação natural de suas dependências e sistemas prediais, o que prejudica a salubridade do trabalho diário e a qualidade do atendimento prestado.\n\nA execução da reforma corrige tais vulnerabilidades estruturais, adequa os espaços às normas técnicas aplicáveis e garante condições dignas e funcionais para o desempenho contínuo das atribuições institucionais.`;
    }
    if (isTiro) {
      return `O adestramento técnico contínuo em armamento e tiro é requisito essencial para a atuação segura e legítima dos profissionais de segurança pública. A ausência de estrutura adequada na ${lotacao} obriga deslocamentos onerosos e restringe a frequência das instruções práticas.\n\nCom a implantação deste projeto utilizando ${materialsSummary}, a unidade assegura treinamento periódico em ambiente controlado e seguro, elevando a precisão técnica e mitigando riscos operacionais tanto para o policial quanto para a população.`;
    }
    if (isViatura) {
      return `A dinâmica da criminalidade exige mobilidade ágil e presença ostensiva contínua nos territórios de maior vulnerabilidade. A defasagem e o alto custo de manutenção da frota atual comprometem a regularidade das rondas na circunscrição da ${lotacao}.\n\nA aquisição de ${materialsSummary} restabelece a plena capacidade operacional das guarnições nas áreas apontadas pela CEACRIM/SSP, ampliando a prevenção qualificada e a preservação da vida em Sergipe.`;
    }
    if (isMulher) {
      return `O enfrentamento à violência doméstica contra a mulher requer resposta estatal rápida, especializada e humanizada para evitar a escalada das agressões e o feminicídio. A carência de meios dedicados limita o alcance das visitas preventivas.\n\nA implementação de ${materialsSummary} na ${lotacao} fortalece a fiscalização das Medidas Protetivas de Urgência e assegura acolhimento digno às vítimas na região atendida.`;
    }
    if (isSaude) {
      return `O exercício profissional na segurança pública envolve turnos extensos, elevada carga física e exposição contínua a fatores de estresse ocupacional. Sem condições adequadas de prevenção em saúde e descanso salubre, elevam-se os riscos de adoecimento e afastamento do efetivo.\n\nAo investir em ${materialsSummary} para a ${lotacao}, a SSP/SE promove a valorização humana do servidor e assegura maior longevidade e disposição funcional.`;
    }
    return `A ${lotacao} enfrenta limitações estruturais e operacionais que impactam diretamente a qualidade e a continuidade das atividades vinculadas a "${titleRaw || 'esta proposta'}".\n\nA viabilização de ${materialsSummary} soluciona de forma objetiva o déficit diagnosticado, alinhando a gestão aos critérios técnicos da Portaria SSP nº 1998/2025 e garantindo retorno concreto à sociedade sergipana.`;
  }

  if (fieldKey === 'publicoAlvoDireto') {
    if (isHospital) {
      return `Profissionais de saúde, militares e servidores atendidos regularmente nas instalações do ${lotacao}, estimados em mais de 400 atendimentos mensais diretos.`;
    }
    return `Profissionais de segurança pública e colaboradores lotados na ${lotacao} (aproximadamente 120 servidores) que utilizarão diretamente ${materialsSummary} em suas atividades.`;
  }

  if (fieldKey === 'publicoAlvoIndireto') {
    if (isHospital) {
      return `Todo o efetivo da ativa, reserva, pensionistas e dependentes vinculados à Segurança Pública do Estado de Sergipe beneficiados pela ampliação da rede assistencial do ${lotacao}.`;
    }
    return `População residente e flutuante da circunscrição atendida pela ${lotacao} no Estado de Sergipe, beneficiada pela melhoria contínua na prestação do serviço público.`;
  }

  if (fieldKey === 'resultadosEsperados') {
    if (isHospital && isReforma) {
      return `- Ampliação de pelo menos 30% na capacidade de atendimentos ambulatoriais e hospitalares;\n- Adequação plena das instalações às exigências sanitárias, elétricas e de acessibilidade;\n- Redução no tempo médio de espera e maior satisfação dos servidores e dependentes atendidos.`;
    }
    if (isReforma) {
      return `- Eliminação das falhas prediais e melhoria comprovada na salubridade e segurança do ambiente;\n- Redução de gastos emergenciais com reparos corretivos;\n- Elevação da eficiência administrativa e do conforto para servidores e cidadãos.`;
    }
    if (isTiro) {
      return `- 100% do efetivo da unidade avaliado e reciclado em instruções periódicas de tiro policial;\n- Redução de custos com deslocamento de tropas para treinamentos externos;\n- Maior segurança técnica e controle emocional em ocorrências com emprego de arma de fogo.`;
    }
    return `- Execução integral de ${materialsSummary} dentro do cronograma previsto;\n- Melhoria mensurável nos indicadores operacionais ou assistenciais da ${lotacao};\n- Uso eficiente dos recursos públicos em conformidade com a Portaria SSP nº 1998/2025.`;
  }

  if (fieldKey === 'metas') {
    if (isHospital && isReforma) {
      return `1. Concluir 100% das etapas de reforma e adequação predial no prazo previsto em cronograma físico-financeiro;\n2. Entregar as novas alas e sistemas em plena operação em até 30 dias após o recebimento definitivo da obra;\n3. Expandir em 30% o volume mensal de atendimentos no primeiro semestre pós-entrega.`;
    }
    return `1. Concluir 100% da entrega, instalação ou execução de ${materialsSummary} em até 60 dias após a contratação;\n2. Capacitar 100% dos usuários responsáveis no prazo de 15 dias após o recebimento técnico;\n3. Manter disponibilidade operacional superior a 95% ao longo dos primeiros 12 meses.`;
  }

  if (fieldKey === 'sustentabilidade') {
    return `A manutenção preventiva e corretiva pós-implantação será absorvida pelos contratos contínuos e pela dotação orçamentária regular da SSP/SE e PMSE. Os bens permanentes e intervenções possuem garantia contratual vigente e vida útil estimada superior a 10 anos, em conformidade com o Manual de Contabilidade Aplicado ao Setor Público (MCASP).`;
  }

  if (fieldKey === 'mensuracaoResultados') {
    if (isHospital) {
      return `Monitoramento mensal por meio de relatórios estatísticos de atendimentos, prontuários e indicadores assistenciais da Diretoria de Saúde / ${lotacao}, comparando volume e tempo de espera antes e depois da implantação.`;
    }
    if (isReforma) {
      return `Aferição por meio de relatórios de medição de engenharia, termo de recebimento definitivo, vistorias prediais semestrais e avaliação de redução de chamados corretivos de manutenção na ${lotacao}.`;
    }
    if (isTiro) {
      return `Controle por meio de atas de instrução de tiro, listas de frequência do efetivo, índices individuais de aproveitamento técnico e relatórios semestrais da ${lotacao}.`;
    }
    return `Acompanhamento mensal por meio de relatórios operacionais (ROP), indicadores estatísticos da CEACRIM/SSP-SE e termos de entrega e disponibilidade da ${lotacao}.`;
  }

  if (fieldKey === 'pesquisaPrecosObservacoes') {
    return isReforma
      ? `Orçamento referenciado em tabelas oficiais de obras e serviços de engenharia (SINAPI/ORSE-SE), complementado por composições de mercado e no mínimo 03 cotações válidas, em observância à Lei nº 14.133/2021 e ao Art. 5º da Portaria SSP nº 1998/2025.`
      : `Pesquisa de preços fundamentada no Painel de Preços do Governo Federal (Compras.gov.br), atas de Registro de Preços vigentes e no mínimo 03 (três) orçamentos formais não discrepantes entre si, conforme a Lei nº 14.133/2021 e o Art. 5º da Portaria SSP nº 1998/2025.`;
  }

  if (fieldKey === 'implementacao') {
    return isReforma
      ? `1. Formalização contratual e emissão da ordem de serviço (15 dias);\n2. Execução das etapas de reforma e adequação com fiscalização técnica contínua (60 a 90 dias);\n3. Vistoria final, termo de recebimento definitivo e liberação imediata para uso pela ${lotacao} (10 dias).`
      : `1. Recebimento e conferência técnica pela Comissão Designada da SSP/PMSE (15 dias);\n2. Tombamento e incorporação patrimonial junto à Diretoria de Apoio Logístico - DAL/PMSE (10 dias);\n3. Capacitação de nivelamento para os usuários e entrada em operação regular na ${lotacao} (15 dias).`;
  }

  return draft || `Texto técnico estruturado para a ${lotacao} referente a "${titleRaw || materialsSummary}", conforme a Portaria SSP nº 1998/2025.`;
}
