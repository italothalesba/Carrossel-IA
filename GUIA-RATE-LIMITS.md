# 🚀 Guia Rápido: Sistema de Rate Limits

## Como Ver Quando Cada API Estará Disponível

### Opção 1: Via Script Rápido (Recomendado)

```bash
npx tsx check-rate-limits.ts
```

Isso mostra:
- ✅ Status de todas as APIs
- ⏰ Quando cada uma estará disponível
- 💡 Qual usar agora
- ⚠️ Quais estão perto do limite

### Opção 2: Via API (Para Dashboards)

```bash
# Ver relatório completo em JSON
curl http://localhost:3018/api/ai/rate-limits

# Ver relatório em texto (fácil leitura)
curl http://localhost:3018/api/ai/rate-limits/report
```

### Opção 3: Via Código (Para Automação)

```typescript
import { getBestAvailableProvider, isProviderReady } from './src/api-rotation';

// Verificar se API está pronta
if (isProviderReady('groq-1')) {
  console.log('✅ Groq está disponível');
} else {
  console.log('⏰ Groq não está disponível agora');
}

// Obter melhor provider para usar agora
const best = getBestAvailableProvider();
console.log(`Use: ${best.providerName}`);
console.log(`Status: ${best.isAvailable ? 'Disponível' : `Disponível em ${best.waitTime}`}`);
```

## Entendendo o Relatório

### Status Colors

- 🟢 **Verde**: API disponível para uso imediato
- 🔴 **Vermelho**: API limitada ou em cooldown

### Informações Mostradas

Para cada API você verá:

```
🟢 Nemotron 3 Super 120B (OpenRouter 1)
   Uso: 15/30 (50.0%)              ← Requests feitas / limite total
   Requests restantes: 15           ← Quantas ainda pode fazer
   🔄 Reset em: 45s                 ← Quando o contador zera

🔴 Groq (Llama 70B)
   Uso: 30/30 (100.0%)             ← Limite atingido!
   Requests restantes: 0            ← Sem requests disponíveis
   ⏰ Disponível em: 1m 15s         ← Quando poderá usar novamente
   (14:32:00)                       ← Horário exato
```

### Cooldowns Ativos

Se uma API está em cooldown, você verá:

```
⏸️ Groq (Llama 70B)
   Motivo: Rate limit hit: 429     ← Por que entrou em cooldown
   Falhas consecutivas: 3          ← Quantos erros seguidos
   ⏰ Disponível em: 1m 15s         ← Tempo restante
```

## Resetar Cooldown Manualmente

Se precisar usar uma API que está em cooldown:

```bash
curl -X POST http://localhost:3018/api/ai/providers/groq-1/reset-cooldown
```

⚠️ **Atenção**: Se a API realmente atingiu o limite, continuar tentando pode causar mais erros.

## Limites Conhecidos das APIs

| API | Requests/min | Requests/dia | Cooldown |
|-----|--------------|--------------|----------|
| Nemotron (OpenRouter) | 30 | - | 1 min |
| Gemma 4 (OpenRouter) | 30 | - | 1 min |
| Groq | 30 | 10,000 | 2 min |
| Fireworks AI | 10 | - | 2 min |
| SambaNova | 30 | - | 1 min |
| Together AI | 20 | - | 2 min |
| DeepSeek | 10 | - | 3 min |
| HuggingFace | 10 | - | 5 min |
| Google Gemini | 15 | 1,500 | 1 min |

### APIs de Imagem

| API | Limite | Cooldown |
|-----|--------|----------|
| Google AI Studio | 50/mês | - |
| Cloudflare FLUX | 100/dia | 1 min |
| HuggingFace SDXL | 10/min | 5 min |
| Leonardo.AI | 150/dia | 2 min |
| ModelsLab | 20/mês | - |
| AI Horde | 5/min | 30s |

## Dicas Práticas

### ✅ Boas Práticas

1. **Sempre verifique antes de enviar requests**
   ```bash
   npx tsx check-rate-limits.ts
   ```

2. **Use o melhor provider sugerido**
   - O sistema automaticamente evita APIs em cooldown
   - Mas é bom saber qual está usando

3. **Monitore APIs próximas do limite**
   - Quando chegar a 80%, considere usar alternativas

4. **Aguarde cooldowns expirarem**
   - Geralmente 1-5 minutos
   - Forçar uso pode piorar a situação

### ❌ O Que Não Fazer

1. **Não fique resetando cooldowns constantemente**
   - Pode resultar em ban temporário da API
   - Espere o tempo natural

2. **Não ignore avisos de rate limit**
   - Se chegou a 90%, reduza frequência de uso

3. **Não assuma que todas APIs são iguais**
   - Cada uma tem limites diferentes
   - Verifique sempre o status

## Exemplo de Uso no Código

```typescript
import { getBestAvailableProvider } from './src/api-rotation';

async function gerarConteudoComIA(prompt: string) {
  // Verificar melhor provider disponível
  const best = getBestAvailableProvider();
  
  if (!best.isAvailable) {
    console.log(`⏰ Melhor API estará disponível em: ${best.waitTime}`);
    console.log(`💡 Usando alternativa...`);
  }
  
  // Sistema automaticamente usa melhor provider via rotação
  const resultado = await apiManager.executeWithRotation(async (provider) => {
    // Fazer request
    return await fetch(...);
  });
  
  return resultado;
}
```

## Monitoramento Contínuo

### Verificar a Cada 10 Segundos

```bash
# Linux/Mac
watch -n 10 'curl -s http://localhost:3018/api/ai/rate-limits/report'

# Windows (PowerShell)
while ($true) { 
  Clear-Host
  Invoke-RestMethod -Uri http://localhost:3018/api/ai/rate-limits/report
  Start-Sleep -Seconds 10
}
```

### Log Automático

```bash
# Salvar log a cada minuto
while true; do
  curl -s http://localhost:3018/api/ai/rate-limits >> api-usage.log
  echo "" >> api-usage.log
  sleep 60
done
```

## Problemas Comuns

### "Todas APIs Limitadas"

**Causa:** Pico de uso simultâneo

**Solução:**
1. Aguardar 1-5 minutos
2. Usar script para verificar qual liberou
3. Se urgente, resetar cooldown de uma API

### "API Não Libera Após Cooldown"

**Causa:** Limite diário/mensal atingido (não apenas por minuto)

**Solução:**
1. Verificar tipo de limite no relatório
2. Se for diário: aguardar até amanhã
3. Se for mensal: esperar próximo mês ou usar outra API

### "Cooldown Não Expira"

**Causa:** Continua falhando ao tentar usar

**Solução:**
1. Não tentar usar a API durante cooldown
2. Esperar expiração natural
3. Se persistir, resetar manualmente

---

**Precisa de mais detalhes?** Veja `RATE-LIMITS.md` para documentação completa.
