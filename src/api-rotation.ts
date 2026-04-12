// Sistema de Rotação de APIs com Ranking Automático e Rate Limiting
// Gerencia múltiplos provedores de IA e seleciona automaticamente o melhor

import { rateLimitTracker } from './services/rate-limit-tracker';
import { isApiAvailable } from './config/api-availability';

export interface ApiProvider {
  id: string;
  name: string;
  type: 'gemini' | 'openrouter' | 'together' | 'deepseek' | 'huggingface' | 'anthropic' | 'aiml' | 'groq' | 'sambanova' | 'fireworks' | 'deepinfra' | 'dashscope';
  baseUrl: string;
  model: string;
  apiKey: string;
  enabled: boolean;
  // Métricas de desempenho
  stats: {
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    averageLatency: number;
    lastUsed: number | null;
    lastError: string | null;
    lastErrorTime: number | null;
    consecutiveFailures: number;
  };
  // Configurações específicas
  headers?: Record<string, string>;
}

export interface ApiRanking {
  providerId: string;
  name: string;
  score: number; // 0-100
  successRate: number; // 0-100
  averageLatency: number; // ms
  status: 'healthy' | 'degraded' | 'unhealthy' | 'disabled';
  quotaExhausted: boolean;
}

export class ApiRotationManager {
  private providers: ApiProvider[] = [];
  private currentIndex: number = 0;
  private initialized: boolean = false;

  initialize() {
    if (this.initialized) {
      console.log('[API ROTATION] Already initialized, skipping');
      return;
    }

    this.initializeProviders();
    this.initialized = true;
  }

  private initializeProviders() {
    // ==========================================
    // OPENROUTER - 4 CHAVES (Nemotron, Gemma)
    // ==========================================
    const openrouterKey1 = process.env.OPENROUTER_API_KEY?.trim();
    const openrouterKey2 = process.env.OPENROUTER_API_KEY_BACKUP?.trim();
    const openrouterKey3 = process.env.OPENROUTER_API_KEY_3?.trim();
    const openrouterKey4 = process.env.OPENROUTER_API_KEY_4?.trim();

    if (openrouterKey1) {
      this.providers.push({
        id: 'nemotron-1',
        name: 'Nemotron 3 Super 120B (OpenRouter 1 - Italo)',
        type: 'openrouter',
        baseUrl: 'https://openrouter.ai/api/v1',
        model: 'nvidia/nemotron-3-super-120b-a12b:free',
        apiKey: openrouterKey1,
        enabled: true,
        stats: { totalRequests: 0, successfulRequests: 0, failedRequests: 0, averageLatency: 0, lastUsed: null, lastError: null, lastErrorTime: null, consecutiveFailures: 0 }
      });
    }

    if (openrouterKey2) {
      this.providers.push({
        id: 'nemotron-2',
        name: 'Nemotron 3 Super 120B (OpenRouter 2 - Odonto)',
        type: 'openrouter',
        baseUrl: 'https://openrouter.ai/api/v1',
        model: 'nvidia/nemotron-3-super-120b-a12b:free',
        apiKey: openrouterKey2,
        enabled: true,
        stats: { totalRequests: 0, successfulRequests: 0, failedRequests: 0, averageLatency: 0, lastUsed: null, lastError: null, lastErrorTime: null, consecutiveFailures: 0 }
      });
    }

    if (openrouterKey3) {
      this.providers.push({
        id: 'nemotron-3',
        name: 'Nemotron 3 Super 120B (OpenRouter 3 - Coruja)',
        type: 'openrouter',
        baseUrl: 'https://openrouter.ai/api/v1',
        model: 'nvidia/nemotron-3-super-120b-a12b:free',
        apiKey: openrouterKey3,
        enabled: true,
        stats: { totalRequests: 0, successfulRequests: 0, failedRequests: 0, averageLatency: 0, lastUsed: null, lastError: null, lastErrorTime: null, consecutiveFailures: 0 }
      });
    }

    if (openrouterKey4) {
      this.providers.push({
        id: 'nemotron-4',
        name: 'Nemotron 3 Super 120B (OpenRouter 4 - Dandhara)',
        type: 'openrouter',
        baseUrl: 'https://openrouter.ai/api/v1',
        model: 'nvidia/nemotron-3-super-120b-a12b:free',
        apiKey: openrouterKey4,
        enabled: true,
        stats: { totalRequests: 0, successfulRequests: 0, failedRequests: 0, averageLatency: 0, lastUsed: null, lastError: null, lastErrorTime: null, consecutiveFailures: 0 }
      });
    }

    // ==========================================
    // GOOGLE GEMMA 4 - 3 CHAVES OPENROUTER
    // ==========================================
    if (openrouterKey1) {
      this.providers.push({
        id: 'gemma4-1',
        name: 'Google Gemma 4 31B (OpenRouter 1 - Italo)',
        type: 'openrouter',
        baseUrl: 'https://openrouter.ai/api/v1',
        model: 'google/gemma-4-31b-it:free',
        apiKey: openrouterKey1,
        enabled: true,
        stats: { totalRequests: 0, successfulRequests: 0, failedRequests: 0, averageLatency: 0, lastUsed: null, lastError: null, lastErrorTime: null, consecutiveFailures: 0 }
      });
    }
    if (openrouterKey2) {
      this.providers.push({
        id: 'gemma4-2',
        name: 'Google Gemma 4 26B A4B (OpenRouter 2 - Odonto)',
        type: 'openrouter',
        baseUrl: 'https://openrouter.ai/api/v1',
        model: 'google/gemma-4-26b-a4b-it:free',
        apiKey: openrouterKey2,
        enabled: true,
        stats: { totalRequests: 0, successfulRequests: 0, failedRequests: 0, averageLatency: 0, lastUsed: null, lastError: null, lastErrorTime: null, consecutiveFailures: 0 }
      });
    }
    if (openrouterKey3) {
      this.providers.push({
        id: 'gemma4-3',
        name: 'Google Gemma 4 (OpenRouter 3 - Coruja)',
        type: 'openrouter',
        baseUrl: 'https://openrouter.ai/api/v1',
        model: 'google/gemma-4-31b-it:free',
        apiKey: openrouterKey3,
        enabled: true,
        stats: { totalRequests: 0, successfulRequests: 0, failedRequests: 0, averageLatency: 0, lastUsed: null, lastError: null, lastErrorTime: null, consecutiveFailures: 0 }
      });
    }
    if (openrouterKey4) {
      this.providers.push({
        id: 'gemma4-4',
        name: 'Google Gemma 4 (OpenRouter 4 - Dandhara)',
        type: 'openrouter',
        baseUrl: 'https://openrouter.ai/api/v1',
        model: 'google/gemma-4-31b-it:free',
        apiKey: openrouterKey4,
        enabled: true,
        stats: { totalRequests: 0, successfulRequests: 0, failedRequests: 0, averageLatency: 0, lastUsed: null, lastError: null, lastErrorTime: null, consecutiveFailures: 0 }
      });
    }

    // ==========================================
    // FIREWORKS AI - 3 CHAVES (Llama 70B)
    // ==========================================
    const fireworksKey1 = process.env.FIREWORKS_API_KEY?.trim();
    const fireworksKey2 = process.env.FIREWORKS_API_KEY_BACKUP_1?.trim();
    const fireworksKey3 = process.env.FIREWORKS_API_KEY_BACKUP_2?.trim();

    if (fireworksKey1) {
      this.providers.push({
        id: 'fireworks-1',
        name: 'Fireworks AI (Llama 70B - Italo)',
        type: 'fireworks',
        baseUrl: 'https://api.fireworks.ai/inference/v1',
        model: 'accounts/fireworks/models/llama-v3p3-70b-instruct',
        apiKey: fireworksKey1,
        enabled: true,
        stats: { totalRequests: 0, successfulRequests: 0, failedRequests: 0, averageLatency: 0, lastUsed: null, lastError: null, lastErrorTime: null, consecutiveFailures: 0 }
      });
    }
    if (fireworksKey2) {
      this.providers.push({
        id: 'fireworks-2',
        name: 'Fireworks AI (Llama 70B - Coruja)',
        type: 'fireworks',
        baseUrl: 'https://api.fireworks.ai/inference/v1',
        model: 'accounts/fireworks/models/llama-v3p3-70b-instruct',
        apiKey: fireworksKey2,
        enabled: true,
        stats: { totalRequests: 0, successfulRequests: 0, failedRequests: 0, averageLatency: 0, lastUsed: null, lastError: null, lastErrorTime: null, consecutiveFailures: 0 }
      });
    }
    if (fireworksKey3) {
      this.providers.push({
        id: 'fireworks-3',
        name: 'Fireworks AI (Llama 70B - Odonto)',
        type: 'fireworks',
        baseUrl: 'https://api.fireworks.ai/inference/v1',
        model: 'accounts/fireworks/models/llama-v3p3-70b-instruct',
        apiKey: fireworksKey3,
        enabled: true,
        stats: { totalRequests: 0, successfulRequests: 0, failedRequests: 0, averageLatency: 0, lastUsed: null, lastError: null, lastErrorTime: null, consecutiveFailures: 0 }
      });
    }

    // ==========================================
    // ALIBABA DASHSCOPE - 3 CHAVES (Qwen Plus)
    // ==========================================
    const dashscopeKey1 = process.env.ALIYUN_DASHSCOPE_API_KEY?.trim();
    const dashscopeKey2 = process.env.ALIYUN_DASHSCOPE_API_KEY_BACKUP_1?.trim();
    const dashscopeKey3 = process.env.ALIYUN_DASHSCOPE_API_KEY_BACKUP_2?.trim();

    if (dashscopeKey1) {
      this.providers.push({
        id: 'dashscope-1',
        name: 'Alibaba DashScope (Qwen Plus - Italo)',
        type: 'dashscope',
        baseUrl: 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation',
        model: 'qwen-plus',
        apiKey: dashscopeKey1,
        enabled: true,
        stats: { totalRequests: 0, successfulRequests: 0, failedRequests: 0, averageLatency: 0, lastUsed: null, lastError: null, lastErrorTime: null, consecutiveFailures: 0 }
      });
    }
    if (dashscopeKey2) {
      this.providers.push({
        id: 'dashscope-2',
        name: 'Alibaba DashScope (Qwen Plus - Odonto)',
        type: 'dashscope',
        baseUrl: 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation',
        model: 'qwen-plus',
        apiKey: dashscopeKey2,
        enabled: true,
        stats: { totalRequests: 0, successfulRequests: 0, failedRequests: 0, averageLatency: 0, lastUsed: null, lastError: null, lastErrorTime: null, consecutiveFailures: 0 }
      });
    }
    if (dashscopeKey3) {
      this.providers.push({
        id: 'dashscope-3',
        name: 'Alibaba DashScope (Qwen Plus - Coruja)',
        type: 'dashscope',
        baseUrl: 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation',
        model: 'qwen-plus',
        apiKey: dashscopeKey3,
        enabled: true,
        stats: { totalRequests: 0, successfulRequests: 0, failedRequests: 0, averageLatency: 0, lastUsed: null, lastError: null, lastErrorTime: null, consecutiveFailures: 0 }
      });
    }

    // ==========================================
    // GROQ - 3 CHAVES (Ultra-rápido)
    // ==========================================
    const groqKey1 = process.env.GROQ_API_KEY?.trim();
    const groqKey2 = process.env.GROQ_API_KEY_BACKUP_1?.trim();
    const groqKey3 = process.env.GROQ_API_KEY_BACKUP_2?.trim();

    if (groqKey1) {
      this.providers.push({
        id: 'groq-1',
        name: 'Groq (Llama 70B - Italo)',
        type: 'groq',
        baseUrl: 'https://api.groq.com/openai/v1',
        model: 'llama-3.3-70b-versatile',
        apiKey: groqKey1,
        enabled: true,
        stats: { totalRequests: 0, successfulRequests: 0, failedRequests: 0, averageLatency: 0, lastUsed: null, lastError: null, lastErrorTime: null, consecutiveFailures: 0 }
      });
    }
    if (groqKey2) {
      this.providers.push({
        id: 'groq-2',
        name: 'Groq (Llama 70B - Odonto)',
        type: 'groq',
        baseUrl: 'https://api.groq.com/openai/v1',
        model: 'llama-3.3-70b-versatile',
        apiKey: groqKey2,
        enabled: true,
        stats: { totalRequests: 0, successfulRequests: 0, failedRequests: 0, averageLatency: 0, lastUsed: null, lastError: null, lastErrorTime: null, consecutiveFailures: 0 }
      });
    }
    if (groqKey3) {
      this.providers.push({
        id: 'groq-3',
        name: 'Groq (Llama 70B - Coruja)',
        type: 'groq',
        baseUrl: 'https://api.groq.com/openai/v1',
        model: 'llama-3.3-70b-versatile',
        apiKey: groqKey3,
        enabled: true,
        stats: { totalRequests: 0, successfulRequests: 0, failedRequests: 0, averageLatency: 0, lastUsed: null, lastError: null, lastErrorTime: null, consecutiveFailures: 0 }
      });
    }

    // ==========================================
    // SAMBANOVA - 3 CHAVES
    // ==========================================
    const sambanovaKey1 = process.env.SAMBANOVA_API_KEY?.trim();
    const sambanovaKey2 = process.env.SAMBANOVA_API_KEY_BACKUP_1?.trim();
    const sambanovaKey3 = process.env.SAMBANOVA_API_KEY_BACKUP_2?.trim();

    if (sambanovaKey1) {
      this.providers.push({
        id: 'sambanova-1',
        name: 'SambaNova (Llama 8B - Italo)',
        type: 'sambanova',
        baseUrl: 'https://api.sambanova.ai/v1',
        model: 'Meta-Llama-3.1-8B-Instruct',
        apiKey: sambanovaKey1,
        enabled: true,
        stats: { totalRequests: 0, successfulRequests: 0, failedRequests: 0, averageLatency: 0, lastUsed: null, lastError: null, lastErrorTime: null, consecutiveFailures: 0 }
      });
    }
    if (sambanovaKey2) {
      this.providers.push({
        id: 'sambanova-2',
        name: 'SambaNova (Llama 8B - Coruja)',
        type: 'sambanova',
        baseUrl: 'https://api.sambanova.ai/v1',
        model: 'Meta-Llama-3.1-8B-Instruct',
        apiKey: sambanovaKey2,
        enabled: true,
        stats: { totalRequests: 0, successfulRequests: 0, failedRequests: 0, averageLatency: 0, lastUsed: null, lastError: null, lastErrorTime: null, consecutiveFailures: 0 }
      });
    }
    if (sambanovaKey3) {
      this.providers.push({
        id: 'sambanova-3',
        name: 'SambaNova (Llama 8B - Odonto)',
        type: 'sambanova',
        baseUrl: 'https://api.sambanova.ai/v1',
        model: 'Meta-Llama-3.1-8B-Instruct',
        apiKey: sambanovaKey3,
        enabled: true,
        stats: { totalRequests: 0, successfulRequests: 0, failedRequests: 0, averageLatency: 0, lastUsed: null, lastError: null, lastErrorTime: null, consecutiveFailures: 0 }
      });
    }

    // ==========================================
    // AIMLAPI - 3 CHAVES
    // ==========================================
    const aimlKey1 = process.env.AIML_API_KEY?.trim();
    const aimlKey2 = process.env.AIML_API_KEY_BACKUP_1?.trim();
    const aimlKey3 = process.env.AIML_API_KEY_BACKUP_2?.trim();

    if (aimlKey1) {
      this.providers.push({
        id: 'aiml-1',
        name: 'AIMLAPI (Llama 70B - Italo)',
        type: 'aiml',
        baseUrl: 'https://api.aimlapi.com/v1',
        model: 'meta-llama/Llama-3.3-70B-Instruct',
        apiKey: aimlKey1,
        enabled: true,
        stats: { totalRequests: 0, successfulRequests: 0, failedRequests: 0, averageLatency: 0, lastUsed: null, lastError: null, lastErrorTime: null, consecutiveFailures: 0 }
      });
    }
    if (aimlKey2) {
      this.providers.push({
        id: 'aiml-2',
        name: 'AIMLAPI (Llama 70B - Odonto)',
        type: 'aiml',
        baseUrl: 'https://api.aimlapi.com/v1',
        model: 'meta-llama/Llama-3.3-70B-Instruct',
        apiKey: aimlKey2,
        enabled: true,
        stats: { totalRequests: 0, successfulRequests: 0, failedRequests: 0, averageLatency: 0, lastUsed: null, lastError: null, lastErrorTime: null, consecutiveFailures: 0 }
      });
    }
    if (aimlKey3) {
      this.providers.push({
        id: 'aiml-3',
        name: 'AIMLAPI (Llama 70B - Coruja)',
        type: 'aiml',
        baseUrl: 'https://api.aimlapi.com/v1',
        model: 'meta-llama/Llama-3.3-70B-Instruct',
        apiKey: aimlKey3,
        enabled: true,
        stats: { totalRequests: 0, successfulRequests: 0, failedRequests: 0, averageLatency: 0, lastUsed: null, lastError: null, lastErrorTime: null, consecutiveFailures: 0 }
      });
    }

    // ==========================================
    // ANTHROPIC CLAUDE - 3 CHAVES
    // ==========================================
    const anthropicKey1 = process.env.ANTHROPIC_API_KEY?.trim();
    const anthropicKey2 = process.env.ANTHROPIC_API_KEY_BACKUP_1?.trim();
    const anthropicKey3 = process.env.ANTHROPIC_API_KEY_BACKUP_2?.trim();

    if (anthropicKey1) {
      this.providers.push({
        id: 'anthropic-1',
        name: 'Anthropic Claude (Italo)',
        type: 'anthropic',
        baseUrl: 'https://api.anthropic.com/v1',
        model: 'claude-3-5-sonnet-20241022',
        apiKey: anthropicKey1,
        enabled: true,
        stats: { totalRequests: 0, successfulRequests: 0, failedRequests: 0, averageLatency: 0, lastUsed: null, lastError: null, lastErrorTime: null, consecutiveFailures: 0 }
      });
    }
    if (anthropicKey2) {
      this.providers.push({
        id: 'anthropic-2',
        name: 'Anthropic Claude (Odonto)',
        type: 'anthropic',
        baseUrl: 'https://api.anthropic.com/v1',
        model: 'claude-3-5-sonnet-20241022',
        apiKey: anthropicKey2,
        enabled: true,
        stats: { totalRequests: 0, successfulRequests: 0, failedRequests: 0, averageLatency: 0, lastUsed: null, lastError: null, lastErrorTime: null, consecutiveFailures: 0 }
      });
    }
    if (anthropicKey3) {
      this.providers.push({
        id: 'anthropic-3',
        name: 'Anthropic Claude (Coruja)',
        type: 'anthropic',
        baseUrl: 'https://api.anthropic.com/v1',
        model: 'claude-3-5-sonnet-20241022',
        apiKey: anthropicKey3,
        enabled: true,
        stats: { totalRequests: 0, successfulRequests: 0, failedRequests: 0, averageLatency: 0, lastUsed: null, lastError: null, lastErrorTime: null, consecutiveFailures: 0 }
      });
    }

    // ==========================================
    // GOOGLE GEMINI - 4 CHAVES
    // ==========================================
    const googleKey1 = process.env.GOOGLE_API_KEY?.trim();
    const geminiKeysEnv = process.env.GEMINI_API_KEYS?.trim();
    const allGeminiKeys = [googleKey1, ...(geminiKeysEnv ? geminiKeysEnv.split(',').map(k => k.trim()).filter(k => k) : [])].filter(k => k);

    allGeminiKeys.forEach((key, index) => {
      const names = ['Italo', 'Odonto Jus', 'Coruja', 'Exocad'];
      this.providers.push({
        id: `gemini-${index + 1}`,
        name: `Google Gemini ${index + 1} (${names[index] || 'Backup'})`,
        type: 'gemini',
        baseUrl: 'https://generativelanguage.googleapis.com/v1beta/models',
        model: 'gemini-2.0-flash',
        apiKey: key,
        enabled: true,
        stats: { totalRequests: 0, successfulRequests: 0, failedRequests: 0, averageLatency: 0, lastUsed: null, lastError: null, lastErrorTime: null, consecutiveFailures: 0 }
      });
    });

    // Together AI (chave existente)
    const togetherKey = process.env.TOGETHER_API_KEY?.trim();
    if (togetherKey) {
      this.providers.push({
        id: 'together-1',
        name: 'Together AI (Llama 70B)',
        type: 'together',
        baseUrl: 'https://api.together.xyz/v1',
        model: 'meta-llama/Llama-3.3-70B-Instruct-Turbo',
        apiKey: togetherKey,
        enabled: true,
        stats: { totalRequests: 0, successfulRequests: 0, failedRequests: 0, averageLatency: 0, lastUsed: null, lastError: null, lastErrorTime: null, consecutiveFailures: 0 }
      });
    }

    // DeepSeek (chave existente)
    const deepseekKey = process.env.DEEPSEEK_API_KEY?.trim();
    if (deepseekKey) {
      this.providers.push({
        id: 'deepseek-1',
        name: 'DeepSeek Chat',
        type: 'deepseek',
        baseUrl: 'https://api.deepseek.com/v1',
        model: 'deepseek-chat',
        apiKey: deepseekKey,
        enabled: true,
        stats: { totalRequests: 0, successfulRequests: 0, failedRequests: 0, averageLatency: 0, lastUsed: null, lastError: null, lastErrorTime: null, consecutiveFailures: 0 }
      });
    }

    // HuggingFace (chave existente)
    const hfKey = process.env.HF_API_KEY?.trim();
    if (hfKey) {
      this.providers.push({
        id: 'huggingface-1',
        name: 'HuggingFace (Qwen)',
        type: 'huggingface',
        baseUrl: 'https://api-inference.huggingface.co/models',
        model: 'Qwen/Qwen2.5-7B-Instruct',
        apiKey: hfKey,
        enabled: true,
        stats: { totalRequests: 0, successfulRequests: 0, failedRequests: 0, averageLatency: 0, lastUsed: null, lastError: null, lastErrorTime: null, consecutiveFailures: 0 }
      });
    }

    console.log(`[API ROTATION] Initialized ${this.providers.length} providers. Order: Nemotron 120B → Gemma 4 31B → Groq → Others`);
    this.providers.forEach((p, i) => {
      const star = i < 4 ? ' ⭐' : '';
      console.log(`  ${i + 1}. ${p.name} (${p.type}) - ${p.model}${star}`);
    });
  }

  private getGeminiKeys(): string[] {
    const keys: string[] = [];
    
    // Suporte para múltiplas chaves Gemini (separadas por vírgula)
    const geminiKeysEnv = process.env.GEMINI_API_KEYS?.trim();
    if (geminiKeysEnv) {
      keys.push(...geminiKeysEnv.split(',').map(k => k.trim()).filter(k => k));
    }

    // Fallback para GOOGLE_API_KEY única
    const googleKey = process.env.GOOGLE_API_KEY?.trim();
    if (googleKey) {
      keys.push(googleKey);
    }

    return keys;
  }

  // Obter ranking de todas as APIs
  getRanking(): ApiRanking[] {
    return this.providers.map(p => {
      const successRate = p.stats.totalRequests > 0
        ? (p.stats.successfulRequests / p.stats.totalRequests) * 100
        : 100; // Novo provedor começa com 100

      // Score ponderado: 70% taxa de sucesso + 30% velocidade
      const latencyScore = Math.max(0, 100 - (p.stats.averageLatency / 100));
      const score = (successRate * 0.7) + (latencyScore * 0.3);

      // Determinar status
      let status: 'healthy' | 'degraded' | 'unhealthy' | 'disabled' = 'disabled';
      if (p.enabled) {
        if (successRate >= 80 && p.stats.averageLatency < 5000) {
          status = 'healthy';
        } else if (successRate >= 50) {
          status = 'degraded';
        } else {
          status = 'unhealthy';
        }
      }

      // Verificar se quota está esgotada (erro 429)
      const quotaExhausted = p.stats.lastError?.includes('429') || 
                            p.stats.lastError?.includes('quota') ||
                            p.stats.lastError?.includes('RESOURCE_EXHAUSTED') ||
                            false;

      return {
        providerId: p.id,
        name: p.name,
        score: Math.round(score * 10) / 10,
        successRate: Math.round(successRate * 10) / 10,
        averageLatency: Math.round(p.stats.averageLatency),
        status,
        quotaExhausted
      };
    }).sort((a, b) => b.score - a.score);
  }

  // Obter provedor mais saudável para próxima requisição
  async getNextProvider(): Promise<ApiProvider | null> {
    const ranking = this.getRanking();

    // Filtrar apenas providers habilitados, com quota disponível e NÃO em cooldown
    const healthyProviders = ranking.filter(r =>
      r.status !== 'disabled' &&
      r.status !== 'unhealthy' &&
      !r.quotaExhausted &&
      !rateLimitTracker.isProviderCoolingDown(r.providerId)
    );

    if (healthyProviders.length === 0) {
      // Se não há providers saudáveis, tenta qualquer um habilitado (mesmo em cooldown)
      const anyEnabled = this.providers.find(p => p.enabled);
      return anyEnabled || null;
    }

    // Retorna o melhor provider
    const best = healthyProviders[0];
    return this.providers.find(p => p.id === best.providerId) || null;
  }

  // Obter próximo provider IGNORANDO cooldown (forçar uso)
  async getNextProviderForce(): Promise<ApiProvider | null> {
    return this.getNextProvider();
  }

  // Registrar resultado de requisição
  recordRequest(providerId: string, success: boolean, latency: number, error?: string, statusCode?: number) {
    const provider = this.providers.find(p => p.id === providerId);
    if (!provider) return;

    provider.stats.totalRequests++;
    provider.stats.lastUsed = Date.now();

    if (success) {
      provider.stats.successfulRequests++;
      provider.stats.consecutiveFailures = 0; // Reset ao ter sucesso
    } else {
      provider.stats.failedRequests++;
      provider.stats.consecutiveFailures++;
      provider.stats.lastError = error || null;
      provider.stats.lastErrorTime = Date.now();

      // Desabilitar temporariamente se muitos erros consecutivos
      if (provider.stats.consecutiveFailures >= 10) {
        provider.enabled = false;
        console.warn(`[API ROTATION] Disabled ${provider.name} due to high failure rate (${provider.stats.consecutiveFailures} consecutive)`);

        // Reabilitar após 5 minutos
        setTimeout(() => {
          provider.enabled = true;
          provider.stats.consecutiveFailures = 0;
          console.log(`[API ROTATION] Re-enabled ${provider.name} after cooldown`);
        }, 5 * 60 * 1000);
      }
    }

    // Calcular latência média móvel (últimas 10 requisições)
    const alpha = 0.3; // Fator de suavização
    provider.stats.averageLatency = provider.stats.averageLatency === 0
      ? latency
      : (alpha * latency) + ((1 - alpha) * provider.stats.averageLatency);

    // Registrar no rate limit tracker
    rateLimitTracker.recordUsage(
      providerId,
      provider.name,
      success,
      undefined, // tokensUsed - pode ser adicionado depois
      error,
      statusCode
    );
  }

  // Verificar se provider está disponível (não em cooldown)
  isProviderAvailable(providerId: string): boolean {
    return !rateLimitTracker.isProviderCoolingDown(providerId);
  }

  // Obter tempo até provider estar disponível
  getProviderAvailability(providerId: string): {
    isAvailable: boolean;
    waitSeconds: number;
    reason: string | null;
  } {
    const availability = rateLimitTracker.getTimeUntilAvailable(providerId);
    return {
      isAvailable: availability.isAvailable,
      waitSeconds: availability.waitSeconds,
      reason: availability.reason
    };
  }

  // Obter estatísticas de um provider específico
  getProviderStats(providerId: string): ApiProvider | undefined {
    return this.providers.find(p => p.id === providerId);
  }

  // Obter todos os providers
  getAllProviders(): ApiProvider[] {
    return [...this.providers];
  }

  /**
   * Verificar saúde das APIs - retorna quantas estão funcionais
   * Exige pelo menos MIN_HEALTHY_APIS para considerar o sistema saudável
   */
  async checkApiHealth(minHealthyApis: number = 3): Promise<{
    isHealthy: boolean;
    healthyCount: number;
    totalCount: number;
    requiredCount: number;
    healthyProviders: Array<{ id: string; name: string; successRate: number }>;
    message: string;
  }> {
    // Filtrar apenas providers habilitados E disponíveis na config
    const enabledProviders = this.providers.filter(p => p.enabled && isApiAvailable(p.id));
    const healthyProviders: Array<{ id: string; name: string; successRate: number }> = [];

    for (const provider of enabledProviders) {
      const stats = provider.stats;
      
      // Calcular taxa de sucesso
      const successRate = stats.totalRequests > 0
        ? (stats.successfulRequests / stats.totalRequests) * 100
        : 100; // Sem histórico = considera saudável

      // Critérios para ser saudável:
      // 1. Não está em cooldown
      // 2. Falhas consecutivas < 5
      // 3. Taxa de sucesso > 50% (se tiver histórico)
      const isCoolingDown = rateLimitTracker.isProviderCoolingDown(provider.id);
      const hasTooManyFailures = stats.consecutiveFailures >= 5 || 
                                 (stats.totalRequests > 0 && (stats.failedRequests / stats.totalRequests) > 0.8);
      const hasLowSuccessRate = stats.totalRequests >= 3 && successRate < 50;

      if (!isCoolingDown && !hasTooManyFailures && !hasLowSuccessRate) {
        healthyProviders.push({
          id: provider.id,
          name: provider.name,
          successRate
        });
      }
    }

    const isHealthy = healthyProviders.length >= minHealthyApis;

    return {
      isHealthy,
      healthyCount: healthyProviders.length,
      totalCount: enabledProviders.length,
      requiredCount: minHealthyApis,
      healthyProviders,
      message: isHealthy
        ? `✅ ${healthyProviders.length} APIs saudáveis (mínimo: ${minHealthyApis})`
        : `⚠️ Apenas ${healthyProviders.length} APIs saudáveis (necessário: ${minHealthyApis})`
    };
  }

  /**
   * Adicionar novo provider dinamicamente
   */
  addProvider(provider: Omit<ApiProvider, 'stats' | 'enabled'>) {
    const newProvider: ApiProvider = {
      ...provider,
      enabled: true,
      stats: {
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        averageLatency: 0,
        lastUsed: null,
        lastError: null,
        lastErrorTime: null,
        consecutiveFailures: 0
      }
    };

    this.providers.push(newProvider);
    console.log(`[API ROTATION] Added new provider: ${provider.name}`);
    return newProvider;
  }

  // Resetar stats de um provider
  resetProviderStats(providerId: string): boolean {
    const provider = this.providers.find(p => p.id === providerId);
    if (!provider) return false;

    provider.stats.totalRequests = 0;
    provider.stats.successfulRequests = 0;
    provider.stats.failedRequests = 0;
    provider.stats.averageLatency = 0;
    provider.stats.consecutiveFailures = 0;
    provider.stats.lastUsed = null;
    provider.stats.lastError = null;
    provider.stats.lastErrorTime = null;

    console.log(`[API ROTATION] Reset stats for: ${provider.name}`);
    return true;
  }

  // Remover provider
  removeProvider(providerId: string): boolean {
    const index = this.providers.findIndex(p => p.id === providerId);
    if (index !== -1) {
      this.providers.splice(index, 1);
      console.log(`[API ROTATION] Removed provider: ${providerId}`);
      return true;
    }
    return false;
  }

  // Reabilitar provider manualmente
  enableProvider(providerId: string): boolean {
    const provider = this.providers.find(p => p.id === providerId);
    if (provider) {
      provider.enabled = true;
      provider.stats.failedRequests = 0;
      console.log(`[API ROTATION] Manually enabled ${provider.name}`);
      return true;
    }
    return false;
  }

  // Executar requisição com rotação automática
  async executeWithRotation(
    requestFn: (provider: ApiProvider) => Promise<{ ok: boolean; data: any; status: number }>
  ): Promise<{ ok: boolean; data: any; status: number; providerId: string }> {
    const maxAttempts = this.providers.filter(p => p.enabled).length;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const provider = await this.getNextProvider();

      if (!provider) {
        return {
          ok: false,
          data: null,
          status: 503,
          providerId: 'none'
        };
      }

      // DELAY MÍNIMO ANTES DE CADA TENTATIVA (evitar rate limiting)
      const MIN_DELAY_BETWEEN_REQUESTS = 2000; // 2 segundos mínimo
      const timeSinceLastUse = provider.stats.lastUsed ? Date.now() - provider.stats.lastUsed : 0;
      if (timeSinceLastUse < MIN_DELAY_BETWEEN_REQUESTS && timeSinceLastUse > 0) {
        const waitTime = MIN_DELAY_BETWEEN_REQUESTS - timeSinceLastUse;
        console.log(`[API ROTATION] ⏳ Waiting ${waitTime}ms before next request to ${provider.name} (rate limit protection)`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }

      const startTime = Date.now();

      try {
        const result = await requestFn(provider);
        const latency = Date.now() - startTime;

        this.recordRequest(provider.id, result.ok, latency);

        if (result.ok) {
          return { ...result, providerId: provider.id };
        }

        // Se falhou, adiciona delay de 10s antes de tentar próximo
        console.warn(`[API ROTATION] ${provider.name} failed, waiting 10s before trying next...`);
        await new Promise(resolve => setTimeout(resolve, 10000));
      } catch (error: any) {
        const latency = Date.now() - startTime;
        this.recordRequest(provider.id, false, latency, error.message);
        
        // Delay de 10s para erros críticos
        const isRateLimit = error.message?.includes('429') || error.message?.includes('quota') || error.message?.includes('RESOURCE_EXHAUSTED');
        console.warn(`[API ROTATION] ${provider.name} threw error (${isRateLimit ? 'RATE LIMIT' : 'error'}), waiting 10s...`);
        await new Promise(resolve => setTimeout(resolve, 10000));
      }
    }

    return {
      ok: false,
      data: null,
      status: 503,
      providerId: 'all-failed'
    };
  }
}

// Singleton export - deve ser inicializado manualmente após carregar .env
export const apiManager = new ApiRotationManager();

// ==========================================
// Funções utilitárias para rate limiting
// ==========================================

/**
 * Obtém relatório completo de rate limits e cooldowns de todas as APIs
 */
export function getRateLimitReport(): string {
  return rateLimitTracker.getAvailabilityReport();
}

/**
 * Obtém o melhor provider disponível no momento
 */
export function getBestAvailableProvider(): {
  providerId: string | null;
  providerName: string;
  waitTime: string;
  isAvailable: boolean;
} {
  const preferredOrder = apiManager.getAllProviders().map(p => p.id);
  return rateLimitTracker.getBestAvailableProvider(preferredOrder);
}

/**
 * Verifica se um provider específico está disponível
 */
export function isProviderReady(providerId: string): boolean {
  return apiManager.isProviderAvailable(providerId);
}

/**
 * Obtém tempo de espera para um provider específico
 */
export function getProviderWaitTime(providerId: string): {
  isAvailable: boolean;
  waitSeconds: number;
  reason: string | null;
} {
  return apiManager.getProviderAvailability(providerId);
}
