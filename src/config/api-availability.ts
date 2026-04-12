/**
 * Configuração de disponibilidade de APIs
 * Permite habilitar/desabilitar APIs individualmente
 * e define cooldowns automáticos baseados em quota
 */

export interface ApiAvailabilityConfig {
  enabled: boolean;
  reason?: string;
  autoDisableOnQuota: boolean;
  quotaResetDate?: string; // ISO date string
}

// Configuração inicial de disponibilidade
// ATUALIZADO: Desabilitados providers com quota excedida - reset automático no próximo ciclo
export const apiAvailability: Record<string, ApiAvailabilityConfig> = {
  // ✅ APIs de Texto - OPENROUTER (FUNCIONANDO)
  'nemotron-1': { enabled: true, autoDisableOnQuota: true },
  'nemotron-2': { enabled: true, autoDisableOnQuota: true },
  'nemotron-3': { enabled: true, autoDisableOnQuota: true },
  'nemotron-4': { enabled: true, autoDisableOnQuota: true },

  // ❌ Gemma 4 - Quota excedida - reset no próximo mês
  'gemma4-1': { enabled: false, reason: 'Quota excedida (429)', autoDisableOnQuota: true, quotaResetDate: getNextMonthFirstDay() },
  'gemma4-2': { enabled: false, reason: 'Quota excedida (429)', autoDisableOnQuota: true, quotaResetDate: getNextMonthFirstDay() },
  'gemma4-3': { enabled: false, reason: 'Quota excedida (429)', autoDisableOnQuota: true, quotaResetDate: getNextMonthFirstDay() },
  'gemma4-4': { enabled: false, reason: 'Quota excedida (429)', autoDisableOnQuota: true, quotaResetDate: getNextMonthFirstDay() },

  // ⚠️ FIREWORKS AI - Apenas 1 funciona
  'fireworks-1': { enabled: true, autoDisableOnQuota: true },
  'fireworks-2': { enabled: false, reason: 'Erro 412 - resposta vazia', autoDisableOnQuota: true },
  'fireworks-3': { enabled: false, reason: 'Erro 412 - resposta vazia', autoDisableOnQuota: true },

  // ❌ ALIBABA DASHSCOPE - 401 Unauthorized - reset no próximo mês
  'dashscope-1': { enabled: false, reason: '401 Unauthorized - chave inválida', autoDisableOnQuota: true, quotaResetDate: getNextMonthFirstDay() },
  'dashscope-2': { enabled: false, reason: '401 Unauthorized - chave inválida', autoDisableOnQuota: true, quotaResetDate: getNextMonthFirstDay() },
  'dashscope-3': { enabled: false, reason: '401 Unauthorized - chave inválida', autoDisableOnQuota: true, quotaResetDate: getNextMonthFirstDay() },

  // ✅ GROQ (FUNCIONANDO - rápido)
  'groq-1': { enabled: true, autoDisableOnQuota: true },
  'groq-2': { enabled: true, autoDisableOnQuota: true },
  'groq-3': { enabled: true, autoDisableOnQuota: true },

  // ❌ SAMBANOVA - 401 - reset no próximo mês
  'sambanova-1': { enabled: false, reason: '401 Unauthorized', autoDisableOnQuota: true, quotaResetDate: getNextMonthFirstDay() },
  'sambanova-2': { enabled: false, reason: '401 Unauthorized', autoDisableOnQuota: true, quotaResetDate: getNextMonthFirstDay() },
  'sambanova-3': { enabled: false, reason: '401 Unauthorized', autoDisableOnQuota: true, quotaResetDate: getNextMonthFirstDay() },

  // ❌ AIMLAPI - 404 - reset no próximo mês
  'aiml-1': { enabled: false, reason: '404 Not Found', autoDisableOnQuota: true, quotaResetDate: getNextMonthFirstDay() },
  'aiml-2': { enabled: false, reason: '404 Not Found', autoDisableOnQuota: true, quotaResetDate: getNextMonthFirstDay() },
  'aiml-3': { enabled: false, reason: '404 Not Found', autoDisableOnQuota: true, quotaResetDate: getNextMonthFirstDay() },

  // ❌ ANTHROPIC CLAUDE - Handler não implementado - reset no próximo mês
  'anthropic-1': { enabled: false, reason: 'Handler não implementado no server', autoDisableOnQuota: true, quotaResetDate: getNextMonthFirstDay() },
  'anthropic-2': { enabled: false, reason: 'Handler não implementado no server', autoDisableOnQuota: true, quotaResetDate: getNextMonthFirstDay() },
  'anthropic-3': { enabled: false, reason: 'Handler não implementado no server', autoDisableOnQuota: true, quotaResetDate: getNextMonthFirstDay() },

  // ❌ GOOGLE GEMINI - Quota excedida - reset no próximo mês
  'gemini-1': { enabled: false, reason: '429 Quota excedida', autoDisableOnQuota: true, quotaResetDate: getNextMonthFirstDay() },
  'gemini-2': { enabled: false, reason: '429 Quota excedida', autoDisableOnQuota: true, quotaResetDate: getNextMonthFirstDay() },
  'gemini-3': { enabled: false, reason: '429 Quota excedida', autoDisableOnQuota: true, quotaResetDate: getNextMonthFirstDay() },
  'gemini-4': { enabled: false, reason: '429 Quota excedida', autoDisableOnQuota: true, quotaResetDate: getNextMonthFirstDay() },

  // ❌ OUTRAS - Sempre falham - reset no próximo mês
  'together-1': { enabled: false, reason: '401 Unauthorized', autoDisableOnQuota: true, quotaResetDate: getNextMonthFirstDay() },
  // ✅ DEEPSEEK — PRIORIDADE MÁXIMA (sem limites rígidos, best-effort)
  // 5M tokens grátis por 30 dias
  'deepseek-1': { enabled: true, autoDisableOnQuota: true },
  'deepseek-2': { enabled: true, autoDisableOnQuota: true },
  'deepseek-3': { enabled: true, autoDisableOnQuota: true },
  'huggingface-1': { enabled: false, reason: '410 Gone - modelo deprecated', autoDisableOnQuota: true, quotaResetDate: getNextMonthFirstDay() },

  // APIs de Imagem
  'google-image': { enabled: true, autoDisableOnQuota: true },
  'cloudflare-image': { enabled: true, autoDisableOnQuota: true },
  'huggingface-image': { enabled: true, autoDisableOnQuota: true },
  'replicate-image': { enabled: true, autoDisableOnQuota: true },
  'leonardo-image': { enabled: true, autoDisableOnQuota: true },
  'modelslab-image': { enabled: true, autoDisableOnQuota: true },
  'aihorde-image': { enabled: true, autoDisableOnQuota: true }
};

// Função auxiliar para obter primeiro dia do próximo mês
function getNextMonthFirstDay(): string {
  const now = new Date();
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return nextMonth.toISOString();
}

// Verificar se API está disponível
export function isApiAvailable(providerId: string): boolean {
  const config = apiAvailability[providerId];
  if (!config) return true; // Se não configurado, assume disponível

  // Verificar se quota resetou
  if (!config.enabled && config.quotaResetDate) {
    const resetDate = new Date(config.quotaResetDate);
    if (new Date() >= resetDate) {
      config.enabled = true;
      config.reason = undefined;
      config.quotaResetDate = undefined;
      console.log(`[API AVAILABILITY] ✅ ${providerId} quota reset, re-enabled automatically`);
      return true;
    } else {
      // Mostrar quando será reabilitada
      const daysUntilReset = Math.ceil((resetDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      console.log(`[API AVAILABILITY] ⏸️ ${providerId} still disabled (quota), resets in ${daysUntilReset} days`);
    }
  }

  return config.enabled;
}

// Desabilitar API automaticamente
export function disableApi(providerId: string, reason: string, resetDate?: string): void {
  const config = apiAvailability[providerId];
  if (config) {
    config.enabled = false;
    config.reason = reason;
    if (resetDate) {
      config.quotaResetDate = resetDate;
    }
    console.warn(`[API AVAILABILITY] ${providerId} disabled: ${reason}`);
  }
}

// Habilitar API manualmente
export function enableApi(providerId: string): void {
  const config = apiAvailability[providerId];
  if (config) {
    config.enabled = true;
    config.reason = undefined;
    config.quotaResetDate = undefined;
    console.log(`[API AVAILABILITY] ${providerId} manually enabled`);
  }
}

// Obter status de todas as APIs
export function getAllApisStatus(): Array<{
  id: string;
  enabled: boolean;
  reason?: string;
  quotaResetDate?: string;
}> {
  return Object.entries(apiAvailability).map(([id, config]) => ({
    id,
    enabled: config.enabled,
    reason: config.reason,
    quotaResetDate: config.quotaResetDate
  }));
}
