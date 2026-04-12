/**
 * AI Gateway Service
 * Cache inteligente de respostas de IA via Cloudflare AI Gateway
 */

interface GatewayConfig {
  accountId: string;
  apiToken: string;
  gatewayId: string;
}

interface CachedResponse {
  id: string;
  prompt: string;
  response: any;
  model: string;
  createdAt: number;
  usageCount: number;
}

export class AIGatewayService {
  private config: GatewayConfig;
  private baseUrl: string;
  private localCache: Map<string, CachedResponse>;

  constructor(config: GatewayConfig) {
    this.config = config;
    this.baseUrl = `https://api.cloudflare.com/client/v4/accounts/${config.accountId}/ai-gateway`;
    this.localCache = new Map();
  }

  /**
   * Gera hash do prompt + modelo para cache
   */
  private getCacheKey(prompt: string, model: string): string {
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(`${model}::${prompt}`).digest('hex').substring(0, 16);
  }

  /**
   * Busca resposta em cache
   */
  getCachedResponse(prompt: string, model: string): any | null {
    const key = this.getCacheKey(prompt, model);
    
    // Verifica cache local primeiro
    if (this.localCache.has(key)) {
      const cached = this.localCache.get(key)!;
      cached.usageCount++;
      console.log(`[AI Gateway] Local cache HIT (used ${cached.usageCount}x)`);
      return cached.response;
    }

    console.log('[AI Gateway] Local cache MISS');
    return null;
  }

  /**
   * Salva resposta em cache
   */
  cacheResponse(prompt: string, model: string, response: any): void {
    const key = this.getCacheKey(prompt, model);
    
    this.localCache.set(key, {
      id: key,
      prompt,
      response,
      model,
      createdAt: Date.now(),
      usageCount: 1
    });

    console.log('[AI Gateway] Response cached locally');
  }

  /**
   * Estatísticas de cache
   */
  getCacheStats(): { totalEntries: number; hitRate: number } {
    let totalHits = 0;
    this.localCache.forEach(entry => {
      totalHits += entry.usageCount;
    });

    return {
      totalEntries: this.localCache.size,
      hitRate: this.localCache.size > 0 ? totalHits / this.localCache.size : 0
    };
  }

  /**
   * Limpa cache antigo (entries com > 24h)
   */
  cleanupOldCache(maxAge: number = 24 * 60 * 60 * 1000): number {
    let cleaned = 0;
    const now = Date.now();

    this.localCache.forEach((value, key) => {
      if (now - value.createdAt > maxAge) {
        this.localCache.delete(key);
        cleaned++;
      }
    });

    if (cleaned > 0) {
      console.log(`[AI Gateway] Cleaned ${cleaned} old cache entries`);
    }

    return cleaned;
  }

  /**
   * Wrapper para chamadas de IA com cache automático
   */
  async cachedTextGeneration(
    textGenerationFn: () => Promise<any>,
    prompt: string,
    model: string
  ): Promise<any> {
    // Tenta cache primeiro
    const cached = this.getCachedResponse(prompt, model);
    if (cached) {
      return { ...cached, fromCache: true };
    }

    // Gera nova resposta
    const response = await textGenerationFn();
    
    // Salva em cache
    this.cacheResponse(prompt, model, response);

    return { ...response, fromCache: false };
  }

  /**
   * Lista entradas em cache (para debugging)
   */
  listCacheEntries(): Array<{ key: string; model: string; promptPreview: string; age: string }> {
    const entries: Array<any> = [];
    const now = Date.now();

    this.localCache.forEach((value, key) => {
      const age = now - value.createdAt;
      const ageStr = age < 60000 ? `${Math.floor(age / 1000)}s` :
                     age < 3600000 ? `${Math.floor(age / 60000)}m` :
                     `${Math.floor(age / 3600000)}h`;

      entries.push({
        key,
        model: value.model,
        promptPreview: value.prompt.substring(0, 50) + '...',
        age: ageStr,
        usageCount: value.usageCount
      });
    });

    return entries.sort((a, b) => b.usageCount - a.usageCount);
  }
}

// Singleton
export const aiGateway = process.env.CLOUDFLARE_ACCOUNT_ID && process.env.CLOUDFLARE_API_TOKEN
  ? new AIGatewayService({
      accountId: process.env.CLOUDFLARE_ACCOUNT_ID,
      apiToken: process.env.CLOUDFLARE_API_TOKEN,
      gatewayId: process.env.AI_GATEWAY_ID || 'carousel-gateway'
    })
  : null;
