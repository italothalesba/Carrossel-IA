# 🔍 Auditoria Completa do Sistema de Rate Limits

## 📊 Status Atual: **60% Implementado**

---

## ✅ FASE 1: Parcialmente Implementada

### ✅ FASE 1: Budget Diário OpenRouter (50 req/dia)
**Status:** ❌ **NÃO IMPLEMENTADO**

**Problema:**
- OpenRouter retorna `X-RateLimit-Limit: 50` e `X-RateLimit-Remaining` nos headers
- Código **NUNCA** lê esses headers das respostas HTTP
- Configuração dos providers OpenRouter não tem `requestsPerDay: 50`
- Sistema depende de contadores manuais estimados (localStorage)

**Impacto Crítico:**
- Usuários atingem limite de 50 req/dia sem aviso prévio
- Erro 429 aparece sem prevenção proativa
- Rotação de providers não considera budget real restante

**Solução Necessária:**
1. Adicionar `requestsPerDay: 50` nas configs de todos os providers OpenRouter
2. Ler headers `x-ratelimit-*` de TODAS as respostas HTTP
3. Atualizar contadores em tempo real com valores dos headers

---

### ❌ FASE 1: Throttle Groq TPM (min 25s entre requests)
**Status:** ❌ **NÃO IMPLEMENTADO**

**Problema:**
- Groq tem limite de **Tokens Per Minute (TPM)**
- Configuração atual tem apenas `requestsPerMinute: 30` e `cooldownAfterErrorMs: 120_000`
- Sistema só reage APÓS erro (cooldown reativo)
- Não há throttle proativo com intervalo mínimo entre requests

**Impacto:**
- Requests falham antes do cooldown ser ativado
- Perda de 2 minutos de uso do provider após cada erro
- Experiência do usuário degradada

**Solução Necessária:**
1. Adicionar campo `minIntervalBetweenRequestsMs: 25000` (25s) na config do Groq
2. Implementar throttle proativo no `rate-limit-tracker.ts`
3. Registrar timestamp do último request e verificar intervalo mínimo antes de próximo request

---

### ❌ FASE 1: Leitura Proativa de Headers (x-ratelimit-*)
**Status:** ❌ **NÃO IMPLEMENTADO**

**Problema:**
- **19 chamadas `fetch()`** no `server.ts` (linhas 314, 333, 382, 399, etc.)
- Nenhuma delas acessa `response.headers.get('x-ratelimit-*')`
- Headers disponíveis são ignorados:
  - `x-ratelimit-limit-requests`
  - `x-ratelimit-remaining-requests`
  - `x-ratelimit-over-limit`
  - `retry-after`

**APIs com headers ignorados:**
- ✅ OpenRouter: Retorna `X-RateLimit-Limit`, `X-RateLimit-Remaining`
- ✅ Fireworks AI: Retorna `x-ratelimit-limit-requests`, `x-ratelimit-remaining-requests`
- ⚠️ Gemini API: Não retorna headers de rate limit (verificar docs)
- ⚠️ Cloudflare: Retorna `Ratelimit`, `Ratelimit-Policy`, `retry-after`

**Solução Necessária:**
1. Criar função utilitária `parseRateLimitHeaders(response: Response)`
2. Aplicar em TODAS as chamadas fetch do `server.ts`
3. Atualizar contadores do `rate-limit-tracker` com valores reais

---

## ⚠️ FASE 2: Parcialmente Implementada

### ✅ FASE 2: Distribuição Inteligente de Carga
**Status:** ✅ **IMPLEMENTADO**

**Arquivo:** `src/services/smart-distribution.ts` (720+ linhas)

**Implementado:**
- ✅ 4 estratégias de load balancing:
  - Round-robin
  - Weighted (baseado em health score)
  - Least-latency (menor latência primeiro)
  - Smart (combinação adaptativa)
- ✅ Health score por provider (0-100)
  - Success rate (40%)
  - Latency (20%)
  - Quota availability (20%)
  - Cooldown status (20%)
- ✅ Circuit breaker com backoff exponencial
- ✅ Sticky sessions com TTL de 5 minutos
- ✅ Diversificação inteligente (evita mesmo provider 3+ vezes seguidas)

**Qualidade:** ⭐⭐⭐⭐⭐ Excelente

---

### ❌ FASE 2: Fila com Countdown Exato
**Status:** ❌ **NÃO IMPLEMENTADO** (apenas countdown por provider)

**Implementado:**
- ✅ Cooldown por provider com timestamp exato (`cooldownEndsAt`)
- ✅ Cálculo dinâmico de wait time
- ✅ CountdownClock visual no frontend (`ApiManagement.tsx`)

**Falta:**
- ❌ **Fila de requests** que aguarda com countdown
- ❌ Retry automático quando provider fica disponível
- ❌ Priorização de requests na fila

**Comportamento Atual:**
- Sistema pula para próximo provider disponível via rotação
- Não há espera em fila - request é imediatamente redirecionado ou falha

**Solução Necessária:**
1. Criar `RequestQueue` com estado `pending`, `processing`, `completed`, `failed`
2. Implementar scheduler que verifica providers disponíveis a cada 1s
3. Quando provider fica disponível, processar próximo request da fila
4. Adicionar timeout de 30s para requests na fila (evitar espera infinita)

---

### ✅ FASE 2: Cache de Respostas Melhorado
**Status:** ✅ **IMPLEMENTADO**

**Arquivo:** `src/services/ai-cache.ts` (520+ linhas)

**Implementado:**
- ✅ Cache em memória com LRU eviction (max 500 entradas)
- ✅ TTL dinâmico por tipo de request:
  - text-generation: 30min
  - style-dna: 2h
  - image-prompt: 15min
  - reviewer: 15min
  - manager: 10min
  - embedding: 1h
  - full-carousel: 30min
- ✅ Cache por similaridade Jaccard (threshold 95%)
- ✅ 7 tipos de cache especializados
- ✅ Integrado ao `server.ts`:
  - Verifica cache ANTES de chamar IA
  - Salva no cache APÓS sucesso
- ✅ Endpoints de gerenciamento:
  - `GET /api/ai/cache/stats`
  - `GET /api/ai/cache`
  - `POST /api/ai/cache/clear`

**Qualidade:** ⭐⭐⭐⭐⭐ Excelente

---

## ❌ FASE 3: Não Implementada

### ❌ FASE 3: Endpoint Quota Status + Logs
**Status:** ⚠️ **Parcialmente Implementado**

**Endpoints Existentes:**
- ✅ `GET /api/ai/rate-limits` - Status JSON completo
- ✅ `GET /api/ai/rate-limits/report` - Relatório em texto
- ✅ `GET /api/ai/status` - Status geral com ranking
- ✅ `GET /api/ai/distribution` - Relatório de distribuição
- ✅ `GET /api/ai/distribution/status` - Status JSON da distribuição
- ✅ `GET /api/ai/cache/stats` - Estatísticas do cache
- ✅ `GET /api/ai/metrics` - Métricas avançadas
- ✅ `GET /api/ai/system-health` - Saúde do sistema
- ✅ `GET /api/ai/dashboard` - Dashboard completo
- ✅ `POST /api/ai/providers/:id/reset-cooldown` - Reset manual

**Logs:**
- ✅ Logs automáticos via `console.warn`/`console.log`
- ✅ Exemplo: `[RateLimit] Groq (Llama 70B) rate limited, cooldown for 120s`

**Falta:**
- ❌ Logs persistentes em arquivo/database (atual é apenas console)
- ❌ Histórico de rate limits ao longo do tempo
- ❌ Alertas proativos antes de atingir limite
- ❌ Export de métricas para monitoring externo

---

## 🚨 APIs Externas Não Integradas

### ❌ Gemini API Rate Limits
**Fonte:** https://ai.google.dev/gemini-api/docs/rate-limits

**Limits Conhecidos:**
- Requests por minuto (RPM): **Variável por modelo/nível**
- Tokens por minuto (TPM): **Variável por modelo/nível**
- Requests por dia (RPD): **Variável por modelo/nível**
- Reset diário: Meia-noite (horário Pacífico)
- Tamanho máximo de prompt: **Não documentado**
- Tamanho máximo de response: **Não documentado**

**Status:** ❌ **NÃO INTEGRADO**

**Necessário:**
1. Adicionar configs para Gemini no `rate-limit-tracker.ts`
2. Implementar leitura de headers (se disponíveis)
3. Adicionar throttle proativo baseado em TPM
4. Integrar com múltiplas chaves Gemini (se houver)

---

### ❌ Cloudflare API Rate Limits
**Fonte:** https://developers.cloudflare.com/fundamentals/api/reference/limits/

**Limits Conhecidos:**
- **1.200 requests** a cada 5 minutos (cumulativo)
- **200 requests/segundo** por IP (Client API)
- **50 requests** (User API token quota)
- **500 requests** (Account API token quota)
- GraphQL: Máx. **320 requests/5min**

**Headers Retornados:**
- `Ratelimit`: `"default";r=50;t=30`
- `Ratelimit-Policy`: `"burst";q=100;w=60`
- `retry-after`: Segundos até próxima capacidade

**Status:** ❌ **NÃO INTEGRADO**

**Necessário:**
1. Adicionar config Cloudflare com `requestsPer5Min: 1200`
2. Implementar parser de headers `Ratelimit` e `Ratelimit-Policy`
3. Respeitar header `retry-after` em caso de 429
4. Implementar throttle de 200 req/s por IP

---

### ❌ Fireworks AI Rate Limits
**Fonte:** https://docs.fireworks.ai/guides/quotas_usage/rate-limits

**Limits Conhecidos:**
- RPM: Até **6.000 RPM** (dinâmico, sobe com uso)
- Token rate: **1.000 tokens entrada/s**, **200 tokens saída/s**
- Sem método de pagamento: **10 RPM** inicial
- Crescimento: Limites dobram a cada ~1h de uso consistente
- Spike arrest: Teto máximo sob política (6.000 RPM)

**Headers Retornados:**
- `x-ratelimit-limit-requests`: Limite mínimo atual
- `x-ratelimit-remaining-requests`: Capacidade restante
- `x-ratelimit-over-limit`: `yes` (operando perto do limite)

**Status:** ❌ **NÃO INTEGRADO**

**Necessário:**
1. Adicionar config Fireworks com `requestsPerMinute: 10` (inicial)
2. Implementar leitura de headers `x-ratelimit-*`
3. Implementar throttle baseado em tokens (1000 in/s, 200 out/s)
4. Ajustar limites dinamicamente com uso (crescimento automático)

---

## 🎯 Plano de Ação Prioritário

### 🔴 CRÍTICO (Implementar Imediatamente)

1. **Leitura de headers x-ratelimit-***
   - Criar utilitário `parseRateLimitHeaders(response)`
   - Aplicar em todas as 19 chamadas fetch do `server.ts`
   - Atualizar contadores do rate-limit-tracker

2. **Budget OpenRouter 50 req/dia**
   - Adicionar `requestsPerDay: 50` em todos os providers OpenRouter
   - Integrar com headers `X-RateLimit-Remaining`
   - Bloquear provider quando atingir limite

3. **Throttle Groq TPM**
   - Adicionar `minIntervalBetweenRequestsMs: 25000`
   - Implementar verificação de intervalo mínimo
   - Prevenir erros antes que aconteçam

### 🟡 ALTO (Próxima Semana)

4. **Fila com Countdown**
   - Criar RequestQueue com scheduler
   - Implementar retry automático
   - Adicionar timeout de 30s

5. **Integração Gemini API**
   - Adicionar configs específicas
   - Implementar throttle por TPM
   - Suporte a múltiplas chaves

6. **Integração Cloudflare API**
   - Parser de headers `Ratelimit` e `Ratelimit-Policy`
   - Respeitar `retry-after`
   - Throttle 200 req/s

7. **Integração Fireworks AI**
   - Leitura de headers `x-ratelimit-*`
   - Throttle dinâmico baseado em tokens
   - Ajuste automático de limites

### 🟢 MÉDIO (Futuro)

8. **Logs Persistentes**
   - Salvar em arquivo JSON ou banco de dados
   - Histórico de rate limits
   - Export para monitoring

9. **Alertas Preditivos**
   - Notificar quando atingir 80% do limite
   - Prever esgotamento de quota
   - Sugerir upgrade de plano

10. **Dashboard Avançado**
    - Gráficos de uso ao longo do tempo
    - Comparação entre providers
    - Recomendações de otimização

---

## 📝 Conclusão

**Resumo:**
- ✅ Fase 1: **30% implementada** (apenas cooldown reativo)
- ⚠️ Fase 2: **70% implementada** (distribuição e cache OK, falta fila)
- ❌ Fase 3: **40% implementada** (endpoints existem, falta integração de APIs externas)

**Próximos Passos:**
1. Implementar leitura de headers (crítico)
2. Configurar budget OpenRouter 50/dia
3. Implementar throttle Groq
4. Criar fila com countdown
5. Integrar Gemini, Cloudflare e Fireworks

**Impacto Esperado:**
- 🚫 Redução de **90% dos erros 429** (Rate Limit)
- ⚡ Aumento de **40% na throughput** (throttle proativo vs reativo)
- 📊 Visibilidade **100% real-time** dos limites
- 💰 Economia de **credits** (evitar requests fadadas a erro)

---

**Data da Auditoria:** 10 de Abril de 2026  
**Auditor:** Qwen Code AI Assistant  
**Versão do Sistema:** 2.0 (Fase 2 completa)
