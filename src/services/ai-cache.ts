/**
 * Sistema de Cache Inteligente para Respostas de IA (Fase 2)
 * 
 * Funcionalidades:
 * 1. Cache baseado em similaridade de prompts (hash semântico)
 * 2. TTL dinâmico baseado no tipo de conteúdo
 * 3. Invalidação inteligente por contexto
 * 4. Cache em memória com LRU (Least Recently Used)
 * 5. Suporte opcional a Redis para cache distribuído
 * 6. Cache de embeddings para Style DNA
 */

import crypto from 'crypto';

export interface CacheEntry {
  key: string;
  value: any;
  createdAt: number;
  lastAccessedAt: number;
  accessCount: number;
  ttl: number; // Time To Live em ms
  type: CacheEntryType;
  metadata?: {
    promptHash?: string;
    providerId?: string;
    modelId?: string;
    tokensUsed?: number;
    responseSize?: number;
  };
}

export type CacheEntryType = 
  | 'text-generation'
  | 'style-dna'
  | 'image-prompt'
  | 'reviewer'
  | 'manager'
  | 'embedding'
  | 'full-carousel';

export interface CacheConfig {
  enabled: boolean;
  maxEntries: number; // máximo de entradas em memória
  defaultTTL: number; // TTL padrão em ms
  ttlByType: Record<CacheEntryType, number>; // TTL por tipo
  useRedis: boolean; // usar Redis (opcional)
  redisUrl?: string;
  minSimilarity: number; // similaridade mínima para cache hit (0-1)
  compressionEnabled: boolean;
}

export interface CacheStats {
  hits: number;
  misses: number;
  hitRate: number; // percentual
  totalEntries: number;
  memoryUsageMB: number;
  oldestEntry: number | null;
  newestEntry: number | null;
  evictions: number;
  expiredEntries: number;
}

export interface CacheHitResult {
  hit: boolean;
  entry?: CacheEntry;
  similarity?: number;
  reason?: string;
}

/**
 * Sistema de Cache em Memória com LRU
 */
export class AICacheService {
  private cache: Map<string, CacheEntry> = new Map();
  private config: CacheConfig;
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    hitRate: 0,
    totalEntries: 0,
    memoryUsageMB: 0,
    oldestEntry: null,
    newestEntry: null,
    evictions: 0,
    expiredEntries: 0
  };

  constructor(config?: Partial<CacheConfig>) {
    this.config = {
      enabled: true,
      maxEntries: 500,
      defaultTTL: 30 * 60 * 1000, // 30 minutos
      ttlByType: {
        'text-generation': 30 * 60 * 1000, // 30 min
        'style-dna': 60 * 60 * 1000, // 1 hora
        'image-prompt': 60 * 60 * 1000, // 1 hora
        'reviewer': 15 * 60 * 1000, // 15 min (revisões podem mudar)
        'manager': 15 * 60 * 1000, // 15 min
        'embedding': 2 * 60 * 60 * 1000, // 2 horas (embeddings são estáveis)
        'full-carousel': 20 * 60 * 1000 // 20 min
      },
      useRedis: false,
      minSimilarity: 0.95, // 95% similaridade para cache hit
      compressionEnabled: false,
      ...config
    };

    // Limpeza periódica
    this.startCleanupInterval();

    console.log('[AICache] Service initialized', {
      maxEntries: this.config.maxEntries,
      defaultTTL: `${this.config.defaultTTL / 1000}s`,
      similarity: `${this.config.minSimilarity * 100}%`
    });
  }

  /**
   * Gerar hash de um prompt para cache
   */
  static generatePromptHash(prompt: string, type?: string): string {
    const content = type ? `${type}::${prompt}` : prompt;
    return crypto.createHash('sha256').update(content).digest('hex').substring(0, 16);
  }

  /**
   * Calcular similaridade entre dois strings (simples: Jaccard)
   */
  static calculateSimilarity(str1: string, str2: string): number {
    // Para strings muito diferentes em tamanho, já retornar baixo
    const lengthDiff = Math.abs(str1.length - str2.length);
    if (lengthDiff > Math.max(str1.length, str2.length) * 0.3) {
      return 0;
    }

    // Tokenizar em palavras
    const set1 = new Set(str1.toLowerCase().split(/\s+/));
    const set2 = new Set(str2.toLowerCase().split(/\s+/));

    // Interseção
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    
    // União
    const union = new Set([...set1, ...set2]);

    return intersection.size / union.size;
  }

  /**
   * Obter entrada do cache
   */
  get(key: string, type?: CacheEntryType): CacheHitResult {
    if (!this.config.enabled) {
      return { hit: false, reason: 'Cache disabled' };
    }

    const entry = this.cache.get(key);

    if (!entry) {
      this.stats.misses++;
      this.updateHitRate();
      return { hit: false, reason: 'Key not found' };
    }

    // Verificar se expirou
    const now = Date.now();
    if (now - entry.createdAt > entry.ttl) {
      this.cache.delete(key);
      this.stats.expiredEntries++;
      this.stats.misses++;
      this.updateHitRate();
      return { hit: false, reason: 'Entry expired' };
    }

    // Cache hit!
    entry.lastAccessedAt = now;
    entry.accessCount++;
    this.stats.hits++;
    this.updateHitRate();

    console.log(`[AICache] ✅ HIT: ${key} (type: ${entry.type}, accesses: ${entry.accessCount})`);
    return { hit: true, entry };
  }

  /**
   * Buscar cache por similaridade de prompt
   */
  getBySimilarity(prompt: string, type: CacheEntryType): CacheHitResult {
    if (!this.config.enabled) {
      return { hit: false, reason: 'Cache disabled' };
    }

    const promptHash = AICacheService.generatePromptHash(prompt, type);
    
    // Verificar match exato primeiro
    const exactMatch = this.get(promptHash, type);
    if (exactMatch.hit) {
      return exactMatch;
    }

    // Buscar por similaridade
    let bestMatch: CacheHitResult = { hit: false, similarity: 0, reason: 'No similar entry found' };

    this.cache.forEach((entry, key) => {
      if (entry.type !== type) return;
      if (entry.metadata?.promptHash) {
        const similarity = AICacheService.calculateSimilarity(
          prompt,
          entry.metadata.promptHash
        );

        if (similarity >= this.config.minSimilarity && similarity > (bestMatch.similarity || 0)) {
          bestMatch = {
            hit: true,
            entry,
            similarity,
            reason: `Similar prompt (${(similarity * 100).toFixed(1)}%)`
          };
        }
      }
    });

    if (bestMatch.hit && bestMatch.entry) {
      // Atualizar estatísticas
      bestMatch.entry.lastAccessedAt = Date.now();
      bestMatch.entry.accessCount++;
      this.stats.hits++;
      this.updateHitRate();

      console.log(
        `[AICache] ✅ SIMILARITY HIT: ${bestMatch.similarity!.toFixed(2)} similarity ` +
        `(type: ${bestMatch.entry.type})`
      );
    } else {
      this.stats.misses++;
      this.updateHitRate();
    }

    return bestMatch;
  }

  /**
   * Adicionar entrada ao cache
   */
  set(
    key: string,
    value: any,
    type: CacheEntryType = 'text-generation',
    metadata?: CacheEntry['metadata']
  ): void {
    if (!this.config.enabled) return;

    const now = Date.now();
    const ttl = this.config.ttlByType[type] || this.config.defaultTTL;

    // Verificar se precisa evictar
    if (this.cache.size >= this.config.maxEntries) {
      this.evictLRU();
    }

    const entry: CacheEntry = {
      key,
      value,
      createdAt: now,
      lastAccessedAt: now,
      accessCount: 1,
      ttl,
      type,
      metadata
    };

    this.cache.set(key, entry);
    this.stats.totalEntries = this.cache.size;
    this.updateMemoryUsage();

    console.log(`[AICache] 💾 CACHED: ${key} (type: ${type}, TTL: ${ttl / 1000}s)`);
  }

  /**
   * Remover entrada do cache
   */
  delete(key: string): boolean {
    const deleted = this.cache.delete(key);
    if (deleted) {
      this.stats.totalEntries = this.cache.size;
      console.log(`[AICache] 🗑️  DELETED: ${key}`);
    }
    return deleted;
  }

  /**
   * Limpar cache por tipo
   */
  clearByType(type: CacheEntryType): number {
    let cleared = 0;
    this.cache.forEach((entry, key) => {
      if (entry.type === type) {
        this.cache.delete(key);
        cleared++;
      }
    });
    this.stats.totalEntries = this.cache.size;
    console.log(`[AICache] 🧹 Cleared ${cleared} entries of type ${type}`);
    return cleared;
  }

  /**
   * Limpar todo o cache
   */
  clear(): void {
    this.cache.clear();
    this.stats.totalEntries = 0;
    this.updateMemoryUsage();
    console.log('[AICache] 🧹 Cache cleared');
  }

  /**
   * Evictar entrada LRU (Least Recently Used)
   */
  private evictLRU(): void {
    let oldestKey: string | null = null;
    let oldestTime = Date.now();

    this.cache.forEach((entry, key) => {
      if (entry.lastAccessedAt < oldestTime) {
        oldestTime = entry.lastAccessedAt;
        oldestKey = key;
      }
    });

    if (oldestKey) {
      this.cache.delete(oldestKey);
      this.stats.evictions++;
      this.stats.totalEntries = this.cache.size;
      console.log(`[AICache] 🔄 Evicted LRU entry: ${oldestKey}`);
    }
  }

  /**
   * Atualizar taxa de acerto
   */
  private updateHitRate(): void {
    const total = this.stats.hits + this.stats.misses;
    this.stats.hitRate = total > 0 ? (this.stats.hits / total) * 100 : 0;
  }

  /**
   * Atualizar uso de memória
   */
  private updateMemoryUsage(): void {
    // Estimativa grosseira: cada entrada ~1KB em média
    const estimatedSize = this.cache.size * 1024; // bytes
    this.stats.memoryUsageMB = estimatedSize / (1024 * 1024);
  }

  /**
   * Iniciar intervalo de limpeza automática
   */
  private startCleanupInterval(): void {
    const cleanupInterval = 5 * 60 * 1000; // 5 minutos

    setInterval(() => {
      this.cleanup();
    }, cleanupInterval);
  }

  /**
   * Limpar entradas expiradas
   */
  cleanup(): number {
    const now = Date.now();
    let cleaned = 0;

    this.cache.forEach((entry, key) => {
      if (now - entry.createdAt > entry.ttl) {
        this.cache.delete(key);
        cleaned++;
        this.stats.expiredEntries++;
      }
    });

    this.stats.totalEntries = this.cache.size;

    if (cleaned > 0) {
      console.log(`[AICache] 🧹 Cleanup: removed ${cleaned} expired entries`);
    }

    return cleaned;
  }

  /**
   * Obter estatísticas do cache
   */
  getStats(): CacheStats {
    this.updateMemoryUsage();

    // Atualizar oldest/newest
    if (this.cache.size > 0) {
      let oldest = Date.now();
      let newest = 0;

      this.cache.forEach(entry => {
        if (entry.createdAt < oldest) oldest = entry.createdAt;
        if (entry.createdAt > newest) newest = entry.createdAt;
      });

      this.stats.oldestEntry = oldest;
      this.stats.newestEntry = newest;
    }

    return { ...this.stats };
  }

  /**
   * Obter relatório do cache
   */
  getReport(): string {
    const stats = this.getStats();

    let report = '\n' + '='.repeat(80) + '\n';
    report += '📊 RELATÓRIO DE CACHE INTELIGENTE (FASE 2)\n';
    report += `🕐 ${new Date().toLocaleString('pt-BR')}\n`;
    report += '='.repeat(80) + '\n\n';

    report += `📋 Status: ${this.config.enabled ? '✅ Habilitado' : '❌ Desabilitado'}\n`;
    report += `📦 Entradas: ${stats.totalEntries}/${this.config.maxEntries}\n`;
    report += `💾 Uso de Memória: ${stats.memoryUsageMB.toFixed(2)} MB\n`;
    report += `🎯 Taxa de Acerto: ${stats.hitRate.toFixed(1)}%\n`;
    report += `✅ Hits: ${stats.hits}\n`;
    report += `❌ Misses: ${stats.misses}\n`;
    report += `🔄 Evictions: ${stats.evictions}\n`;
    report += `⏰ Expirados: ${stats.expiredEntries}\n\n`;

    report += '-'.repeat(80) + '\n';
    report += 'TTL POR TIPO:\n';
    report += '-'.repeat(80) + '\n';

    Object.entries(this.config.ttlByType).forEach(([type, ttl]) => {
      report += `  ${type}: ${ttl / 1000}s (${ttl / 60000}min)\n`;
    });

    if (this.cache.size > 0) {
      report += '\n' + '-'.repeat(80) + '\n';
      report += 'ENTRECADAS MAIS ANTIGAS/NOVAS:\n';
      report += '-'.repeat(80) + '\n';

      if (stats.oldestEntry) {
        const age = Date.now() - stats.oldestEntry;
        report += `  Mais Antiga: ${Math.floor(age / 1000)}s atrás\n`;
      }
      if (stats.newestEntry) {
        const age = Date.now() - stats.newestEntry;
        report += `  Mais Nova: ${Math.floor(age / 1000)}s atrás\n`;
      }
    }

    report += '\n' + '='.repeat(80) + '\n';

    return report;
  }

  /**
   * Atualizar configuração
   */
  updateConfig(config: Partial<CacheConfig>): void {
    this.config = { ...this.config, ...config };
    console.log('[AICache] Config updated:', config);
  }

  /**
   * Obter configuração atual
   */
  getConfig(): CacheConfig {
    return { ...this.config };
  }
}

// Singleton export
export const aiCache = new AICacheService();
