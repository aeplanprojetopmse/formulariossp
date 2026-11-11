import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

const DEFAULT_API_KEY =
  process.env.GEMINI_API_KEY ||
  'AQ.Ab8RN6Il0g7MQH8IY05Q8A4M5icq9SPH_ishaNjBlTFAB4PoLw';

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

// Endpoint to generate content or suggestions with Gemini
app.post('/api/gemini/generate', async (req: Request, res: Response) => {
  try {
    const { prompt, systemInstruction, customApiKey } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt é obrigatório.' });
    }

    const ai = getGenAIClient(customApiKey);
    let text = '';
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: systemInstruction ? { systemInstruction } : undefined,
      });
      text = response.text || '';
    } catch (primaryErr: any) {
      console.warn('Tentativa com gemini-3.8-flash encontrou erro, tentando modelo alternativo...', primaryErr?.message);
      const fallbackResponse = await ai.models.generateContent({
        model: 'gemini-3.1-flash-lite',
        contents: prompt,
        config: systemInstruction ? { systemInstruction } : undefined,
      });
      text = fallbackResponse.text || '';
    }

    res.json({ text });
  } catch (err: any) {
    const errMsg = err?.message || '';
    if (
      errMsg.includes('ACCESS_TOKEN_TYPE_UNSUPPORTED') ||
      errMsg.includes('API key not valid') ||
      errMsg.includes('UNAUTHENTICATED')
    ) {
      return res.status(401).json({
        error:
          'Chave de API inválida: A chave informada inicia com "AQ.", que é um token de sessão/OAuth. As chaves gratuitas da API do Gemini no Google AI Studio iniciam com "AIzaSy...". Gere uma chave em https://aistudio.google.com/apikey e cole nas Configurações (ícone ⚙️).',
      });
    }

    console.error('Erro na API Gemini:', err);
    res.status(500).json({
      error: errMsg || 'Erro ao comunicar com a API do Gemini.',
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
