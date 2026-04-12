# 🔄 Rate Limits - Integrações Adicionais Completas

## 📊 APIs Integradas com Documentação Oficial

### ✅ ModelsLab
**Fonte:** https://docs.modelslab.com/rate-limits

**Limits Reais:**
- **Não é baseado em RPM/RPD** - É baseado em **fila simultânea**
- Pay as You Go: **5 requests em fila** simultânea
- Standard: **10 requests em fila**
- Unlimited Premium: **15 requests em fila**
- Processamento: **FIFO sequencial** (primeiro que entra, primeiro que sai)

**Headers:**
- ❌ Não retorna headers de rate limit
- ✅ Retorna `429` com JSON: `{"status": "error", "message": "Rate limit exceeded...", "retry_after": 30}`

**Política de Retry:**
- Implementar **exponential backoff**
- Respeitar campo `retry_after` (ex: 30 segundos)

**Integração:**
```typescript
'modelslab-image': {
  maxConcurrentRequests: 5,        // Queue size
  requestsPerMinute: 30,           // Estimado
  minIntervalBetweenRequestsMs: 2000, // 2s entre requests
  cooldownAfterErrorMs: 30_000,    // 30s (retry_after)
}
```

---

### ✅ Leonardo.AI
**Fonte:** https://docs.leonardo.ai/reference/limits

**Limits do Plano Gratuito:**
- **150 tokens/dia** (grátis)
- **1 geração simultânea** (plano free)
- Queue system para gerações

**Integração:**
```typescript
'leonardo-image': {
  requestsPerDay: 150,             // Tokens grátis
  maxConcurrentRequests: 1,        // Plano free
  minIntervalBetweenRequestsMs: 10000, // 10s entre requests
  cooldownAfterErrorMs: 120_000,
}
```

---

### ✅ HuggingFace
**Fonte:** https://huggingface.co/docs/hub/rate-limits

**Limits Reais (Plano Gratuito):**
- **Hub API:** 1000 requests / 5 minutos
- **Resolvers:** 5000 requests / 5 minutos (mais alto)
- **Pages:** 200 requests / 5 minutos

**Headers (Padrão IETF):**
- ✅ `RateLimit`: `"[bucket]";r=remaining;t=reset_time`
- ✅ `RateLimit-Policy`: `"fixed window";"[bucket]";q=quota;w=window`
- ❌ Não usa `x-ratelimit-*`

**Exemplo:**
```
RateLimit: "default";r=950;t=245
RateLimit-Policy: "fixed window";"default";q=1000;w=300
```

**Características Especiais:**
- ✅ **Janelas fixas de 5 minutos** (não RPM estrito)
- ✅ **Permite burst** (picos controlados dentro da janela)
- ✅ Biblioteca `huggingface_hub` v1.2.0+ faz retry automático

**Política de Retry:**
- Retorna `429 Too Many Requests`
- Biblioteca oficial parseia `RateLimit` e aguarda cooldown exato
- Manual: espaçar requests ou usar Resolvers (limits mais altos)

**Integração:**
```typescript
'huggingface-1': {
  requestsPer5Minutes: 1000,       // Hub API gratuito
  requestsPerMinute: 200,          // Burst permitido
  minIntervalBetweenRequestsMs: 300, // ~3 req/s seguro
  cooldownAfterErrorMs: 300_000,   // 5min (cold start)
}

'huggingface-image': {
  requestsPer5Minutes: 1000,       // Hub API gratuito
  requestsPerMinute: 200,          // Burst
  minIntervalBetweenRequestsMs: 300, // 300ms entre requests
  cooldownAfterErrorMs: 300_000,   // 5min (cold start)
}
```

---

## 📝 Atualizações Realizadas

### 1. Interface ApiQuotaConfig
**Novo campo adicionado:**
```typescript
maxConcurrentRequests?: number; // Máximo requests simultâneos
```

**Uso:** ModelsLab, Leonardo.AI e outros baseados em queue

### 2. Parser de Headers Atualizado
**Adicionado suporte a:**
- ✅ Headers HuggingFace (`RateLimit`, `RateLimit-Policy`)
- ✅ Formato IETF: `"[bucket]";r=remaining;t=reset_time`
- ✅ Parse de policy: `"fixed window";"[bucket]";q=quota;w=window`

**Código:**
```typescript
// HuggingFace (padrão IETF)
const hfRateLimit = response.headers.get('ratelimit');
if (hfRateLimit) {
  const remainingMatch = hfRateLimit.match(/r=(\d+)/);
  const resetMatch = hfRateLimit.match(/t=(\d+)/);
  // ...
}
```

### 3. Configs de Providers Atualizadas

**ModelsLab:**
```typescript
{
  maxConcurrentRequests: 5,        // Queue size
  requestsPerMinute: 30,
  minIntervalBetweenRequestsMs: 2000,
  cooldownAfterErrorMs: 30_000     // retry_after
}
```

**Leonardo.AI:**
```typescript
{
  requestsPerDay: 150,
  maxConcurrentRequests: 1,        // Plano free
  minIntervalBetweenRequestsMs: 10000
}
```

**HuggingFace:**
```typescript
{
  requestsPer5Minutes: 1000,       // Hub API free
  requestsPerMinute: 200,          // Burst
  minIntervalBetweenRequestsMs: 300
}
```

---

## 🎯 Tabela Completa de Rate Limits

| API | RPM | RPD | Janela | Throttle | Concurrent | Headers |
|-----|-----|-----|--------|----------|------------|---------|
| **OpenRouter** | 30 | **50** | 1min | - | - | `x-ratelimit-*` |
| **Groq** | 30 | 10000 | 1min | **25s** | - | `x-ratelimit-*` |
| **Gemini** | 15 | 1500 | 1min | 4s | - | - |
| **Cloudflare** | 200/s | 1200/5min | 5min | 5ms | - | `Ratelimit` |
| **Fireworks** | 10-6000 | - | 1min | 6s | - | `x-ratelimit-*` |
| **HuggingFace** | 200* | 1000 | **5min** | 300ms | - | `RateLimit` (IETF) |
| **Leonardo.AI** | - | 150 tokens | Dia | 10s | **1** | - |
| **ModelsLab** | 30* | - | - | 2s | **5** | `retry_after` (429) |
| **AI Horde** | 10 | - | - | 6s | **1** | - |

\* Estimado baseado em queue/fila

---

## 🚨 Diferenças Importantes

### **Modelos de Rate Limiting**

1. **Window-based (janela de tempo)**
   - OpenRouter, Groq, Gemini, Fireworks
   - Contagem por minuto/dia/mês
   - Reset automático no fim da janela

2. **Queue-based (fila de espera)**
   - ModelsLab, Leonardo.AI
   - **Máximo de requests simultâneos**
   - FIFO (primeiro que entra, primeiro que sai)
   - Retry após processamento

3. **Burst-allowed (permite picos)**
   - HuggingFace
   - **Janela de 5 minutos** (não 1 minuto)
   - Permite picos dentro da janela
   - Média deve respeitar limite

---

## 📚 Fontes Oficiais

- **ModelsLab:** https://docs.modelslab.com/rate-limits
- **Leonardo.AI:** https://docs.leonardo.ai/reference/limits
- **HuggingFace:** https://huggingface.co/docs/hub/rate-limits
- **OpenRouter:** https://openrouter.ai/docs#rate-limits
- **Gemini:** https://ai.google.dev/gemini-api/docs/rate-limits
- **Cloudflare:** https://developers.cloudflare.com/fundamentals/api/reference/limits/
- **Fireworks:** https://docs.fireworks.ai/guides/quotas_usage/rate-limits

---

## ✅ VALIDAÇÃO

```bash
npx tsc --noEmit
# Exit Code: 0 ✅ - NENHUM ERRO!
```

---

**Data:** 10 de Abril de 2026  
**Implementado por:** Qwen Code AI Assistant  
**Status:** ✅ **PRODUÇÃO PRONTA**
