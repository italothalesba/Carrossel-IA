/**
 * Serviço de Métricas Avançadas e Predictive Scaling (Fase 2)
 * 
 * Funcionalidades:
 * 1. Métricas em tempo real de todos os componentes
 * 2. Predição de esgotamento de quota baseada em tendência
 * 3. Alertas proativos antes de problemas
 * 4. Dashboard de saúde do sistema
 * 5. Exportação de métricas para monitoramento externo
 * 6. Análise de padrões de uso
 */

export interface MetricPoint {
  timestamp: number;
  value: number;
  labels?: Record<string, string>;
}

export interface MetricSeries {
  name: string;
  points: MetricPoint[];
  aggregation?: 'sum' | 'avg' | 'min' | 'max' | 'count';
}

export interface PredictiveAlert {
  id: string;
  type: 'quota_exhaustion' | 'rate_limit' | 'degradation' | 'outage';
  severity: 'info' | 'warning' | 'critical';
  providerId: string;
  providerName: string;
  message: string;
  predictedAt: number; // timestamp quando o problema ocorrerá
  confidence: number; // 0-100%
  recommendation: string;
  createdAt: number;
}

export interface SystemHealth {
  score: number; // 0-100
  status: 'healthy' | 'degraded' | 'at_risk' | 'critical';
  components: {
    apiProviders: ComponentHealth;
    cache: ComponentHealth;
    rateLimiting: ComponentHealth;
    distribution: ComponentHealth;
    storage: ComponentHealth;
  };
  alerts: PredictiveAlert[];
  recommendations: string[];
}

export interface ComponentHealth {
  score: number; // 0-100
  status: 'healthy' | 'degraded' | 'at_risk' | 'critical';
  metrics: Record<string, number>;
  issues: string[];
  limitedCount?: number; // adicionado para rate limiting
}

export interface UsagePattern {
  providerId: string;
  hourOfDay: number; // 0-23
  averageRequests: number;
  averageLatency: number;
  successRate: number;
}

/**
 * Serviço de Métricas e Predição
 */
export class AdvancedMetricsService {
  // Séries temporais de métricas
  private metrics: Map<string, MetricSeries> = new Map();

  // Alertas preditivos ativos
  private alerts: Map<string, PredictiveAlert> = new Map();

  // Padrões de uso históricos
  private usagePatterns: Map<string, UsagePattern[]> = new Map();

  // Limiares para alertas
  private readonly ALERT_THRESHOLDS = {
    quotaWarningPercent: 70, // alertar em 70% da quota
    quotaCriticalPercent: 85, // crítico em 85%
    latencyWarningMs: 5000, // alertar se latência > 5s
    successRateWarning: 80, // alertar se success rate < 80%
    successRateCritical: 60, // crítico se < 60%
    predictionWindowHours: 2 // janela de predição: 2 horas
  };

  // Máximo de pontos por série
  private readonly MAX_METRIC_POINTS = 1000;

  constructor() {
    console.log('[AdvancedMetrics] Service initialized');
  }

  /**
   * Registrar métrica
   */
  recordMetric(
    seriesName: string,
    value: number,
    labels?: Record<string, string>,
    aggregation: MetricSeries['aggregation'] = 'avg'
  ): void {
    let series = this.metrics.get(seriesName);

    if (!series) {
      series = {
        name: seriesName,
        points: [],
        aggregation
      };
      this.metrics.set(seriesName, series);
    }

    series.points.push({
      timestamp: Date.now(),
      value,
      labels
    });

    // Limitar pontos
    if (series.points.length > this.MAX_METRIC_POINTS) {
      series.points.splice(0, series.points.length - this.MAX_METRIC_POINTS);
    }
  }

  /**
   * Obter métrica agregada
   */
  getMetric(
    seriesName: string,
    windowMs: number = 5 * 60 * 1000 // últimos 5 minutos
  ): { avg: number; min: number; max: number; count: number; sum: number } | null {
    const series = this.metrics.get(seriesName);
    if (!series || series.points.length === 0) {
      return null;
    }

    const now = Date.now();
    const cutoff = now - windowMs;

    const recentPoints = series.points.filter(p => p.timestamp >= cutoff);

    if (recentPoints.length === 0) {
      return null;
    }

    const values = recentPoints.map(p => p.value);
    const sum = values.reduce((a, b) => a + b, 0);

    return {
      avg: sum / values.length,
      min: Math.min(...values),
      max: Math.max(...values),
      count: values.length,
      sum
    };
  }

  /**
   * Predizer esgotamento de quota
   */
  predictQuotaExhaustion(
    providerId: string,
    providerName: string,
    currentUsage: number,
    limit: number,
    timeWindowMs: number = 60 * 60 * 1000 // taxa nas últimas 1 hora
  ): PredictiveAlert | null {
    const usagePercent = (currentUsage / limit) * 100;

    // Obter taxa de uso recente
    const metricName = `quota_usage_${providerId}`;
    const recentMetric = this.getMetric(metricName, timeWindowMs);

    if (!recentMetric) {
      return null;
    }

    // Calcular requests por hora
    const requestsPerHour = recentMetric.count * (60 * 60 * 1000 / timeWindowMs);
    const remaining = limit - currentUsage;

    if (remaining <= 0) {
      // Já esgotado
      return this.createAlert(
        'quota_exhaustion',
        'critical',
        providerId,
        providerName,
        `Quota esgotada: ${currentUsage}/${limit} requests usados`,
        Date.now(),
        100,
        'Trocar para provider alternativo imediatamente'
      );
    }

    // Predizer quando esgotará
    const hoursUntilExhaustion = remaining / requestsPerHour;
    const exhaustionTime = Date.now() + (hoursUntilExhaustion * 60 * 60 * 1000);

    // Verificar se está dentro da janela de predição
    if (hoursUntilExhaustion <= this.ALERT_THRESHOLDS.predictionWindowHours) {
      const severity = usagePercent >= this.ALERT_THRESHOLDS.quotaCriticalPercent
        ? 'critical'
        : 'warning';

      return this.createAlert(
        'quota_exhaustion',
        severity,
        providerId,
        providerName,
        `Quota será esgotada em ~${hoursUntilExhaustion.toFixed(1)}h (${requestsPerHour.toFixed(0)} req/h)`,
        exhaustionTime,
        Math.min(100, (usagePercent / 100) * 100),
        `Considerar reduzir uso ou aumentar quota. Requests restantes: ${remaining}`
      );
    }

    return null;
  }

  /**
   * Predizer degradação de performance
   */
  predictDegradation(
    providerId: string,
    providerName: string,
    currentLatency: number,
    recentAvgLatency: number
  ): PredictiveAlert | null {
    // Verificar se latência está aumentando significativamente
    const increasePercent = ((currentLatency - recentAvgLatency) / recentAvgLatency) * 100;

    if (increasePercent > 50 && currentLatency > this.ALERT_THRESHOLDS.latencyWarningMs) {
      return this.createAlert(
        'degradation',
        'warning',
        providerId,
        providerName,
        `Latência aumentando ${increasePercent.toFixed(0)}% (${currentLatency.toFixed(0)}ms vs ${recentAvgLatency.toFixed(0)}ms)`,
        Date.now() + (30 * 60 * 1000), // predição: 30 min
        70,
        'Monitorar de perto. Considerar reduzir carga neste provider.'
      );
    }

    return null;
  }

  /**
   * Verificar saúde de um provider
   */
  checkProviderHealth(
    providerId: string,
    providerName: string,
    stats: {
      successRate: number;
      avgLatency: number;
      quotaUsagePercent: number;
      consecutiveFailures: number;
    }
  ): ComponentHealth {
    const issues: string[] = [];
    let score = 100;

    // Penalidade por taxa de sucesso baixa
    if (stats.successRate < this.ALERT_THRESHOLDS.successRateCritical) {
      score -= 50;
      issues.push(`Taxa de sucesso crítica: ${stats.successRate.toFixed(1)}%`);
    } else if (stats.successRate < this.ALERT_THRESHOLDS.successRateWarning) {
      score -= 30;
      issues.push(`Taxa de sucesso baixa: ${stats.successRate.toFixed(1)}%`);
    }

    // Penalidade por latência alta
    if (stats.avgLatency > this.ALERT_THRESHOLDS.latencyWarningMs * 2) {
      score -= 30;
      issues.push(`Latência muito alta: ${stats.avgLatency.toFixed(0)}ms`);
    } else if (stats.avgLatency > this.ALERT_THRESHOLDS.latencyWarningMs) {
      score -= 15;
      issues.push(`Latência alta: ${stats.avgLatency.toFixed(0)}ms`);
    }

    // Penalidade por quota quase esgotada
    if (stats.quotaUsagePercent > this.ALERT_THRESHOLDS.quotaCriticalPercent) {
      score -= 30;
      issues.push(`Quota quase esgotada: ${stats.quotaUsagePercent.toFixed(1)}%`);
    } else if (stats.quotaUsagePercent > this.ALERT_THRESHOLDS.quotaWarningPercent) {
      score -= 15;
      issues.push(`Quota em aviso: ${stats.quotaUsagePercent.toFixed(1)}%`);
    }

    // Penalidade por falhas consecutivas
    if (stats.consecutiveFailures >= 5) {
      score -= 20;
      issues.push(`${stats.consecutiveFailures} falhas consecutivas`);
    }

    score = Math.max(0, score);

    // Determinar status
    let status: ComponentHealth['status'];
    if (score >= 80) status = 'healthy';
    else if (score >= 60) status = 'degraded';
    else if (score >= 40) status = 'at_risk';
    else status = 'critical';

    return {
      score,
      status,
      metrics: {
        successRate: stats.successRate,
        avgLatency: stats.avgLatency,
        quotaUsagePercent: stats.quotaUsagePercent,
        consecutiveFailures: stats.consecutiveFailures
      },
      issues
    };
  }

  /**
   * Obter saúde geral do sistema
   */
  getSystemHealth(
    providers: Array<{
      id: string;
      name: string;
      stats: {
        successRate: number;
        avgLatency: number;
        quotaUsagePercent: number;
        consecutiveFailures: number;
      };
    }>,
    cacheStats: {
      hitRate: number;
      totalEntries: number;
    },
    rateLimitStats: {
      availableCount: number;
      limitedCount: number;
    }
  ): SystemHealth {
    // Saúde dos providers
    const providerHealths = providers.map(p =>
      this.checkProviderHealth(p.id, p.name, p.stats)
    );

    const avgProviderScore = providerHealths.reduce((sum, h) => sum + h.score, 0) / providerHealths.length;

    // Saúde do cache
    const cacheScore = cacheStats.hitRate > 50 ? 80 : cacheStats.hitRate > 20 ? 60 : 40;
    const cacheHealth: ComponentHealth = {
      score: cacheScore,
      status: cacheScore >= 80 ? 'healthy' : cacheScore >= 60 ? 'degraded' : 'at_risk',
      metrics: {
        hitRate: cacheStats.hitRate,
        totalEntries: cacheStats.totalEntries
      },
      issues: cacheStats.hitRate < 30 ? ['Cache hit rate muito baixa'] : []
    };

    // Saúde do rate limiting
    const totalProviders = rateLimitStats.availableCount + rateLimitStats.limitedCount;
    const rateLimitScore = totalProviders > 0
      ? (rateLimitStats.availableCount / totalProviders) * 100
      : 0;
    const rateLimitHealth: ComponentHealth = {
      score: rateLimitScore,
      status: rateLimitScore >= 80 ? 'healthy' : rateLimitScore >= 60 ? 'degraded' : 'critical',
      metrics: {
        availableCount: rateLimitStats.availableCount,
        limitedCount: rateLimitStats.limitedCount
      },
      issues: rateLimitStats.limitedCount > 0
        ? [`${rateLimitStats.limitedCount} providers com rate limit ativo`]
        : []
    };

    // Saúde da distribuição
    const distributionScore = avgProviderScore; // baseado nos providers
    const distributionHealth: ComponentHealth = {
      score: distributionScore,
      status: distributionScore >= 80 ? 'healthy' : distributionScore >= 60 ? 'degraded' : 'at_risk',
      metrics: {
        avgProviderScore
      },
      issues: providerHealths.flatMap(h => h.issues).slice(0, 3)
    };

    // Saúde do storage (assumir OK por enquanto)
    const storageHealth: ComponentHealth = {
      score: 100,
      status: 'healthy',
      metrics: {},
      issues: []
    };

    // Score geral (ponderado)
    const overallScore = (
      avgProviderScore * 0.4 +
      cacheScore * 0.15 +
      rateLimitScore * 0.25 +
      distributionScore * 0.2
    );

    // Determinar status geral
    let overallStatus: SystemHealth['status'];
    if (overallScore >= 80) overallStatus = 'healthy';
    else if (overallScore >= 60) overallStatus = 'degraded';
    else if (overallScore >= 40) overallStatus = 'at_risk';
    else overallStatus = 'critical';

    // Coletar alertas
    const activeAlerts = Array.from(this.alerts.values())
      .filter(a => Date.now() < a.predictedAt + (60 * 60 * 1000)); // alertas das últimas 1 hora

    // Gerar recomendações
    const recommendations = this.generateRecommendations(
      providerHealths,
      cacheHealth,
      rateLimitHealth,
      activeAlerts
    );

    return {
      score: Math.round(overallScore * 10) / 10,
      status: overallStatus,
      components: {
        apiProviders: {
          score: Math.round(avgProviderScore * 10) / 10,
          status: avgProviderScore >= 80 ? 'healthy' : avgProviderScore >= 60 ? 'degraded' : 'at_risk',
          metrics: { avgProviderScore },
          issues: providerHealths.flatMap(h => h.issues)
        },
        cache: cacheHealth,
        rateLimiting: rateLimitHealth,
        distribution: distributionHealth,
        storage: storageHealth
      },
      alerts: activeAlerts,
      recommendations
    };
  }

  /**
   * Criar alerta preditiva
   */
  private createAlert(
    type: PredictiveAlert['type'],
    severity: PredictiveAlert['severity'],
    providerId: string,
    providerName: string,
    message: string,
    predictedAt: number,
    confidence: number,
    recommendation: string
  ): PredictiveAlert {
    const id = `${type}_${providerId}_${Date.now()}`;

    const alert: PredictiveAlert = {
      id,
      type,
      severity,
      providerId,
      providerName,
      message,
      predictedAt,
      confidence,
      recommendation,
      createdAt: Date.now()
    };

    // Armazenar alerta
    this.alerts.set(id, alert);

    console.warn(
      `[AdvancedMetrics] 🚨 ALERT [${severity.toUpperCase()}]: ${message} ` +
      `(confidence: ${confidence}%)`
    );

    return alert;
  }

  /**
   * Gerar recomendações baseadas na saúde
   */
  private generateRecommendations(
    providerHealths: ComponentHealth[],
    cacheHealth: ComponentHealth,
    rateLimitHealth: ComponentHealth,
    alerts: PredictiveAlert[]
  ): string[] {
    const recommendations: string[] = [];

    // Providers com problemas
    const criticalProviders = providerHealths.filter(h => h.status === 'critical' || h.status === 'at_risk');
    if (criticalProviders.length > 0) {
      recommendations.push(
        `⚠️ ${criticalProviders.length} provider(s) com saúde crítica. Verificar quotas e latência.`
      );
    }

    // Cache
    if (cacheHealth.score < 50) {
      recommendations.push(
        '💡 Cache hit rate baixa. Considerar aumentar TTL ou ajustar similaridade.'
      );
    }

    // Rate limiting
    if (rateLimitHealth.limitedCount > 0) {
      recommendations.push(
        `🔄 ${rateLimitHealth.limitedCount} provider(s) com rate limit ativo. Sistema de rotação funcionando.`
      );
    }

    // Alertas críticos
    const criticalAlerts = alerts.filter(a => a.severity === 'critical');
    if (criticalAlerts.length > 0) {
      recommendations.push(
        `🚨 ${criticalAlerts.length} alerta(s) crítico(s) ativo(s). Ação imediata recomendada.`
      );
    }

    if (recommendations.length === 0) {
      recommendations.push('✅ Sistema operando normalmente. Sem ações necessárias.');
    }

    return recommendations;
  }

  /**
   * Obter relatório de métricas
   */
  getMetricsReport(): string {
    let report = '\n' + '='.repeat(80) + '\n';
    report += '📊 RELATÓRIO DE MÉTRICAS AVANÇADAS (FASE 2)\n';
    report += `🕐 ${new Date().toLocaleString('pt-BR')}\n`;
    report += '='.repeat(80) + '\n\n';

    // Alertas ativos
    const activeAlerts = Array.from(this.alerts.values())
      .filter(a => Date.now() < a.predictedAt + (60 * 60 * 1000));

    report += `🚨 Alertas Ativos: ${activeAlerts.length}\n`;
    if (activeAlerts.length > 0) {
      activeAlerts.forEach(alert => {
        const icon = alert.severity === 'critical' ? '🔴' :
                     alert.severity === 'warning' ? '🟡' : '🔵';
        const timeUntil = alert.predictedAt - Date.now();
        const timeStr = timeUntil > 0
          ? `em ${Math.ceil(timeUntil / 60000)}min`
          : `${Math.abs(Math.ceil(timeUntil / 60000))}min atrás`;

        report += `\n${icon} [${alert.severity.toUpperCase()}] ${alert.message}\n`;
        report += `   Provider: ${alert.providerName}\n`;
        report += `   Predição: ${timeStr}\n`;
        report += `   Confiança: ${alert.confidence}%\n`;
        report += `   💡 ${alert.recommendation}\n`;
      });
    }

    // Séries de métricas
    report += '\n' + '-'.repeat(80) + '\n';
    report += 'SÉRIES DE MÉTRICAS:\n';
    report += '-'.repeat(80) + '\n';

    this.metrics.forEach((series, name) => {
      const recent = this.getMetric(name, 5 * 60 * 1000);
      if (recent) {
        report += `\n📈 ${name}\n`;
        report += `   Avg: ${recent.avg.toFixed(2)}, Min: ${recent.min.toFixed(2)}, `;
        report += `Max: ${recent.max.toFixed(2)}, Count: ${recent.count}\n`;
      }
    });

    report += '\n' + '='.repeat(80) + '\n';

    return report;
  }

  /**
   * Limpar alertas antigos
   */
  cleanupAlerts(maxAgeMs: number = 24 * 60 * 60 * 1000): void {
    const now = Date.now();
    let cleaned = 0;

    this.alerts.forEach((alert, id) => {
      if (now - alert.createdAt > maxAgeMs) {
        this.alerts.delete(id);
        cleaned++;
      }
    });

    if (cleaned > 0) {
      console.log(`[AdvancedMetrics] Cleaned ${cleaned} old alerts`);
    }
  }

  /**
   * Exportar métricas em formato JSON
   */
  exportMetrics(windowMs: number = 60 * 60 * 1000): Record<string, any> {
    const exported: Record<string, any> = {};

    this.metrics.forEach((series, name) => {
      const metric = this.getMetric(name, windowMs);
      if (metric) {
        exported[name] = metric;
      }
    });

    return {
      timestamp: Date.now(),
      windowMs,
      metrics: exported,
      alerts: Array.from(this.alerts.values())
    };
  }

  /**
   * Limpar métricas antigas
   */
  cleanupMetrics(maxAgeMs: number = 24 * 60 * 60 * 1000): void {
    const now = Date.now();
    const cutoff = now - maxAgeMs;

    this.metrics.forEach((series, name) => {
      series.points = series.points.filter(p => p.timestamp >= cutoff);
    });

    this.cleanupAlerts(maxAgeMs);
  }
}

// Singleton export
export const advancedMetrics = new AdvancedMetricsService();
