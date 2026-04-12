/**
 * Sistema de Distribuição Inteligente de Requests (Fase 2)
 * 
 * Funcionalidades:
 * 1. Load Balancing baseado em saúde real dos providers
 * 2. Distribuição proporcional baseada em quotas restantes
 * 3. Predictive scaling (prever quando provider ficará indisponível)
 * 4. Sticky sessions para prompts similares (cache-friendly)
 * 5. Circuit breaker avançado com backoff exponencial
 */

export interface ProviderHealthScore {
  providerId: string;
  providerName: string;
  score: number; // 0-100
  successRate: number; // 0-100
  avgLatency: number; // ms
  quotaRemaining: number; // requests ou tokens restantes
  quotaUsagePercent: number; // 0-100%
  cooldownActive: boolean;
  circuitBreakerOpen: boolean;
  recommendedWeight: number; // peso recomendado para load balancing (0-100)
}

export interface LoadBalancingConfig {
  strategy: 'round-robin' | 'weighted' | 'least-latency' | 'smart';
  weights: Map<string, number>; // providerId -> weight
  stickySessions: boolean;
  sessionTTL: number; // tempo de vida da sessão em ms
}

export interface CircuitBreakerState {
  providerId: string;
  state: 'closed' | 'open' | 'half-open';
  failureCount: number;
  successCount: number;
  lastFailureAt: number | null;
  nextRetryAt: number | null;
  backoffMultiplier: number; // multiplicador para backoff exponencial
  halfOpenMaxAttempts: number;
}

export interface RequestDistribution {
  timestamp: number;
  providerId: string;
  promptHash: string;
  latency: number;
  success: boolean;
  tokensUsed?: number;
  cached: boolean;
}

interface StickySession {
  providerId: string;
  expiresAt: number;
  requestCount: number;
}

/**
 * Serviço de Distribuição Inteligente
 */
export class SmartDistributionService {
  // Estado de circuit breaker por provider
  private circuitBreakers: Map<string, CircuitBreakerState> = new Map();

  // Configuração de load balancing
  private lbConfig: LoadBalancingConfig = {
    strategy: 'smart',
    weights: new Map(),
    stickySessions: true,
    sessionTTL: 5 * 60 * 1000 // 5 minutos
  };

  // Sessões sticky
  private stickySessions: Map<string, StickySession> = new Map();

  // Histórico de distribuição
  private distributionHistory: RequestDistribution[] = [];

  // Métricas por provider
  private providerMetrics: Map<string, {
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    totalLatency: number;
    lastRequestAt: number | null;
    avgLatency: number;
    successRate: number;
  }> = new Map();

  // Constantes
  private readonly MAX_HISTORY_LENGTH = 1000;
  private readonly CIRCUIT_BREAKER_THRESHOLD = 5; // falhas consecutivas para abrir
  private readonly HALF_OPEN_MAX_ATTEMPTS = 3;
  private readonly BASE_BACKOFF_MS = 1000;
  private readonly MAX_BACKOFF_MS = 5 * 60 * 1000; // 5 minutos

  constructor() {
    console.log('[SmartDistribution] Service initialized');
  }

  /**
   * Calcula score de saúde de um provider
   */
  calculateHealthScore(
    providerId: string,
    providerName: string,
    stats: {
      totalRequests: number;
      successfulRequests: number;
      failedRequests: number;
      avgLatency: number;
      consecutiveFailures: number;
    },
    quotaInfo: {
      remaining: number;
      limit: number;
      usagePercent: number;
    },
    isCoolingDown: boolean
  ): ProviderHealthScore {
    // Taxa de sucesso (0-100)
    const successRate = stats.totalRequests > 0
      ? (stats.successfulRequests / stats.totalRequests) * 100
      : 100;

    // Score de latência (0-100): 100 para <500ms, 0 para >10s
    const latencyScore = Math.max(0, Math.min(100, 100 - ((stats.avgLatency - 500) / 95)));

    // Score de quota (0-100): 100 para quota cheia, 0 para quota vazia
    const quotaScore = 100 - quotaInfo.usagePercent;

    // Penalidade por falhas consecutivas
    const consecutiveFailurePenalty = Math.min(50, stats.consecutiveFailures * 10);

    // Penalidade por cooldown
    const cooldownPenalty = isCoolingDown ? 100 : 0;

    // Score final ponderado
    let score = (successRate * 0.4) + (latencyScore * 0.2) + (quotaScore * 0.2) + (100 * 0.2);
    score -= consecutiveFailurePenalty;
    score -= cooldownPenalty;
    score = Math.max(0, Math.min(100, score));

    // Calcular peso recomendado para load balancing
    let recommendedWeight = score;
    if (isCoolingDown || score < 20) {
      recommendedWeight = 0;
    } else if (quotaInfo.usagePercent > 90) {
      recommendedWeight = score * 0.3; // Reduzir peso se quota quase esgotada
    }

    return {
      providerId,
      providerName,
      score: Math.round(score * 10) / 10,
      successRate: Math.round(successRate * 10) / 10,
      avgLatency: Math.round(stats.avgLatency),
      quotaRemaining: quotaInfo.remaining,
      quotaUsagePercent: Math.round(quotaInfo.usagePercent * 10) / 10,
      cooldownActive: isCoolingDown,
      circuitBreakerOpen: this.isCircuitBreakerOpen(providerId),
      recommendedWeight: Math.round(recommendedWeight * 10) / 10
    };
  }

  /**
   * Seleciona o melhor provider usando load balancing inteligente
   */
  selectProvider(
    providers: Array<{
      id: string;
      name: string;
      stats: any;
      enabled: boolean;
    }>,
    quotaInfo: Map<string, { remaining: number; limit: number; usagePercent: number }>,
    coolingDownProviders: Set<string>,
    promptHash?: string
  ): string | null {
    // Verificar sticky session primeiro
    if (this.lbConfig.stickySessions && promptHash) {
      const session = this.stickySessions.get(promptHash);
      if (session && Date.now() < session.expiresAt) {
        const provider = providers.find(p => p.id === session.providerId);
        if (provider && provider.enabled && !coolingDownProviders.has(provider.id)) {
          session.requestCount++;
          console.log(`[SmartDistribution] 🎯 Sticky session: ${provider.name}`);
          return provider.id;
        }
      }
    }

    // Filtrar providers disponíveis
    const availableProviders = providers.filter(p =>
      p.enabled &&
      !coolingDownProviders.has(p.id) &&
      !this.isCircuitBreakerOpen(p.id)
    );

    if (availableProviders.length === 0) {
      console.warn('[SmartDistribution] ⚠️ No providers available');
      return null;
    }

    // Calcular saúde de cada provider
    const healthScores = availableProviders.map(provider => {
      const quota = quotaInfo.get(provider.id) || { remaining: 1000, limit: 1000, usagePercent: 0 };
      return this.calculateHealthScore(
        provider.id,
        provider.name,
        provider.stats,
        quota,
        coolingDownProviders.has(provider.id)
      );
    });

    // Ordenar por score
    healthScores.sort((a, b) => b.score - a.score);

    // Selecionar baseado na estratégia
    let selected: ProviderHealthScore;

    switch (this.lbConfig.strategy) {
      case 'round-robin':
        selected = this.selectRoundRobin(healthScores);
        break;
      case 'weighted':
        selected = this.selectWeighted(healthScores);
        break;
      case 'least-latency':
        selected = healthScores.reduce((best, current) =>
          current.avgLatency < best.avgLatency ? current : best
        );
        break;
      case 'smart':
      default:
        selected = this.selectSmart(healthScores);
        break;
    }

    // Criar/atualizar sticky session
    if (this.lbConfig.stickySessions && promptHash) {
      this.stickySessions.set(promptHash, {
        providerId: selected.providerId,
        expiresAt: Date.now() + this.lbConfig.sessionTTL,
        requestCount: 1
      });
    }

    console.log(`[SmartDistribution] ✅ Selected: ${selected.providerName} (score: ${selected.score})`);
    return selected.providerId;
  }

  /**
   * Seleção Round-Robin (simples)
   */
  private selectRoundRobin(healthScores: ProviderHealthScore[]): ProviderHealthScore {
    // Usar índice baseado no histórico para round-robin
    const index = this.distributionHistory.length % healthScores.length;
    return healthScores[index];
  }

  /**
   * Seleção Weighted (baseada em pesos)
   */
  private selectWeighted(healthScores: ProviderHealthScore[]): ProviderHealthScore {
    // Calcular pesos totais
    const totalWeight = healthScores.reduce((sum, hs) => sum + hs.recommendedWeight, 0);

    if (totalWeight === 0) {
      return healthScores[0];
    }

    // Seleção ponderada
    let random = Math.random() * totalWeight;
    for (const hs of healthScores) {
      random -= hs.recommendedWeight;
      if (random <= 0) {
        return hs;
      }
    }

    return healthScores[healthScores.length - 1];
  }

  /**
   * Seleção Smart (combina múltiplos fatores)
   */
  private selectSmart(healthScores: ProviderHealthScore[]): ProviderHealthScore {
    // Smart = melhor score geral, mas com diversificação
    const best = healthScores[0];

    // Se melhor provider foi usado recentemente, tentar o segundo melhor
    const recentUsage = this.distributionHistory.slice(-10);
    const recentUsageCount = recentUsage.filter(d => d.providerId === best.providerId).length;

    if (recentUsageCount >= 3 && healthScores.length > 1) {
      // Diversificar: usar segundo melhor se melhor foi muito usado
      console.log(`[SmartDistribution] 🔄 Diversifying: using ${healthScores[1].providerName}`);
      return healthScores[1];
    }

    return best;
  }

  /**
   * Circuit Breaker: verificar se está aberto
   */
  private isCircuitBreakerOpen(providerId: string): boolean {
    const breaker = this.circuitBreakers.get(providerId);
    return breaker?.state === 'open';
  }

  /**
   * Circuit Breaker: registrar sucesso
   */
  recordSuccess(providerId: string, latency: number): void {
    const now = Date.now();

    // Atualizar métricas
    let metrics = this.providerMetrics.get(providerId);
    if (!metrics) {
      metrics = {
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        totalLatency: 0,
        lastRequestAt: null,
        avgLatency: 0,
        successRate: 100
      };
    }

    metrics.totalRequests++;
    metrics.successfulRequests++;
    metrics.totalLatency += latency;
    metrics.lastRequestAt = now;
    metrics.avgLatency = metrics.totalLatency / metrics.successfulRequests;
    metrics.successRate = (metrics.successfulRequests / metrics.totalRequests) * 100;
    this.providerMetrics.set(providerId, metrics);

    // Atualizar circuit breaker
    let breaker = this.circuitBreakers.get(providerId);
    if (!breaker) {
      breaker = this.createCircuitBreaker(providerId);
    }

    if (breaker.state === 'half-open') {
      breaker.successCount++;
      if (breaker.successCount >= breaker.halfOpenMaxAttempts) {
        // Sucesso: fechar circuit breaker
        breaker.state = 'closed';
        breaker.failureCount = 0;
        breaker.successCount = 0;
        breaker.backoffMultiplier = 1;
        console.log(`[SmartDistribution] 🔒 Circuit breaker CLOSED for ${providerId}`);
      }
    } else if (breaker.state === 'open') {
      // Se está aberto mas tivemos sucesso (tentativa forçada), fechar
      breaker.state = 'closed';
      breaker.failureCount = 0;
      breaker.successCount = 0;
      breaker.backoffMultiplier = 1;
      console.log(`[SmartDistribution] 🔒 Circuit breaker CLOSED for ${providerId} (recovered)`);
    } else {
      // Estado closed: reset falhas consecutivas
      breaker.failureCount = 0;
    }

    this.circuitBreakers.set(providerId, breaker);

    // Registrar no histórico
    this.distributionHistory.push({
      timestamp: now,
      providerId,
      promptHash: '',
      latency,
      success: true,
      cached: false
    });

    this.trimHistory();
  }

  /**
   * Circuit Breaker: registrar falha
   */
  recordFailure(providerId: string, error: string, statusCode?: number): void {
    const now = Date.now();

    // Atualizar métricas
    let metrics = this.providerMetrics.get(providerId);
    if (!metrics) {
      metrics = {
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        totalLatency: 0,
        lastRequestAt: null,
        avgLatency: 0,
        successRate: 0
      };
    }

    metrics.totalRequests++;
    metrics.failedRequests++;
    metrics.lastRequestAt = now;
    metrics.successRate = metrics.totalRequests > 0
      ? (metrics.successfulRequests / metrics.totalRequests) * 100
      : 0;
    this.providerMetrics.set(providerId, metrics);

    // Atualizar circuit breaker
    let breaker = this.circuitBreakers.get(providerId);
    if (!breaker) {
      breaker = this.createCircuitBreaker(providerId);
    }

    breaker.failureCount++;
    breaker.lastFailureAt = now;

    // Verificar se deve abrir circuit breaker
    if (breaker.failureCount >= this.CIRCUIT_BREAKER_THRESHOLD || statusCode === 429) {
      if (breaker.state === 'closed') {
        breaker.state = 'open';
        breaker.backoffMultiplier = Math.pow(2, breaker.failureCount - this.CIRCUIT_BREAKER_THRESHOLD);
        const backoffMs = Math.min(
          this.BASE_BACKOFF_MS * breaker.backoffMultiplier,
          this.MAX_BACKOFF_MS
        );
        breaker.nextRetryAt = now + backoffMs;

        console.warn(
          `[SmartDistribution] ⚡ Circuit breaker OPEN for ${providerId} ` +
          `(backoff: ${backoffMs / 1000}s)`
        );
      }
    } else if (breaker.state === 'half-open') {
      // Falha em half-open: voltar para open
      breaker.state = 'open';
      breaker.successCount = 0;
      breaker.backoffMultiplier *= 2;
      const backoffMs = Math.min(
        this.BASE_BACKOFF_MS * breaker.backoffMultiplier,
        this.MAX_BACKOFF_MS
      );
      breaker.nextRetryAt = now + backoffMs;

      console.warn(
        `[SmartDistribution] ⚡ Circuit breaker RE-OPENED for ${providerId} ` +
        `(backoff: ${backoffMs / 1000}s)`
      );
    }

    this.circuitBreakers.set(providerId, breaker);

    // Registrar no histórico
    this.distributionHistory.push({
      timestamp: now,
      providerId,
      promptHash: '',
      latency: 0,
      success: false,
      cached: false
    });

    this.trimHistory();
  }

  /**
   * Criar estado de circuit breaker
   */
  private createCircuitBreaker(providerId: string): CircuitBreakerState {
    return {
      providerId,
      state: 'closed',
      failureCount: 0,
      successCount: 0,
      lastFailureAt: null,
      nextRetryAt: null,
      backoffMultiplier: 1,
      halfOpenMaxAttempts: this.HALF_OPEN_MAX_ATTEMPTS
    };
  }

  /**
   * Verificar se circuit breaker permite tentativa
   */
  canAttemptRequest(providerId: string): {
    allowed: boolean;
    waitMs: number;
    reason: string;
  } {
    const breaker = this.circuitBreakers.get(providerId);

    if (!breaker || breaker.state === 'closed') {
      return { allowed: true, waitMs: 0, reason: 'OK' };
    }

    if (breaker.state === 'open') {
      if (breaker.nextRetryAt && Date.now() >= breaker.nextRetryAt) {
        // Tempo de retry chegou: permitir e mudar para half-open
        breaker.state = 'half-open';
        breaker.successCount = 0;
        this.circuitBreakers.set(providerId, breaker);

        console.log(`[SmartDistribution] 🔓 Circuit breaker HALF-OPEN for ${providerId}`);
        return { allowed: true, waitMs: 0, reason: 'Half-open retry' };
      }

      const waitMs = breaker.nextRetryAt ? breaker.nextRetryAt - Date.now() : 0;
      return {
        allowed: false,
        waitMs: Math.max(0, waitMs),
        reason: `Circuit breaker open (retry in ${Math.ceil(waitMs / 1000)}s)`
      };
    }

    // half-open: permitir tentativa limitada
    if (breaker.successCount < breaker.halfOpenMaxAttempts) {
      return { allowed: true, waitMs: 0, reason: 'Half-open attempt' };
    }

    return {
      allowed: false,
      waitMs: 0,
      reason: 'Half-open max attempts reached'
    };
  }

  /**
   * Limpar sessões sticky expiradas
   */
  cleanupStickySessions(): void {
    const now = Date.now();
    let cleaned = 0;

    this.stickySessions.forEach((session, key) => {
      if (now >= session.expiresAt) {
        this.stickySessions.delete(key);
        cleaned++;
      }
    });

    if (cleaned > 0) {
      console.log(`[SmartDistribution] Cleaned ${cleaned} expired sticky sessions`);
    }
  }

  /**
   * Limitar histórico
   */
  private trimHistory(): void {
    if (this.distributionHistory.length > this.MAX_HISTORY_LENGTH) {
      this.distributionHistory.splice(
        0,
        this.distributionHistory.length - this.MAX_HISTORY_LENGTH
      );
    }
  }

  /**
   * Obter métricas de um provider
   */
  getProviderMetrics(providerId: string) {
    return this.providerMetrics.get(providerId) || {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      totalLatency: 0,
      lastRequestAt: null,
      avgLatency: 0,
      successRate: 100
    };
  }

  /**
   * Obter relatório completo de distribuição
   */
  getDistributionReport(): string {
    let report = '\n' + '='.repeat(80) + '\n';
    report += '📊 RELATÓRIO DE DISTRIBUIÇÃO INTELIGENTE (FASE 2)\n';
    report += `🕐 ${new Date().toLocaleString('pt-BR')}\n`;
    report += '='.repeat(80) + '\n\n';

    // Estratégia atual
    report += `📋 Estratégia: ${this.lbConfig.strategy.toUpperCase()}\n`;
    report += `🎯 Sticky Sessions: ${this.lbConfig.stickySessions ? '✅' : '❌'}\n`;
    report += `📦 Sessões ativas: ${this.stickySessions.size}\n\n`;

    // Métricas por provider
    report += '-'.repeat(80) + '\n';
    report += 'MÉTRICAS POR PROVIDER:\n';
    report += '-'.repeat(80) + '\n';

    this.providerMetrics.forEach((metrics, providerId) => {
      const breaker = this.circuitBreakers.get(providerId);
      const breakerState = breaker?.state || 'closed';

      const icon = breakerState === 'open' ? '🔴' :
                   breakerState === 'half-open' ? '🟡' : '🟢';

      report += `\n${icon} ${providerId}\n`;
      report += `   Requests: ${metrics.totalRequests} (${metrics.successfulRequests}✅ / ${metrics.failedRequests}❌)\n`;
      report += `   Success Rate: ${metrics.successRate.toFixed(1)}%\n`;
      report += `   Avg Latency: ${metrics.avgLatency.toFixed(0)}ms\n`;
      report += `   Circuit Breaker: ${breakerState.toUpperCase()}\n`;

      if (breaker?.state === 'open' && breaker.nextRetryAt) {
        const waitMs = breaker.nextRetryAt - Date.now();
        if (waitMs > 0) {
          report += `   Next Retry: ${Math.ceil(waitMs / 1000)}s\n`;
        }
      }
    });

    // Histórico recente
    report += '\n' + '-'.repeat(80) + '\n';
    report += 'ÚLTIMAS 10 REQUISIÇÕES:\n';
    report += '-'.repeat(80) + '\n';

    const recent = this.distributionHistory.slice(-10);
    recent.forEach((req, i) => {
      const icon = req.success ? '✅' : '❌';
      const time = new Date(req.timestamp).toLocaleTimeString('pt-BR');
      report += `${i + 1}. ${icon} ${time} - ${req.providerId} (${req.latency}ms)\n`;
    });

    report += '\n' + '='.repeat(80) + '\n';

    return report;
  }

  /**
   * Resetar configuração
   */
  reset(): void {
    this.circuitBreakers.clear();
    this.stickySessions.clear();
    this.distributionHistory.length = 0;
    this.providerMetrics.clear();

    console.log('[SmartDistribution] Reset complete');
  }
}

// Singleton export
export const smartDistribution = new SmartDistributionService();
