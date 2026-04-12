/**
 * Rate Limit Headers Parser
 * Lê e parseia headers de rate limit de todas as APIs suportadas
 */

export interface ParsedRateLimitHeaders {
  // Headers padrão (OpenRouter, Fireworks, etc.)
  limit?: number;
  remaining?: number;
  overLimit?: boolean;
  retryAfter?: number;
  
  // Headers específicos Cloudflare
  cloudflarePolicy?: string;
  
  // Provedor que retornou os headers
  provider: string;
  
  // Timestamp de quando foi lido
  timestamp: number;
}

/**
 * Lê e parseia headers de rate limit de uma resposta HTTP
 * Suporta múltiplos formatos de diferentes provedores
 */
export function parseRateLimitHeaders(response: Response, provider: string): ParsedRateLimitHeaders {
  const headers: ParsedRateLimitHeaders = {
    provider,
    timestamp: Date.now()
  };

  // ==========================================
  // HuggingFace (padrão IETF: RateLimit, RateLimit-Policy)
  // Formato: "[bucket]";r=remaining;t=reset_time
  // Policy: "fixed window";"[bucket]";q=quota;w=window
  // ==========================================
  const hfRateLimit = response.headers.get('ratelimit');
  if (hfRateLimit) {
    // Parse: "[bucket]";r=123;t=45
    const remainingMatch = hfRateLimit.match(/r=(\d+)/);
    const resetMatch = hfRateLimit.match(/t=(\d+)/);
    
    if (remainingMatch) {
      headers.remaining = parseInt(remainingMatch[1], 10);
    }
    if (resetMatch) {
      headers.retryAfter = parseInt(resetMatch[1], 10);
    }
  }

  const hfPolicy = response.headers.get('ratelimit-policy');
  if (hfPolicy) {
    // Parse: "fixed window";"[bucket]";q=1000;w=300
    const quotaMatch = hfPolicy.match(/q=(\d+)/);
    const windowMatch = hfPolicy.match(/w=(\d+)/);
    
    if (quotaMatch) {
      headers.limit = parseInt(quotaMatch[1], 10);
    }
  }

  // ==========================================
  // OpenRouter / Fireworks AI (padrão x-ratelimit-*)
  // ==========================================
  const limitHeader = response.headers.get('x-ratelimit-limit-requests') || 
                      response.headers.get('x-ratelimit-limit');
  const remainingHeader = response.headers.get('x-ratelimit-remaining-requests') || 
                          response.headers.get('x-ratelimit-remaining');
  const overLimitHeader = response.headers.get('x-ratelimit-over-limit');
  const retryAfterHeader = response.headers.get('retry-after');

  if (limitHeader && !headers.limit) {
    headers.limit = parseInt(limitHeader, 10);
  }

  if (remainingHeader && !headers.remaining) {
    headers.remaining = parseInt(remainingHeader, 10);
  }

  if (overLimitHeader) {
    headers.overLimit = overLimitHeader.toLowerCase() === 'yes';
  }

  if (retryAfterHeader && !headers.retryAfter) {
    headers.retryAfter = parseInt(retryAfterHeader, 10);
  }

  // ==========================================
  // Cloudflare (formato especial: "default";r=50;t=30)
  // ==========================================
  const cloudflareRatelimit = response.headers.get('ratelimit');
  if (cloudflareRatelimit && !headers.limit) {
    headers.cloudflarePolicy = cloudflareRatelimit;
    
    // Parse do formato: "policy_name";r=remaining;t=reset_time
    const match = cloudflareRatelimit.match(/r=(\d+)/);
    if (match && !headers.remaining) {
      headers.remaining = parseInt(match[1], 10);
    }
  }

  const cloudflarePolicy = response.headers.get('ratelimit-policy');
  if (cloudflarePolicy && !headers.limit) {
    // Parse do formato: "policy_name";q=quota;w=window
    const match = cloudflarePolicy.match(/q=(\d+);w=(\d+)/);
    if (match && !headers.limit) {
      headers.limit = parseInt(match[1], 10);
    }
  }

  return headers;
}

/**
 * Valida se os headers parseados são válidos
 */
export function isValidRateLimitHeaders(headers: ParsedRateLimitHeaders): boolean {
  return (
    headers.limit !== undefined ||
    headers.remaining !== undefined ||
    headers.retryAfter !== undefined
  );
}

/**
 * Formata headers para logging
 */
export function formatRateLimitLog(headers: ParsedRateLimitHeaders): string {
  const parts: string[] = [];
  
  if (headers.limit !== undefined) {
    parts.push(`limit=${headers.limit}`);
  }
  
  if (headers.remaining !== undefined) {
    parts.push(`remaining=${headers.remaining}`);
  }
  
  if (headers.overLimit) {
    parts.push('over_limit=true');
  }
  
  if (headers.retryAfter !== undefined) {
    parts.push(`retry_after=${headers.retryAfter}s`);
  }
  
  return `[RateLimit ${headers.provider}] ${parts.join(', ')}`;
}

/**
 * Calcula percentual de uso baseado nos headers
 */
export function calculateUsagePercent(headers: ParsedRateLimitHeaders): number | null {
  if (headers.limit === undefined || headers.remaining === undefined) {
    return null;
  }
  
  const used = headers.limit - headers.remaining;
  return Math.round((used / headers.limit) * 100);
}
