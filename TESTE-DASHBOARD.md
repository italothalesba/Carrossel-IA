# 🧪 Guia de Teste do Dashboard

## Como Testar

### 1. Abrir o Dashboard
```
http://localhost:3018/dashboard
```

### 2. Verificar Console do Navegador
Pressione `F12` e vá para a aba "Console"

**Logs esperados:**
```
[DASHBOARD] Fetching data...
[DASHBOARD] Responses: 200 200
[DASHBOARD] Data received: {rateLimits: 25, providers: 33}
```

### 3. Se Funcionar ✅
Você verá:
- Header com título "📊 Dashboard de Rate Limits"
- 4 cards coloridos com métricas
- Grid de cards das APIs
- Resumo no final

### 4. Se NÃO Funcionar ❌
Você verá:
- Ícone X vermelho
- Mensagem de erro
- Botão "Tentar Novamente"

**Ações:**
1. Verificar console do navegador (F12)
2. Ver se servidor está rodando: `http://localhost:3018`
3. Testar endpoints manualmente:
   - `http://localhost:3018/api/ai/rate-limits`
   - `http://localhost:3018/api/ai/status`

---

## Endpoints Verificados

✅ `/api/ai/rate-limits` - Retorna dados de rate limit
✅ `/api/ai/status` - Retorna status das APIs

**Ambos testados e funcionando via curl!**

---

## Problemas Comuns

### Página em branco
- **Causa:** Erro de JavaScript silencioso
- **Solução:** Ver console do navegador (F12)

### Loading infinito
- **Causa:** Fetch falha mas não seta error
- **Solução:** Corrigido com `finally { setLoading(false) }`

### Erro ao carregar
- **Causa:** Servidor não está rodando
- **Solução:** `npm run dev`

---

**Data:** 10 de Abril de 2026
**Status:** Dashboard corrigido com logging e tratamento de erros
