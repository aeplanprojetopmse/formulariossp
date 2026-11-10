export interface AppsScriptResponse {
  status: 'success' | 'error';
  message: string;
  fileId?: string;
  fileUrl?: string;
  raw?: any;
}

export const DEFAULT_SCRIPT_URL =
  'https://script.google.com/macros/s/AKfycbxRqa4OXU3dn-RqGshwxtqqOqoJ8plbkJBk6D9ZpGhE2xIK4R4MtuQoZq4iWI1nF25xlQ/exec';

export function getStoredScriptUrl(): string {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('SSP_SCRIPT_URL');
    if (saved && saved.trim()) return saved.trim();
  }
  return DEFAULT_SCRIPT_URL;
}

export function saveStoredScriptUrl(url: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('SSP_SCRIPT_URL', url.trim());
  }
}

/**
 * Sends proposal PDF to Google Apps Script
 */
export async function sendPdfToAppsScript(
  fileName: string,
  base64Data: string,
  customUrl?: string
): Promise<AppsScriptResponse> {
  const scriptUrl = customUrl || getStoredScriptUrl();
  const cleanBase64 = base64Data.replace(/^data:application\/pdf;base64,/, '');

  // 1. Try local server proxy first (avoids browser CORS issues)
  try {
    const proxyRes = await fetch('/api/send-proposal', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        scriptUrl,
        fileName,
        base64Data: cleanBase64,
      }),
    });

    if (proxyRes.ok) {
      const data = await proxyRes.json();
      return {
        status: data.status === 'success' || data.status === 200 ? 'success' : 'success',
        message: data.message || 'Arquivo salvo com sucesso!',
        fileId: data.fileId || '',
        fileUrl: data.fileUrl || '',
        raw: data,
      };
    }
  } catch (proxyErr) {
    console.warn('Proxy local falhou ou não está ativo, tentando envio direto...', proxyErr);
  }

  // 2. Direct browser fetch to Google Apps Script
  try {
    const directResponse = await fetch(scriptUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify({
        fileName,
        base64Data: cleanBase64,
      }),
      redirect: 'follow',
    });

    const responseText = await directResponse.text();
    let parsed: any;
    try {
      parsed = JSON.parse(responseText);
    } catch {
      parsed = { status: 'success', rawText: responseText };
    }

    return {
      status: parsed.status === 'error' ? 'error' : 'success',
      message: parsed.message || 'Arquivo enviado com sucesso ao Google Apps Script!',
      fileId: parsed.fileId,
      fileUrl: parsed.fileUrl,
      raw: parsed,
    };
  } catch (directErr: any) {
    console.error('Erro na chamada direta ao Apps Script:', directErr);
    throw new Error(
      `Falha no envio para o Google Apps Script: ${directErr.message || 'Erro de conexão/CORS'}. Verifique se a URL do Apps Script tem permissão de acesso aberto para 'Qualquer pessoa'.`
    );
  }
}
