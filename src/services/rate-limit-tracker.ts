/**
 * Rate Limit & Cooldown Tracker Service
 * Rastreia uso de APIs e prevê quando cada uma estará disponível novamente
 */

export interface RateLimitInfo {
  providerId: string;
  providerName: string;
  currentUsage: number;
  limit: number;
  limitType: 'requests' | 'tokens' | 'daily' | 'monthly';
  windowMs: number; // janela de tempo em milissegundos
  resetsAt: number | null; // timestamp quando o limite reseta
  availableAt: number | null; // timestamp quando estará disponível
  isLimited: boolean;
  usagePercent: number; // 0-100%
  estimatedRequestsLeft: number;
}

export interface CooldownState {
  providerId: string;
  providerName: string;
  isCoolingDown: boolean;
  cooldownEndsAt: number | null;
  cooldownReason: string | null;
  consecutiveFailures: number;
  lastFailureAt: number | null;
  nextRetryAt: number | null;
}

export interface ApiQuotaConfig {
  providerId: string;
  providerName: string;
  // Rate limits conhecidos (configurações padrão dos planos gratuitos)
  requestsPerMinute?: number;
  requestsPerDay?: number;
  requestsPerMonth?: number;
  tokensPerMinute?: number;
  tokensPerDay?: number;
  // Cooldown personalizado
  cooldownAfterErrorMs?: number; // tempo de cooldown após erro
  maxConsecutiveFailures?: number; // máximo de falhas antes de cooldown
}

interface UsageRecord {
  timestamp: number;
  tokensUsed?: number;
  success: boolean;
  error?: string;
  statusCode?: number;
}

// ============================================================
// CONFIGURAÇÕES BASEADAS NOS LIMITES REAIS DOS PROVIDERS (2026)
// Fontes: Groq docs, DeepSeek docs, OpenRouter docs, Fireworks docs, SambaNova docs
// PRIORIDADE: DeepSeek > Groq > OpenRouter > Outros
// ============================================================
const DEFAULT_QUOTA_CONFIGS: Record<string, ApiQuotaConfig> = {
  // ==========================================
  // DEEPSEEK — PRIORIDADE MÁXIMA
  // Sem limites rígidos (best-effort)
  // 5M tokens grátis/30 dias, sem cartão
  // ==========================================
  'deepseek-1': {
    providerId: 'deepseek-1',
    providerName: 'DeepSeek Chat (Italo)',
    requestsPerMinute: 100,
    requestsPerDay: 5000,
    tokensPerMinute: 60000,
    cooldownAfterErrorMs: 30_000,
    maxConsecutiveFailures: 5
  },
  'deepseek-2': {
    providerId: 'deepseek-2',
    providerName: 'DeepSeek Chat (Odonto)',
    requestsPerMinute: 100,
    requestsPerDay: 5000,
    tokensPerMinute: 60000,
    cooldownAfterErrorMs: 30_000,
    maxConsecutiveFailures: 5
  },
  'deepseek-3': {
    providerId: 'deepseek-3',
    providerName: 'DeepSeek Chat (Coruja)',
    requestsPerMinute: 100,
    requestsPerDay: 5000,
    tokensPerMinute: 60000,
    cooldownAfterErrorMs: 30_000,
    maxConsecutiveFailures: 5
  },

  // ==========================================
  // GROQ — PRIORIDADE ALTA
  // 70B: 30 RPM, 12K TPM, 1K RPD
  // ==========================================
  'groq-1': {
    providerId: 'groq-1',
    providerName: 'Groq (Llama 70B - Italo)',
    requestsPerMinute: 30,
    requestsPerDay: 1000,
    tokensPerMinute: 12000,
    cooldownAfterErrorMs: 60_000,
    maxConsecutiveFailures: 3
  },
  'groq-2': {
    providerId: 'groq-2',
    providerName: 'Groq (Llama 70B - Odonto)',
    requestsPerMinute: 30,
    requestsPerDay: 1000,
    tokensPerMinute: 12000,
    cooldownAfterErrorMs: 60_000,
    maxConsecutiveFailures: 3
  },
  'groq-3': {
    providerId: 'groq-3',
    providerName: 'Groq (Llama 70B - Coruja)',
    requestsPerMinute: 30,
    requestsPerDay: 1000,
    tokensPerMinute: 12000,
    cooldownAfterErrorMs: 60_000,
    maxConsecutiveFailures: 3
  },

  // ==========================================
  // OPENROUTER (FREE TIER)
  // 20 RPM, 200 RPD (com créditos)
  // ==========================================
  'nemotron-1': {
    providerId: 'nemotron-1',
    providerName: 'Nemotron 3 Super 120B (OpenRouter 1)',
    requestsPerMinute: 20,
    requestsPerDay: 200,
    cooldownAfterErrorMs: 60_000,
    maxConsecutiveFailures: 3
  },
  'nemotron-2': {
    providerId: 'nemotron-2',
    providerName: 'Nemotron 3 Super 120B (OpenRouter 2)',
    requestsPerMinute: 20,
    requestsPerDay: 200,
    cooldownAfterErrorMs: 60_000,
    maxConsecutiveFailures: 3
  },
  'nemotron-3': {
    providerId: 'nemotron-3',
    providerName: 'Nemotron 3 Super 120B (OpenRouter 3)',
    requestsPerMinute: 20,
    requestsPerDay: 200,
    cooldownAfterErrorMs: 60_000,
    maxConsecutiveFailures: 3
  },
  'nemotron-4': {
    providerId: 'nemotron-4',
    providerName: 'Nemotron 3 Super 120B (OpenRouter 4)',
    requestsPerMinute: 20,
    requestsPerDay: 200,
    cooldownAfterErrorMs: 60_000,
    maxConsecutiveFailures: 3
  },
  'gemma4-1': {
    providerId: 'gemma4-1',
    providerName: 'Google Gemma 4 31B (OpenRouter 1)',
    requestsPerMinute: 20,
    requestsPerDay: 200,
    cooldownAfterErrorMs: 60_000,
    maxConsecutiveFailures: 3
  },
  'gemma4-2': {
    providerId: 'gemma4-2',
    providerName: 'Google Gemma 4 26B A4B (OpenRouter 2)',
    requestsPerMinute: 20,
    requestsPerDay: 200,
    cooldownAfterErrorMs: 60_000,
    maxConsecutiveFailures: 3
  },
  'gemma4-3': {
    providerId: 'gemma4-3',
    providerName: 'Google Gemma 4 (OpenRouter 3)',
    requestsPerMinute: 20,
    requestsPerDay: 200,
    cooldownAfterErrorMs: 60_000,
    maxConsecutiveFailures: 3
  },
  'gemma4-4': {
    providerId: 'gemma4-4',
    providerName: 'Google Gemma 4 (OpenRouter 4)',
    requestsPerMinute: 20,
    requestsPerDay: 200,
    cooldownAfterErrorMs: 60_000,
    maxConsecutiveFailures: 3
  },

  // ==========================================
  // FIREWORKS AI (FREE) — 10 RPM (70B)
  // ==========================================
  'fireworks-1': {
    providerId: 'fireworks-1',
    providerName: 'Fireworks AI (Llama 70B - Italo)',
    requestsPerMinute: 10,
    cooldownAfterErrorMs: 120_000,
    maxConsecutiveFailures: 3
  },
  'fireworks-2': {
    providerId: 'fireworks-2',
    providerName: 'Fireworks AI (Llama 70B - Coruja)',
    requestsPerMinute: 10,
    cooldownAfterErrorMs: 120_000,
    maxConsecutiveFailures: 3
  },
  'fireworks-3': {
    providerId: 'fireworks-3',
    providerName: 'Fireworks AI (Llama 70B - Odonto)',
    requestsPerMinute: 10,
    cooldownAfterErrorMs: 120_000,
    maxConsecutiveFailures: 3
  },

  // ==========================================
  // SAMBANOVA (DEVELOPER) — 20 RPM free
  // ==========================================
  'sambanova-1': {
    providerId: 'sambanova-1',
    providerName: 'SambaNova (Llama 8B - Italo)',
    requestsPerMinute: 20,
    cooldownAfterErrorMs: 60_000,
    maxConsecutiveFailures: 3
  },
  'sambanova-2': {
    providerId: 'sambanova-2',
    providerName: 'SambaNova (Llama 8B - Coruja)',
    requestsPerMinute: 20,
    cooldownAfterErrorMs: 60_000,
    maxConsecutiveFailures: 3
  },
  'sambanova-3': {
    providerId: 'sambanova-3',
    providerName: 'SambaNova (Llama 8B - Odonto)',
    requestsPerMinute: 20,
    cooldownAfterErrorMs: 60_000,
    maxConsecutiveFailures: 3
  },

  // ==========================================
  // AIMLAPI
  // ==========================================
  'aiml-1': {
    providerId: 'aiml-1',
    providerName: 'AIMLAPI (Llama 70B - Italo)',
    requestsPerMinute: 10,
    cooldownAfterErrorMs: 120_000,
    maxConsecutiveFailures: 3
  },
  'aiml-2': {
    providerId: 'aiml-2',
    providerName: 'AIMLAPI (Llama 70B - Odonto)',
    requestsPerMinute: 10,
    cooldownAfterErrorMs: 120_000,
    maxConsecutiveFailures: 3
  },
  'aiml-3': {
    providerId: 'aiml-3',
    providerName: 'AIMLAPI (Llama 70B - Coruja)',
    requestsPerMinute: 10,
    cooldownAfterErrorMs: 120_000,
    maxConsecutiveFailures: 3
  },

  // ==========================================
  // ANTHROPIC CLAUDE
  // ==========================================
  'anthropic-1': {
    providerId: 'anthropic-1',
    providerName: 'Anthropic Claude (Italo)',
    requestsPerMinute: 50,
    cooldownAfterErrorMs: 60_000,
    maxConsecutiveFailures: 3
  },
  'anthropic-2': {
    providerId: 'anthropic-2',
    providerName: 'Anthropic Claude (Odonto)',
    requestsPerMinute: 50,
    cooldownAfterErrorMs: 60_000,
    maxConsecutiveFailures: 3
  },
  'anthropic-3': {
    providerId: 'anthropic-3',
    providerName: 'Anthropic Claude (Coruja)',
    requestsPerMinute: 50,
    cooldownAfterErrorMs: 60_000,
    maxConsecutiveFailures: 3
  },

  // ==========================================
  // ALIBABA DASHSCOPE (QWEN)
  // International: 600 RPM, 1M TPM
  // ==========================================
  'dashscope-1': {
    providerId: 'dashscope-1',
    providerName: 'Alibaba DashScope (Qwen Plus - Italo)',
    requestsPerMinute: 600,
    requestsPerDay: 5000,
    tokensPerMinute: 1000000,
    cooldownAfterErrorMs: 60_000,
    maxConsecutiveFailures: 3
  },
  'dashscope-2': {
    providerId: 'dashscope-2',
    providerName: 'Alibaba DashScope (Qwen Plus - Odonto)',
    requestsPerMinute: 600,
    requestsPerDay: 5000,
    tokensPerMinute: 1000000,
    cooldownAfterErrorMs: 60_000,
    maxConsecutiveFailures: 3
  },
  'dashscope-3': {
    providerId: 'dashscope-3',
    providerName: 'Alibaba DashScope (Qwen Plus - Coruja)',
    requestsPerMinute: 600,
    requestsPerDay: 5000,
    tokensPerMinute: 1000000,
    cooldownAfterErrorMs: 60_000,
    maxConsecutiveFailures: 3
  },

  // ==========================================
  // TOGETHER AI
  // ==========================================
  'together-1': {
    providerId: 'together-1',
    providerName: 'Together AI (Llama)',
    requestsPerMinute: 20,
    cooldownAfterErrorMs: 120_000,
    maxConsecutiveFailures: 3
  },

  // ==========================================
  // HUGGINGFACE (FREE INFERENCE)
  // ==========================================
  'huggingface-1': {
    providerId: 'huggingface-1',
    providerName: 'HuggingFace (Qwen)',
    requestsPerMinute: 10,
    cooldownAfterErrorMs: 300_000,
    maxConsecutiveFailures: 2
  }
};

// Configuração para Gemini (múltiplas chaves)
function getGeminiQuotaConfig(index: number): ApiQuotaConfig {
  return {
    providerId: `gemini-${index + 1}`,
    providerName: `Google Gemini ${index + 1}`,
    requestsPerMinute: 15, // Gemini 2.0 Flash free tier
    requestsPerDay: 1500,
    cooldownAfterErrorMs: 60_000,
    maxConsecutiveFailures: 3
  };
}

// Configuração para APIs de imagem
const IMAGE_APIS_QUOTA_CONFIGS: Record<string, ApiQuotaConfig> = {
  'google-image': {
    providerId: 'google-image',
    providerName: 'Google AI Studio (Image)',
    requestsPerMonth: 50, // 50 imagens/mês grátis
    cooldownAfterErrorMs: 0, // limite mensal, não há cooldown
    maxConsecutiveFailures: 3
  },
  'cloudflare-image': {
    providerId: 'cloudflare-image',
    providerName: 'Cloudflare Workers AI (FLUX.1)',
    requestsPerDay: 100, // Cloudflare Workers AI free
    cooldownAfterErrorMs: 60_000,
    maxConsecutiveFailures: 3
  },
  'huggingface-image': {
    providerId: 'huggingface-image',
    providerName: 'HuggingFace (FLUX.1-dev)',
    requestsPerMinute: 10,
    cooldownAfterErrorMs: 300_000, // 5 minutos (cold start comum)
    maxConsecutiveFailures: 2
  },
  'replicate-image': {
    providerId: 'replicate-image',
    providerName: 'Replicate (SDXL)',
    cooldownAfterErrorMs: 60_000,
    maxConsecutiveFailures: 3
  },
  'leonardo-image': {
    providerId: 'leonardo-image',
    providerName: 'Leonardo.AI',
    requestsPerDay: 150, // 150 tokens/dia grátis
    cooldownAfterErrorMs: 120_000,
    maxConsecutiveFailures: 3
  },
  'modelslab-image': {
    providerId: 'modelslab-image',
    providerName: 'ModelsLab',
    requestsPerMonth: 20, // 20 créditos grátis
    cooldownAfterErrorMs: 0,
    maxConsecutiveFailures: 3
  },
  'aihorde-image': {
    providerId: 'aihorde-image',
    providerName: 'AI Horde',
    requestsPerMinute: 5,
    cooldownAfterErrorMs: 30_000,
    maxConsecutiveFailures: 5
  }
};

export class RateLimitTrackerService {
  // Histórico de uso por provider
  private usageHistory: Map<string, UsageRecord[]> = new Map();

  // Estado de cooldown por provider
  private cooldownStates: Map<string, CooldownState> = new Map();

  // Configurações de quota por provider
  private quotaConfigs: Map<string, ApiQuotaConfig> = new Map();

  // Contadores manuais de uso (para limites diários/mensais)
  private manualCounters: Map<string, { count: number; resetsAt: number }> = new Map();

  // FASE 1: Quota atual (headers x-ratelimit-*)
  private currentQuotas: Map<string, {
    remainingRequests?: number;
    remainingTokens?: number;
    limitRequests?: number;
    limitTokens?: number;
    resetsAt?: number;
    lastUpdated: number;
  }> = new Map();

  // FASE 1: Providers com quota baixa (< 10%)
  private lowQuotaProviders: Map<string, {
    markedAt: number;
    warning: string;
  }> = new Map();

  // FASE 1: Throttle ativo (Groq TPM)
  private throttledProviders: Map<string, {
    delayMs: number;
    reason: string;
    tokensUsed: number;
    startsAt: number;
    endsAt: number;
  }> = new Map();

  constructor() {
    this.initializeQuotaConfigs();
    this.loadManualCounters();
  }

  private initializeQuotaConfigs(): void {
    // Inicializar configs de texto
    Object.entries(DEFAULT_QUOTA_CONFIGS).forEach(([id, config]) => {
      this.quotaConfigs.set(id, config);
    });

    // Inicializar configs de imagem
    Object.entries(IMAGE_APIS_QUOTA_CONFIGS).forEach(([id, config]) => {
      this.quotaConfigs.set(id, config);
    });
  }

  private loadManualCounters(): void {
    // Carregar contadores do localStorage (client-side) ou variáveis de ambiente (server-side)
    try {
      if (typeof localStorage !== 'undefined') {
        const saved = localStorage.getItem('api-rate-limit-counters');
        if (saved) {
          const parsed = JSON.parse(saved);
          Object.entries(parsed).forEach(([key, value]: [string, any]) => {
            this.manualCounters.set(key, value);
          });
        }
      }
    } catch (error) {
      console.warn('[RateLimitTracker] Failed to load manual counters:', error);
    }
  }

  private saveManualCounters(): void {
    try {
      if (typeof localStorage !== 'undefined') {
        const toSave: Record<string, any> = {};
        this.manualCounters.forEach((value, key) => {
          toSave[key] = value;
        });
        localStorage.setItem('api-rate-limit-counters', JSON.stringify(toSave));
      }
    } catch (error) {
      console.warn('[RateLimitTracker] Failed to save manual counters:', error);
    }
  }

  /**
   * Registra o uso de uma API
   */
  recordUsage(
    providerId: string,
    providerName: string,
    success: boolean,
    tokensUsed?: number,
    error?: string,
    statusCode?: number
  ): void {
    const now = Date.now();
    
    // Inicializar histórico se necessário
    if (!this.usageHistory.has(providerId)) {
      this.usageHistory.set(providerId, []);
    }
    const history = this.usageHistory.get(providerId)!;
    
    // Adicionar registro
    history.push({
      timestamp: now,
      tokensUsed,
      success,
      error,
      statusCode
    });

    // Manter apenas últimas 1000 entradas para evitar memory leak
    if (history.length > 1000) {
      history.splice(0, history.length - 1000);
    }

    // Atualizar contador manual para limites diários/mensais
    if (success) {
      this.incrementManualCounter(providerId);
    }

    // Atualizar estado de cooldown baseado no resultado
    this.updateCooldownState(providerId, providerName, success, error, statusCode);

    // Salvar contadores
    this.saveManualCounters();

    // Log se houve erro
    if (!success) {
      console.warn(
        `[RateLimit] ${providerName} failed (${statusCode}): ${error}`
      );
    }
  }

  /**
   * Incrementa contador manual de uso
   */
  private incrementManualCounter(providerId: string): void {
    const config = this.quotaConfigs.get(providerId);
    if (!config) return;

    // Determinar janela de reset
    let windowMs: number;
    if (config.requestsPerDay) {
      windowMs = 24 * 60 * 60 * 1000; // 1 dia
    } else if (config.requestsPerMonth) {
      windowMs = 30 * 24 * 60 * 60 * 1000; // 30 dias
    } else {
      return; // Não precisa de contador manual para limites por minuto
    }

    const counter = this.manualCounters.get(providerId);
    const now = Date.now();

    if (!counter || now >= counter.resetsAt) {
      // Reset contador
      this.manualCounters.set(providerId, {
        count: 1,
        resetsAt: now + windowMs
      });
    } else {
      // Incrementar
      counter.count++;
      this.manualCounters.set(providerId, counter);
    }
  }

  /**
   * Atualiza estado de cooldown de um provider
   */
  private updateCooldownState(
    providerId: string,
    providerName: string,
    success: boolean,
    error?: string,
    statusCode?: number
  ): void {
    const config = this.quotaConfigs.get(providerId);
    if (!config) return;

    const now = Date.now();
    let state = this.cooldownStates.get(providerId);

    if (!state) {
      state = {
        providerId,
        providerName,
        isCoolingDown: false,
        cooldownEndsAt: null,
        cooldownReason: null,
        consecutiveFailures: 0,
        lastFailureAt: null,
        nextRetryAt: null
      };
    }

    if (success) {
      // Reset contador de falhas consecutivas
      state.consecutiveFailures = 0;
      state.lastFailureAt = null;
      
      // Se estava em cooldown e agora成功了, sair do cooldown
      if (state.isCoolingDown) {
        state.isCoolingDown = false;
        state.cooldownEndsAt = null;
        state.cooldownReason = null;
        state.nextRetryAt = null;
        console.log(`[RateLimit] ${providerName} recovered from cooldown`);
      }
    } else {
      // Incrementar falhas consecutivas
      state.consecutiveFailures++;
      state.lastFailureAt = now;

      // Verificar se deve entrar em cooldown
      const maxFailures = config.maxConsecutiveFailures || 3;
      const cooldownMs = config.cooldownAfterErrorMs || 60_000;

      if (state.consecutiveFailures >= maxFailures) {
        state.isCoolingDown = true;
        state.cooldownEndsAt = now + cooldownMs;
        state.nextRetryAt = now + cooldownMs;
        state.cooldownReason = error || `Rate limit exceeded (status: ${statusCode})`;
        
        console.warn(
          `[RateLimit] ${providerName} entered cooldown for ${cooldownMs / 1000}s ` +
          `(${state.consecutiveFailures} consecutive failures)`
        );
      }

      // Cooldown imediato para erros 429 (rate limit)
      if (statusCode === 429 || error?.includes('429') || error?.includes('quota')) {
        state.isCoolingDown = true;
        state.cooldownEndsAt = now + cooldownMs;
        state.nextRetryAt = now + cooldownMs;
        state.cooldownReason = `Rate limit hit: ${error || statusCode}`;
        
        console.warn(
          `[RateLimit] ${providerName} rate limited, cooldown for ${cooldownMs / 1000}s`
        );
      }
    }

    this.cooldownStates.set(providerId, state);
  }

  /**
   * Obtém informações de rate limit de um provider
   */
  getRateLimitInfo(providerId: string, providerName: string): RateLimitInfo {
    const config = this.quotaConfigs.get(providerId);
    const now = Date.now();

    if (!config) {
      return {
        providerId,
        providerName,
        currentUsage: 0,
        limit: 0,
        limitType: 'requests',
        windowMs: 0,
        resetsAt: null,
        availableAt: null,
        isLimited: false,
        usagePercent: 0,
        estimatedRequestsLeft: 0
      };
    }

    // Obter histórico recente
    const history = this.usageHistory.get(providerId) || [];
    
    // Calcular uso por minuto
    const oneMinuteAgo = now - 60_000;
    const recentRequests = history.filter(h => h.timestamp >= oneMinuteAgo);
    const requestsPerMinute = recentRequests.length;

    // Determinar tipo de limite e uso atual
    let limit: number;
    let currentUsage: number;
    let limitType: 'requests' | 'tokens' | 'daily' | 'monthly';
    let windowMs: number;
    let resetsAt: number | null = null;

    // Prioridade: mensal > diário > por minuto
    if (config.requestsPerMonth) {
      const counter = this.manualCounters.get(providerId);
      limitType = 'monthly';
      limit = config.requestsPerMonth;
      currentUsage = counter && now < counter.resetsAt ? counter.count : 0;
      windowMs = 30 * 24 * 60 * 60 * 1000;
      resetsAt = counter?.resetsAt || null;
    } else if (config.requestsPerDay) {
      const counter = this.manualCounters.get(providerId);
      limitType = 'daily';
      limit = config.requestsPerDay;
      currentUsage = counter && now < counter.resetsAt ? counter.count : 0;
      windowMs = 24 * 60 * 60 * 1000;
      resetsAt = counter?.resetsAt || null;
    } else {
      limitType = 'requests';
      limit = config.requestsPerMinute || 30;
      currentUsage = requestsPerMinute;
      windowMs = 60_000;
      resetsAt = oneMinuteAgo + windowMs;
    }

    const usagePercent = (currentUsage / limit) * 100;
    const isLimited = usagePercent >= 90 || this.isProviderCoolingDown(providerId);
    
    // Calcular quando estará disponível
    let availableAt: number | null = null;
    if (isLimited) {
      const cooldownState = this.cooldownStates.get(providerId);
      if (cooldownState?.isCoolingDown && cooldownState.cooldownEndsAt) {
        availableAt = cooldownState.cooldownEndsAt;
      } else if (resetsAt) {
        availableAt = resetsAt;
      }
    }

    // Estimar requests restantes
    const estimatedRequestsLeft = Math.max(0, limit - currentUsage);

    return {
      providerId,
      providerName,
      currentUsage,
      limit,
      limitType,
      windowMs,
      resetsAt,
      availableAt,
      isLimited,
      usagePercent: Math.min(100, Math.round(usagePercent * 10) / 10),
      estimatedRequestsLeft
    };
  }

  /**
   * Obtém estado de cooldown de um provider
   */
  getCooldownState(providerId: string): CooldownState | null {
    return this.cooldownStates.get(providerId) || null;
  }

  /**
   * Obtém todos os estados de cooldown ativos
   */
  getAllCooldowns(): Array<{
    providerId: string;
    providerName: string;
    isCoolingDown: boolean;
    cooldownEndsAt: number | null;
    cooldownReason: string | null;
    waitMs: number;
    waitSeconds: number;
    nextRetryAt: number | null;
  }> {
    const now = Date.now();
    const allCooldowns: Array<any> = [];

    this.cooldownStates.forEach((state, providerId) => {
      // Verificar se cooldown já expirou
      if (state.isCoolingDown && state.cooldownEndsAt) {
        if (now >= state.cooldownEndsAt) {
          // Cooldown expirou, reset estado
          state.isCoolingDown = false;
          state.cooldownEndsAt = null;
          state.cooldownReason = null;
          state.nextRetryAt = null;
          this.cooldownStates.set(providerId, state);
        }
      }

      const waitMs = state.isCoolingDown && state.cooldownEndsAt
        ? Math.max(0, state.cooldownEndsAt - now)
        : 0;

      allCooldowns.push({
        ...state,
        waitMs,
        waitSeconds: Math.ceil(waitMs / 1000)
      });
    });

    // Ordenar por tempo restante (menor primeiro)
    return allCooldowns.sort((a, b) => {
      if (!a.isCoolingDown && !b.isCoolingDown) return 0;
      if (!a.isCoolingDown) return 1;
      if (!b.isCoolingDown) return -1;
      return a.waitMs - b.waitMs;
    });
  }

  /**
   * Verifica se um provider está em cooldown
   */
  isProviderCoolingDown(providerId: string): boolean {
    const state = this.cooldownStates.get(providerId);
    if (!state?.isCoolingDown) return false;

    // Verificar se cooldown já expirou
    const now = Date.now();
    if (state.cooldownEndsAt && now >= state.cooldownEndsAt) {
      // Cooldown expirou, reset estado
      state.isCoolingDown = false;
      state.cooldownEndsAt = null;
      state.cooldownReason = null;
      state.nextRetryAt = null;
      this.cooldownStates.set(providerId, state);
      return false;
    }

    return true;
  }

  /**
   * Obtém tempo restante até o provider estar disponível
   */
  getTimeUntilAvailable(providerId: string): {
    isAvailable: boolean;
    waitMs: number;
    waitSeconds: number;
    reason: string | null;
  } {
    const now = Date.now();
    
    // Verificar cooldown
    if (this.isProviderCoolingDown(providerId)) {
      const state = this.cooldownStates.get(providerId)!;
      const waitMs = state.cooldownEndsAt ? state.cooldownEndsAt - now : 0;
      
      return {
        isAvailable: false,
        waitMs: Math.max(0, waitMs),
        waitSeconds: Math.ceil(Math.max(0, waitMs) / 1000),
        reason: state.cooldownReason || 'Rate limit cooldown'
      };
    }

    // Verificar limite de uso
    const config = this.quotaConfigs.get(providerId);
    if (config) {
      const counter = this.manualCounters.get(providerId);
      if (counter && now < counter.resetsAt) {
        if (config.requestsPerDay && counter.count >= config.requestsPerDay) {
          return {
            isAvailable: false,
            waitMs: counter.resetsAt - now,
            waitSeconds: Math.ceil((counter.resetsAt - now) / 1000),
            reason: `Daily limit reached (${counter.count}/${config.requestsPerDay})`
          };
        }
        if (config.requestsPerMonth && counter.count >= config.requestsPerMonth) {
          return {
            isAvailable: false,
            waitMs: counter.resetsAt - now,
            waitSeconds: Math.ceil((counter.resetsAt - now) / 1000),
            reason: `Monthly limit reached (${counter.count}/${config.requestsPerMonth})`
          };
        }
      }
    }

    return {
      isAvailable: true,
      waitMs: 0,
      waitSeconds: 0,
      reason: null
    };
  }

  /**
   * Obtém resumo de todas as APIs
   */
  getAllApisStatus(): {
    rateLimits: RateLimitInfo[];
    cooldowns: CooldownState[];
    availableCount: number;
    limitedCount: number;
  } {
    const rateLimits: RateLimitInfo[] = [];
    const cooldowns: CooldownState[] = [];
    let availableCount = 0;
    let limitedCount = 0;

    this.quotaConfigs.forEach((config, providerId) => {
      const rateLimit = this.getRateLimitInfo(providerId, config.providerName);
      const cooldown = this.getCooldownState(providerId);

      rateLimits.push(rateLimit);
      if (cooldown) {
        cooldowns.push(cooldown);
      }

      if (rateLimit.isLimited || this.isProviderCoolingDown(providerId)) {
        limitedCount++;
      } else {
        availableCount++;
      }
    });

    return {
      rateLimits,
      cooldowns,
      availableCount,
      limitedCount
    };
  }

  /**
   * Formata tempo para exibição
   */
  formatTime(ms: number): string {
    if (ms <= 0) return 'Agora';
    
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
      const remainingHours = hours % 24;
      return `${days}d ${remainingHours}h`;
    }
    if (hours > 0) {
      const remainingMinutes = minutes % 60;
      return `${hours}h ${remainingMinutes}m`;
    }
    if (minutes > 0) {
      const remainingSeconds = seconds % 60;
      return `${minutes}m ${remainingSeconds}s`;
    }
    return `${seconds}s`;
  }

  /**
   * Geta relatório de disponibilidade de todas as APIs
   */
  getAvailabilityReport(): string {
    const status = this.getAllApisStatus();
    const now = Date.now();

    let report = `\n${'='.repeat(80)}\n`;
    report += `📊 RELATÓRIO DE DISPONIBILIDADE DE APIs\n`;
    report += `🕐 ${new Date(now).toLocaleString('pt-BR')}\n`;
    report += `${'='.repeat(80)}\n\n`;

    report += `✅ Disponíveis: ${status.availableCount}\n`;
    report += `⚠️  Limitadas/Indisponíveis: ${status.limitedCount}\n\n`;

    report += `${'-'.repeat(80)}\n`;
    report += `RATE LIMITS:\n`;
    report += `${'-'.repeat(80)}\n`;

    status.rateLimits.forEach(rl => {
      const icon = rl.isLimited ? '🔴' : '🟢';
      report += `\n${icon} ${rl.providerName}\n`;
      report += `   Uso: ${rl.currentUsage}/${rl.limit} (${rl.usagePercent}%)\n`;
      report += `   Tipo: ${rl.limitType}\n`;
      report += `   Requests restantes: ${rl.estimatedRequestsLeft}\n`;
      
      if (rl.isLimited && rl.availableAt) {
        const waitMs = rl.availableAt - now;
        report += `   ⏰ Disponível em: ${this.formatTime(waitMs)} (${new Date(rl.availableAt).toLocaleTimeString('pt-BR')})\n`;
      } else if (rl.resetsAt) {
        report += `   🔄 Reset em: ${this.formatTime(rl.resetsAt - now)}\n`;
      }
    });

    if (status.cooldowns.length > 0) {
      report += `\n${'-'.repeat(80)}\n`;
      report += `COOLDOWNS ATIVOS:\n`;
      report += `${'-'.repeat(80)}\n`;

      status.cooldowns.forEach(cd => {
        if (cd.isCoolingDown) {
          const icon = '⏸️';
          const waitMs = cd.cooldownEndsAt ? cd.cooldownEndsAt - now : 0;
          report += `\n${icon} ${cd.providerName}\n`;
          report += `   Motivo: ${cd.cooldownReason}\n`;
          report += `   Falhas consecutivas: ${cd.consecutiveFailures}\n`;
          report += `   ⏰ Disponível em: ${this.formatTime(waitMs)}\n`;
        }
      });
    }

    report += `\n${'='.repeat(80)}\n`;

    return report;
  }

  /**
   * FASE 1: Atualiza quota restante de um provider (headers x-ratelimit-*)
   */
  updateQuota(providerId: string, quota: {
    remainingRequests?: number;
    remainingTokens?: number;
    limitRequests?: number;
    limitTokens?: number;
    resetsAt?: number;
  }): void {
    // Armazenar quota atual
    const currentQuota = this.currentQuotas.get(providerId) || {
      remainingRequests: undefined,
      remainingTokens: undefined,
      limitRequests: undefined,
      limitTokens: undefined,
      resetsAt: undefined,
      lastUpdated: Date.now()
    };

    this.currentQuotas.set(providerId, {
      ...currentQuota,
      ...quota,
      lastUpdated: Date.now()
    });

    // Log para debugging
    if (quota.remainingRequests !== undefined) {
      console.log(`[RateLimit] ${providerId}: ${quota.remainingRequests} requests remaining`);
    }
    if (quota.remainingTokens !== undefined) {
      console.log(`[RateLimit] ${providerId}: ${quota.remainingTokens} tokens remaining`);
    }
  }

  /**
   * FASE 1: Marca provider como "quota baixa" (< 10% restante)
   */
  markAsLowQuota(providerId: string): void {
    this.lowQuotaProviders.set(providerId, {
      markedAt: Date.now(),
      warning: 'Quota below 10% - approaching limit'
    });

    console.warn(`[RateLimit] 🚨 ${providerId} marked as LOW QUOTA`);
  }

  /**
   * FASE 1: Verifica se provider está com quota baixa
   */
  isLowQuota(providerId: string): boolean {
    const lowQuota = this.lowQuotaProviders.get(providerId);
    if (!lowQuota) return false;

    // Verificar se já foi resetado (passou de 1 hora)
    const oneHour = 60 * 60 * 1000;
    if (Date.now() - lowQuota.markedAt > oneHour) {
      this.lowQuotaProviders.delete(providerId);
      return false;
    }

    return true;
  }

  /**
   * FASE 1: Obtém quota atual de um provider
   */
  getCurrentQuota(providerId: string): {
    remainingRequests?: number;
    remainingTokens?: number;
    limitRequests?: number;
    limitTokens?: number;
    resetsAt?: number;
    isLow: boolean;
  } | null {
    const quota = this.currentQuotas.get(providerId);
    if (!quota) return null;

    return {
      ...quota,
      isLow: this.isLowQuota(providerId)
    };
  }

  /**
   * FASE 1: Aplica throttle baseado em tokens usados (Groq TPM)
   */
  setThrottle(providerId: string, throttle: {
    delayMs: number;
    reason: string;
    tokensUsed?: number;
  }): void {
    const throttleEndsAt = Date.now() + throttle.delayMs;

    // Configurar como um cooldown temporário
    const state = this.cooldownStates.get(providerId) || {
      providerId,
      providerName: providerId,
      isCoolingDown: false,
      cooldownEndsAt: null,
      cooldownReason: null,
      consecutiveFailures: 0,
      lastFailureAt: null,
      nextRetryAt: null
    };

    state.isCoolingDown = true;
    state.cooldownEndsAt = throttleEndsAt;
    state.cooldownReason = throttle.reason;
    state.nextRetryAt = throttleEndsAt;

    this.cooldownStates.set(providerId, state);

    // Também armazenar em throttle específico
    this.throttledProviders.set(providerId, {
      delayMs: throttle.delayMs,
      reason: throttle.reason,
      tokensUsed: throttle.tokensUsed || 0,
      startsAt: Date.now(),
      endsAt: throttleEndsAt
    });
  }

  /**
   * FASE 1: Verifica se provider está throttled
   */
  isThrottled(providerId: string): boolean {
    const throttle = this.throttledProviders.get(providerId);
    if (!throttle) return false;

    // Verificar se throttle já expirou
    if (Date.now() >= throttle.endsAt) {
      this.throttledProviders.delete(providerId);
      // Também limpar cooldown
      const state = this.cooldownStates.get(providerId);
      if (state?.isCoolingDown && state.cooldownReason?.includes('TPM')) {
        state.isCoolingDown = false;
        state.cooldownEndsAt = null;
        state.cooldownReason = null;
        this.cooldownStates.set(providerId, state);
      }
      return false;
    }

    return true;
  }

  /**
   * FASE 1: Obtém tempo restante do throttle
   */
  getThrottleTimeRemaining(providerId: string): {
    isThrottled: boolean;
    waitMs: number;
    waitSeconds: number;
    reason: string;
  } {
    if (!this.isThrottled(providerId)) {
      return {
        isThrottled: false,
        waitMs: 0,
        waitSeconds: 0,
        reason: ''
      };
    }

    const throttle = this.throttledProviders.get(providerId)!;
    const waitMs = throttle.endsAt - Date.now();

    return {
      isThrottled: true,
      waitMs: Math.max(0, waitMs),
      waitSeconds: Math.ceil(Math.max(0, waitMs) / 1000),
      reason: throttle.reason
    };
  }

  /**
   * Reseta cooldown de um provider (usado após reavaliação com sucesso)
   */
  resetCooldown(providerId: string): void {
    const state = this.cooldownStates.get(providerId);
    if (state) {
      state.isCoolingDown = false;
      state.cooldownEndsAt = null;
      state.cooldownReason = null;
      state.consecutiveFailures = 0;
      state.nextRetryAt = null;
      this.cooldownStates.set(providerId, state);
      console.log(`[RateLimit] ${providerId} cooldown reset manually`);
    }

    // Também limpar throttle se existir
    this.throttledProviders.delete(providerId);
    this.lowQuotaProviders.delete(providerId);
  }

  /**
   * Limpa histórico antigo para liberar memória
   */
  cleanup(maxAgeMs: number = 24 * 60 * 60 * 1000): void {
    const now = Date.now();
    const cutoff = now - maxAgeMs;

    this.usageHistory.forEach((history, providerId) => {
      const filtered = history.filter(h => h.timestamp >= cutoff);
      if (filtered.length < history.length) {
        this.usageHistory.set(providerId, filtered);
      }
    });

    // Limpar cooldowns expirados
    this.cooldownStates.forEach((state, providerId) => {
      if (state.isCoolingDown && state.cooldownEndsAt && now >= state.cooldownEndsAt) {
        state.isCoolingDown = false;
        state.cooldownEndsAt = null;
        state.cooldownReason = null;
        state.nextRetryAt = null;
        this.cooldownStates.set(providerId, state);
      }
    });

    console.log('[RateLimitTracker] Cleanup completed');
  }

  /**
   * Exporta dados para análise
   */
  exportData(format: 'json' | 'csv' = 'json'): string {
    const status = this.getAllApisStatus();

    if (format === 'json') {
      return JSON.stringify(status, null, 2);
    }

    // CSV
    const headers = 'providerId,usage,limit,limitType,usagePercent,isLimited,cooldownEndsAt';
    const rows = status.rateLimits.map(rl => 
      `"${rl.providerId}",${rl.currentUsage},${rl.limit},${rl.limitType},${rl.usagePercent},${rl.isLimited},${rl.availableAt || ''}`
    );

    return [headers, ...rows].join('\n');
  }

  /**
   * Obtém o melhor provider disponível agora
   */
  getBestAvailableProvider(preferredOrder?: string[]): {
    providerId: string | null;
    providerName: string;
    waitTime: string;
    isAvailable: boolean;
  } {
    const order = preferredOrder || Array.from(this.quotaConfigs.keys());
    
    for (const providerId of order) {
      const availability = this.getTimeUntilAvailable(providerId);
      const config = this.quotaConfigs.get(providerId);
      
      if (availability.isAvailable) {
        return {
          providerId,
          providerName: config?.providerName || providerId,
          waitTime: 'Agora',
          isAvailable: true
        };
      }
    }

    // Nenhum disponível, retornar o que estará disponível mais cedo
    let earliestProvider: { providerId: string; waitMs: number } | null = null;
    
    for (const providerId of order) {
      const availability = this.getTimeUntilAvailable(providerId);
      
      if (!availability.isAvailable) {
        if (!earliestProvider || availability.waitMs < earliestProvider.waitMs) {
          earliestProvider = { providerId, waitMs: availability.waitMs };
        }
      }
    }

    if (earliestProvider) {
      const config = this.quotaConfigs.get(earliestProvider.providerId);
      return {
        providerId: earliestProvider.providerId,
        providerName: config?.providerName || earliestProvider.providerId,
        waitTime: this.formatTime(earliestProvider.waitMs),
        isAvailable: false
      };
    }

    return {
      providerId: null,
      providerName: 'Nenhum',
      waitTime: 'Indefinido',
      isAvailable: false
    };
  }
}

// Singleton global
export const rateLimitTracker = new RateLimitTrackerService();
