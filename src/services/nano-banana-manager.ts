/**
 * ============================================================================
 * SERVIÇO: Nano Banana (Gemini 2.5 Flash Image) - Gerenciamento de Limites
 * ============================================================================
 * 
 * MODELO: gemini-2.5-flash-image (Nano Banana)
 * PROVIDER: Google AI Studio
 * LIMITE GRATUITO: 50 imagens por mês
 * LATÊNCIA MÉDIA: 7.4 segundos
 * QUALIDADE: Ultra
 * 
 * ESTRATÉGIA DE USO:
 * - SLIDE 1 (CAPA): SEMPRE usar Nano Banana (mais importante visualmente)
 * - SLIDES 2-3 (CONTEÚDO): Usar fallback gratuito se limite atingido
 * - SLIDE 4 (CTA): Usar Nano Banana se limite disponível
 * 
 * MONITORAMENTO:
 * - Contador de requests no localStorage
 * - Reset automático no início de cada mês
 * - Fallback para Cloudflare FLUX-Schnell (100 req/dia grátis)
 * - Fallback secundário: Leonardo.AI ($150 tokens/mês)
 */

interface NanoBananaStatus {
  requestsUsed: number;
  requestsRemaining: number;
  monthlyLimit: 50;
  resetDate: string;
  isLimitReached: boolean;
  lastReset: number;
}

interface NanoBananaConfig {
  model: 'gemini-2.5-flash-image';
  provider: 'google-ai-studio';
  apiKey: string;
  maxRetries: number;
  timeout: number;
}

const NANO_BANANA_MONTHLY_LIMIT = 50;
const STORAGE_KEY = 'nano_banana_usage';
const CONFIG: NanoBananaConfig = {
  model: 'gemini-2.5-flash-image',
  provider: 'google-ai-studio',
  apiKey: '', // Será injetado pelo server
  maxRetries: 2,
  timeout: 30000, // 30 segundos
};

/**
 * Obtém status atual do Nano Banana
 */
export function getNanoBananaStatus(): NanoBananaStatus {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  
  // Verifica se precisa resetar contador
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    const data = JSON.parse(stored);
    const lastReset = new Date(data.lastReset);
    
    // Se mudou o mês, reseta
    if (lastReset.getMonth() !== currentMonth || lastReset.getFullYear() !== currentYear) {
      const freshStatus: NanoBananaStatus = {
        requestsUsed: 0,
        requestsRemaining: NANO_BANANA_MONTHLY_LIMIT,
        monthlyLimit: NANO_BANANA_MONTHLY_LIMIT,
        resetDate: new Date(currentYear, currentMonth + 1, 0).toISOString(),
        isLimitReached: false,
        lastReset: now.getTime(),
      };
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(freshStatus));
      return freshStatus;
    }
    
    return data as NanoBananaStatus;
  }
  
  // Primeiro uso
  const freshStatus: NanoBananaStatus = {
    requestsUsed: 0,
    requestsRemaining: NANO_BANANA_MONTHLY_LIMIT,
    monthlyLimit: NANO_BANANA_MONTHLY_LIMIT,
    resetDate: new Date(currentYear, currentMonth + 1, 0).toISOString(),
    isLimitReached: false,
    lastReset: now.getTime(),
  };
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(freshStatus));
  return freshStatus;
}

/**
 * Incrementa contador de uso do Nano Banana
 */
export function incrementNanoBananaUsage(): NanoBananaStatus {
  const status = getNanoBananaStatus();
  
  if (status.isLimitReached) {
    throw new Error('Nano Banana monthly limit reached. Use fallback model.');
  }
  
  const newStatus: NanoBananaStatus = {
    ...status,
    requestsUsed: status.requestsUsed + 1,
    requestsRemaining: status.requestsRemaining - 1,
    isLimitReached: status.requestsRemaining - 1 <= 0,
  };
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(newStatus));
  console.log(`[NANO BANANA] Usage: ${newStatus.requestsUsed}/${NANO_BANANA_MONTHLY_LIMIT} (${newStatus.requestsRemaining} remaining)`);
  
  return newStatus;
}

/**
 * Decide qual modelo de imagem usar baseado no limite e importância do slide
 */
export function decidirModeloImagem(
  slideType: 'cover' | 'content' | 'cta',
  slideNumber: number
): { model: string; reason: string; priority: 'high' | 'medium' | 'low' } {
  const status = getNanoBananaStatus();
  
  // CAPA (slide 1): SEMPRE Nano Banana (alta prioridade)
  if (slideType === 'cover' || slideNumber === 1) {
    if (!status.isLimitReached) {
      return {
        model: 'nano-banana',
        reason: 'Cover slide requires highest quality - using Nano Banana',
        priority: 'high',
      };
    }
    // Se limite atingido, fallback para FLUX-Schnell
    return {
      model: 'flux-schnell',
      reason: 'Nano Banana limit reached - fallback to FLUX-Schnell for cover',
      priority: 'high',
    };
  }
  
  // CTA (slide 4): Usa Nano Banana se disponível
  if (slideType === 'cta' || slideNumber === 4) {
    if (!status.isLimitReached && status.requestsRemaining > 5) {
      return {
        model: 'nano-banana',
        reason: 'CTA slide - using Nano Banana (5+ requests remaining)',
        priority: 'medium',
      };
    }
    return {
      model: 'flux-schnell',
      reason: 'Saving Nano Banana for cover - using FLUX-Schnell for CTA',
      priority: 'medium',
    };
  }
  
  // CONTEÚDO (slides 2-3): Usa Nano Banana só se tiver bastante limite
  if (slideType === 'content') {
    if (!status.isLimitReached && status.requestsRemaining > 10) {
      return {
        model: 'nano-banana',
        reason: `Content slide - using Nano Banana (${status.requestsRemaining} remaining)`,
        priority: 'low',
      };
    }
    return {
      model: 'flux-schnell',
      reason: 'Preserving Nano Banana for cover/CTA - using FLUX-Schnell for content',
      priority: 'low',
    };
  }
  
  // Fallback padrão
  return {
    model: 'flux-schnell',
    reason: 'Default fallback - FLUX-Schnell',
    priority: 'low',
  };
}

/**
 * Gera imagem com Nano Banana respeitando limites
 */
export async function generateImageWithNanoBanana(
  prompt: string,
  slideType: 'cover' | 'content' | 'cta',
  slideNumber: number
): Promise<{ imageUrl: string; model: string; success: boolean }> {
  const decision = decidirModeloImagem(slideType, slideNumber);
  
  console.log(`[IMAGE MODEL DECISION] Slide ${slideNumber} (${slideType}): ${decision.model} - ${decision.reason}`);
  
  try {
    // Se decidiu Nano Banana e tem limite
    if (decision.model === 'nano-banana') {
      const status = getNanoBananaStatus();
      
      if (status.isLimitReached) {
        console.warn('[NANO BANANA] Limit reached, switching to fallback');
        return generateFallbackImage(prompt, slideType, slideNumber);
      }
      
      // Incrementa uso
      incrementNanoBananaUsage();
      
      // Gera com Nano Banana via server
      const response = await fetch('/api/ai/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          preferredModel: 'nano-banana',
          slideType,
          slideNumber,
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Nano Banana generation failed: ${response.status}`);
      }
      
      const data = await response.json();
      
      return {
        imageUrl: data.output,
        model: 'nano-banana',
        success: true,
      };
    }
    
    // Usa fallback
    return generateFallbackImage(prompt, slideType, slideNumber);
    
  } catch (error) {
    console.error('[NANO BANANA] Error:', error);
    return generateFallbackImage(prompt, slideType, slideNumber);
  }
}

/**
 * Gera imagem com modelo fallback
 */
async function generateFallbackImage(
  prompt: string,
  slideType: 'cover' | 'content' | 'cta',
  slideNumber: number
): Promise<{ imageUrl: string; model: string; success: boolean }> {
  // Ordem de fallback:
  // 1. FLUX-Schnell (Cloudflare) - 100 req/dia grátis
  // 2. FLUX-Dev (HuggingFace) - 10 RPM grátis
  // 3. Leonardo.AI - $150 tokens/mês
  
  try {
    // Tenta FLUX-Schnell primeiro
    console.log(`[FALLBACK] Trying FLUX-Schnell for slide ${slideNumber}`);
    
    const response = await fetch('/api/ai/generate-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt,
        preferredModel: 'flux-schnell',
        slideType,
        slideNumber,
      }),
    });
    
    if (response.ok) {
      const data = await response.json();
      return {
        imageUrl: data.output,
        model: 'flux-schnell',
        success: true,
      };
    }
    
    // Tenta FLUX-Dev
    console.log(`[FALLBACK] FLUX-Schnell failed, trying FLUX-Dev`);
    
    const response2 = await fetch('/api/ai/generate-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt,
        preferredModel: 'flux-dev',
        slideType,
        slideNumber,
      }),
    });
    
    if (response2.ok) {
      const data2 = await response2.json();
      return {
        imageUrl: data2.output,
        model: 'flux-dev',
        success: true,
      };
    }
    
    // Tenta Leonardo.AI
    console.log(`[FALLBACK] FLUX-Dev failed, trying Leonardo.AI`);
    
    const response3 = await fetch('/api/ai/generate-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt,
        preferredModel: 'leonardo',
        slideType,
        slideNumber,
      }),
    });
    
    if (response3.ok) {
      const data3 = await response3.json();
      return {
        imageUrl: data3.output,
        model: 'leonardo',
        success: true,
      };
    }
    
    throw new Error('All fallback models failed');
    
  } catch (error) {
    console.error('[FALLBACK] All models failed:', error);
    return {
      imageUrl: '',
      model: 'none',
      success: false,
    };
  }
}

/**
 * Reseta manualmente o contador de uso (para testes)
 */
export function resetNanoBananaUsage(): void {
  localStorage.removeItem(STORAGE_KEY);
  console.log('[NANO BANANA] Usage counter reset manually');
}

/**
 * Obtém relatório de uso para debug
 */
export function getNanoBananaUsageReport(): {
  status: NanoBananaStatus;
  strategy: string;
  recommendations: string[];
} {
  const status = getNanoBananaStatus();
  
  const recommendations: string[] = [];
  
  if (status.requestsRemaining > 30) {
    recommendations.push('✅ Plenty of Nano Banana requests remaining - use liberally for covers');
  } else if (status.requestsRemaining > 10) {
    recommendations.push('⚠️ Moderate Nano Banana usage - reserve for covers and important CTAs');
  } else if (status.requestsRemaining > 0) {
    recommendations.push('🚨 Low Nano Banana requests - use ONLY for covers');
  } else {
    recommendations.push('❌ Nano Banana limit reached - using fallback models');
  }
  
  recommendations.push(`📊 Monthly reset: ${new Date(status.resetDate).toLocaleDateString('pt-BR')}`);
  recommendations.push('💡 Strategy: Cover (Slide 1) > CTA (Slide 4) > Content (Slides 2-3)');
  
  return {
    status,
    strategy: 'Prioritize Nano Banana for covers, fallback to FLUX for content',
    recommendations,
  };
}

export default {
  getNanoBananaStatus,
  incrementNanoBananaUsage,
  decidirModeloImagem,
  generateImageWithNanoBanana,
  resetNanoBananaUsage,
  getNanoBananaUsageReport,
};
