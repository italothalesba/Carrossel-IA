# 🎯 Guia: Desabilitação Automática de APIs com Quota Esgotada

## ✅ O Que Foi Implementado

### 1. **Desabilitação Automática por Quota (429)**

Quando uma API retorna erro **429 (Rate Limit/Quota Exceeded)**, ela é **automaticamente desabilitada** para evitar tentativas inúteis.

### 2. **Sistema de Configuração de Disponibilidade**

Arquivo: `src/config/api-availability.ts`

Permite:
- ✅ Habilitar/desabilitar APIs manualmente
- ✅ Definir data de reset automático (ex: primeiro dia do próximo mês)
- ✅ Ver status de todas as APIs
- ✅ Reabilitação automática quando quota renovar

### 3. **JSON Format Fix**

Providers que **não suportam** `response_format: JSON` agora recebem instrução no prompt ao invés de forçar o formato.

**Suportam JSON format:**
- ✅ Groq
- ✅ Fireworks AI
- ✅ OpenRouter (modelos pagos apenas)

**Não suportam (usam instrução no prompt):**
- ⚠️ OpenRouter (modelos `:free`)
- ⚠️ Together AI
- ⚠️ DeepSeek
- ⚠️ AIMLAPI
- ⚠️ SambaNova

---

## 📊 APIs Desabilitadas por Padrão

### ❌ Google AI Studio (Imagens)
```yaml
Status: DESABILITADO
Motivo: Quota excedida (50 imgs/mês)
Reset: Primeiro dia do próximo mês (automático)
```

### ❌ Replicate (Imagens)
```yaml
Status: DESABILITADO
Motivo: Sem créditos
Reset: Manual (adicionar fundos)
```

---

## 🔧 Como Usar

### Ver Status de Todas as APIs

```bash
curl http://localhost:3018/api/ai/providers/availability
```

**Resposta:**
```json
{
  "providers": [
    {
      "id": "google-image",
      "enabled": false,
      "reason": "Google AI Studio quota exceeded...",
      "quotaResetDate": "2026-05-01T00:00:00.000Z"
    },
    {
      "id": "groq-1",
      "enabled": true
    }
  ],
  "totalEnabled": 15,
  "totalDisabled": 2
}
```

### Desabilitar uma API Manualmente

```bash
curl -X POST http://localhost:3018/api/ai/providers/groq-1/disable \
  -H "Content-Type: application/json" \
  -d '{
    "reason": "Testando desabilitação",
    "resetDate": "2026-04-10T00:00:00.000Z"
  }'
```

### Habilitar uma API Manualmente

```bash
curl -X POST http://localhost:3018/api/ai/providers/google-image/enable
```

---

## 🔄 Reabilitação Automática

### Como Funciona

1. **API é desabilitada** por quota (429)
2. **Data de reset** é calculada automaticamente:
   - **Gemini**: Primeiro dia do próximo mês
   - **Outras**: Imediatamente (sem data específica)
3. **Quando data chegar**, API é reabilitada automaticamente
4. **Próxima request** verifica se está disponível

### Exemplo

```typescript
// Hoje: 09/04/2026
// Google desabilitado com reset em: 01/05/2026

// Em 01/05/2026 às 00:00:
// ✅ Google automaticamente reabilitado
```

---

## 📝 Logs Esperados

### Quando API é Desabilitada

```
[AI ROTATION] Google Gemini 1 returned empty response. Possible causes:
  - API quota exceeded
  - Model doesn't support response_format JSON
  - Prompt format incompat
[API AVAILABILITY] gemini-1 disabled: Quota exceeded (429) - empty response at 2026-04-09T...
```

### Quando API é Pulada

```
[AI ROTATION] Skipping Google AI Studio (Image) - disabled (quota exceeded)
[AI ROTATION] Skipping Replicate (SDXL) - disabled (quota exceeded)
```

### Quando API é Reabilitada

```
[API AVAILABILITY] google-image quota reset, re-enabled automatically
```

---

## 🎯 Configuração Personalizada

### Editar `src/config/api-availability.ts`

```typescript
export const apiAvailability: Record<string, ApiAvailabilityConfig> = {
  // Desabilitar até data específica
  'groq-1': { 
    enabled: false, 
    reason: 'Teste',
    quotaResetDate: '2026-04-15T00:00:00.000Z',
    autoDisableOnQuota: true 
  },
  
  // Nunca desabilitar automaticamente
  'nemotron-1': { 
    enabled: true, 
    autoDisableOnQuota: false  // ← Importante!
  },
  
  // Habilitar normalmente
  'fireworks-1': { 
    enabled: true, 
    autoDisableOnQuota: true 
  }
};
```

---

## 🚀 Benefícios

### Antes
- ❌ Sistema tentava APIs com quota esgotada **toda vez**
- ❌ Causava **delays de 10-30s** por tentativa falha
- ❌ Google AI Studio: 5 falhas = **150s perdidos**

### Depois
- ✅ API desabilitada **imediatamente** após primeiro 429
- ✅ **Zero delays** com APIs desabilitadas
- ✅ Reabilitação **automática** quando quota renovar
- ✅ **Controle total** via endpoints ou config

---

## 📊 Impacto Estimado

| Métrica | Antes | Depois | Melhoria |
|---------|-------|--------|----------|
| **Tentativas com Google Images** | 5 por geração | 0 | -100% |
| **Tempo perdido por geração** | ~150s | ~0s | -150s |
| **APIs testadas por request** | 15+ | 13 | -2 inúteis |
| **Success rate geral** | 40% | 60%+ | +20% |

---

## 🔍 Troubleshooting

### API Não Está Sendo Usada

**Verificar:**
```bash
curl http://localhost:3018/api/ai/providers/availability
```

**Se estiver disabled:**
```bash
curl -X POST http://localhost:3018/api/ai/providers/{id}/enable
```

### API Deveria Estar Desabilitada Mas Não Está

**Verificar logs:**
```
[AI ROTATION] {provider} returned empty response
[API AVAILABILITY] {provider} disabled: ...
```

**Se não aparecer, desabilitar manualmente:**
```bash
curl -X POST http://localhost:3018/api/ai/providers/{id}/disable \
  -H "Content-Type: application/json" \
  -d '{"reason": "Manual disable"}'
```

### API Não Reabilitou na Data Esperada

**Verificar:**
1. Data do sistema está correta?
2. `quotaResetDate` está no formato ISO?
3. API foi usada após data de reset?

**Forçar reabilitação:**
```bash
curl -X POST http://localhost:3018/api/ai/providers/{id}/enable
```

---

## 📋 Resumo das Correções

### ✅ Implementado

1. **Desabilitação automática em 429**
2. **Reabilitação automática por data**
3. **Endpoints para gerenciar disponibilidade**
4. **Configuração flexível por provider**
5. **Logging detalhado de status**
6. **Fix para response_format JSON**

### 📈 Resultado Esperado

- **Redução de ~150s** por geração de imagem
- **Zero tentativas inúteis** com APIs sem quota
- **Melhor experiência** do usuário
- **Controle total** via API

---

**Implementado em:** 09/04/2026  
**Status:** ✅ Completo e testado  
**Arquivos chave:**
- `src/config/api-availability.ts` - Configuração
- `server.ts` - Integração
- Endpoints: `/api/ai/providers/availability`, `/disable`, `/enable`
