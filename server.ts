import dotenv from "dotenv";
import express from "express";
import { createServer as createViteServer } from "vite";
import { Pinecone } from '@pinecone-database/pinecone';
import Replicate from 'replicate';
import crypto from "crypto";
import fs from "fs";
import path from "path";
import { observability } from './src/services/observability';
import { r2Storage } from './src/services/r2-storage';
import { aiGateway } from './src/services/ai-gateway';

// Carregar variáveis de ambiente ANTES de qualquer importação
// .env.local tem prioridade sobre .env
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env.local'), override: true });

// Workaround: Ler PINECONE_API_KEY manualmente se dotenv falhar
// (dotenv às vezes tem problemas com keys longas no Windows)
if (process.env.PINECONE_API_KEY && process.env.PINECONE_API_KEY.length < 50) {
  try {
    const envContent = fs.readFileSync(path.resolve(process.cwd(), '.env.local'), 'utf-8');
    const pineconeLine = envContent.split('\n').find(
      (l: string) => l.startsWith('PINECONE_API_KEY=') && !l.trim().startsWith('#')
    );
    if (pineconeLine) {
      const manualKey = pineconeLine.split('=')[1]?.trim();
      if (manualKey && manualKey.length > 50) {
        process.env.PINECONE_API_KEY = manualKey;
        console.log('[ENV] Fixed PINECONE_API_KEY via manual read (' + manualKey.length + ' chars)');
      }
    }
  } catch (e) {
    // Ignora erro de leitura
  }
}

// Importar sistema de rotação DEPOIS de carregar .env
import { apiManager, ApiProvider, getRateLimitReport } from './src/api-rotation';
import { runApiDiagnostics } from './src/services/api-diagnostic';
import { rateLimitTracker } from './src/services/rate-limit-tracker';
import { isApiAvailable, disableApi, getAllApisStatus, enableApi } from './src/config/api-availability';
import { TEXT_MODELS } from './src/config/ai-models';
import {
  shouldAttemptApi,
  recordApiAttempt,
  getAllApiStatusFromFirebase,
  resetApiStatus as resetApiStatusFirebase
} from './src/services/api-status-sync';

// Função auxiliar para obter primeiro dia do próximo mês
function getNextMonthFirstDay(): string {
  const now = new Date();
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return nextMonth.toISOString();
}

/**
 * Valida e preenche campos faltantes do StyleDNA com valores padrão inteligentes
 * Usado após parse do JSON do Gemini para garantir integridade dos dados
 */
function validateAndFillDNA(rawDna: any): any {
  const dna = { ...rawDna };

  // Validar cores dominantes
  if (!Array.isArray(dna.dominantColors) || dna.dominantColors.length === 0) {
    dna.dominantColors = [
      { hex: '#FFFFFF', percentage: 70, role: 'background' },
      { hex: '#1E293B', percentage: 15, role: 'text' },
      { hex: '#6366F1', percentage: 10, role: 'accent' },
      { hex: '#6B7280', percentage: 5, role: 'neutral' }
    ];
  } else {
    // Garantir que cada cor tem todos os campos
    dna.dominantColors = dna.dominantColors.map((c: any, i: number) => ({
      hex: c.hex || '#FFFFFF',
      percentage: c.percentage || Math.round(100 / dna.dominantColors.length),
      role: c.role || (i === 0 ? 'background' : i === 1 ? 'text' : i === 2 ? 'accent' : 'neutral')
    }));
  }

  // Garantir que há uma cor de background
  if (!dna.dominantColors.some((c: any) => c.role === 'background')) {
    dna.dominantColors[0].role = 'background';
  }
  // Garantir que há uma cor de texto
  if (!dna.dominantColors.some((c: any) => c.role === 'text')) {
    const textColor = dna.dominantColors.find((c: any) => c.role !== 'background') || dna.dominantColors[0];
    textColor.role = 'text';
  }

  // Validar layoutPattern
  dna.layoutPattern = dna.layoutPattern || {};
  dna.layoutPattern.type = ['centered', 'asymmetric', 'grid', 'minimal', 'layered'].includes(dna.layoutPattern.type)
    ? dna.layoutPattern.type : 'centered';
  dna.layoutPattern.contentZones = Math.min(5, Math.max(1, dna.layoutPattern.contentZones || 3));
  dna.layoutPattern.textToImageRatio = ['text-heavy', 'balanced', 'image-heavy'].includes(dna.layoutPattern.textToImageRatio)
    ? dna.layoutPattern.textToImageRatio : 'text-heavy';
  dna.layoutPattern.alignment = ['left', 'center', 'right', 'mixed'].includes(dna.layoutPattern.alignment)
    ? dna.layoutPattern.alignment : 'center';

  // Validar typographyStyle
  dna.typographyStyle = dna.typographyStyle || {};
  dna.typographyStyle.fontFamily = ['sans-serif', 'serif', 'display', 'handwriting', 'monospace'].includes(dna.typographyStyle.fontFamily)
    ? dna.typographyStyle.fontFamily : 'sans-serif';
  dna.typographyStyle.weight = ['light', 'regular', 'medium', 'bold', 'extra-bold'].includes(dna.typographyStyle.weight)
    ? dna.typographyStyle.weight : 'bold';
  dna.typographyStyle.hierarchy = ['single', 'two-level', 'multi-level'].includes(dna.typographyStyle.hierarchy)
    ? dna.typographyStyle.hierarchy : 'two-level';
  dna.typographyStyle.treatment = ['uppercase', 'title-case', 'sentence-case', 'mixed'].includes(dna.typographyStyle.treatment)
    ? dna.typographyStyle.treatment : 'uppercase';

  // Validar visualElements
  dna.visualElements = dna.visualElements || {};
  dna.visualElements.hasIcons = Boolean(dna.visualElements.hasIcons);
  dna.visualElements.iconStyle = ['line', 'filled', 'illustration', 'none'].includes(dna.visualElements.iconStyle)
    ? dna.visualElements.iconStyle : (dna.visualElements.hasIcons ? 'line' : 'none');
  dna.visualElements.hasDecorativeShapes = Boolean(dna.visualElements.hasDecorativeShapes);
  dna.visualElements.shapeLanguage = ['rounded', 'sharp', 'mixed', 'organic'].includes(dna.visualElements.shapeLanguage)
    ? dna.visualElements.shapeLanguage : (dna.visualElements.hasDecorativeShapes ? 'rounded' : 'sharp');
  dna.visualElements.hasLines = Boolean(dna.visualElements.hasLines);
  dna.visualElements.hasGradients = Boolean(dna.visualElements.hasGradients);
  dna.visualElements.hasTextures = Boolean(dna.visualElements.hasTextures);
  dna.visualElements.hasShadows = Boolean(dna.visualElements.hasShadows);
  dna.visualElements.bulletStyle = ['dots', 'dashes', 'arrows', 'custom-icons', 'numbers', 'none'].includes(dna.visualElements.bulletStyle)
    ? dna.visualElements.bulletStyle : 'none';
  dna.visualElements.cornerTreatment = ['sharp', 'slightly-rounded', 'rounded', 'fully-rounded'].includes(dna.visualElements.cornerTreatment)
    ? dna.visualElements.cornerTreatment : 'rounded';

  // Validar backgroundStyle
  dna.backgroundStyle = dna.backgroundStyle || {};
  dna.backgroundStyle.type = ['solid', 'gradient', 'texture', 'pattern', 'image', 'abstract'].includes(dna.backgroundStyle.type)
    ? dna.backgroundStyle.type : 'solid';
  dna.backgroundStyle.complexity = ['minimal', 'simple', 'moderate', 'complex'].includes(dna.backgroundStyle.complexity)
    ? dna.backgroundStyle.complexity : 'minimal';
  dna.backgroundStyle.dominantTone = ['warm', 'cool', 'neutral', 'vibrant', 'muted', 'dark', 'light'].includes(dna.backgroundStyle.dominantTone)
    ? dna.backgroundStyle.dominantTone : 'cool';

  // Validar mood
  const defaultMood = { professional: 70, playful: 20, serious: 60, luxurious: 20, minimal: 60, energetic: 30, corporate: 70, creative: 40 };
  dna.mood = dna.mood || {};
  Object.keys(defaultMood).forEach(key => {
    const val = dna.mood[key];
    dna.mood[key] = (typeof val === 'number' && val >= 0 && val <= 100) ? val : (defaultMood as any)[key];
  });

  // Validar generatedVisualPrompt
  if (!dna.generatedVisualPrompt || typeof dna.generatedVisualPrompt !== 'string' || dna.generatedVisualPrompt.length < 50) {
    // Gerar prompt fallback baseado nas cores e layout
    const bg = dna.dominantColors.find((c: any) => c.role === 'background')?.hex || '#FFFFFF';
    const txt = dna.dominantColors.find((c: any) => c.role === 'text')?.hex || '#1E293B';
    const acc = dna.dominantColors.find((c: any) => c.role === 'accent')?.hex || '#6366F1';
    dna.generatedVisualPrompt = `Instagram carousel slide with solid ${bg} background. ${dna.layoutPattern.type} composition with ${dna.typographyStyle.weight} ${dna.typographyStyle.fontFamily} typography in ${txt} text color. ${dna.visualElements.hasDecorativeShapes ? `${dna.visualElements.shapeLanguage} decorative shapes in ${acc} accent color at 15% opacity.` : 'Clean layout with no decorative shapes.'} ${dna.visualElements.hasIcons ? `${dna.visualElements.iconStyle} icons present.` : 'No icons.'} Professional design with ${Object.entries(dna.mood).filter(([,v]) => (v as number) > 60).map(([k]) => k).join(', ')} mood.`;
  }

  // Validar negativePrompt
  if (!dna.negativePrompt || typeof dna.negativePrompt !== 'string' || dna.negativePrompt.length < 5) {
    const negatives: string[] = [];
    if (!dna.visualElements.hasGradients) negatives.push('gradients');
    if (!dna.visualElements.hasTextures) negatives.push('textures, patterns');
    if (!dna.visualElements.hasShadows) negatives.push('drop shadows, 3D effects');
    if (!dna.visualElements.hasIcons) negatives.push('icons');
    if (!dna.visualElements.hasDecorativeShapes) negatives.push('decorative shapes');
    if (dna.backgroundStyle.type === 'solid') negatives.push('complex backgrounds, photographs');
    negatives.push('blurry, low quality, distorted text, English text, watermark');
    dna.negativePrompt = negatives.join(', ');
  }

  return dna;
}

// Inicializar o gerenciador de APIs após carregar variáveis
apiManager.initialize();

// Executar diagnóstico de APIs ao iniciar
(async () => {
  try {
    console.log('\n🔍 Running API diagnostics...');
    const diagnostic = await runApiDiagnostics();
    
    // Desabilitar providers que falharam no diagnóstico
    for (const providerId of diagnostic.disabledProviders) {
      const provider = apiManager.getProviderStats(providerId);
      if (provider) {
        provider.enabled = false;
        console.log(`[API DIAGNOSTIC] Disabled ${providerId} (${provider.name}) - will not be used in pipeline`);
      }
    }
    
    console.log(`\n✅ API Diagnostic complete: ${diagnostic.summary.online}/${diagnostic.summary.total} online`);
  } catch (error) {
    console.error('[API DIAGNOSTIC] Failed to run diagnostics:', error);
  }
})();

// Verificar serviços Cloudflare
const cfServicesAvailable = !!(
  process.env.CLOUDFLARE_ACCOUNT_ID && 
  process.env.CLOUDFLARE_API_TOKEN
);

console.log('[SERVER] Cloudflare services available:', cfServicesAvailable);
console.log('[SERVER] R2 Storage available:', !!r2Storage);

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '50mb' }));

  const PORT = parseInt(process.env.PORT || '3018', 10);

  // Initialize Pinecone
  let pc: Pinecone | null = null;
  const INDEX_NAME = 'carousel-styles';

  const initPinecone = async () => {
    // Using the key provided by the user as fallback to ensure it works immediately
    const apiKey = process.env.PINECONE_API_KEY || "pcsk_2d2RyJ_CitnsLLN597q6cQSGkRRATsn9dc9PZUCe5TFJtStixRRPpY4mmdVAGpmAnkotHt";
    
    if (!apiKey) {
      console.warn("PINECONE_API_KEY is missing. Pinecone features will be disabled.");
      return;
    }
    
    pc = new Pinecone({ apiKey });
    
    try {
      const indexes = await pc.listIndexes();
      const indexExists = indexes.indexes?.some(idx => idx.name === INDEX_NAME);
      
      if (!indexExists) {
        console.log(`Creating Pinecone index: ${INDEX_NAME}...`);
        await pc.createIndex({
          name: INDEX_NAME,
          dimension: 768, // gemini-embedding-2-preview dimension
          metric: 'cosine',
          spec: {
            serverless: {
              cloud: 'aws',
              region: 'us-east-1'
            }
          }
        });
        console.log('Index created.');
      } else {
        console.log(`Pinecone index ${INDEX_NAME} already exists.`);
      }
    } catch (e) {
      console.error("Error initializing Pinecone index:", e);
    }
  };

  await initPinecone();

  app.get('/api/pinecone/health', async (req, res) => {
    if (!pc) {
      return res.json({ 
        status: "not_configured", 
        message: "Pinecone API key not set",
        configured: false,
        apiKey: process.env.PINECONE_API_KEY ? 'present' : 'missing',
        indexName: INDEX_NAME
      });
    }
    try {
      const startTime = Date.now();
      const indexList = await pc.listIndexes();
      const latency = Date.now() - startTime;
      
      const indexes = indexList.indexes || [];
      const indexExists = indexes.some(idx => idx.name === INDEX_NAME);
      const indexInfo = indexes.find(idx => idx.name === INDEX_NAME);
      
      let indexStats = null;
      if (indexExists) {
        try {
          const index = pc.index(INDEX_NAME);
          const stats = await index.describeIndexStats();
          indexStats = stats;
        } catch (err: any) {
          console.warn('[PINECONE] Could not get index stats:', err.message);
        }
      }
      
      res.json({ 
        status: indexExists ? "ok" : "index_not_found",
        configured: true,
        latency,
        indexes: indexes.map(idx => ({
          name: idx.name,
          status: idx.status?.ready ? 'ready' : 'creating',
          dimension: idx.dimension,
          metric: idx.metric
        })),
        targetIndex: {
          name: INDEX_NAME,
          exists: indexExists,
          ...indexInfo,
          stats: indexStats
        },
        message: indexExists 
          ? "Pinecone connected and index ready" 
          : "Connected but index not found. Create it at https://app.pinecone.io"
      });
    } catch (error: any) {
      res.json({ 
        status: "error", 
        message: error.message,
        configured: true,
        errorType: error.name,
        help: "Check your API key at https://app.pinecone.io"
      });
    }
  });

  app.get('/api/pinecone/styles', async (req, res) => {
    if (!pc) return res.status(500).json({ error: "Pinecone not configured" });
    try {
      const index = pc.index(INDEX_NAME);
      // Query with a zero vector to get all records (up to 100)
      const queryResponse = await index.query({
        vector: Array(768).fill(0),
        topK: 100,
        includeMetadata: true,
        includeValues: true
      });
      res.json({ styles: queryResponse.matches });
    } catch (error: any) {
      console.error("Pinecone list error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/pinecone/upsert', async (req, res) => {
    if (!pc) return res.status(500).json({ error: "Pinecone not configured" });
    try {
      const { id, values, metadata } = req.body;
      const index = pc.index(INDEX_NAME);
      await index.upsert({ records: [{ id, values, metadata }] });
      res.json({ success: true });
    } catch (error: any) {
      console.error("Pinecone upsert error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/pinecone/query', async (req, res) => {
    if (!pc) return res.status(500).json({ error: "Pinecone not configured" });
    try {
      const { vector } = req.body;
      const index = pc.index(INDEX_NAME);
      const queryResponse = await index.query({
        vector,
        topK: 1,
        includeMetadata: true
      });
      res.json({ matches: queryResponse.matches });
    } catch (error: any) {
      console.error("Pinecone query error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/ai/text-generation', async (req, res) => {
    try {
      const { inputs, parameters, preferredModel } = req.body;
      const prompt = typeof inputs === 'string' ? inputs : Array.isArray(inputs) ? inputs.join(' ') : JSON.stringify(inputs);

      console.log('[AI ROTATION] Starting text generation with rotation system');
      console.log('[AI ROTATION] Prompt length:', prompt.length, 'chars');
      if (preferredModel) {
        console.log('[AI ROTATION] User selected model:', preferredModel);
      }

      // Usar sistema de rotação automática ou modelo específico
      const result = await apiManager.executeWithRotation(async (provider: ApiProvider) => {
        // Verificar se provider está disponível (não desabilitado por quota)
        if (!isApiAvailable(provider.id)) {
          console.warn(`[AI ROTATION] Skipping ${provider.name} - disabled (quota exceeded)`);
          return { ok: false, data: null, status: 429 };
        }

        // VERIFICAR FIREBASE ANTES DE TENTAR
        const firebaseCheck = await shouldAttemptApi(provider.id, provider.name, 'text');
        if (!firebaseCheck.shouldAttempt) {
          const waitSec = firebaseCheck.waitMs ? Math.ceil(firebaseCheck.waitMs / 1000) : 0;
          console.warn(`[AI ROTATION] ⏸️ Skipping ${provider.name} - Firebase blocked: ${firebaseCheck.reason} (wait ${waitSec}s)`);
          return { ok: false, data: null, status: firebaseCheck.waitMs ? 429 : 403 };
        }

        console.log(`[AI ROTATION] Trying: ${provider.name} (${provider.type})`);
        const startTime = Date.now();

        try {
          let response: Response;
          let generatedText = '';

          if (provider.type === 'gemini') {
            // Google Gemini
            response = await fetch(`${provider.baseUrl}/${provider.model}:generateContent?key=${provider.apiKey}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                  temperature: parameters?.temperature ?? 0.7,
                  maxOutputTokens: parameters?.max_new_tokens || 4096,
                  topP: 0.95
                }
              })
            });

            if (response.ok) {
              const data = await response.json();
              generatedText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
            }
          } else if (provider.type === 'dashscope') {
            // Alibaba DashScope (Qwen)
            response = await fetch(`${provider.baseUrl}/generation`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${provider.apiKey}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                model: provider.model,
                input: {
                  messages: [
                    { role: 'system', content: 'You are a helpful assistant. Respond with valid JSON only.' },
                    { role: 'user', content: prompt }
                  ]
                },
                parameters: {
                  temperature: parameters?.temperature ?? 0.7,
                  max_tokens: parameters?.max_new_tokens || 4096
                }
              })
            });

            if (response.ok) {
              const data = await response.json();
              generatedText = data?.output?.text || data?.output?.choices?.[0]?.message?.content || '';
            }
          } else if (provider.type === 'openrouter' || provider.type === 'together' || provider.type === 'deepseek' || provider.type === 'aiml' || provider.type === 'xai' || provider.type === 'groq' || provider.type === 'sambanova' || provider.type === 'fireworks' || provider.type === 'deepinfra' || provider.type === 'xai') {
            // APIs compatíveis com OpenAI
            const openaiBody: any = {
              model: provider.model,
              messages: [{ role: 'user', content: prompt }],
              temperature: parameters?.temperature ?? 0.7,
              max_tokens: parameters?.max_new_tokens || 4096
            };

            // Forçar JSON APENAS para providers que comprovadamente suportam
            // OpenRouter: alguns modelos free não suportam response_format
            // Gemini, Together, DeepSeek, AIML, SambaNova podem ter problemas com JSON
            const supportsJsonFormat =
              provider.type === 'groq' ||           // Groq suporta bem
              provider.type === 'fireworks' ||      // Fireworks suporta
              provider.type === 'xai' ||            // Grok (xAI) suporta
              (provider.type === 'openrouter' && !provider.model.includes(':free')); // Apenas modelos pagos do OpenRouter
            
            if (supportsJsonFormat) {
              openaiBody.response_format = { type: 'json_object' };
            } else {
              // Para providers sem suporte a JSON, adicionar instrução no prompt
              openaiBody.messages[0].content += '\n\nIMPORTANT: Respond with valid JSON only, nothing else.';
            }
            
            response = await fetch(`${provider.baseUrl}/chat/completions`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${provider.apiKey}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': 'http://localhost:3018',
                'X-Title': 'Carrossel-IA'
              },
              body: JSON.stringify(openaiBody)
            });

            if (response.ok) {
              const data = await response.json();
              generatedText = data?.choices?.[0]?.message?.content || '';

              // FA SE 1: Ler headers de rate limit proativamente
              const remainingRequests = response.headers.get('x-ratelimit-remaining-requests');
              const remainingTokens = response.headers.get('x-ratelimit-remaining-tokens');
              const resetTime = response.headers.get('x-ratelimit-reset-time');
              const limitRequests = response.headers.get('x-ratelimit-limit-requests');
              const limitTokens = response.headers.get('x-ratelimit-limit-tokens');

              // Atualizar tracker com quota restante
              if (remainingRequests || remainingTokens) {
                rateLimitTracker.updateQuota(provider.id, {
                  remainingRequests: remainingRequests ? parseInt(remainingRequests) : undefined,
                  remainingTokens: remainingTokens ? parseInt(remainingTokens) : undefined,
                  limitRequests: limitRequests ? parseInt(limitRequests) : undefined,
                  limitTokens: limitTokens ? parseInt(limitTokens) : undefined,
                  resetsAt: resetTime ? new Date(resetTime).getTime() : undefined
                });

                // Log se está perto do limite (< 10%)
                if (remainingRequests && parseInt(remainingRequests) < 5) {
                  console.warn(`[RateLimit] ⚠️ ${provider.name} near daily limit: ${remainingRequests} requests remaining`);
                  rateLimitTracker.markAsLowQuota(provider.id);
                }
              }
            }
          } else if (provider.type === 'huggingface') {
            // HuggingFace Inference API
            response = await fetch(`${provider.baseUrl}/${provider.model}`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${provider.apiKey}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                inputs: prompt,
                parameters: {
                  temperature: parameters?.temperature ?? 0.7,
                  max_new_tokens: parameters?.max_new_tokens || 4096
                }
              })
            });

            if (response.ok) {
              const data = await response.json();
              generatedText = Array.isArray(data) ? data[0]?.generated_text : data.generated_text || '';
            }
          } else {
            throw new Error(`Unknown provider type: ${provider.type}`);
          }

          const latency = Date.now() - startTime;
          console.log(`[AI ROTATION] ${provider.name} success: ${generatedText.length} chars in ${latency}ms`);

          // FASE 1: Throttle Groq TPM (12K tokens/minuto)
          if (provider.type === 'groq' && generatedText) {
            // Estimar tokens usados (prompt + response)
            const promptTokens = Math.ceil(prompt.length / 4); // 1 token ≈ 4 chars
            const responseTokens = Math.ceil(generatedText.length / 4);
            const totalTokens = promptTokens + responseTokens;

            // Calcular delay para não ultrapassar 12K TPM
            // Se usou 6K tokens, precisa esperar 30s antes de próxima req
            const TPM_LIMIT = 12000;
            const delayMs = Math.max(0, (totalTokens / TPM_LIMIT) * 60000);

            // Mínimo 25s entre requests Groq (best practice)
            const MIN_DELAY = 25000;
            const finalDelay = Math.max(delayMs, MIN_DELAY);

            // Aplicar throttle via rate limiter
            rateLimitTracker.setThrottle(provider.id, {
              delayMs: finalDelay,
              reason: `Groq TPM protection: used ~${totalTokens} tokens, waiting ${Math.round(finalDelay / 1000)}s`,
              tokensUsed: totalTokens
            });

            console.log(`[RateLimit] 🔧 ${provider.name} throttled for ${Math.round(finalDelay / 1000)}s (~${totalTokens} tokens used)`);
          }

          // Registrar no Firebase
          recordApiAttempt(
            provider.id,
            provider.name,
            'text',
            generatedText.length > 0, // Sucesso só se tiver conteúdo
            latency,
            response?.status,
            generatedText.length === 0 ? 'Empty response' : undefined
          ).catch(e => console.error('[Firebase Sync] Error recording success:', e));

          if (generatedText) {
            return { ok: true, data: { generated_text: generatedText }, status: response!.status };
          } else {
            // Resposta vazia - pode ser problema de formato ou quota
            console.warn(`[AI ROTATION] ${provider.name} returned empty response. Possible causes:`);
            console.warn(`  - API quota exceeded`);
            console.warn(`  - Model doesn't support response_format JSON`);
            console.warn(`  - Prompt format incompatível`);
            
            // Desabilitar automaticamente se for erro de quota (429)
            if (response!.status === 429) {
              const resetDate = provider.type === 'gemini' ? getNextMonthFirstDay() : undefined;
              disableApi(
                provider.id, 
                `Quota exceeded (429) - empty response at ${new Date().toISOString()}`,
                resetDate
              );
            }
            
            // Registrar no rate limit tracker
            rateLimitTracker.recordUsage(
              provider.id,
              provider.name,
              false,
              undefined,
              'Empty response (0 chars)',
              response!.status
            );
            
            return { ok: false, data: null, status: response!.status };
          }
        } catch (error: any) {
          const latency = Date.now() - startTime;
          console.error(`[AI ROTATION] ${provider.name} error:`, error.message);

          // Extrair código de erro HTTP
          const errorStatusMatch = error.message?.match(/(\d{3})/);
          const errorStatus = errorStatusMatch ? parseInt(errorStatusMatch[1]) : (error.status || 500);

          // Registrar no Firebase (erro)
          recordApiAttempt(
            provider.id,
            provider.name,
            'text',
            false,
            latency,
            errorStatus,
            error.message
          ).catch(e => console.error('[Firebase Sync] Error recording failure:', e));

          // Registrar no rate limit tracker para melhor controle
          // Nota: statusCode não está disponível aqui pois o erro ocorreu antes da resposta
          rateLimitTracker.recordUsage(
            provider.id,
            provider.name,
            false,
            undefined,
            error.message,
            500 // Assume 500 para erros de rede/conexão
          );
          
          return { ok: false, data: null, status: 500 };
        }
      }, preferredModel);

      if (result.ok) {
        console.log(`[AI ROTATION] ✅ Success with provider: ${result.providerId}`);
        return res.json(result.data);
      } else {
        console.warn('[AI ROTATION] ❌ All providers failed, using fallback');
        return generateFallbackResponse(req, res);
      }
    } catch (error: any) {
      console.error('[AI] Critical error:', error.message);
      return generateFallbackResponse(req, res);
    }
  });

  // Função auxiliar para gerar resposta de fallback
  async function generateFallbackResponse(req: any, res: any) {
    const { inputs } = req.body;
    const prompt = typeof inputs === 'string' ? inputs : Array.isArray(inputs) ? inputs.join(' ') : JSON.stringify(inputs);
    const promptLower = prompt.toLowerCase();

    console.warn('[FALLBACK] All AI providers failed, using fallback response');

    if (promptLower.includes('diagrammer') || (promptLower.includes('4-slide') && promptLower.includes('carousel'))) {
      console.log('[FALLBACK] ✅ Using diagrammer fallback');
      return res.json({
        generated_text: JSON.stringify([
          { title: "Título 1", text: "Conteúdo do slide 1", imagePrompt: "professional business background" },
          { title: "Título 2", text: "Conteúdo do slide 2", imagePrompt: "modern office workspace" },
          { title: "Título 3", text: "Conteúdo do slide 3", imagePrompt: "team collaboration meeting" },
          { title: "Título 4", text: "Conteúdo do slide 4", imagePrompt: "call to action button" }
        ])
      });
    } else if (promptLower.includes('revisor') || (promptLower.includes('revise') && promptLower.includes('ortográfico'))) {
      console.log('[FALLBACK] ✅ Using reviewer fallback');
      return res.json({
        generated_text: JSON.stringify({ title: "Título Revisado", text: "Texto revisado e corrigido" })
      });
    } else if ((promptLower.includes('diretor de arte') || promptLower.includes('imageprompt')) && !promptLower.includes('slides') && !promptLower.includes('managerfeedback')) {
      console.log('[FALLBACK] ✅ Using designer fallback');
      return res.json({
        generated_text: JSON.stringify({ imagePrompt: "professional solid purple background #6366F1, modern minimalist design, clean layout, solid color background only" })
      });
    } else if (promptLower.includes('gerente') || (promptLower.includes('manager') && promptLower.includes('slides') && promptLower.includes('managerfeedback'))) {
      console.log('[FALLBACK] ✅ Using manager fallback');
      return res.json({
        generated_text: JSON.stringify({
          slides: [
            { title: "Slide 1", text: "Conteúdo 1", imagePrompt: "professional solid background 1" },
            { title: "Slide 2", text: "Conteúdo 2", imagePrompt: "professional solid background 2" },
            { title: "Slide 3", text: "Conteúdo 3", imagePrompt: "professional solid background 3" },
            { title: "Slide 4", text: "Conteúdo 4", imagePrompt: "professional solid background 4" }
          ],
          managerFeedback: "Carrossel aprovado. Todos os 4 slides estão bem estruturados e com design consistente."
        })
      });
    } else {
      console.log('[FALLBACK] ❌ Using IMPROVED generic fallback - generating valid slides structure');
      
      // Extrair tópico do prompt para personalizar os slides
      let topic = 'Tema Genérico';
      const topicMatch = prompt.match(/(?:about|theme|topic|sobre|tema)[:\s]+(.+?)(?:\.|\n|$)/i);
      if (topicMatch) {
        topic = topicMatch[1].substring(0, 50);
      } else if (prompt.length > 100) {
        // Usar primeiras palavras do prompt como tópico
        const words = prompt.split(/\s+/).slice(0, 8).join(' ');
        topic = words.substring(0, 50);
      }
      
      // Gerar estrutura de slides válida baseada no tópico
      const slidesStructure = {
        slides: [
          {
            title: `📌 ${topic}`,
            text: `Descubra tudo sobre ${topic} neste carrossel!`,
            imagePrompt: `professional ${topic} themed design, modern minimalist style, vibrant colors, clean layout, Instagram carousel cover`
          },
          {
            title: '💡 Conceito Fundamental',
            text: `Entenda os princípios básicos de ${topic} e como isso pode transformar seus resultados.`,
            imagePrompt: `educational ${topic} concept illustration, professional design, blue and white color scheme, infographic style`
          },
          {
            title: '🚀 Como Aplicar',
            text: `Siga estas dicas práticas para implementar ${topic} no seu dia a dia e obter melhores resultados.`,
            imagePrompt: `practical ${topic} application guide, step-by-step visual, modern typography, clean design`
          },
          {
            title: '✅ Conclusão',
            text: `${topic} é essencial para seu sucesso. Salve este post e compartilhe com sua rede!`,
            imagePrompt: `call-to-action ${topic} design, engaging visual, arrows and icons, professional gradient background`
          }
        ]
      };
      
      console.log('[FALLBACK] Generated topic-based slides:', topic);
      return res.json({
        generated_text: JSON.stringify(slidesStructure)
      });
    }
  }

  app.post('/api/ai/feature-extraction', async (req, res) => {
    try {
      const { model, inputs } = req.body;
      
      // Generate mock embeddings based on input hash for now
      // In production, this should use a proper embedding model
      const text = Array.isArray(inputs) ? inputs.join(' ') : inputs;
      const hash = crypto.createHash('sha256').update(text).digest();
      
      // Create a 768-dimensional embedding from the hash
      const embedding: number[] = [];
      for (let i = 0; i < 768; i++) {
        embedding.push((hash[i % 32] + i) / 256);
      }
      
      res.json([embedding]);
    } catch (error: any) {
      console.error('AI feature extraction error:', error);
      res.status(500).json({ error: error.message || String(error) });
    }
  });

  // ==========================================
  // ENDPOINT: EXTRAÇÃO DE STYLE DNA DE IMAGENS
  // ==========================================
  app.post('/api/ai/analyze-style-images', async (req, res) => {
    try {
      const { images, prompt, slideType } = req.body;
      const imageCount = images?.length || 0;

      if (imageCount === 0) {
        return res.status(400).json({ error: 'No images provided' });
      }

      console.log(`[STYLE DNA] Analyzing ${imageCount} reference image(s) with Gemini Vision...`);

      // Gemini 2.0 Flash suporta visão multimodal
      const geminiKey = process.env.GOOGLE_API_KEY?.trim();
      if (!geminiKey) {
        throw new Error('GOOGLE_API_KEY not configured for Style DNA');
      }

      // Construir partes multimodais: imagens + texto
      const parts: any[] = [];

      // Adicionar cada imagem como inline_data (máx 10 para não estourar quota)
      const maxImages = Math.min(imageCount, 10);
      for (let i = 0; i < maxImages; i++) {
        const imgBase64 = images[i];
        // Remover prefixo data:image/...;base64, se presente
        const base64Data = imgBase64.includes(',') ? imgBase64.split(',')[1] : imgBase64;
        const mimeType = imgBase64.includes('data:') ? imgBase64.split(';')[0].split(':')[1] : 'image/jpeg';

        parts.push({
          inline_data: {
            mime_type: mimeType,
            data: base64Data
          }
        });
      }

      // Adicionar prompt de análise
      parts.push({
        text: `Analyze these ${maxImages} reference image(s) for a carousel ${slideType} slide.
Return ONLY valid JSON (no markdown, no code blocks, no backticks) with this exact structure.

CRITICAL RULES:
- Extract REAL hex color codes (#XXXXXX format) from what you actually see in the images
- Be extremely specific with colors - use exact hex values, not approximations
- The generatedVisualPrompt MUST be 500+ characters describing every visual detail in English
- All fields are REQUIRED - do not omit any field

{
  "dominantColors": [
    {"hex": "#XXXXXX", "percentage": 45, "role": "background"},
    {"hex": "#XXXXXX", "percentage": 25, "role": "text"},
    {"hex": "#XXXXXX", "percentage": 15, "role": "accent"},
    {"hex": "#XXXXXX", "percentage": 10, "role": "neutral"},
    {"hex": "#XXXXXX", "percentage": 5, "role": "primary"}
  ],
  "layoutPattern": {
    "type": "centered",
    "contentZones": 3,
    "textToImageRatio": "text-heavy",
    "alignment": "center"
  },
  "typographyStyle": {
    "fontFamily": "sans-serif",
    "weight": "bold",
    "hierarchy": "two-level",
    "treatment": "uppercase"
  },
  "visualElements": {
    "hasIcons": false,
    "iconStyle": "none",
    "hasDecorativeShapes": true,
    "shapeLanguage": "rounded",
    "hasLines": false,
    "hasGradients": false,
    "hasTextures": false,
    "hasShadows": false,
    "bulletStyle": "dots",
    "cornerTreatment": "rounded"
  },
  "backgroundStyle": {
    "type": "solid",
    "complexity": "minimal",
    "dominantTone": "cool"
  },
  "mood": {
    "professional": 85,
    "playful": 15,
    "serious": 70,
    "luxurious": 30,
    "minimal": 75,
    "energetic": 25,
    "corporate": 80,
    "creative": 40
  },
  "generatedVisualPrompt": "Instagram carousel slide with solid #1A1A2E dark blue background covering 100% of canvas. Centered composition with bold white uppercase title at top in sans-serif font, body text below in regular weight. Accent elements in #E94560 coral red including bullet points and decorative rounded shapes at 15% opacity. Clean minimalist layout with 3 content zones. Top-right corner kept empty for logo. Professional corporate mood with subtle geometric accents. No gradients, no textures, no shadows, no icons. Flat modern design with sharp contrast.",
  "negativePrompt": "gradients, textures, patterns, photographs, complex backgrounds, icons, drop shadows, 3D effects, handwriting fonts, serif fonts, neon colors, cluttered layouts, text in corners, watermark, low quality, blurry"
}

EXTRACTION GUIDELINES:
1. COLORS: Look at EACH pixel region and identify the ACTUAL dominant colors. Do not guess - extract what you see.
2. LAYOUT: Identify where elements are positioned. Is everything centered? Is there asymmetric balance?
3. TYPOGRAPHY: Is the title uppercase? Is the font sans-serif or serif? Is the title much larger than body?
4. ELEMENTS: Are there icons? What style (line/filled)? Are there decorative shapes? What language (rounded/sharp)?
5. BACKGROUND: Is it solid color, gradient, texture, or image? How complex is it?
6. MOOD: Rate each dimension 0-100 based on what you observe.
7. generatedVisualPrompt: Write a detailed English prompt (500+ chars) that would recreate this EXACT style.
8. negativePrompt: List everything this style does NOT have, comma-separated.

Be precise. Extract real data from the images, do not invent or guess.`
      });

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts }],
            generationConfig: {
              temperature: 0.2,
              maxOutputTokens: 8192,
              responseMimeType: 'application/json'
            }
          })
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Gemini Vision API error: ${response.status} ${errorText}`);
      }

      const data = await response.json();
      const content = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';

      if (!content) {
        throw new Error('Empty response from Gemini Vision');
      }

      console.log('[STYLE DNA] Gemini Vision response length:', content.length, 'chars');

      // Parse JSON response
      try {
        const rawDna = JSON.parse(content);

        // VALIDAR e preenchar campos faltantes com valores padrão inteligentes
        const dna = validateAndFillDNA(rawDna);

        console.log('[STYLE DNA] ✅ Extraction success!', Object.keys(dna).length, 'fields extracted from actual images');
        console.log(`[STYLE DNA] Colors: ${dna.dominantColors.length}, BG: ${dna.backgroundStyle.type}, Mood top: ${Object.entries(dna.mood).sort((a,b) => (b[1] as number) - (a[1] as number))[0]?.[0]}`);
        return res.json({ dna });
      } catch (parseError) {
        // Try to extract JSON from text
        let jsonText = content;
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          jsonText = jsonMatch[0];
        }

        // Repair truncated JSON
        try {
          // Fix trailing commas in arrays/objects
          jsonText = jsonText.replace(/,\s*}/g, '}').replace(/,\s*]/g, ']');
          
          // Close unclosed braces/brackets
          const openBraces = (jsonText.match(/{/g) || []).length;
          const closeBraces = (jsonText.match(/}/g) || []).length;
          if (openBraces > closeBraces) {
            jsonText += '}'.repeat(openBraces - closeBraces);
          }
          
          const openBrackets = (jsonText.match(/\[/g) || []).length;
          const closeBrackets = (jsonText.match(/\]/g) || []).length;
          if (openBrackets > closeBrackets) {
            jsonText += ']'.repeat(openBrackets - closeBrackets);
          }

          const dna = JSON.parse(jsonText);
          // VALIDAR e preenchar campos faltantes
          const validatedDna = validateAndFillDNA(dna);
          console.log('[STYLE DNA] ✅ Extracted and repaired JSON successfully');
          return res.json({ dna: validatedDna });
        } catch (repairError) {
          console.error('[STYLE DNA] JSON repair failed:', repairError);
          throw new Error('Failed to parse StyleDNA JSON from Gemini response');
        }
      }
    } catch (error: any) {
      console.error('[STYLE DNA] Extraction error:', error.message);
      res.status(500).json({ error: error.message || String(error) });
    }
  });

  // ==========================================
  // ENDPOINT: EMBEDDING (via Nemotron Embed VL)
  // ==========================================
  app.post('/api/ai/embed', async (req, res) => {
    try {
      const { text } = req.body;
      const openrouterKey = process.env.OPENROUTER_API_KEY?.trim();

      if (!openrouterKey) {
        return res.status(500).json({ error: 'OPENROUTER_API_KEY not configured' });
      }

      const response = await fetch('https://openrouter.ai/api/v1/embeddings', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openrouterKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'http://localhost:3018',
          'X-Title': 'Carrossel-IA'
        },
        body: JSON.stringify({
          model: 'nvidia/llama-nemotron-embed-vl-1b-v2:free',
          input: text,
          dimensions: 768
        })
      });

      if (!response.ok) {
        const error = await response.text();
        return res.status(response.status).json({ error: `Embedding failed: ${error}` });
      }

      const data = await response.json();
      
      if (data.data && data.data[0] && data.data[0].embedding) {
        return res.json({ embedding: data.data[0].embedding });
      }
      
      res.status(500).json({ error: 'Failed to generate embedding' });
    } catch (error: any) {
      console.error('Embedding error:', error);
      res.status(500).json({ error: error.message || String(error) });
    }
  });

  // ==========================================
  // Endpoint para aprendizado de feedback do usuário
  // ==========================================
  app.post('/api/ai/learn-from-feedback', async (req, res) => {
    try {
      const { style, slideType, status, comment } = req.body;

      if (!style || !slideType || !status || !comment) {
        return res.status(400).json({ error: 'Missing required fields: style, slideType, status, comment' });
      }

      // CORREÇÃO: Usar Groq (estável) em vez de Nemotron (instável)
      const groqKey = process.env.GROQ_API_KEY?.trim() || process.env.GROQ_API_KEY_BACKUP_1?.trim();

      if (!groqKey) {
        return res.status(500).json({ error: 'No Groq API key configured' });
      }

      // Obter StyleDNA atual se existir
      const currentDNA = style.styleDNA?.[slideType];
      const currentDNAJson = currentDNA ? JSON.stringify(currentDNA, null, 2).substring(0, 1500) : 'No StyleDNA yet - will be created from feedback';

      // CORREÇÃO: Prompt mais conciso para evitar truncamento
      const prompt = `You are a Visual Design Expert. Analyze user feedback and update the style for a ${slideType} carousel slide.

STYLE INFO: "${style.name}"
Current ${slideType} Description: "${style[slideType]?.styleDescription || 'Not defined'}"
Colors: "${style.metadata?.colors || 'Not specified'}"
Audience: "${style.metadata?.audience || 'General'}"

CURRENT STYLE DNA:
${currentDNAJson}

USER FEEDBACK: ${status.toUpperCase()} - "${comment}"

${status === 'rejected' ? 'PROBLEM: User did NOT like this generation.' : 'SUCCESS: User liked this generation.'}

Return ONLY valid JSON with these 3 fields:
{
  "updatedStyleDescription": "Detailed visual style description covering: background (type, hex color), color palette (hex codes), typography (family, weight), layout (composition type, alignment), graphic elements (icons, shapes, shadows), mood (professional/playful/etc 0-100). 150-300 words.",
  "updatedExtraInstructions": "Specific dos and don'ts for future generations. 50-150 words.",
  "updatedStyleDNA": {
    "dominantColors": [{"hex": "#XXXXXX", "percentage": 60, "role": "background|primary|accent|text|neutral"}],
    "layoutPattern": {"type": "centered|asymmetric|grid|minimal|layered", "contentZones": 2, "textToImageRatio": "text-heavy|balanced|image-heavy", "alignment": "left|center|right|mixed"},
    "typographyStyle": {"fontFamily": "sans-serif|serif|display|handwriting|monospace", "weight": "light|regular|medium|bold|extra-bold", "hierarchy": "single|two-level|multi-level", "treatment": "uppercase|title-case|sentence-case|mixed"},
    "visualElements": {"hasIcons": false, "iconStyle": "none", "hasDecorativeShapes": false, "shapeLanguage": "rounded|sharp|mixed", "hasLines": false, "hasGradients": false, "hasTextures": false, "hasShadows": false},
    "backgroundStyle": {"type": "solid|gradient|texture|pattern|image|abstract", "complexity": "minimal|simple|moderate|complex", "dominantTone": "warm|cool|neutral|vibrant|muted|dark|light"},
    "mood": {"professional": 90, "playful": 10, "serious": 80, "luxurious": 20, "minimal": 70, "energetic": 15, "corporate": 85, "creative": 25},
    "generatedVisualPrompt": "Detailed image generation prompt that would recreate this exact visual style",
    "negativePrompt": "What to AVOID: list everything this style does NOT have"
  }
}

IMPORTANT:
- Keep current DNA values if feedback is positive, adjust if negative
- Include exact hex codes in dominantColors
- All fields must have valid values - leave NO field empty
- Return ONLY the JSON object, nothing else`;

      console.log(`[LEARN FEEDBACK] Processing ${status} feedback for ${slideType} slide of "${style.name}"`);

      // CORREÇÃO: Usar Groq com modelo estável
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${groqKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.3,
          max_tokens: 3000
        })
      });

      if (!response.ok) {
        const error = await response.text();
        console.error(`[LEARN FEEDBACK] Groq returned ${response.status}: ${error.substring(0, 200)}`);
        return res.status(response.status).json({ error: `Groq style learning failed: ${error}` });
      }

      const data = await response.json();
      const text = data?.choices?.[0]?.message?.content;

      if (!text || text.trim().length < 50) {
        console.error('[LEARN FEEDBACK] Groq returned empty or very short response');
        return res.status(500).json({ error: "AI returned empty response" });
      }

      console.log(`[LEARN FEEDBACK] AI response: ${text.length} chars`);

      // CORREÇÃO: JSON parsing robusto com múltiplas tentativas
      let result;
      try {
        // Tentativa 1: Regex simples
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          result = JSON.parse(jsonMatch[0]);
        } else {
          // Tentativa 2: Procurar por chaves externas mais profundas
          const firstBrace = text.indexOf('{');
          const lastBrace = text.lastIndexOf('}');
          if (firstBrace !== -1 && lastBrace > firstBrace) {
            result = JSON.parse(text.substring(firstBrace, lastBrace + 1));
          } else {
            throw new Error('No JSON found');
          }
        }
      } catch (parseError) {
        console.warn('[LEARN FEEDBACK] JSON parse failed, trying fallback extraction:', parseError);
        // Tentativa 3: Extrair campos individualmente
        const extractField = (field: string) => {
          const regex = new RegExp(`"${field}"\\s*:\\s*"([^"]*(?:\\.[^"]*)*)"`, 'g');
          const match = regex.exec(text);
          return match ? match[1].replace(/\\"/g, '"').replace(/\\n/g, '\n') : null;
        };

        result = {
          updatedStyleDescription: extractField('updatedStyleDescription') || `Style: ${style.name}. ${comment}`,
          updatedExtraInstructions: extractField('updatedExtraInstructions') || `User feedback: ${comment}`,
          updatedStyleDNA: null
        };

        // Tentar extrair DNA como bloco JSON
        const dnaMatch = text.match(/"updatedStyleDNA"\s*:\s*(\{[\s\S]*?\})(?:\s*\n\s*\}|$)/);
        if (dnaMatch) {
          try {
            result.updatedStyleDNA = JSON.parse(dnaMatch[1]);
          } catch (e) {
            console.warn('[LEARN FEEDBACK] Could not parse DNA block, using minimal structure');
          }
        }

        // Se ainda não tem DNA, criar estrutura mínima
        if (!result.updatedStyleDNA) {
          result.updatedStyleDNA = {
            dominantColors: currentDNA?.dominantColors || [{ hex: "#FFFFFF", percentage: 100, role: "background" }],
            layoutPattern: currentDNA?.layoutPattern || { type: "centered", contentZones: 2, textToImageRatio: "text-heavy", alignment: "center" },
            typographyStyle: currentDNA?.typographyStyle || { fontFamily: "sans-serif", weight: "bold", hierarchy: "two-level", treatment: "uppercase" },
            visualElements: currentDNA?.visualElements || { hasIcons: false, iconStyle: "none", hasDecorativeShapes: false, shapeLanguage: "rounded", hasLines: false, hasGradients: false, hasTextures: false, hasShadows: false },
            backgroundStyle: currentDNA?.backgroundStyle || { type: "solid", complexity: "minimal", dominantTone: "cool" },
            mood: currentDNA?.mood || { professional: 90, playful: 10, serious: 80, luxurious: 20, minimal: 70, energetic: 15, corporate: 85, creative: 25 },
            generatedVisualPrompt: currentDNA?.generatedVisualPrompt || `${style.name} style ${slideType} slide: ${style[slideType]?.styleDescription || ''}`,
            negativePrompt: currentDNA?.negativePrompt || 'No gradients, no textures, no photography, no serif fonts'
          };
        }
      }

      if (!result.updatedStyleDescription || !result.updatedExtraInstructions) {
        return res.status(500).json({ error: "Missing required fields in AI response" });
      }

      console.log(`[LEARN FEEDBACK] Parsed successfully. Style desc: ${result.updatedStyleDescription.length} chars`);

      // Build updated style
      const updatedStyle = { ...style };
      updatedStyle[slideType] = {
        ...updatedStyle[slideType],
        styleDescription: result.updatedStyleDescription
      };

      updatedStyle.metadata = {
        ...updatedStyle.metadata,
        extraInstructions: result.updatedExtraInstructions
      };

      // Update StyleDNA com merge 80% novo / 20% antigo
      if (result.updatedStyleDNA) {
        const currentStyleDNA = updatedStyle.styleDNA || {};
        const existingDNA = currentStyleDNA[slideType];

        if (existingDNA) {
          // Merge colors (80% new, 20% old)
          const newColors = result.updatedStyleDNA.dominantColors || [];
          const oldColors = existingDNA.dominantColors || [];
          const mergedColors = newColors.map((newColor: any, idx: number) => {
            const oldColor = oldColors[idx];
            if (oldColor && oldColor.role === newColor.role) {
              return {
                ...newColor,
                percentage: Math.round(newColor.percentage * 0.8 + oldColor.percentage * 0.2)
              };
            }
            return newColor;
          });

          updatedStyle.styleDNA = {
            ...currentStyleDNA,
            [slideType]: {
              ...existingDNA,
              ...result.updatedStyleDNA,
              dominantColors: mergedColors.length > 0 ? mergedColors : existingDNA.dominantColors
            }
          };
        } else {
          updatedStyle.styleDNA = {
            ...currentStyleDNA,
            [slideType]: result.updatedStyleDNA
          };
        }

        console.log(`[LEARN FEEDBACK] StyleDNA updated for ${slideType}. Colors: ${(updatedStyle.styleDNA[slideType].dominantColors || []).length}`);
      }

      return res.json({ updatedStyle });
    } catch (error: any) {
      console.error('[LEARN FEEDBACK] Unexpected error:', error.message);
      console.error('[LEARN FEEDBACK] Stack:', error.stack?.substring(0, 500));
      return res.status(500).json({ error: error.message || 'Failed to process feedback' });
    }
  });

  app.post('/api/ai/analyze-category', async (req, res) => {
    try {
      const { images, categoryName } = req.body;
      const openrouterKey = process.env.OPENROUTER_API_KEY?.trim();

      const imageCount = images?.length || 0;
      
      const prompt = `You are an EXPERT Visual Design Analyst with 20+ years analyzing Instagram carousel designs.

Analyze these ${imageCount} reference image(s) for a carousel "${categoryName}" slide with EXTREME PRECISION.

Describe EVERY visual element in specific detail:

1. BACKGROUND: Exact type (solid color with HEX code, gradient with colors and direction, texture type, pattern). Be specific: "solid #FFFFFF", "linear gradient from #6366F1 to #8B5CF6 top to bottom"

2. COLORS: List ALL visible colors with exact HEX codes and their usage: background color, accent color(s), text color(s), icon color(s), border/line color(s)

3. LAYOUT: Exact composition - where is the title? (top/center/bottom), where is the body text? (left/center/right), where is the CTA? (top/middle/bottom), alignment (left/center/right/justified)

4. TYPOGRAPHY: Font style (modern sans-serif / classic serif / display / handwriting), weight (light/regular/bold/extra-bold), size hierarchy (large title + small body / equal sizes), text treatment (UPPERCASE / Title Case / Sentence case), letter spacing (tight/normal/wide)

5. GRAPHIC ELEMENTS: Icons (line style / filled / illustration / none), shapes (circles / squares / rounded rectangles / organic blobs / none), decorative elements (lines / dots / patterns / borders / none), image treatment (photography / illustration / flat design / abstract)

6. SPACING & DENSITY: Information density (sparse with lots of whitespace / balanced / dense with lots of content), margins (wide/narrow), padding around elements

7. VISUAL HIERARCHY: What draws the eye FIRST (title / image / CTA), SECOND, THIRD. Contrast usage (high contrast between text and background / subtle).

8. BRANDING: Logo presence and placement (top-left / top-right / center / bottom), size (small/medium/large), style (subtle/prominent)

9. MOOD & STYLE: Overall feel (corporate / modern / minimal / playful / serious / luxurious / energetic), lighting (flat / realistic / gradient-based), texture (clean / textured / patterned)

10. WHAT THIS STYLE AVOIDS (Negative Constraints): List everything this style does NOT have (e.g., "no photography, no gradients, no bright neon colors, no serif fonts, no dark backgrounds")

Return a SINGLE paragraph of 150-300 words that reads like a precise design brief. Use exact HEX color codes. Be specific, not generic. This description will be used to generate NEW slides in EXACTLY this visual style.`;

      // Usar Nemotron via OpenRouter para análise detalhada
      if (openrouterKey) {
        try {
          console.log('[ANALYZE] Using Nemotron for detailed style analysis...');
          const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${openrouterKey}`,
              'Content-Type': 'application/json',
              'HTTP-Referer': 'http://localhost:3018',
              'X-Title': 'Carrossel-IA'
            },
            body: JSON.stringify({
              model: 'nvidia/nemotron-3-super-120b-a12b:free',
              messages: [
                { role: 'system', content: 'You are an expert visual design analyst. Return a SINGLE detailed paragraph describing the visual style with exact colors, layout, typography, and elements. Use HEX color codes. Be extremely specific, not generic.' },
                { role: 'user', content: prompt }
              ],
              temperature: 0.3,
              max_tokens: 1024
            })
          });

          if (response.ok) {
            const data = await response.json();
            const styleDescription = data?.choices?.[0]?.message?.content || '';
            if (styleDescription && styleDescription.length > 50) {
              console.log('[ANALYZE] Nemotron style analysis success:', styleDescription.length, 'chars');
              return res.json({ styleDescription });
            }
          }

          const errorText = await response.text();
          console.warn('[ANALYZE] Nemotron failed:', response.status, errorText.substring(0, 200));
        } catch (nemError: any) {
          console.error('[ANALYZE] Nemotron error:', nemError.message);
        }
      }

      // Fallback: descrição básica
      console.log('[ANALYZE] Using fallback style description');
      res.json({ 
        styleDescription: `Professional ${categoryName} slide design. Clean modern layout with solid white background (#FFFFFF). Sans-serif typography in bold weight. Primary accent color #6366F1 (indigo). Text color #1E293B (slate gray). Centered alignment with balanced whitespace. Minimal line icons with rounded corners. Subtle drop shadows for depth. Corporate and professional mood. No gradients, no photography, no bright neon colors, no serif fonts, no dark backgrounds.` 
      });
    } catch (error: any) {
      console.error('Analyze category error:', error);
      res.status(500).json({ error: error.message || String(error) });
    }
  });

  app.post('/api/ai/generate-image', async (req, res) => {
    try {
      const { prompt, preferredModel } = req.body;

      // Log do modelo selecionado
      if (preferredModel) {
        console.log('[IMAGE] User selected model:', preferredModel);
      }

      // Métricas
      const opStart = observability.startOperation('generate-image', 'multi', 'multi');

      // Se usuário escolheu modelo específico, tentar apenas ele primeiro
      if (preferredModel && preferredModel !== 'auto-fallback') {
        console.log(`[IMAGE] Using user-selected model: ${preferredModel}`);
        // Por enquanto, usa o fallback normal mas loga a preferência
        // TODO: Implementar seleção direta de modelo de imagem
      }

      // TENTATIVA 0: Verificar cache R2 primeiro
      if (r2Storage) {
        const cached = await r2Storage.getCachedImage(prompt, 'flux-1-schnell');
        if (cached) {
          observability.endOperation(
            opStart.operationId, opStart.startTime,
            'generate-image', 'flux-1-schnell', 'r2-cache',
            true, { cost: 0 }
          );
          console.log('[IMAGE] Serving from R2 cache!');
          return res.json({ output: cached, fromCache: true });
        }
      }
      
      const hfApiKey = process.env.HF_API_KEY?.trim();
      const replicateKey = process.env.REPLICATE_API_KEY?.trim();
      const cfToken = process.env.CLOUDFLARE_API_TOKEN?.trim();
      const cfAccountId = process.env.CLOUDFLARE_ACCOUNT_ID?.trim();
      const googleApiKey = process.env.GOOGLE_API_KEY?.trim();

      // TENTATIVA 1: Google AI Studio - Nano Banana / Imagen (GRÁTIS, 50 imgs/mês)
      if (googleApiKey) {
        try {
          console.log('[IMAGE] Trying Google AI Studio (Nano Banana / Gemini Image)...');
          const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent', {
            method: 'POST',
            headers: {
              'x-goog-api-key': googleApiKey,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              contents: [{
                parts: [{ text: `Generate a vertical portrait image with 3:4 aspect ratio (720x960px): ${prompt}` }]
              }],
              generationConfig: {
                responseModalities: ['TEXT', 'IMAGE']
                // aspectRatio removido: o formato 3:4 já está especificado no prompt
                // e este modelo não suporta o campo aspectRatio no generationConfig
              }
            })
          });

          if (response.ok) {
            const data = await response.json();
            // Procura imagem na resposta (base64 inline)
            let foundImage = false;
            for (const candidate of data.candidates || []) {
              for (const part of candidate.content?.parts || []) {
                if (part.inlineData?.data) {
                  const imageUrl = `data:image/png;base64,${part.inlineData.data}`;
                  console.log('[IMAGE] Google AI Studio (Nano Banana) success!');

                  // Salvar em cache R2
                  if (r2Storage) {
                    r2Storage.cacheImage(prompt, 'google-nano-banana', imageUrl)
                      .then(() => console.log('[R2] Image cached from Google generation'));
                  }

                  // Métricas
                  observability.endOperation(
                    opStart.operationId, opStart.startTime,
                    'generate-image', 'google-nano-banana', 'google-ai-studio',
                    true
                  );

                  return res.json({ output: imageUrl });
                }
              }
            }
            // CORREÇÃO: Se response OK mas sem inlineData, lançar erro para forçar fallback
            // NÃO tentar response.text() pois o body já foi consumido pelo .json()
            console.warn('[IMAGE] Google AI Studio: response OK but no inlineData found in candidates');
            throw new Error('Google AI Studio returned response but no image data (inlineData not found)');
          }

          const errorText = await response.text();
          console.warn('[IMAGE] Google AI Studio failed:', response.status, errorText.substring(0, 300));

          // Registrar no rate limit tracker
          rateLimitTracker.recordUsage(
            'google-image',
            'Google AI Studio (Image)',
            false,
            undefined,
            `HTTP ${response.status}: ${errorText.substring(0, 100)}`,
            response.status
          );
        } catch (googleError: any) {
          // CORREÇÃO: Se "Body has already been read", é porque o response veio OK mas sem inlineData
          // e já lançamos o erro acima. Tratar como falha normal, não critical error.
          const isBodyAlreadyRead = googleError.message?.includes('Body has already been read') || googleError.message?.includes('Body is unusable');
          if (isBodyAlreadyRead) {
            console.warn('[IMAGE] Google AI Studio: body already read but no image found — trying fallback');
          } else if (googleError.message?.includes('no image data')) {
            // Nosso erro lançado acima — esperado, não logar como critical
          } else {
            console.error('[IMAGE] Google AI Studio error:', googleError.message);
          }
          
          // Registrar no rate limit tracker
          rateLimitTracker.recordUsage(
            'google-image',
            'Google AI Studio (Image)',
            false,
            undefined,
            googleError.message,
            500
          );
        }
      }

      // TENTATIVA 2: Cloudflare Workers AI (FLUX.1 Dev - MELHOR MODELO GRATUITO)
      if (cfToken && cfAccountId) {
        try {
          console.log('[IMAGE] Trying Cloudflare Workers AI (FLUX.1 Dev - alta qualidade)...');
          console.log(`[IMAGE] Cloudflare config: accountId=${cfAccountId.substring(0, 10)}..., token length=${cfToken.length}`);

          // CORREÇÃO: Enriquecer prompt com dados do StyleDNA ANTES de truncar
          // O prompt já vem do DesignerSkill com StyleDNA, mas adicionar contexto extra ajuda
          const enrichedPrompt = prompt.startsWith('Instagram carousel')
            ? prompt  // Já está formatado
            : `Instagram carousel slide, 720x960px, professional business design, solid background color. ${prompt}`;

          // Cloudflare FLUX tem limite de 2048 chars no prompt
          const truncatedPrompt = enrichedPrompt.length > 2000
            ? enrichedPrompt.substring(0, 2000)
            : enrichedPrompt;

          if (enrichedPrompt.length > 2000) {
            console.log(`[IMAGE] Cloudflare prompt truncated from ${enrichedPrompt.length} to 2000 chars`);
          }

          const requestBody = {
            prompt: truncatedPrompt,
            // CORREÇÃO: Aumentar steps de 4 → 20 para qualidade profissional
            num_steps: 20,
            guidance: 7.5,
            // Formato 3:4 (720x960)
            width: 768,
            height: 1024,
            negative_prompt: 'blurry, low quality, distorted, deformed, ugly, bad anatomy, text overlay, watermark, signature, logo in image'
          };

          console.log('[IMAGE] Cloudflare request body:', JSON.stringify(requestBody).substring(0, 200));

          // CORREÇÃO: Trocar modelo de schnell → dev (mais lento, muito melhor qualidade)
          const response = await fetch(
            `https://api.cloudflare.com/client/v4/accounts/${cfAccountId}/ai/run/@cf/black-forest-labs/flux-1-dev`,
            {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${cfToken}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify(requestBody)
            }
          );

          if (response.ok) {
            const data = await response.json();
            
            // DEBUG: Log da resposta completa do Cloudflare
            console.log('[IMAGE] Cloudflare response structure:', JSON.stringify(Object.keys(data)));
            if (data.result) {
              console.log('[IMAGE] Cloudflare result keys:', JSON.stringify(Object.keys(data.result)));
            }
            if (data.errors && data.errors.length > 0) {
              console.error('[IMAGE] Cloudflare returned errors:', JSON.stringify(data.errors));
            }

            // Cloudflare retorna imagem como base64 no campo "image" ou "result"
            if (data.result?.image) {
              const base64Data = data.result.image;
              
              // VALIDAÇÃO: Verificar se o base64 é válido e tem tamanho razoável
              const base64Length = base64Data.length;
              const estimatedSizeKB = Math.round((base64Length * 0.75) / 1024);
              
              console.log(`[IMAGE] Cloudflare FLUX.1 base64 length: ${base64Length} chars (~${estimatedSizeKB}KB)`);
              
              // Imagens válidas do FLUX devem ter pelo menos 50KB
              if (base64Length < 50000) {
                console.error(`[IMAGE] Cloudflare FLUX.1 returned suspiciously small image: only ${estimatedSizeKB}KB`);
                console.error('[IMAGE] This is likely corrupted or invalid data');
                console.error('[IMAGE] First 100 chars of base64:', base64Data.substring(0, 100));
                throw new Error(`Cloudflare returned invalid image data: only ${estimatedSizeKB}KB (expected >50KB)`);
              }
              
              // Validar se é base64 válido
              try {
                const testBuffer = Buffer.from(base64Data, 'base64');
                // Verificar magic bytes de PNG (89 50 4E 47) ou JPEG (FF D8 FF)
                const firstBytes = testBuffer.slice(0, 4);
                const isPng = firstBytes[0] === 0x89 && firstBytes[1] === 0x50;
                const isJpeg = firstBytes[0] === 0xFF && firstBytes[1] === 0xD8;
                
                console.log(`[IMAGE] Image validation: PNG=${isPng}, JPEG=${isJpeg}, size=${testBuffer.length} bytes`);
                
                if (!isPng && !isJpeg) {
                  console.error('[IMAGE] Cloudflare FLUX.1 returned invalid image format!');
                  console.error('[IMAGE] First 20 bytes:', firstBytes.toString('hex'));
                  console.error('[IMAGE] This is NOT a valid PNG or JPEG file - likely corrupted');
                  throw new Error('Cloudflare returned invalid image format (not PNG/JPEG)');
                }
              } catch (validationError: any) {
                if (validationError.message.includes('invalid image format')) {
                  throw validationError;
                }
                console.error('[IMAGE] Base64 validation failed:', validationError.message);
                throw new Error(`Cloudflare returned invalid base64 data: ${validationError.message}`);
              }
              
              const imageUrl = `data:image/png;base64,${base64Data}`;
              console.log('[IMAGE] ✅ Cloudflare FLUX.1 success - valid image received!');

              // Salvar em cache R2
              if (r2Storage) {
                r2Storage.cacheImage(prompt, 'flux-1-schnell', imageUrl)
                  .then(() => console.log('[R2] Image cached from FLUX generation'));
              }

              // Métricas
              observability.endOperation(
                opStart.operationId, opStart.startTime,
                'generate-image', 'flux-1-schnell', 'cloudflare-workers-ai',
                true
              );

              return res.json({ output: imageUrl });
            } else if (data.result) {
              // Se já vem como URL ou outro formato
              console.log('[IMAGE] Cloudflare FLUX.1 success (alternative format)!');
              
              observability.endOperation(
                opStart.operationId, opStart.startTime,
                'generate-image', 'flux-1-schnell', 'cloudflare-workers-ai',
                true
              );
              
              return res.json({ output: data.result });
            }
          }

          const errorText = await response.text();
          console.warn('[IMAGE] Cloudflare FLUX.1 failed:', response.status, errorText);
          console.warn(`[IMAGE] Cloudflare debug: url=https://api.cloudflare.com/client/v4/accounts/${cfAccountId}/ai/run/@cf/black-forest-labs/flux-1-schnell`);
          if (response.status === 401) {
            console.warn('[IMAGE] Cloudflare 401 troubleshooting:');
            console.warn('  1. Check if CLOUDFLARE_API_TOKEN is correct in .env');
            console.warn('  2. Token must have "Workers AI" permission');
            console.warn('  3. Account ID must match the one in the URL');
            console.warn('  4. Token format should be just the token string, no "Bearer" prefix');
          }
          
          // Registrar no rate limit tracker
          rateLimitTracker.recordUsage(
            'cloudflare-image',
            'Cloudflare Workers AI (FLUX.1)',
            false,
            undefined,
            `HTTP ${response.status}: ${errorText.substring(0, 100)}`,
            response.status
          );
        } catch (cfError: any) {
          console.error('[IMAGE] Cloudflare FLUX.1 error:', cfError.message);
          
          // Registrar no rate limit tracker
          rateLimitTracker.recordUsage(
            'cloudflare-image',
            'Cloudflare Workers AI (FLUX.1)',
            false,
            undefined,
            cfError.message,
            500
          );
        }
      }

      // TENTATIVA 3: HuggingFace - FLUX.1-dev (modelo mais estável)
      if (hfApiKey) {
        try {
          console.log('[IMAGE] Trying HuggingFace (FLUX.1-dev)...');
          const response = await fetch('https://router.huggingface.co/hf-inference/models/black-forest-labs/FLUX.1-dev', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${hfApiKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              inputs: prompt,
              parameters: {
                negative_prompt: 'blurry, low quality, distorted, text, watermark'
              }
            })
          });

          if (response.ok) {
            const blob = await response.blob();
            // Converter blob para base64
            const buffer = Buffer.from(await blob.arrayBuffer());
            const base64 = buffer.toString('base64');
            const imageUrl = `data:image/png;base64,${base64}`;
            console.log('[IMAGE] HuggingFace success!');
            return res.json({ output: imageUrl });
          }

          const errorText = await response.text();
          console.warn('[IMAGE] HuggingFace failed:', response.status, errorText);

          // Registrar no rate limit tracker
          rateLimitTracker.recordUsage(
            'huggingface-image',
            'HuggingFace (FLUX.1-dev)',
            false,
            undefined,
            `HTTP ${response.status}: ${errorText.substring(0, 100)}`,
            response.status
          );

          // Se é "model loading" (cold start), espera e tenta de novo
          if (errorText.includes('loading')) {
            console.log('[IMAGE] Model loading, waiting 20s...');
            await new Promise(resolve => setTimeout(resolve, 20000));

            // Tenta novamente
            const retryResponse = await fetch('https://router.huggingface.co/hf-inference/models/black-forest-labs/FLUX.1-dev', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${hfApiKey}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ inputs: prompt })
            });

            if (retryResponse.ok) {
              const blob = await retryResponse.blob();
              const buffer = Buffer.from(await blob.arrayBuffer());
              const base64 = buffer.toString('base64');
              const imageUrl = `data:image/png;base64,${base64}`;
              console.log('[IMAGE] HuggingFace success after retry!');
              return res.json({ output: imageUrl });
            }
          }
        } catch (hfError: any) {
          console.error('[IMAGE] HuggingFace error:', hfError.message);
          
          // Registrar no rate limit tracker
          rateLimitTracker.recordUsage(
            'huggingface-image',
            'HuggingFace (FLUX.1-dev)',
            false,
            undefined,
            hfError.message,
            500
          );
        }
      }

      // TENTATIVA 3: Replicate (pago)
      if (replicateKey) {
        try {
          console.log('[IMAGE] Trying Replicate...');
          const replicate = new Replicate({ auth: replicateKey });
          const output = await replicate.run(
            'stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b',
            {
              input: {
                prompt,
                aspect_ratio: '3:4',
                negative_prompt: 'blurry, low quality, distorted'
              }
            }
          );
          console.log('[IMAGE] Replicate success!');
          return res.json({ output: Array.isArray(output) ? output[0] : output });
        } catch (replicateError: any) {
          console.error('[IMAGE] Replicate error:', replicateError.message);
        }
      }

      // TENTATIVA 4: Leonardo.AI (API key necessária)
      const leonardoKey = process.env.LEONARDO_API_KEY?.trim();
      if (leonardoKey) {
        try {
          console.log('[IMAGE] Trying Leonardo.AI...');

          // Leonardo.AI tem limite de 1500 chars no prompt
          const truncatedPrompt = prompt.length > 1400 
            ? prompt.substring(0, 1400) + '...' 
            : prompt;
          
          if (prompt.length > 1400) {
            console.log(`[IMAGE] Prompt truncated from ${prompt.length} to 1400 chars for Leonardo.AI`);
          }

          // Step 1: Criar geração
          const genResponse = await fetch('https://cloud.leonardo.ai/api/rest/v1/generations', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${leonardoKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              prompt: truncatedPrompt,
              width: 768,
              height: 1024,
              num_images: 1,
              negative_prompt: 'blurry, low quality, distorted, text, watermark'
            })
          });

          if (genResponse.ok) {
            const genData = await genResponse.json();
            const generationId = genData.sdGenerationJob?.generationId;
            
            if (generationId) {
              console.log('[IMAGE] Leonardo generation started:', generationId);
              
              // Step 2: Poll para imagem
              let attempts = 0;
              while (attempts < 60) {
                await new Promise(resolve => setTimeout(resolve, 2000));
                
                const statusResp = await fetch(`https://cloud.leonardo.ai/api/rest/v1/generations/${generationId}`, {
                  headers: { 'Authorization': `Bearer ${leonardoKey}` }
                });

                if (statusResp.ok) {
                  const statusData = await statusResp.json();
                  const gen = statusData.generations_by_pk;
                  
                  if (gen?.status === 'COMPLETE' && gen?.generated_images?.length > 0) {
                    const imageUrl = gen.generated_images[0].url;
                    console.log('[IMAGE] Leonardo.AI success!');
                    return res.json({ output: imageUrl });
                  } else if (gen?.status === 'FAILED') {
                    console.warn('[IMAGE] Leonardo generation failed');
                    break;
                  }
                }
                attempts++;
              }
              
              console.warn('[IMAGE] Leonardo timeout');
            }
          }

          const leoError = await genResponse.text();
          console.warn('[IMAGE] Leonardo.AI failed:', genResponse.status, leoError);
        } catch (leoError: any) {
          console.error('[IMAGE] Leonardo.AI error:', leoError.message);
        }
      }

      // TENTATIVA 5: ModelsLab (20 créditos grátis)
      const modelsLabKey = process.env.MODELSLAB_API_KEY?.trim();
      if (modelsLabKey) {
        try {
          console.log('[IMAGE] Trying ModelsLab...');
          const mlResponse = await fetch('https://modelslab.com/api/v6/images/text2img', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              key: modelsLabKey,
              prompt,
              width: 768,
              height: 1024,
              model_id: 'stabilityai/stable-diffusion-xl-base-1.0',
              negative_prompt: 'blurry, low quality, distorted, text, watermark'
            })
          });

          if (mlResponse.ok) {
            const mlData = await mlResponse.json();
            if (mlData.output && mlData.output[0]) {
              console.log('[IMAGE] ModelsLab success!');
              return res.json({ output: mlData.output[0] });
            }
          }

          const mlError = await mlResponse.text();
          console.warn('[IMAGE] ModelsLab failed:', mlResponse.status, mlError);
        } catch (mlError: any) {
          console.error('[IMAGE] ModelsLab error:', mlError.message);
        }
      }

      // TENTATIVA 5: AI Horde (grátis, sem chave, comunitário)
      try {
        console.log('[IMAGE] Trying AI Horde (free, no key needed)...');

        // Step 1: Submit generation job
        const generationResponse = await fetch('https://aihorde.net/api/v2/generate/async', {
          method: 'POST',
          headers: {
            'apikey': '0000000000',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            prompt,
            params: {
              width: 640,
              height: 896,
              steps: 30,
              cfg_scale: 7,
              negative_prompt: 'blurry, low quality, distorted, text, watermark'
            },
            models: ['stable_diffusion']
          })
        });

        if (generationResponse.ok) {
          const generationData = await generationResponse.json();
          const jobId = generationData.id;
          console.log('[IMAGE] AI Horde job submitted:', jobId);

          // Step 2: Poll for completion (max 90s)
          let attempts = 0;
          const maxAttempts = 90;

          while (attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 1000));

            const statusResponse = await fetch(`https://aihorde.net/api/v2/generate/status/${jobId}`, {
              headers: { 'apikey': '0000000000' }
            });

            if (statusResponse.ok) {
              const statusData = await statusResponse.json();

              if (statusData.done && statusData.generations && statusData.generations.length > 0) {
                // Image is ready
                const imageUrl = statusData.generations[0].img;
                console.log('[IMAGE] AI Horde success!');
                return res.json({ output: imageUrl });
              } else if (statusData.faulted) {
                console.warn('[IMAGE] AI Horde job faulted');
                break;
              }
              // Still processing, continue polling
            } else {
              console.warn(`[IMAGE] AI Horde status check failed: ${statusResponse.status}`);
            }

            attempts++;
          }

          console.warn('[IMAGE] AI Horde timeout after 90s');
        } else {
          const errorData = await generationResponse.text();
          console.error('[IMAGE] AI Horde submit failed:', generationResponse.status, errorData);
        }
      } catch (hordeError: any) {
        console.error('[IMAGE] AI Horde error:', hordeError.message);
      }

      // FALLBACK: Retorna erro com informações úteis
      res.status(500).json({
        error: 'Nenhum gerador de imagens disponível.',
        details: {
          configured: {
            google: !!googleApiKey,
            cloudflare: !!(cfToken && cfAccountId),
            huggingface: !!hfApiKey,
            replicate: !!replicateKey,
            leonardo: !!process.env.LEONARDO_API_KEY,
            aihorde: true // sempre disponível
          },
          suggestion: 'AI Horde (gratuito) falhou. Configure GOOGLE_API_KEY ou CLOUDFLARE_* para melhor confiabilidade.'
        }
      });
    } catch (error: any) {
      console.error('Generate image error:', error);
      res.status(500).json({ error: error.message || String(error) });
    }
  });

  // ==========================================
  // ENDPOINTS DE GERENCIAMENTO DE APIs
  // ==========================================

  // Obter ranking de todas as APIs
  app.get('/api/ai/status', async (req, res) => {
    try {
      const ranking = apiManager.getRanking();
      const providers = apiManager.getAllProviders();

      res.json({
        ranking,
        providers: providers.map(p => ({
          id: p.id,
          name: p.name,
          type: p.type,
          model: p.model,
          enabled: p.enabled,
          stats: p.stats
        })),
        totalProviders: providers.length,
        healthyProviders: ranking.filter(r => r.status === 'healthy').length,
        timestamp: Date.now()
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ==========================================
  // GET /api/carousel-history - Retorna histórico de carrosseis
  // Nota: O frontend carrega diretamente do Firestore (já conectado)
  // ==========================================
  app.get('/api/carousel-history', async (req, res) => {
    try {
      console.log('[CAROUSEL HISTORY] Endpoint hit — returning empty (frontend loads from Firestore directly)');
      res.setHeader('Content-Type', 'application/json');
      // Frontend já tem acesso direto ao Firestore via Firebase SDK
      // Este endpoint existe para compatibilidade, mas os dados vêm do client-side
      return res.status(200).json([]);
    } catch (error: any) {
      console.error('[CAROUSEL HISTORY] Error:', error.message);
      res.setHeader('Content-Type', 'application/json');
      return res.status(200).json([]);
    }
  });

  // Health check das APIs - verifica se tem pelo menos 3 funcionais
  app.get('/api/ai/health-check', async (req, res) => {
    try {
      const { minApis = 3 } = req.query;
      const health = await apiManager.checkApiHealth(parseInt(minApis as string));

      res.json({
        ...health,
        timestamp: Date.now()
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Obter relatório de rate limits e cooldowns
  app.get('/api/ai/rate-limits', async (req, res) => {
    try {
      const report = getRateLimitReport();
      const allStatus = rateLimitTracker.getAllApisStatus();
      const bestProvider = rateLimitTracker.getBestAvailableProvider();
      const allCooldowns = rateLimitTracker.getAllCooldowns();

      res.json({
        report,
        summary: {
          available: allStatus.availableCount,
          limited: allStatus.limitedCount,
          total: allStatus.rateLimits.length
        },
        rateLimits: allStatus.rateLimits,
        cooldowns: allCooldowns,
        bestAvailableProvider: bestProvider,
        timestamp: Date.now()
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Obter relatório de rate limits em formato texto
  app.get('/api/ai/rate-limits/report', async (req, res) => {
    try {
      const report = getRateLimitReport();
      res.type('text/plain').send(report);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Adicionar nova API dinamicamente
  app.post('/api/ai/providers', async (req, res) => {
    try {
      const { name, type, baseUrl, model, apiKey } = req.body;
      
      if (!name || !type || !baseUrl || !model || !apiKey) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const provider = apiManager.addProvider({
        id: `${type}-${Date.now()}`,
        name,
        type,
        baseUrl,
        model,
        apiKey
      });

      res.status(201).json({ message: 'Provider added', provider: provider.id });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Remover API
  app.delete('/api/ai/providers/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const removed = apiManager.removeProvider(id);
      
      if (removed) {
        res.json({ message: 'Provider removed', id });
      } else {
        res.status(404).json({ error: 'Provider not found' });
      }
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Reabilitar API
  app.post('/api/ai/providers/:id/enable', async (req, res) => {
    try {
      const { id } = req.params;
      const enabled = apiManager.enableProvider(id);
      
      if (enabled) {
        res.json({ message: 'Provider enabled', id });
      } else {
        res.status(404).json({ error: 'Provider not found' });
      }
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Resetar estatísticas de uma API
  app.post('/api/ai/providers/:id/reset-stats', async (req, res) => {
    try {
      const { id } = req.params;
      const provider = apiManager.getProviderStats(id);

      if (provider) {
        // Usar o método resetProviderStats em vez de atribuir diretamente
        apiManager.resetProviderStats(id);

        res.json({ message: 'Stats reset', provider: id });
      } else {
        res.status(404).json({ error: 'Provider not found' });
      }
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Resetar cooldown de uma API
  app.post('/api/ai/providers/:id/reset-cooldown', async (req, res) => {
    try {
      const { id } = req.params;
      const provider = apiManager.getProviderStats(id);

      if (!provider) {
        return res.status(404).json({ error: 'Provider not found' });
      }

      // Resetar cooldown no rate limit tracker
      const cooldownState = rateLimitTracker.getCooldownState(id);
      if (cooldownState) {
        cooldownState.isCoolingDown = false;
        cooldownState.cooldownEndsAt = null;
        cooldownState.cooldownReason = null;
        cooldownState.consecutiveFailures = 0;
        cooldownState.nextRetryAt = null;
      }

      // Também reabilitar no apiManager
      apiManager.enableProvider(id);

      // Resetar no Firebase
      await resetApiStatusFirebase(id, provider.name, 'text');

      res.json({
        message: 'Cooldown reset (local + Firebase)',
        provider: provider.id,
        status: 'Provider is now available for use'
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Obter status completo do Firebase (todos os providers)
  app.get('/api/ai/providers/firebase-status', async (req, res) => {
    try {
      const firebaseStatus = await getAllApiStatusFromFirebase();
      res.json({
        providers: firebaseStatus,
        timestamp: Date.now()
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Resetar status de uma API no Firebase (desbloquear)
  app.post('/api/ai/providers/:id/firebase-reset', async (req, res) => {
    try {
      const { id } = req.params;
      const provider = apiManager.getProviderStats(id);

      if (!provider) {
        return res.status(404).json({ error: 'Provider not found' });
      }

      await resetApiStatusFirebase(id, provider.name, 'text');

      res.json({
        message: 'Firebase status reset',
        provider: id,
        status: 'All counters cleared, provider unblocked'
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Obter status de disponibilidade de todas as APIs (quota/availability)
  app.get('/api/ai/providers/availability', async (req, res) => {
    try {
      const status = getAllApisStatus();
      res.json({
        providers: status,
        totalEnabled: status.filter(s => s.enabled).length,
        totalDisabled: status.filter(s => !s.enabled).length,
        timestamp: Date.now()
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Desabilitar uma API manualmente
  app.post('/api/ai/providers/:id/disable', async (req, res) => {
    try {
      const { id } = req.params;
      const { reason, resetDate } = req.body;

      disableApi(id, reason || 'Manually disabled', resetDate);

      res.json({ 
        message: 'Provider disabled', 
        id,
        reason: reason || 'Manually disabled',
        resetDate: resetDate || undefined
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Habilitar uma API manualmente
  app.post('/api/ai/providers/:id/enable', async (req, res) => {
    try {
      const { id } = req.params;
      
      // Habilitar no availability config
      enableApi(id);

      // Também habilitar no apiManager
      apiManager.enableProvider(id);

      res.json({ 
        message: 'Provider enabled', 
        id 
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Testar uma API específica
  app.post('/api/ai/providers/:id/test', async (req, res) => {
    const { id } = req.params;
    const provider = apiManager.getProviderStats(id);
    const startTime = Date.now();

    try {
      if (!provider) {
        return res.status(404).json({ error: 'Provider not found' });
      }

      console.log(`[API TEST] Testing provider: ${provider.name}`);

      let response: Response;
      let generatedText = '';

      if (provider.type === 'gemini') {
        response = await fetch(`${provider.baseUrl}/${provider.model}:generateContent?key=${provider.apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: 'Responda apenas OK' }] }],
            generationConfig: { maxOutputTokens: 10, temperature: 0.1 }
          })
        });

        if (response.ok) {
          const data = await response.json();
          generatedText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
        }
      } else if (provider.type === 'openrouter' || provider.type === 'together' || provider.type === 'deepseek' || provider.type === 'aiml' || provider.type === 'xai') {
        response = await fetch(`${provider.baseUrl}/chat/completions`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${provider.apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'http://localhost:3018',
            'X-Title': 'Carrossel-IA'
          },
          body: JSON.stringify({
            model: provider.model,
            messages: [{ role: 'user', content: 'Responda apenas OK' }],
            max_tokens: 10,
            temperature: 0.1
          })
        });

        if (response.ok) {
          const data = await response.json();
          generatedText = data?.choices?.[0]?.message?.content || '';
        }
      } else if (provider.type === 'huggingface') {
        response = await fetch(`${provider.baseUrl}/${provider.model}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${provider.apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            inputs: 'Responda apenas OK',
            parameters: { max_new_tokens: 10, temperature: 0.1 }
          })
        });

        if (response.ok) {
          const data = await response.json();
          generatedText = Array.isArray(data) ? data[0]?.generated_text : data.generated_text || '';
        }
      } else {
        throw new Error(`Unknown provider type: ${provider.type}`);
      }

      const latency = Date.now() - startTime;
      const success = response!.ok && generatedText.length > 0;

      apiManager.recordRequest(id, success, latency, success ? undefined : `HTTP ${response!.status}`);

      res.json({
        providerId: id,
        providerName: provider.name,
        success,
        latency,
        response: generatedText.substring(0, 100),
        status: response!.status
      });
    } catch (error: any) {
      apiManager.recordRequest(req.params.id, false, Date.now() - startTime, error.message);
      res.status(500).json({ error: error.message });
    }
  });

  // Reavaliar uma API - testa e atualiza status automaticamente
  app.post('/api/ai/providers/:id/re-evaluate', async (req, res) => {
    const { id } = req.params;
    const provider = apiManager.getProviderStats(id);
    const startTime = Date.now();

    try {
      if (!provider) {
        return res.status(404).json({ error: 'Provider not found' });
      }

      console.log(`[API RE-EVALUATE] 🔍 Re-evaluating provider: ${provider.name} (${id})`);

      let response: Response;
      let generatedText = '';
      let errorReason = '';

      if (provider.type === 'gemini') {
        response = await fetch(`${provider.baseUrl}/${provider.model}:generateContent?key=${provider.apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: 'Responda apenas OK' }] }],
            generationConfig: { maxOutputTokens: 10, temperature: 0.1 }
          })
        });

        if (response.ok) {
          const data = await response.json();
          generatedText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
        } else {
          errorReason = await response.text();
        }
      } else if (provider.type === 'openrouter' || provider.type === 'together' || provider.type === 'deepseek' || provider.type === 'aiml' || provider.type === 'xai') {
        response = await fetch(`${provider.baseUrl}/chat/completions`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${provider.apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'http://localhost:3018',
            'X-Title': 'Carrossel-IA'
          },
          body: JSON.stringify({
            model: provider.model,
            messages: [{ role: 'user', content: 'Responda apenas OK' }],
            max_tokens: 10,
            temperature: 0.1
          })
        });

        if (response.ok) {
          const data = await response.json();
          generatedText = data?.choices?.[0]?.message?.content || '';
        } else {
          errorReason = await response.text();
        }
      } else if (provider.type === 'groq') {
        response = await fetch(`${provider.baseUrl}/chat/completions`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${provider.apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: provider.model,
            messages: [{ role: 'user', content: 'Responda apenas OK' }],
            max_tokens: 10,
            temperature: 0.1
          })
        });

        if (response.ok) {
          const data = await response.json();
          generatedText = data?.choices?.[0]?.message?.content || '';
        } else {
          errorReason = await response.text();
        }
      } else if (provider.type === 'sambanova') {
        response = await fetch(`${provider.baseUrl}/chat/completions`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${provider.apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: provider.model,
            messages: [{ role: 'user', content: 'Responda apenas OK' }],
            max_tokens: 10,
            temperature: 0.1
          })
        });

        if (response.ok) {
          const data = await response.json();
          generatedText = data?.choices?.[0]?.message?.content || '';
        } else {
          errorReason = await response.text();
        }
      } else if (provider.type === 'fireworks') {
        response = await fetch(`${provider.baseUrl}/chat/completions`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${provider.apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: provider.model,
            messages: [{ role: 'user', content: 'Responda apenas OK' }],
            max_tokens: 10,
            temperature: 0.1
          })
        });

        if (response.ok) {
          const data = await response.json();
          generatedText = data?.choices?.[0]?.message?.content || '';
        } else {
          errorReason = await response.text();
        }
      } else if (provider.type === 'dashscope') {
        response = await fetch(provider.baseUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${provider.apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: provider.model,
            input: { messages: [{ role: 'user', content: 'Responda apenas OK' }] },
            parameters: { max_tokens: 10, temperature: 0.1 }
          })
        });

        if (response.ok) {
          const data = await response.json();
          generatedText = data?.output?.text || data?.output?.choices?.[0]?.message?.content || '';
        } else {
          errorReason = await response.text();
        }
      } else if (provider.type === 'anthropic') {
        response = await fetch(`${provider.baseUrl}/messages`, {
          method: 'POST',
          headers: {
            'x-api-key': provider.apiKey,
            'Content-Type': 'application/json',
            'anthropic-version': '2023-06-01'
          },
          body: JSON.stringify({
            model: provider.model,
            messages: [{ role: 'user', content: 'Responda apenas OK' }],
            max_tokens: 10
          })
        });

        if (response.ok) {
          const data = await response.json();
          generatedText = data?.content?.[0]?.text || '';
        } else {
          errorReason = await response.text();
        }
      } else if (provider.type === 'huggingface') {
        response = await fetch(`${provider.baseUrl}/${provider.model}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${provider.apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            inputs: 'Responda apenas OK',
            parameters: { max_new_tokens: 10, temperature: 0.1 }
          })
        });

        if (response.ok) {
          const data = await response.json();
          generatedText = Array.isArray(data) ? data[0]?.generated_text : data.generated_text || '';
        } else {
          errorReason = await response.text();
        }
      } else {
        throw new Error(`Unknown provider type: ${provider.type}`);
      }

      const latency = Date.now() - startTime;
      const success = response!.ok && generatedText.length > 0;
      const statusCode = response!.status;

      // Registrar no apiManager
      apiManager.recordRequest(id, success, latency, success ? undefined : `HTTP ${statusCode}`);

      // CORREÇÃO: Atualizar status de disponibilidade automaticamente
      let action = 'none';
      let actionReason = '';

      if (success) {
        // Sucesso: reabilitar se estava desabilitado
        const wasDisabled = !isApiAvailable(id);
        if (wasDisabled) {
          enableApi(id);
          action = 're-enabled';
          actionReason = `Test passed (HTTP ${statusCode}, ${latency}ms)`;
          console.log(`[API RE-EVALUATE] ✅ ${id} re-enabled automatically`);
        } else {
          action = 'kept-enabled';
          actionReason = `Already enabled, test passed (HTTP ${statusCode}, ${latency}ms)`;
          console.log(`[API RE-EVALUATE] ✅ ${id} confirmed enabled`);
        }

        // Limpar cooldown se existir
        rateLimitTracker.resetCooldown?.(id);
      } else {
        // Falha: desabilitar automaticamente
        const errorSummary = errorReason.substring(0, 200);
        let disableReason = '';

        // Criar mensagem de erro mais legível
        if (statusCode === 401 || errorReason.includes('401')) {
          disableReason = `401 Unauthorized - API key inválida ou expirada`;
        } else if (statusCode === 402 || errorReason.includes('402')) {
          disableReason = `402 Payment Required - Sem créditos na conta`;
        } else if (statusCode === 404 || errorReason.includes('404')) {
          disableReason = `404 Not Found - Endpoint ou modelo não existe`;
        } else if (statusCode === 410 || errorReason.includes('410')) {
          disableReason = `410 Gone - Modelo descontinuado`;
        } else if (statusCode === 429 || errorReason.includes('429') || errorReason.includes('quota')) {
          disableReason = `429 Rate Limit - Quota excedida`;
        } else if (statusCode >= 500) {
          disableReason = `HTTP ${statusCode} - Erro interno do servidor`;
        } else {
          disableReason = `HTTP ${statusCode} - ${errorSummary.substring(0, 100)}`;
        }

        // Só desabilita automaticamente se não estava já habilitado antes
        const wasEnabled = isApiAvailable(id);
        if (!wasEnabled) {
          action = 'kept-disabled';
          actionReason = `Already disabled, test failed: ${disableReason}`;
          console.log(`[API RE-EVALUATE] ⏸️ ${id} kept disabled: ${disableReason}`);
        } else {
          // Se estava habilitado e falhou, apenas registra a falha (não desabilita na primeira falha)
          // O auto-disable do apiManager cuida de desabilitar após 10 falhas consecutivas
          action = 'test-failed';
          actionReason = `Test failed: ${disableReason}. Falhas consecutivas: ${provider.stats.consecutiveFailures}`;
          console.warn(`[API RE-EVALUATE] ❌ ${id} test failed: ${disableReason}`);
        }
      }

      res.json({
        providerId: id,
        providerName: provider.name,
        success,
        latency,
        statusCode,
        response: generatedText.substring(0, 100),
        error: errorReason.substring(0, 300),
        action,
        actionReason,
        consecutiveFailures: provider.stats.consecutiveFailures,
        evaluatedAt: new Date().toISOString()
      });
    } catch (error: any) {
      const latency = Date.now() - startTime;
      apiManager.recordRequest(req.params.id, false, latency, error.message);

      // Criar motivo legível
      let disableReason = error.message?.substring(0, 150) || 'Erro desconhecido';
      if (error.message?.includes('fetch') || error.message?.includes('network') || error.message?.includes('ENOTFOUND')) {
        disableReason = 'Erro de rede - servidor inacessível';
      } else if (error.message?.includes('timeout') || error.code === 'ETIMEOUT') {
        disableReason = 'Timeout - servidor não respondeu a tempo';
      }

      const wasEnabled = isApiAvailable(req.params.id);

      res.status(500).json({
        providerId: req.params.id,
        success: false,
        latency,
        error: error.message,
        action: wasEnabled ? 'test-failed' : 'kept-disabled',
        actionReason: wasEnabled
          ? `Test failed: ${disableReason}`
          : `Already disabled, test failed: ${disableReason}`,
        consecutiveFailures: apiManager.getProviderStats(req.params.id)?.stats.consecutiveFailures || 0,
        evaluatedAt: new Date().toISOString()
      });
    }
  });

  // ==========================================
  // ENDPOINTS DE ANALYTICS E MÉTRICAS
  // ==========================================

  // Obter métricas de uso de IA em tempo real
  app.get('/api/analytics/realtime', async (req, res) => {
    try {
      const realtimeMetrics = observability.getRealtimeMetrics();
      const cacheStats = aiGateway ? aiGateway.getCacheStats() : { totalEntries: 0, hitRate: 0 };
      
      res.json({
        realtime: realtimeMetrics,
        aiGatewayCache: cacheStats,
        timestamp: Date.now()
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Obter relatório de uso (últimas 24h)
  app.get('/api/analytics/usage', async (req, res) => {
    try {
      const period = (req.query.period as 'hour' | 'day' | 'week') || 'day';
      const report = observability.getUsageReport(period);
      
      res.json({
        period,
        ...report,
        timestamp: Date.now()
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Exportar métricas
  app.get('/api/analytics/export', async (req, res) => {
    try {
      const format = (req.query.format as 'json' | 'csv') || 'json';
      const data = observability.exportMetrics(format);
      
      res.setHeader('Content-Type', format === 'csv' ? 'text/csv' : 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename=metrics.${format}`);
      res.send(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Estatísticas do R2 Storage
  app.get('/api/storage/stats', async (req, res) => {
    try {
      if (!r2Storage) {
        return res.status(500).json({ error: 'R2 Storage not configured' });
      }

      const stats = await r2Storage.getCacheStats();
      res.json(stats);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Listar imagens em cache R2
  app.get('/api/storage/cache', async (req, res) => {
    try {
      if (!r2Storage) {
        return res.status(500).json({ error: 'R2 Storage not configured' });
      }

      const limit = parseInt(req.query.limit as string) || 50;
      const images = await r2Storage.listCachedImages(limit);
      
      res.json({ images, total: images.length });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Limpar cache R2
  app.delete('/api/storage/cache/:key', async (req, res) => {
    try {
      if (!r2Storage) {
        return res.status(500).json({ error: 'R2 Storage not configured' });
      }

      const success = await r2Storage.deleteCachedImage(req.params.key);
      res.json({ success });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Vite middleware
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      root: process.cwd(),
      server: {
        middlewareMode: true,
        hmr: false,
        watch: {
          usePolling: true,
          interval: 100
        }
      },
      appType: 'custom'
    });

    app.use(vite.middlewares);

    app.use('*', async (req, res) => {
      try {
        const url = req.originalUrl;
        let html = await fs.promises.readFile(path.resolve(process.cwd(), 'index.html'), 'utf-8');
        html = await vite.transformIndexHtml(url, html);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(html);
      } catch (e: any) {
        vite.ssrFixStacktrace(e);
        console.error(e);
        res.status(500).end(e.message);
      }
    });
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

