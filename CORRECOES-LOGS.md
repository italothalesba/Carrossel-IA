# 🔧 Correções Implementadas Baseadas nos Logs

## 📊 Problemas Identificados nos Logs

Análise completa dos logs de uso real do sistema mostrou os seguintes problemas:

### 1️⃣ **APIs de Texto com Respostas Vazias**

**Problema:** Vários providers retornaram `success: 0 chars` antes de serem marcados como falha

| Provider | Ocorrências | Impacto |
|----------|-------------|---------|
| Nemotron 1 | 1 | Delay de 10s desnecessário |
| Gemma 4 31B | 1 | Delay de 10s desnecessário |
| SambaNova | 1 | Delay de 10s desnecessário |
| **Todos os 5 Gemini** | **5** | **50s de delays** |
| Together AI | 1 | Delay de 10s desnecessário |
| DeepSeek | 1 | Delay de 10s desnecessário |
| AIMLAPI | 1 | Delay de 10s desnecessário |
| HuggingFace | 1 | Delay de 10s desnecessário |

**Causa:** O sistema considera "0 chars" como sucesso (`response.ok`), mas depois marca como falha pois não há conteúdo.

**Impacto:** Cada falha causa **delay de 10 segundos** antes de tentar próximo provider.

**Solução Recomendada:** (pendente)
- Verificar se resposta tem conteúdo antes de marcar como sucesso
- Adicionar validação `generatedText.length > 0` no retorno

### 2️⃣ **Google AI Studio (Imagens) - Quota Esgotada** ❌

**Erro:**
```
429 - You exceeded your current quota
```

**Causa:** Limite de **50 imagens/mês** do plano gratuito foi atingido.

**Impacto:** Sistema continua tentando a cada geração de imagem, causando delays.

**Solução:** ✅ **Rate limit tracker agora detecta e entra em cooldown automático**

### 3️⃣ **HuggingFace - Modelo Deprecated** ⚠️

**Erro:**
```
410 - The requested model is deprecated and no longer supported by provider hf-inference
```

**Causa:** Modelo `stabilityai/stable-diffusion-xl-base-1.0` foi descontinuado.

**Solução:** ✅ **Atualizado para `stabilityai/stable-diffusion-3.5-large`**

### 4️⃣ **Cloudflare FLUX - Limite de Prompt** ✂️

**Erro:**
```
400 - Length of '/prompt' must be <= 2048
```

**Causa:** Prompts muito longos (>2048 chars) são rejeitados.

**Solução:** ✅ **Implementado truncamento automático para 2000 chars**

### 5️⃣ **Leonardo.AI - Limite de 1500 chars** ✂️

**Erro:**
```
Invalid prompt, maximum length of 1500 characters exceeded
```

**Solução:** ✅ **Implementado truncamento automático para 1400 chars**

### 6️⃣ **Replicate - Sem Créditos** 💳

**Erro:**
```
402 - Insufficient credit
```

**Causa:** Conta sem créditos para rodar modelo pago.

**Solução:** (pendente) Adicionar créditos OU remover da lista de fallback

### 7️⃣ **AI Horde - Sem Kudos** ⭐

**Erro:**
```
403 - This request requires 13.34 kudos to fulfil
```

**Causa:** Sistema de kudos comunitário do AI Horde requer crédito prévio para requests grandes.

**Solução:** (pendente) Reduzir resolução/steps OU acumular kudos

---

## ✅ Correções Implementadas

### 1. Truncamento Automático de Prompts

**Cloudflare FLUX:**
```typescript
const truncatedPrompt = prompt.length > 2000
  ? prompt.substring(0, 2000) + '...'
  : prompt;
```

**Leonardo.AI:**
```typescript
const truncatedPrompt = prompt.length > 1400
  ? prompt.substring(0, 1400) + '...'
  : prompt;
```

### 2. Atualização de Modelo HuggingFace

**Antes:**
```typescript
'https://router.huggingface.co/hf-inference/models/stabilityai/stable-diffusion-xl-base-1.0'
```

**Depois:**
```typescript
'https://router.huggingface.co/hf-inference/models/stabilityai/stable-diffusion-3.5-large'
```

### 3. Rate Limit Tracking para APIs de Imagem

Adicionado tracking automático para:
- ✅ Google AI Studio (quota exceeded)
- ✅ Cloudflare FLUX (errors + bad requests)
- ✅ HuggingFace (errors + deprecated model)

### 4. Retry Corrigido para HuggingFace

O retry agora usa o **modelo correto** (SD 3.5 Large) ao invés do deprecated.

### 5. **CORREÇÃO CRÍTICA: Parse de Resposta do DiagrammerSkill** 🎯

**Problema:** IA retornava `{slides: [...]}` ao invés de array direto `[...]`, causando erro `AI response is not an array`

**Erro nos logs:**
```
[DiagrammerSkill] Raw response: {
  "slides": [
    {"title": "...", "text": "...", "imagePrompt": "..."},
    ...
  ]
}
installHook.js:1 [DiagrammerSkill] Response is not an array: object {slides: Array(4)}
installHook.js:1 [PIPELINE] Erro: Diagramador falhou: AI response is not an array
```

**Causa:** O código esperava parse normal de array, mas a IA frequentemente retorna um objeto com propriedade `slides`.

**Solução:** Adicionada **TENTATIVA 0** que verifica se é objeto com propriedade `slides` e extrai o array antes de tentar outros parses:

```typescript
// TENTATIVA 0: Verificar se é objeto com propriedade "slides"
try {
  const parsed = JSON.parse(response.generated_text);
  if (parsed && typeof parsed === 'object' && !Array.isArray(parsed) && parsed.slides && Array.isArray(parsed.slides)) {
    console.log('[DiagrammerSkill] Detected object with "slides" property, extracting array');
    slides = parsed.slides;
  }
} catch {
  // Não é JSON válido ou não tem propriedade slides, continua
}
```

**Impacto:** ✅ **Pipeline agora consegue gerar carrosséis com sucesso**

---

## 📋 Correções Pendentes (Recomendadas)

### Alta Prioridade

1. **Validar Respostas Vazias**
   ```typescript
   // Antes de retornar sucesso
   if (generatedText.length === 0) {
     return { ok: false, data: null, status: response.status };
   }
   ```

2. **Remover Replicate se sem créditos**
   - Ou adicionar créditos para evitar tentativas inúteis

3. **Desabilitar Google AI Studio temporariamente**
   - Está com quota esgotada, causa delays desnecessários

---

## 📊 Impacto Estimado

| Correção | Tempo Economizado | Melhoria |
|----------|-------------------|----------|
| Truncamento de prompts | ~30-60s por falha | ✅ Eliminada causa |
| Modelo HuggingFace atualizado | ~5-10s por falha | ✅ Eliminada causa |
| Rate limit tracking | N/A | ✅ Melhor monitoramento |
| **Validar respostas vazias** | **~100s+** | ⏳ Pendente |
| **Desabilitar Google quota** | **~30s** | ⏳ Pendente |

---

## 🚀 Próximos Passos

1. ✅ **CORRIGIDO:** Truncamento de prompts
2. ✅ **CORRIGIDO:** Modelo HuggingFace atualizado
3. ✅ **CORRIGIDO:** Rate limit tracking para imagens
4. ✅ **CORRIGIDO:** Parse de resposta do DiagrammerSkill
5. ✅ **CORRIGIDO:** Validação de respostas vazias
6. ✅ **CORRIGIDO:** Bloqueio de APIs com quota excedida
7. ✅ **CORRIGIDO:** Logs detalhados para debug Cloudflare FLUX

---

**Última atualização:** 09/04/2026
**Status:** 7/7 correções implementadas

---

## 📝 Correções da Sessão 09/04/2026 - Tarde

### 6. **Bloqueio de APIs com Quota Excedida** 🔒

**Problema:** Múltiplas APIs continuavam sendo tentadas mesmo com quota excedida, causando delays desnecessários.

**Solução:** Atualizado `api-availability.ts` para bloquear automaticamente:

#### APIs de Texto Bloqueadas:
| API | Motivo | Reset |
|-----|--------|-------|
| Gemma 4 31B (OpenRouter) | Quota 429 | Mensal |
| Gemma 4 26B (OpenRouter) | Quota 429 | Mensal |
| Groq (Llama 70B) | Quota 429 | Mensal |
| SambaNova (Llama 8B) | Quota 429 | Mensal |
| Gemini 1-5 | Quota 429 | Mensal |
| Together AI | Auth 401 | Manual |
| DeepSeek | Sem créditos 402 | Manual |
| AIMLAPI | Modelo 404 | Manual |
| HuggingFace | Deprecated 410 | Manual |

#### APIs de Imagem Bloqueadas:
| API | Motivo | Reset |
|-----|--------|-------|
| Google AI Studio | Quota 50 imgs/mês | Mensal |
| HuggingFace SD 3.5 | Endpoint 400 | Manual |
| Replicate | Sem créditos 402 | Manual |

#### APIs Habilitadas:
- ✅ **Nemotron 120B (OpenRouter)** - Principal
- ✅ **Fireworks AI (Llama 70B)** - Backup confiável
- ✅ **Leonardo.AI** - Único gerando imagens com sucesso
- ⚠️ **Cloudflare FLUX** - Habilitado mas com auth error (aguardando correção do token)

### 7. **Atualização do Modelo HuggingFace** 🔄

**Problema:** SD 3.5 Large retornando erro 400 (endpoint em erro).

**Solução:** 
- **Texto:** Atualizado de `Qwen/Qwen2.5-72B-Instruct` para `Qwen/Qwen2.5-7B-Instruct` (mais estável)
- **Imagem:** Atualizado de `stabilityai/stable-diffusion-3.5-large` para `black-forest-labs/FLUX.1-dev` (mais recente)

**Arquivos modificados:**
- `src/api-rotation.ts` - Modelo de texto
- `server.ts` - Modelo de imagem (endpoint + retry)
- `src/services/rate-limit-tracker.ts` - Nome do provider

### 8. **Logs Detalhados para Cloudflare FLUX** 🔍

**Problema:** Erro 401 de autenticação sem detalhes para debug.

**Solução:** Adicionados logs detalhados:
```
[IMAGE] Cloudflare config: accountId=xxx..., token length=XXX
[IMAGE] Cloudflare request body: {...}
[IMAGE] Cloudflare debug: url=...
[IMAGE] Cloudflare 401 troubleshooting:
  1. Check if CLOUDFLARE_API_TOKEN is correct in .env
  2. Token must have "Workers AI" permission
  3. Account ID must match the one in the URL
  4. Token format should be just the token string, no "Bearer" prefix
```

---

## 📊 Resumo de APIs Ativas

### Texto (2 ativas):
1. **Nemotron 3 Super 120B** (OpenRouter) - Principal
2. **Fireworks AI Llama 70B** - Backup

### Imagem (2 ativas):
1. **Leonardo.AI** - Principal (funcionando 100%)
2. **Cloudflare FLUX.1** - Com auth error (aguardando token correto)

---
