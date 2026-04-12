/**
 * Rate Limit Integration for server.ts
 * Wrapper para aplicar rate limiting em todas as chamadas fetch
 */

import { parseRateLimitHeaders } from './rate-limit-headers';
import { rateLimitTracker } from './rate-limit-tracker';

/**
 * Faz fetch com rate limit automático
 * Lê headers de rate limit e atualiza trackers
 */
export async function fetchWithRateLimit(
  url: string,
  options: RequestInit,
  providerId: string,
  providerName: string
): Promise<Response> {
  // Verificar throttle ANTES de fazer request
  const throttle = rateLimitTracker.isThrottled(providerId);
  if (throttle.isThrottled) {
    console.warn(`[THROTTLE] ${providerName} throttled, waiting ${Math.ceil(throttle.waitMs / 1000)}s`);
    // Esperar tempo necessário
    await new Promise(resolve => setTimeout(resolve, throttle.waitMs));
  }

  // Fazer request
  const response = await fetch(url, options);

  // Ler headers de rate limit
  const rlHeaders = parseRateLimitHeaders(response, providerId);

  // Atualizar trackers
  rateLimitTracker.updateFromHeaders(providerId, providerName, rlHeaders);

  // Log se headers estão presentes
  if (rlHeaders.limit !== undefined || rlHeaders.remaining !== undefined) {
    console.log(`[RATE LIMIT] ${providerName}: limit=${rlHeaders.limit}, remaining=${rlHeaders.remaining}`);
  }

  return response;
}

/**
 * Registra sucesso/erro no rate limit tracker
 */
export function recordRateLimitResult(
  providerId: string,
  providerName: string,
  success: boolean,
  statusCode?: number,
  error?: string
): void {
  rateLimitTracker.recordUsage(
    providerId,
    providerName,
    success,
    undefined,
    error,
    statusCode
  );

  // Registrar timestamp para throttle
  rateLimitTracker.recordRequestTimestamp(providerId, providerName, success);
}
