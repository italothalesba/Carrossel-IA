/**
 * AI Observability Service
 * Monitoramento e métricas de uso de IA
 */

interface ObservationMetric {
  timestamp: number;
  operation: string;
  model: string;
  provider: string;
  latency: number;
  success: boolean;
  tokensUsed?: number;
  cost?: number;
  error?: string;
  metadata?: Record<string, any>;
}

export class AIObservabilityService {
  private metrics: ObservationMetric[];
  private batchSize: number;

  constructor(batchSize: number = 50) {
    this.metrics = [];
    this.batchSize = batchSize;
  }

  /**
   * Registra métrica de operação de IA
   */
  recordMetric(metric: ObservationMetric): void {
    this.metrics.push(metric);
    console.log(
      `[Observability] ${metric.operation} | ${metric.model} | ${metric.latency}ms | ${metric.success ? '✅' : '❌'}`
    );

    // Auto-flush se atingir batch size
    if (this.metrics.length >= this.batchSize) {
      this.flushMetrics();
    }
  }

  /**
   * Registra início de operação
   */
  startOperation(operation: string, model: string, provider: string): { operationId: string; startTime: number } {
    return {
      operationId: `${operation}_${Date.now()}`,
      startTime: Date.now()
    };
  }

  /**
   * Registra fim de operação
   */
  endOperation(
    operationId: string,
    startTime: number,
    operation: string,
    model: string,
    provider: string,
    success: boolean,
    metadata?: { tokensUsed?: number; cost?: number; error?: string }
  ): void {
    const latency = Date.now() - startTime;
    
    this.recordMetric({
      timestamp: Date.now(),
      operation,
      model,
      provider,
      latency,
      success,
      tokensUsed: metadata?.tokensUsed,
      cost: metadata?.cost,
      error: metadata?.error
    });
  }

  /**
   * Salva métricas em armazenamento persistente
   * (No futuro, pode enviar para Cloudflare Workers Analytics)
   */
  flushMetrics(): void {
    if (this.metrics.length === 0) return;

    console.log(`[Observability] Flushing ${this.metrics.length} metrics...`);
    
    // Salvar em arquivo ou enviar para serviço de analytics
    // Por enquanto, apenas log
    this.metrics = [];
  }

  /**
   * Gera relatório de uso
   */
  getUsageReport(period: 'hour' | 'day' | 'week' = 'day'): {
    totalOperations: number;
    successRate: number;
    averageLatency: number;
    totalCost: number;
    topModels: Array<{ model: string; count: number }>;
    topProviders: Array<{ provider: string; count: number }>;
  } {
    const now = Date.now();
    const periodMs = period === 'hour' ? 60 * 60 * 1000 :
                     period === 'day' ? 24 * 60 * 60 * 1000 :
                     7 * 24 * 60 * 60 * 1000;

    const recentMetrics = this.metrics.filter(m => now - m.timestamp < periodMs);

    if (recentMetrics.length === 0) {
      return {
        totalOperations: 0,
        successRate: 0,
        averageLatency: 0,
        totalCost: 0,
        topModels: [],
        topProviders: []
      };
    }

    const successCount = recentMetrics.filter(m => m.success).length;
    const avgLatency = recentMetrics.reduce((sum, m) => sum + m.latency, 0) / recentMetrics.length;
    const totalCost = recentMetrics.reduce((sum, m) => sum + (m.cost || 0), 0);

    // Top models
    const modelCounts: Record<string, number> = {};
    recentMetrics.forEach(m => {
      modelCounts[m.model] = (modelCounts[m.model] || 0) + 1;
    });
    const topModels = Object.entries(modelCounts)
      .map(([model, count]) => ({ model, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Top providers
    const providerCounts: Record<string, number> = {};
    recentMetrics.forEach(m => {
      providerCounts[m.provider] = (providerCounts[m.provider] || 0) + 1;
    });
    const topProviders = Object.entries(providerCounts)
      .map(([provider, count]) => ({ provider, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      totalOperations: recentMetrics.length,
      successRate: successCount / recentMetrics.length,
      averageLatency: avgLatency,
      totalCost,
      topModels,
      topProviders
    };
  }

  /**
   * Métricas em tempo real
   */
  getRealtimeMetrics(): {
    lastHour: ObservationMetric[];
    errorRate: number;
    p50Latency: number;
    p95Latency: number;
    p99Latency: number;
  } {
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    const lastHourMetrics = this.metrics.filter(m => m.timestamp >= oneHourAgo);

    const latencies = lastHourMetrics.map(m => m.latency).sort((a, b) => a - b);
    const errors = lastHourMetrics.filter(m => !m.success).length;

    return {
      lastHour: lastHourMetrics.slice(-10), // últimas 10 métricas
      errorRate: lastHourMetrics.length > 0 ? errors / lastHourMetrics.length : 0,
      p50Latency: latencies.length > 0 ? latencies[Math.floor(latencies.length * 0.5)] : 0,
      p95Latency: latencies.length > 0 ? latencies[Math.floor(latencies.length * 0.95)] : 0,
      p99Latency: latencies.length > 0 ? latencies[Math.floor(latencies.length * 0.99)] : 0
    };
  }

  /**
   * Exporta métricas para análise
   */
  exportMetrics(format: 'json' | 'csv' = 'json'): string {
    if (format === 'json') {
      return JSON.stringify(this.metrics, null, 2);
    }

    // CSV
    const headers = 'timestamp,operation,model,provider,latency,success,tokensUsed,cost,error';
    const rows = this.metrics.map(m => 
      `${m.timestamp},${m.operation},${m.model},${m.provider},${m.latency},${m.success},${m.tokensUsed || 0},${m.cost || 0},"${m.error || ''}"`
    );
    
    return [headers, ...rows].join('\n');
  }
}

// Singleton global
export const observability = new AIObservabilityService();
