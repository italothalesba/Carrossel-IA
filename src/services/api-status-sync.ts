/**
 * API Status Sync Service - Firebase Sync
 * Sincroniza o status de uso de todas as APIs com Firebase Firestore
 * para evitar tentativas repetidas em APIs bloqueadas/expiradas
 * 
 * FALLBACK LOCAL: Se Firestore falhar, usa storage em memória
 */

import { db } from '../firebase';
import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs, serverTimestamp } from 'firebase/firestore';

// FALLBACK: Cache local em memória caso Firestore falhe
const localStatusCache = new Map<string, ApiStatusRecord>();
let firestoreWriteFailed = false; // Circuit breaker
let firestoreLastRetry = 0;
const FIRESTORE_RETRY_INTERVAL = 5 * 60 * 1000; // 5 minutos entre retries

export interface ApiStatusRecord {
  providerId: string;
  providerName: string;
  type: 'text' | 'image';
  
  // Contadores
  totalAttempts: number;
  successCount: number;
  failureCount: number;
  consecutiveFailures: number;
  
  // Últimos eventos
  lastSuccessAt: number | null;
  lastFailureAt: number | null;
  lastError: string | null;
  lastErrorCode: number | null;
  lastErrorTime: number | null;
  
  // Status atual
  isBlocked: boolean;
  blockedReason: string | null;
  blockedUntil: number | null; // timestamp quando desbloqueia
  isRateLimited: boolean;
  rateLimitResetsAt: number | null;
  
  // Quota (se aplicável)
  dailyUsage: number;
  monthlyUsage: number;
  dailyLimit: number | null;
  monthlyLimit: number | null;
  quotaResetDate: string | null; // ISO date
  
  // Métricas
  averageLatency: number;
  lastLatency: number | null;
  
  // Sync
  lastSyncAt: number;
  updatedAt: any; // serverTimestamp
}

const API_STATUS_COLLECTION = 'api_status';

/**
 * Obtém status de uma API do Firebase
 * COM FALLBACK LOCAL: Se Firestore falhar, usa cache em memória
 */
export async function getApiStatusFromFirebase(providerId: string): Promise<ApiStatusRecord | null> {
  try {
    const docRef = doc(db, API_STATUS_COLLECTION, providerId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return docSnap.data() as ApiStatusRecord;
    }

    // Fallback: verifica cache local
    if (localStatusCache.has(providerId)) {
      return localStatusCache.get(providerId) || null;
    }

    return null;
  } catch (error: any) {
    // Silenciar erros de permissão - fallback para local tracking
    if (error?.code === 'permission-denied') {
      if (localStatusCache.has(providerId)) {
        return localStatusCache.get(providerId) || null;
      }
    }
    return null;
  }
}

/**
 * Salva/atualiza status de uma API no Firebase
 * COM FALLBACK LOCAL: Se Firestore falhar, salva em memória
 */
export async function saveApiStatusToFirebase(status: ApiStatusRecord): Promise<void> {
  try {
    // Se Firestore está em modo de erro, salva apenas local
    if (firestoreWriteFailed) {
      const now = Date.now();
      if (now - firestoreLastRetry > FIRESTORE_RETRY_INTERVAL) {
        console.log('[ApiStatusSync] 🔁 Retrying Firestore write after cooldown...');
        firestoreLastRetry = now;
        // Tenta novamente
        try {
          await tryFirestoreSave(status);
          // Se chegou aqui, sucesso!
          firestoreWriteFailed = false;
          console.log('[ApiStatusSync] ✅ Firestore write restored!');
          return;
        } catch (retryError) {
          // Continua em modo fallback
          console.warn('[ApiStatusSync] ⚠️ Firestore retry failed, using local cache');
        }
      }
      // Salva no cache local
      localStatusCache.set(status.providerId, status);
      return;
    }

    // Tentativa normal
    await tryFirestoreSave(status);
  } catch (error: any) {
    // Circuit breaker: Se PERMISSION_DENIED, ativa fallback
    if (error?.code === 'permission-denied') {
      if (!firestoreWriteFailed) {
        firestoreWriteFailed = true;
        firestoreLastRetry = Date.now();
        console.error('[ApiStatusSync] ❌ Firestore PERMISSION_DENIED - switching to local cache mode');
        console.error('[ApiStatusSync] 💡 Tip: Deploy updated firestore.rules or check Firebase project config');
      }
      // Salva no cache local
      localStatusCache.set(status.providerId, status);
      return;
    }

    // Outros erros - log mas não muda modo
    console.error('[ApiStatusSync] Failed to save status to Firebase:', error);
  }
}

/**
 * Tenta salvar no Firestore (função auxiliar)
 */
async function tryFirestoreSave(status: ApiStatusRecord): Promise<void> {
  const docRef = doc(db, 'api_status', status.providerId);
  await setDoc(docRef, {
    ...status,
    updatedAt: serverTimestamp()
  }, { merge: true });
  console.log(`[ApiStatusSync] Saved status for ${status.providerId}:`, {
    attempts: status.totalAttempts,
    failures: status.failureCount,
    blocked: status.isBlocked
  });
}

/**
 * Verifica se uma API deve ser tentada ou está bloqueada
 */
export async function shouldAttemptApi(
  providerId: string,
  providerName: string,
  type: 'text' | 'image'
): Promise<{
  shouldAttempt: boolean;
  reason?: string;
  waitMs?: number;
  status?: ApiStatusRecord | null;
}> {
  try {
    const status = await getApiStatusFromFirebase(providerId);
    
    // Se não tem registro, pode tentar
    if (!status) {
      return { shouldAttempt: true, status: null };
    }
    
    const now = Date.now();
    
    // Verificar se está bloqueada
    if (status.isBlocked) {
      if (status.blockedUntil && now < status.blockedUntil) {
        const waitMs = status.blockedUntil - now;
        return {
          shouldAttempt: false,
          reason: status.blockedReason || 'API blocked',
          waitMs,
          status
        };
      } else {
        // Bloqueio expirou, pode tentar
        return { shouldAttempt: true, status };
      }
    }
    
    // Verificar rate limit
    if (status.isRateLimited) {
      if (status.rateLimitResetsAt && now < status.rateLimitResetsAt) {
        const waitMs = status.rateLimitResetsAt - now;
        return {
          shouldAttempt: false,
          reason: `Rate limited (resets in ${Math.ceil(waitMs / 1000)}s)`,
          waitMs,
          status
        };
      }
    }
    
    // Verificar quota diária
    if (status.dailyLimit && status.dailyUsage >= status.dailyLimit) {
      return {
        shouldAttempt: false,
        reason: `Daily quota exhausted (${status.dailyUsage}/${status.dailyLimit})`,
        status
      };
    }
    
    // Verificar quota mensal
    if (status.monthlyLimit && status.monthlyUsage >= status.monthlyLimit) {
      return {
        shouldAttempt: false,
        reason: `Monthly quota exhausted (${status.monthlyUsage}/${status.monthlyLimit})`,
        status
      };
    }
    
    // Verificar falhas consecutivas altas (>10 falhas = provável problema)
    if (status.consecutiveFailures >= 10) {
      // Só bloqueia se houve falha recente (últimos 5 minutos)
      if (status.lastFailureAt && (now - status.lastFailureAt) < 5 * 60 * 1000) {
        return {
          shouldAttempt: false,
          reason: `Too many consecutive failures (${status.consecutiveFailures})`,
          waitMs: 60 * 1000, // Espera 1 minuto
          status
        };
      } else {
        // Falhas antigas, reseta contador
        return { shouldAttempt: true, status };
      }
    }
    
    // Pode tentar
    return { shouldAttempt: true, status };
  } catch (error) {
    console.error('[ApiStatusSync] Error checking if should attempt:', error);
    // Em caso de erro, permite tentativa (fallback seguro)
    return { shouldAttempt: true, status: null };
  }
}

/**
 * Registra tentativa de uso de API no Firebase
 */
export async function recordApiAttempt(
  providerId: string,
  providerName: string,
  type: 'text' | 'image',
  success: boolean,
  latency?: number,
  errorCode?: number,
  errorMessage?: string
): Promise<void> {
  try {
    const existing = await getApiStatusFromFirebase(providerId);
    const now = Date.now();
    
    let status: ApiStatusRecord = existing || {
      providerId,
      providerName,
      type,
      totalAttempts: 0,
      successCount: 0,
      failureCount: 0,
      consecutiveFailures: 0,
      lastSuccessAt: null,
      lastFailureAt: null,
      lastError: null,
      lastErrorCode: null,
      lastErrorTime: null,
      isBlocked: false,
      blockedReason: null,
      blockedUntil: null,
      isRateLimited: false,
      rateLimitResetsAt: null,
      dailyUsage: 0,
      monthlyUsage: 0,
      dailyLimit: null,
      monthlyLimit: null,
      quotaResetDate: null,
      averageLatency: 0,
      lastLatency: null,
      lastSyncAt: now,
      updatedAt: serverTimestamp()
    };
    
    // Atualizar contadores
    status.totalAttempts++;
    status.lastSyncAt = now;
    
    if (success) {
      status.successCount++;
      status.consecutiveFailures = 0; // Reset falhas consecutivas
      status.lastSuccessAt = now;
      
      // Se estava bloqueada e teve sucesso, desbloqueia
      if (status.isBlocked) {
        status.isBlocked = false;
        status.blockedReason = null;
        status.blockedUntil = null;
      }
    } else {
      status.failureCount++;
      status.consecutiveFailures++;
      status.lastFailureAt = now;
      status.lastError = errorMessage || null;
      status.lastErrorCode = errorCode || null;
      status.lastErrorTime = now;
    }
    
    // Atualizar latência
    if (latency) {
      status.lastLatency = latency;
      status.averageLatency = status.averageLatency === 0
        ? latency
        : (status.averageLatency * 0.9) + (latency * 0.1); // Média móvel
    }
    
    // Incrementar usage
    status.dailyUsage++;
    status.monthlyUsage++;
    
    // Lógica de bloqueio automático
    if (errorCode === 401) {
      // Auth inválida - bloqueia por 24h (provável chave expirada)
      status.isBlocked = true;
      status.blockedReason = `Authentication failed (401) - invalid or expired API key`;
      status.blockedUntil = now + (24 * 60 * 60 * 1000); // 24 horas
    } else if (errorCode === 402) {
      // Sem créditos - bloqueia por 30 dias
      status.isBlocked = true;
      status.blockedReason = `Insufficient credits (402)`;
      status.blockedUntil = now + (30 * 24 * 60 * 60 * 1000); // 30 dias
    } else if (errorCode === 429) {
      // Rate limit - bloqueia por 1 hora
      status.isRateLimited = true;
      status.rateLimitResetsAt = now + (60 * 60 * 1000); // 1 hora
      status.isBlocked = true;
      status.blockedReason = `Rate limited (429)`;
      status.blockedUntil = now + (60 * 60 * 1000);
    } else if (status.consecutiveFailures >= 10) {
      // Muitas falhas consecutivas - bloqueia por 10 minutos
      status.isBlocked = true;
      status.blockedReason = `Too many consecutive failures (${status.consecutiveFailures})`;
      status.blockedUntil = now + (10 * 60 * 1000);
    }
    
    // Salva no Firebase
    await saveApiStatusToFirebase(status);
  } catch (error) {
    console.error('[ApiStatusSync] Failed to record attempt:', error);
  }
}

/**
 * Obtém todas as APIs com status do Firebase
 */
export async function getAllApiStatusFromFirebase(): Promise<ApiStatusRecord[]> {
  try {
    const q = query(collection(db, API_STATUS_COLLECTION));
    const querySnapshot = await getDocs(q);
    
    const results: ApiStatusRecord[] = [];
    querySnapshot.forEach((doc) => {
      results.push(doc.data() as ApiStatusRecord);
    });
    
    return results;
  } catch (error) {
    console.error('[ApiStatusSync] Failed to get all statuses:', error);
    return [];
  }
}

/**
 * Reseta status de uma API (desbloqueia manualmente)
 */
export async function resetApiStatus(providerId: string, providerName: string, type: 'text' | 'image'): Promise<void> {
  try {
    const status: ApiStatusRecord = {
      providerId,
      providerName,
      type,
      totalAttempts: 0,
      successCount: 0,
      failureCount: 0,
      consecutiveFailures: 0,
      lastSuccessAt: null,
      lastFailureAt: null,
      lastError: null,
      lastErrorCode: null,
      lastErrorTime: null,
      isBlocked: false,
      blockedReason: null,
      blockedUntil: null,
      isRateLimited: false,
      rateLimitResetsAt: null,
      dailyUsage: 0,
      monthlyUsage: 0,
      dailyLimit: null,
      monthlyLimit: null,
      quotaResetDate: null,
      averageLatency: 0,
      lastLatency: null,
      lastSyncAt: Date.now(),
      updatedAt: serverTimestamp()
    };
    
    await saveApiStatusToFirebase(status);
    console.log(`[ApiStatusSync] Reset status for ${providerId}`);
  } catch (error) {
    console.error('[ApiStatusSync] Failed to reset status:', error);
  }
}
