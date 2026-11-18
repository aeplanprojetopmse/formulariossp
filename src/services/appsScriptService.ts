export interface AppsScriptResponse {
  status: 'success' | 'error';
  message: string;
  fileId?: string;
  fileUrl?: string;
  emailSent?: boolean;
  emailRecipient?: string;
  emailMessage?: string;
  raw?: any;
}

export interface SendProposalMetadata {
  recipientEmail?: string;
  projectTitle?: string;
  proposalNumber?: string;
  senderName?: string;
  senderUnit?: string;
}

export interface AppsScriptGeminiResponse {
  supported: boolean;
  text?: string;
  modelUsed?: string;
  modelLabel?: string;
  quotaExhaustedModels?: string[];
  quotaExhausted?: boolean;
  invalidApiKey?: boolean;
  noApiKey?: boolean;
  error?: string;
}

const LEGACY_SCRIPT_URL =
  'https://script.google.com/macros/s/AKfycbxRqa4OXU3dn-RqGshwxtqqOqoJ8plbkJBk6D9ZpGhE2xIK4R4MtuQoZq4iWI1nF25xlQ/exec';

export const DEFAULT_SCRIPT_URL =
  'https://script.google.com/macros/s/AKfycbxpRLMi9mMeSvkMD82pEJDK85uXknDUqV-zF2IoiWgjg5XJYpSCyRT8fCdxfIIORjPWEg/exec';

let appsScriptGeminiUnsupported = false;

export function getStoredScriptUrl(): string {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('SSP_SCRIPT_URL');
    if (saved && saved.trim()) {
      const trimmed = saved.trim();
      if (trimmed === LEGACY_SCRIPT_URL) {
        localStorage.setItem('SSP_SCRIPT_URL', DEFAULT_SCRIPT_URL);
        return DEFAULT_SCRIPT_URL;
      }
      return trimmed;
    }
  }
  return DEFAULT_SCRIPT_URL;
}

export function saveStoredScriptUrl(url: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('SSP_SCRIPT_URL', url.trim());
    appsScriptGeminiUnsupported = false;
  }
}

/**
 * Calls Gemini AI through the Google Apps Script Web App bridge (for static front-end hosting)
 */
export async function callGeminiViaAppsScript(
  prompt: string,
  systemInstruction?: string
): Promise<AppsScriptGeminiResponse> {
  if (appsScriptGeminiUnsupported) {
    return { supported: false };
  }

  const scriptUrl = getStoredScriptUrl();
  if (!scriptUrl) {
    return { supported: false };
  }

  try {
    const response = await fetch(scriptUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify({
        action: 'gemini',
        prompt,
        systemInstruction: systemInstruction || '',
      }),
      redirect: 'follow',
    });

    const textResponse = await response.text();
    let parsed: any = null;
    try {
      parsed = JSON.parse(textResponse);
    } catch {
      return { supported: false, error: 'Resposta inválida do Apps Script.' };
    }

    // Legacy script that only handles PDF uploads returns missing base64Data/fileName
    if (
      parsed?.status === 'error' &&
      typeof parsed?.message === 'string' &&
      (parsed.message.includes('base64Data') || parsed.message.includes('Campos obrigatórios ausentes'))
    ) {
      appsScriptGeminiUnsupported = true;
      return { supported: false };
    }

    if (parsed?.status === 'success' && parsed?.text) {
      return {
        supported: true,
        text: parsed.text,
        modelUsed: parsed.modelUsed || 'gemini-3.1-flash-lite',
        modelLabel: parsed.modelLabel || 'Gemini 3.1 Flash Lite',
        quotaExhaustedModels: Array.isArray(parsed.quotaExhaustedModels)
          ? parsed.quotaExhaustedModels
          : [],
      };
    }

    return {
      supported: true,
      quotaExhausted: Boolean(parsed?.quotaExhausted),
      invalidApiKey: Boolean(parsed?.invalidApiKey),
      noApiKey: Boolean(parsed?.noApiKey),
      quotaExhaustedModels: Array.isArray(parsed?.quotaExhaustedModels)
        ? parsed.quotaExhaustedModels
        : [],
      error: parsed?.message || parsed?.error || 'Falha ao chamar Gemini via Apps Script.',
    };
  } catch (err: any) {
    return {
      supported: false,
      error: err?.message || 'Erro de conexão com Apps Script.',
    };
  }
}

/**
 * Sends proposal PDF to AEPLAN (via Google Apps Script Web App)
 * Optionally sends a PDF copy to the sender's email via Apps Script MailApp
 */
export async function sendPdfToAppsScript(
  fileName: string,
  base64Data: string,
  customUrl?: string,
  metadata?: SendProposalMetadata
): Promise<AppsScriptResponse> {
  const scriptUrl = customUrl || getStoredScriptUrl();
  const cleanBase64 = base64Data.replace(/^data:application\/pdf;base64,/, '');

  const payload = {
    action: 'upload_pdf',
    fileName,
    base64Data: cleanBase64,
    recipientEmail: metadata?.recipientEmail?.trim() || '',
    projectTitle: metadata?.projectTitle || '',
    proposalNumber: metadata?.proposalNumber || '',
    senderName: metadata?.senderName || '',
    senderUnit: metadata?.senderUnit || '',
  };

  const isStaticHost =
    typeof window !== 'undefined' &&
    (window.location.hostname.endsWith('github.io') ||
      window.location.hostname.endsWith('netlify.app') ||
      window.location.hostname.endsWith('vercel.app'));

  // 1. Try local server proxy first when backend is present (avoids browser CORS issues)
  if (!isStaticHost) {
    try {
      const proxyRes = await fetch('/api/send-proposal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          scriptUrl,
          ...payload,
        }),
      });

      if (proxyRes.ok) {
        const data = await proxyRes.json();
        return {
          status: data.status === 'error' ? 'error' : 'success',
          message: data.message || 'Proposta enviada para a AEPLAN com sucesso!',
          fileId: data.fileId || '',
          fileUrl: data.fileUrl || '',
          emailSent: Boolean(data.emailSent),
          emailRecipient: data.emailRecipient || payload.recipientEmail || '',
          emailMessage: data.emailMessage || '',
          raw: data,
        };
      }
    } catch (proxyErr) {
      console.warn('Proxy local falhou ou não está ativo, tentando envio direto...', proxyErr);
    }
  }

  // 2. Direct browser fetch to Google Apps Script
  try {
    const directResponse = await fetch(scriptUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify(payload),
      redirect: 'follow',
    });

    const responseText = await directResponse.text();
    let parsed: any;
    try {
      parsed = JSON.parse(responseText);
    } catch {
      parsed = { status: 'success', rawText: responseText };
    }

    if (parsed.status === 'error') {
      throw new Error(parsed.message || 'Erro retornado pelo servidor da AEPLAN.');
    }

    return {
      status: 'success',
      message: parsed.message || 'Proposta enviada com sucesso para a AEPLAN!',
      fileId: parsed.fileId,
      fileUrl: parsed.fileUrl,
      emailSent: Boolean(parsed.emailSent),
      emailRecipient: parsed.emailRecipient || payload.recipientEmail || '',
      emailMessage: parsed.emailMessage || '',
      raw: parsed,
    };
  } catch (directErr: any) {
    console.error('Erro no envio para a AEPLAN:', directErr);
    throw new Error(
      `Falha no envio para a AEPLAN: ${directErr.message || 'Erro de conexão/CORS'}. Verifique se o endpoint da AEPLAN está acessível.`
    );
  }
}
