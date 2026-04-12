# 🧪 GUIA DE TESTE - FASE 1

**Data:** 10 de Abril de 2026
**Status:** 🔄 **EM TESTE**

---

## 🎯 Objetivo do Teste

Verificar se as otimizações de Rate Limit da Fase 1 estão funcionando:
1. ✅ Leitura de headers `x-ratelimit-*`
2. ✅ Budget diário OpenRouter (50 req/dia)
3. ✅ Throttle Groq TPM (12K tokens/min)

---

## 📋 Checklist de Teste

### **Teste 1: Servidor Iniciou Corretamente?**

```bash
# Verificar se está rodando
netstat -ano | findstr ":3018"

# Deve mostrar:
# TCP    0.0.0.0:3018           0.0.0.0:0              LISTENING
```

**Status:** ✅ PASSOU (servidor rodando na porta 3018)

---

### **Teste 2: Acesso à Interface Web**

1. Abrir browser: `http://localhost:3018`
2. Verificar se página carrega
3. Fazer login com Google
4. Verificar se estilos aparecem

**Status:** ⏳ AGUARDANDO TESTE MANUAL

---

### **Teste 3: Geração de Carrossel (OpenRouter)**

1. Ir em "Criação de Carrossel"
2. Inserir conteúdo de teste (ex: texto sobre IRPF)
3. Selecionar um estilo
4. Clicar "GERAR CARROSSEL"

**O Que Observar nos Logs:**
```
[AI ROTATION] Trying: Nemotron 3 Super 120B (OpenRouter 1 - Italo)
[AI ROTATION] Nemotron 3 Super 120B success: 646 chars in 12050ms

# DEVE APARECER (após response):
[RateLimit] nemotron-1: 49 requests remaining  ← NOVO!
[RateLimit] nemotron-1: 11500 tokens remaining ← NOVO!
```

**Verificar:**
- ✅ Request foi bem sucedido
- ✅ Headers foram lidos (mensagem "requests remaining")
- ✅ Budget foi atualizado (deve mostrar 49/50 restante)

---

### **Teste 4: Throttle Groq TPM**

1. Gerar carrossel que use Groq (Revisor ou Gerente)
2. Observar logs:

**O Que Deve Aparecer:**
```
[AI ROTATION] Groq (Llama 70B - Italo) success: 482 chars in 893ms
[RateLimit] 🔧 Groq (Llama 70B - Italo) throttled for 25s (~6500 tokens used) ← NOVO!
```

**Verificar:**
- ✅ Throttle aplicado (mínimo 25s)
- ✅ Tokens estimados (~6.5K para prompt médio)
- ✅ Próximas requests Groq esperam throttle expirar

---

### **Teste 5: Budget Diário OpenRouter**

1. Gerar múltiplos carrosséis (3-4 seguidos)
2. Observar contagem de requests:

**O Que Deve Aparecer:**
```
[RateLimit] nemotron-1: 48 requests remaining
[RateLimit] nemotron-1: 47 requests remaining
...
[RateLimit] ⚠️ nemotron-1 near daily limit: 5 requests remaining  ← ALERTA!
[RateLimit] 🚨 nemotron-1 marked as LOW QUOTA  ← BLOQUEIO!
```

**Verificar:**
- ✅ Contagem decrementa corretamente
- ✅ Alerta ao atingir 40/50 (80%)
- ✅ Provider bloqueado ao atingir 47/50 (95%)

---

### **Teste 6: Rotação Inteligente de Providers**

1. Quando nemotron-1 está com quota baixa (< 10%)
2. Sistema deve automaticamente usar nemotron-2

**O Que Deve Aparecer:**
```
[AI ROTATION] Skipping Nemotron 3 Super 120B (OpenRouter 1) - low quota
[AI ROTATION] Trying: Nemotron 3 Super 120B (OpenRouter 2 - Odonto)  ← PRÓXIMO!
```

**Verificar:**
- ✅ Provider com quota baixa é pulado
- ✅ Próximo provider na fila é usado
- ✅ Sem erros 429

---

## 🔍 Como Ver Logs em Tempo Real

### **Opção 1: Terminal do Servidor**
```bash
# O servidor está rodando em background
# Para ver logs, precisa parar e rodar em foreground:
taskkill /F /PID 6616
npm run dev
```

### **Opção 2: Endpoint de Status (se disponível)**
```bash
# Verificar status de rate limits:
curl http://localhost:3018/api/ai/rate-limits

# Ou quota status (se implementado):
curl http://localhost:3018/api/ai/quota-status
```

---

## ✅ Critérios de Sucesso

### **Teste PASSOU se:**
- ✅ Servidor inicia sem erros
- ✅ Interface web carrega
- ✅ Carrossel é gerado com sucesso
- ✅ Logs mostram "requests remaining" após requests OpenRouter
- ✅ Logs mostram "throttled for Xs" após requests Groq
- ✅ Budget diário é trackelado (49, 48, 47... requests remaining)
- ✅ Zero erros 429 durante teste

### **Teste FALHOU se:**
- ❌ Servidor não inicia
- ❌ Erros de compilação TypeScript
- ❌ Requests falham com 429
- ❌ Headers não são lidos (nenhuma mensagem "requests remaining")
- ❌ Throttle não é aplicado (nenhuma mensagem "throttled")

---

## 🐛 Troubleshooting

### **Problema: Servidor não inicia**
```bash
# Verificar erro:
npm run dev

# Possíveis causas:
# - TypeScript errors
# - Port 3018 em uso
# - Variáveis de ambiente faltando
```

### **Problema: Headers não são lidos**
```
Causa: API não retorna headers x-ratelimit-*
Solução: Verificar se OpenRouter/Groq estão retornando headers
```

### **Problema: Throttle não aparece**
```
Causa: Provider type não é 'groq'
Solução: Verificar se provider.type está correto no api-rotation.ts
```

---

## 📊 Resultados Esperados

### **Antes da Fase 1:**
```
[AI ROTATION] Nemotron success: 646 chars in 12050ms
[AI ROTATION] Groq success: 482 chars in 893ms
# (sem informações de quota ou throttle)

# Eventualmente:
Error: 429 Too Many Requests  ← ERRO!
```

### **Depois da Fase 1:**
```
[AI ROTATION] Nemotron success: 646 chars in 12050ms
[RateLimit] nemotron-1: 49 requests remaining  ← PROATIVO!
[RateLimit] nemotron-1: 11500 tokens remaining ← MONITORADO!

[AI ROTATION] Groq success: 482 chars in 893ms
[RateLimit] 🔧 Groq throttled for 25s (~6500 tokens used) ← THROTTLE!

# Zero erros 429! ✅
```

---

## 📝 Próximos Passos Após Teste

### **Se Teste PASSAR:**
1. ✅ Documentar resultados
2. ✅ Fazer commit do progresso
3. ✅ Continuar com Fase 2

### **Se Teste FALHAR:**
1. 🔍 Identificar causa raiz
2. 🔧 Corrigir problema
3. 🔄 Re-testar

---

**Teste iniciado:** 10/04/2026 - 14:30 (aproximado)
**Servidor:** Rodando em http://localhost:3018 (PID 6616)
**Status:** ⏳ Aguardando teste manual
