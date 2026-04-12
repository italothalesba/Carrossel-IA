# 📊 Sistema de Rate Limits e Cooldowns

## Visão Geral

O sistema agora inclui um **rastreador inteligente de rate limits** que monitora o uso de todas as APIs e prevê quando cada uma estará disponível novamente, evitando erros de cotas e tokens.

## 🎯 Funcionalidades

### 1. **Contador de Rate Limit Automático**
- Monitora requests por minuto, dia e mês
- Calcula percentual de uso de cada API
- Estima quantas requests ainda podem ser feitas

### 2. **Sistema de Cooldown Inteligente**
- Detecta erros 429 (Rate Limit) automaticamente
- Ativa cooldown automático após falhas consecutivas
- Calcula tempo exato até a API estar disponível novamente

### 3. **Previsão de Disponibilidade**
- Mostra quando cada API estará disponível
- Exibe motivo do bloqueio (rate limit, quota diária, etc.)
- Sugere melhor API disponível no momento

## 📡 Endpoints da API

### Obter Status Completo de Rate Limits

```bash
GET /api/ai/rate-limits
```

**Resposta JSON:**
```json
{
  "report": "... relatório em texto formatado ...",
  "summary": {
    "available": 8,
    "limited": 3,
    "total": 11
  },
  "rateLimits": [
    {
      "providerId": "nemotron-1",
      "providerName": "Nemotron 3 Super 120B (OpenRouter 1)",
      "currentUsage": 15,
      "limit": 30,
      "limitType": "requests",
      "usagePercent": 50.0,
      "isLimited": false,
      "estimatedRequestsLeft": 15,
      "resetsAt": 1712345678901,
      "availableAt": null
    }
  ],
  "cooldowns": [
    {
      "providerId": "groq-1",
      "providerName": "Groq (Llama 70B)",
      "isCoolingDown": true,
      "cooldownEndsAt": 1712345678901,
      "cooldownReason": "Rate limit hit: 429",
      "consecutiveFailures": 3,
      "nextRetryAt": 1712345678901
    }
  ],
  "bestAvailableProvider": {
    "providerId": "nemotron-1",
    "providerName": "Nemotron 3 Super 120B (OpenRouter 1)",
    "waitTime": "Agora",
    "isAvailable": true
  },
  "timestamp": 1712345678901
}
```

### Obter Relatório em Texto Formatado

```bash
GET /api/ai/rate-limits/report
```

**Resposta:**
```
================================================================================
📊 RELATÓRIO DE DISPONIBILIDADE DE APIs
🕐 09/04/2026, 14:30:45
================================================================================

✅ Disponíveis: 8
⚠️  Limitadas/Indisponíveis: 3

--------------------------------------------------------------------------------
RATE LIMITS:
--------------------------------------------------------------------------------

🟢 Nemotron 3 Super 120B (OpenRouter 1)
   Uso: 15/30 (50.0%)
   Tipo: requests
   Requests restantes: 15
   🔄 Reset em: 45s

🔴 Groq (Llama 70B)
   Uso: 30/30 (100.0%)
   Tipo: requests
   Requests restantes: 0
   ⏰ Disponível em: 1m 15s (14:32:00)

--------------------------------------------------------------------------------
COOLDOWNS ATIVOS:
--------------------------------------------------------------------------------

⏸️ Groq (Llama 70B)
   Motivo: Rate limit hit: 429 Too Many Requests
   Falhas consecutivas: 3
   ⏰ Disponível em: 1m 15s

================================================================================
```

### Status Geral das APIs

```bash
GET /api/ai/status
```

Retorna ranking de saúde e estatísticas de todos os providers.

## 🔧 Uso via Código

### Verificar se Provider está Disponível

```typescript
import { isProviderReady, getProviderWaitTime } from './src/api-rotation';

// Verificar disponibilidade
if (isProviderReady('groq-1')) {
  console.log('✅ Groq está pronto para uso');
} else {
  const availability = getProviderWaitTime('groq-1');
  console.log(`⏰ Groq estará disponível em ${availability.waitSeconds}s`);
  console.log(`Motivo: ${availability.reason}`);
}
```

### Obter Melhor Provider Disponível

```typescript
import { getBestAvailableProvider } from './src/api-rotation';

const best = getBestAvailableProvider();

if (best.isAvailable) {
  console.log(`✅ Melhor provider: ${best.providerName}`);
} else {
  console.log(`⏰ Melhor provider estará disponível em: ${best.waitTime}`);
}
```

### Obter Relatório Completo

```typescript
import { getRateLimitReport } from './src/api-rotation';

const report = getRateLimitReport();
console.log(report);
```

### Acesso Direto ao Tracker

```typescript
import { rateLimitTracker } from './src/services/rate-limit-tracker';

// Status de todas as APIs
const status = rateLimitTracker.getAllApisStatus();
console.log(`Disponíveis: ${status.availableCount}`);
console.log(`Limitadas: ${status.limitedCount}`);

// Tempo até provider estar disponível
const availability = rateLimitTracker.getTimeUntilAvailable('groq-1');
console.log(`Disponível em: ${rateLimitTracker.formatTime(availability.waitMs)}`);
```

## ⚙️ Configurações de Rate Limit

Cada provider tem configurações personalizadas baseadas nos limites conhecidos dos planos gratuitos:

| Provider | Requests/min | Cooldown após Erro | Falhas Máx. |
|----------|--------------|-------------------|-------------|
| Nemotron (OpenRouter) | 30 | 1 min | 3 |
| Gemma 4 (OpenRouter) | 30 | 1 min | 3 |
| Groq | 30 | 2 min | 3 |
| Fireworks AI | 10 | 2 min | 3 |
| SambaNova | 30 | 1 min | 5 |
| Together AI | 20 | 2 min | 3 |
| DeepSeek | 10 | 3 min | 3 |
| HuggingFace | 10 | 5 min | 2 |
| Google Gemini | 15 | 1 min | 3 |

### APIs de Imagem

| Provider | Limite | Cooldown após Erro | Falhas Máx. |
|----------|--------|-------------------|-------------|
| Google AI Studio | 50/mês | - | 3 |
| Cloudflare FLUX | 100/dia | 1 min | 3 |
| HuggingFace SDXL | 10/min | 5 min | 2 |
| Leonardo.AI | 150/dia | 2 min | 3 |
| ModelsLab | 20/mês | - | 3 |
| AI Horde | 5/min | 30s | 5 |

## 🎯 Como Funciona o Sistema

### 1. Detecção Automática de Rate Limit

O sistema detecta automaticamente erros de rate limit:

```typescript
// Detecta status HTTP 429
if (statusCode === 429) {
  // Ativa cooldown imediato
  state.isCoolingDown = true;
  state.cooldownEndsAt = now + cooldownMs;
}

// Detecta mensagens de quota
if (error?.includes('429') || error?.includes('quota')) {
  // Ativa cooldown
}
```

### 2. Cooldown Progressivo

- **1-2 falhas**: Continua tentando
- **3 falhas consecutivas** (configurável): Ativa cooldown
- **Após cooldown**: Testa novamente, se falhar, cooldown mais longo

### 3. Rotação Inteligente

O sistema de rotação agora considera:

1. ✅ Taxa de sucesso histórica
2. ⚡ Velocidade média
3. 🚫 Status de cooldown atual
4. 📊 Quota disponível

### 4. Contadores Persistentes

- Contadores de uso diário/mensal são salvos em `localStorage`
- Persistem entre reinicializações do servidor (client-side)
- Resetam automaticamente ao atingir o período limite

## 📊 Métricas Disponíveis

### Para Cada Provider

- **Uso atual**: Requests feitas no período
- **Limite**: Máximo de requests permitido
- **Percentual**: Quanto do limite já foi usado
- **Requests restantes**: Quantas requests ainda pode fazer
- **Tempo de reset**: Quando o contador zera
- **Cooldown ativo**: Se está em período de espera
- **Motivo do cooldown**: Por que está bloqueado

### Métricas Globais

- **APIs disponíveis**: Quantas estão prontas para uso
- **APIs limitadas**: Quantas estão em cooldown ou sem quota
- **Melhor provider**: Qual usar agora
- **Tempo de espera**: Quando a próxima estará disponível

## 🔍 Exemplos de Uso Prático

### Exemplo 1: Verificar Antes de Enviar Request

```typescript
const { isProviderReady, getProviderWaitTime } = await import('./src/api-rotation');

const providerId = 'groq-1';

if (!isProviderReady(providerId)) {
  const wait = getProviderWaitTime(providerId);
  console.log(`⏰ Aguarde ${wait.waitSeconds}s antes de usar Groq`);
  console.log(`Motivo: ${wait.reason}`);
  
  // Usar provider alternativo
  const best = getBestAvailableProvider();
  console.log(`💡 Use instead: ${best.providerName}`);
}
```

### Exemplo 2: Dashboard de Monitoramento

```typescript
// Atualizar a cada 10 segundos
setInterval(() => {
  const status = rateLimitTracker.getAllApisStatus();
  
  console.clear();
  console.log('=== API STATUS DASHBOARD ===');
  console.log(`✅ Available: ${status.availableCount}`);
  console.log(`⚠️  Limited: ${status.limitedCount}`);
  console.log('');
  
  status.rateLimits.forEach(rl => {
    const icon = rl.isLimited ? '🔴' : '🟢';
    console.log(`${icon} ${rl.providerName}: ${rl.currentUsage}/${rl.limit} (${rl.usagePercent}%)`);
  });
}, 10000);
```

### Exemplo 3: Aguardar Provider Específico

```typescript
async function waitForProvider(providerId: string, maxWaitMs = 300000) {
  const start = Date.now();
  
  while (Date.now() - start < maxWaitMs) {
    if (isProviderReady(providerId)) {
      return true;
    }
    
    const wait = getProviderWaitTime(providerId);
    console.log(`Aguardando ${providerId}: ${wait.waitSeconds}s restantes`);
    await new Promise(r => setTimeout(r, Math.min(wait.waitSeconds * 1000, 5000)));
  }
  
  return false;
}

// Uso
const ready = await waitForProvider('deepseek-1', 180000); // Espera até 3 min
if (ready) {
  console.log('✅ DeepSeek está disponível!');
} else {
  console.log('❌ Timeout - usando fallback');
}
```

## 🚀 Próximos Passos

### Funcionalidades Planejadas

- [ ] Painel web visual com gráficos em tempo real
- [ ] Notificações quando API fica disponível
- [ ] Predição de uso baseada em histórico
- [ ] Alertas antes de atingir limites
- [ ] Integração com Discord/Telegram para alertas
- [ ] Cache distribuído entre múltiplos servidores
- [ ] Rastreamento de tokens (input/output)
- [ ] Cálculo de custos em tempo real

## 🐛 Troubleshooting

### API Sempre Mostra como "Limitada"

**Causa:** Cooldown não expirou ou limite diário/mensal atingido

**Solução:**
```bash
# Verificar status detalhado
curl http://localhost:3018/api/ai/rate-limits

# Aguardar tempo indicado em "availableAt"
# Ou resetar contador manual (se necessário)
```

### Resetar Contadores Manualmente

```typescript
// Limpar histórico de um provider
rateLimitTracker.cleanup(0); // Limpa tudo

// Resetar cooldown específico
const state = rateLimitTracker.getCooldownState('groq-1');
if (state) {
  state.isCoolingDown = false;
  state.cooldownEndsAt = null;
}
```

### Logs Detalhados

O sistema gera logs automáticos:

```
[RateLimit] Groq (Llama 70B) rate limited, cooldown for 120s
[RateLimitTracker] Groq (Llama 70B) failed (429): Too Many Requests
[RateLimit] Groq (Llama 70B) recovered from cooldown
[RateLimitTracker] Cleanup completed
```

## 📝 Notas Importantes

1. **Limites Reais vs Configurados**: Os limites configurados são baseados nos planos gratuitos oficiais. Se descobrir limites diferentes, ajuste em `rate-limit-tracker.ts`.

2. **Persistência**: Contadores diários/mensais são salvos em `localStorage` (client-side). Em produção, considere usar Redis ou banco de dados.

3. **Cleanup Automático**: O sistema limpa automaticamente registros antigos a cada 24h para evitar memory leaks.

4. **Fallback**: Se TODAS as APIs estiverem indisponíveis, o sistema usa respostas de fallback hardcoded.

---

**Implementado por:** Sistema de Rate Limits v1.0  
**Última atualização:** 09/04/2026
