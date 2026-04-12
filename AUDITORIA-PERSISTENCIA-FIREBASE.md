# 🔍 Auditoria Completa de Persistência Firebase

## ✅ O QUE É SALVO NO FIREBASE (Persiste Restart)

### Coleções Existentes no Firestore:

| Coleção | O que Salva | Sobrevive Restart? |
|---------|-------------|-------------------|
| **`styles`** | Estilos visuais (nome, descrições, metadata, styleDNA) | ✅ SIM |
| **`carousel_history`** | Metadata dos carrosséis (texto, styleId, slides SEM imagens) | ✅ SIM |
| **`api_status`** | Status de APIs (bloqueios, quotas, falhas, latência) | ✅ SIM |
| `r2_cache` | ⚠️ Placeholder - NÃO USADO | -- |
| `users` | ⚠️ Apenas nas rules - NÃO USADO | -- |

---

## ❌ O QUE **NÃO** É SALVO (Perde ao Reiniciar)

### Dados VOLÁTEIS (Memória RAM):

| Dado | Onde está | Por que perde? |
|------|-----------|----------------|
| **Cooldowns de rate limit** | `Map` em memória | Node.js não tem persistência automática |
| **Histórico de uso de APIs** | `Map` em memória | Mesmo problema |
| **Contadores diários/mensais** | `Map` em memória | `localStorage` não funciona em Node.js |
| **Throttle entre requests** | `Map` em memória | Mesmo problema |
| **Usage history (timestamps)** | `Map` em memória | Mesmo problema |

---

## 🚨 PROBLEMA CRÍTICO IDENTIFICADO

### Código Problemático (`rate-limit-tracker.ts`):

```typescript
private loadManualCounters(): void {
  if (typeof localStorage !== 'undefined') {
    // NUNCA EXECUTA NO SERVIDOR!
    // localStorage é undefined em Node.js
  }
}

private saveManualCounters(): void {
  if (typeof localStorage !== 'undefined') {
    // NUNCA EXECUTA NO SERVIDOR!
  }
}
```

**Resultado:** 
- ✅ No browser: contadores salvos no localStorage
- ❌ No servidor: **contadores PERDEM a cada restart**

---

## 📊 Impacto Real

### Cenário Atual:

1. **Servidor rodando:**
   - OpenRouter 1 atinge 50/50 requests diários
   - Sistema marca como "limited" ✅
   - Dashboard mostra usage correto ✅

2. **Servidor reinicia:**
   - ❌ Contador volta para 0/50
   - ❌ Cooldowns são perdidos
   - ❌ APIs bloqueadas ficam disponíveis
   - ❌ Usuário pode exceder limites sem saber

3. **Risco:**
   - Erros 429 inesperados (API realmente bloqueada no provider)
   - Waste de requests (tentativas fadadas a erro)
   - Dashboard mostra dados incorretos após restart

---

## ✅ O QUE FUNCIONA CORRETAMENTE

### Persistente (Firestore `api_status`):

```typescript
// api-status-sync.ts salva no Firestore:
{
  providerId: 'nemotron-1',
  totalAttempts: 150,
  successCount: 145,
  failureCount: 5,
  isBlocked: true,
  blockedUntil: '2026-05-01T00:00:00Z',  // Bloqueio de longo prazo
  dailyUsage: 45,
  dailyLimit: 50,
  quotaResetDate: '2026-05-01T00:00:00Z'
}
```

**Sobrevive restart!** ✅

### Mas tem problema:
- `api_status` é gerenciado por `api-status-sync.ts`
- `rate-limit-tracker.ts` **NÃO sincroniza** com `api_status`
- São sistemas **independentes** que não conversam entre si!

---

## 🔧 Solução Necessária

### Opção 1: Salvar Rate Limits no Firestore (Recomendado)

**Criar função que salva a cada 30s:**

```typescript
// rate-limit-tracker.ts
async function persistToFirestore(): Promise<void> {
  const db = getFirestore();
  
  for (const [providerId, counter] of this.manualCounters) {
    await setDoc(doc(db, 'rate_limits', providerId), {
      providerId,
      count: counter.count,
      resetsAt: counter.resetsAt,
      updatedAt: new Date().toISOString()
    }, { merge: true });
  }
}

// Auto-save a cada 30 segundos
setInterval(() => this.persistToFirestore(), 30000);
```

### Opção 2: Salvar em arquivo JSON no disco

```typescript
// rate-limit-tracker.ts
import fs from 'fs';
import path from 'path';

const CACHE_FILE = path.join(process.cwd(), 'data', 'rate-limits.json');

private saveManualCounters(): void {
  const toSave: Record<string, any> = {};
  this.manualCounters.forEach((value, key) => {
    toSave[key] = value;
  });
  
  fs.writeFileSync(CACHE_FILE, JSON.stringify(toSave, null, 2));
}

private loadManualCounters(): void {
  try {
    if (fs.existsSync(CACHE_FILE)) {
      const saved = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf-8'));
      Object.entries(saved).forEach(([key, value]: [string, any]) => {
        this.manualCounters.set(key, value);
      });
    }
  } catch (error) {
    console.warn('[RateLimitTracker] Failed to load counters:', error);
  }
}
```

---

## 📋 Resumo Final

| Dado | Persiste? | Local | Correção Necessária? |
|------|-----------|-------|---------------------|
| Styles | ✅ SIM | Firestore `styles` | NÃO |
| Carousel History | ✅ SIM | Firestore `carousel_history` | NÃO |
| API Status (bloqueios longos) | ✅ SIM | Firestore `api_status` | NÃO |
| **Rate Limits (contadores)** | ❌ NÃO | Memória RAM | **SIM** |
| **Cooldowns** | ❌ NÃO | Memória RAM | **SIM** |
| **Usage History** | ❌ NÃO | Memória RAM | **SIM** |
| Imagens carrosséis | ✅ SIM | IndexedDB (client) | NÃO |
| Cache estilos | ✅ SIM | IndexedDB (client) | NÃO |

---

**Data:** 10 de Abril de 2026  
**Auditado por:** Qwen Code AI Assistant  
**Status:** ⚠️ **PROBLEMA CRÍTICO IDENTIFICADO - Rate limits não persistem**
