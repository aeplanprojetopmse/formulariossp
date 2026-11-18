import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

const DEFAULT_API_KEY = process.env.GEMINI_API_KEY || '';

const MODEL_CASCADE = [
  { id: 'gemini-3.1-flash-lite', label: 'Gemini 3.1 Flash Lite', useLowThinking: false },
  { id: 'gemini-4-hydrogen', label: 'Gemini 4 Flash', useLowThinking: true },
  { id: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash', useLowThinking: false },
] as const;

const QUOTA_COOLDOWN_MS = 60_000;
const modelCooldownUntil: Record<string, number> = {};

function getGenAIClient(apiKey?: string) {
  const key = apiKey || DEFAULT_API_KEY;
  return new GoogleGenAI({
    apiKey: key,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function isAuthError(errMsg: string): boolean {
  return (
    errMsg.includes('ACCESS_TOKEN_TYPE_UNSUPPORTED') ||
    errMsg.includes('API key not valid') ||
    errMsg.includes('API_KEY_INVALID') ||
    errMsg.includes('PERMISSION_DENIED') ||
    errMsg.includes('UNAUTHENTICATED')
  );
}

function isQuotaError(errMsg: string, status?: number): boolean {
  const lower = errMsg.toLowerCase();
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

function isModelNotFoundError(errMsg: string, status?: number): boolean {
  const lower = errMsg.toLowerCase();
  return status === 404 || lower.includes('not_found') || lower.includes('404');
}

// Endpoint to generate content or suggestions with Gemini using free model cascade
app.post('/api/gemini/generate', async (req: Request, res: Response) => {
  try {
    const { prompt, systemInstruction, customApiKey } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt é obrigatório.' });
    }

    const effectiveKey = (customApiKey || DEFAULT_API_KEY || '').trim();
    if (!effectiveKey) {
      return res.status(401).json({
        error: 'Nenhuma chave de API configurada no servidor.',
        noApiKey: true,
      });
    }

    const ai = getGenAIClient(effectiveKey);
    const quotaExhaustedModels: string[] = [];
    const now = Date.now();

    for (const modelEntry of MODEL_CASCADE) {
      const cooldownExpires = modelCooldownUntil[modelEntry.id] || 0;
      if (cooldownExpires > now) {
        quotaExhaustedModels.push(modelEntry.label);
        continue;
      }

      try {
        const config: Record<string, any> = {};
        if (systemInstruction) {
          config.systemInstruction = systemInstruction;
        }
        if (modelEntry.useLowThinking) {
          config.thinkingConfig = { thinkingLevel: ThinkingLevel.LOW };
        }

        const response = await ai.models.generateContent({
          model: modelEntry.id,
          contents: prompt,
          config: Object.keys(config).length > 0 ? config : undefined,
        });

        const text = response.text || '';
        if (text.trim()) {
          return res.json({
            text,
            modelUsed: modelEntry.id,
            modelLabel: modelEntry.label,
            quotaExhaustedModels,
          });
        }
      } catch (err: any) {
        const errMsg = err?.message || String(err);
        const status = err?.status || err?.statusCode;

        if (isAuthError(errMsg)) {
          console.warn(`Erro de autenticação na API Gemini (${modelEntry.id}):`, errMsg);
          return res.status(401).json({
            error:
              'Chave de API inválida. Configure uma chave do Google AI Studio iniciada com "AIzaSy..." em Settings > Secrets ou nas Configurações.',
            invalidApiKey: true,
            authReason: errMsg.slice(0, 160),
          });
        }

        if (isQuotaError(errMsg, status)) {
          console.warn(`Cota esgotada ou indisponibilidade temporária em ${modelEntry.id}:`, errMsg);
          modelCooldownUntil[modelEntry.id] = Date.now() + QUOTA_COOLDOWN_MS;
          quotaExhaustedModels.push(modelEntry.label);
          continue;
        }

        if (isModelNotFoundError(errMsg, status)) {
          console.warn(`Modelo ${modelEntry.id} não encontrado neste endpoint:`, errMsg);
          continue;
        }

        console.warn(`Erro inesperado no modelo ${modelEntry.id}:`, errMsg);
      }
    }

    return res.status(429).json({
      error: 'Cota gratuita esgotada em todos os modelos disponíveis.',
      quotaExhausted: true,
      quotaExhaustedModels,
    });
  } catch (err: any) {
    console.error('Erro na API Gemini:', err);
    res.status(500).json({
      error: err?.message || 'Erro ao comunicar com a API do Gemini.',
    });
  }
});

// Endpoint to forward/proxy the PDF to Google Apps Script (handles CORS reliably)
app.post('/api/send-proposal', async (req: Request, res: Response) => {
  try {
    const { scriptUrl, fileName, base64Data } = req.body;
    const targetUrl =
      scriptUrl ||
      'https://script.google.com/macros/s/AKfycbxRqa4OXU3dn-RqGshwxtqqOqoJ8plbkJBk6D9ZpGhE2xIK4R4MtuQoZq4iWI1nF25xlQ/exec';

    if (!fileName || !base64Data) {
      return res.status(400).json({ error: 'fileName e base64Data são obrigatórios.' });
    }

    const cleanedBase64 = base64Data.replace(/^data:application\/pdf;base64,/, '');

    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify({
        fileName,
        base64Data: cleanedBase64,
      }),
      redirect: 'follow',
    });

    const text = await response.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = { status: 'success', rawResponse: text };
    }

    res.json(data);
  } catch (err: any) {
    console.error('Erro no envio do Apps Script:', err);
    res.status(500).json({
      error: err.message || 'Falha ao enviar documento para o Google Apps Script.',
    });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(port, () => {
    console.log(`Servidor FPP SSP/SE rodando na porta ${port}`);
  });
}

startServer();
