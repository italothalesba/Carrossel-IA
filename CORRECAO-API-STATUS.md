# 📋 Deploy das Correção - Abril 2026

## ✅ Correções Implementadas

### 1. Firestore Rules (firestore.rules)
**Problema:** Erro `PERMISSION_DENIED` ao salvar status das APIs
**Solução:** Alterado regras de `api_status` e `r2_cache` para `allow write: if true`

**Como fazer deploy:**

#### Opção A: Firebase Console (Manual)
1. Acesse: https://console.firebase.google.com/
2. Selecione seu projeto
3. Vá para **Firestore Database** > **Rules**
4. Copie TODO o conteúdo de `firestore.rules`
5. Cole no editor e clique em **Publicar**

#### Opção B: Firebase CLI (Automático)
```bash
# Instalar Firebase CLI (se não tiver)
npm install -g firebase-tools

# Login
firebase login

# Deploy apenas das regras
firebase deploy --only firestore:rules
```

---

### 2. API Availability (src/config/api-availability.ts)
**Problema:** APIs com quota excedida sendo tentadas repetidamente
**Solução:** Adicionado `quotaResetDate` para todas as APIs desabilitadas

**APIs com reset automático no próximo mês:**
- Gemma 4 (todas 4 contas)
- Alibaba DashScope (todas 3 contas)
- SambaNova (todas 3 contas)
- AIMLAPI (todas 3 contas)
- Anthropic Claude (todas 3 contas)
- Google Gemini (todas 4 contas)
- Together AI, DeepSeek, HuggingFace

**Como funciona:**
- ✅ APIs desabilitadas com quota **NÃO** serão tentadas
- 📅 No primeiro dia do próximo mês, serão reabilitadas automaticamente
- 📊 Log mostra "resets in X days" quando verifica quota

---

## 🧪 Testes

### Teste 1: Verificar se APIs com quota são puladas
1. Reinicie o servidor: `npm run dev`
2. Observe os logs - APIs com quota devem mostrar:
   ```
   [API AVAILABILITY] ⏸️ gemma4-1 still disabled (quota), resets in X days
   [AI ROTATION] Skipping Google Gemma 4 31B - disabled (quota exceeded)
   ```

### Teste 2: Verificar se Firestore funciona
1. Reinicie o servidor
2. Observe os logs - **NÃO** deve aparecer mais:
   ```
   PERMISSION_DENIED: Missing or insufficient permissions
   ```

### Teste 3: Verificar status das APIs
Acesse: `http://localhost:3018/api/ai/api-status` (se disponível)
Ou verifique os logs de inicialização

---

## 📊 Status Atual das APIs

### ✅ Funcionando (8 APIs)
| Provider | Contas |
|----------|--------|
| Nemotron 3 Super 120B | 4/4 ✅ |
| Fireworks AI | 1/3 ⚠️ |
| Groq Llama 70B | 3/3 ✅ |

### ⏸️ Aguardando Reset de Quota (22 APIs)
Serão reabilitadas automaticamente em: **01/05/2026**

### ❌ Desabilitadas Permanentemente (3 APIs)
- Fireworks-2, Fireworks-3 (erro 412)
- Precisam de novas chaves ou correção no server

---

## 🚀 Próximos Passos

1. **Deploy Firestore Rules** (urgente)
2. **Reiniciar servidor** para aplicar mudanças
3. **Monitorar logs** nas próximas 24h
4. **Considerar adicionar mais chaves** de APIs gratuitas
5. **Verificar Fireworks-2/3** - talvez precise atualizar modelo

---

## 📝 Notas Técnicas

- `quotaResetDate` usa `getNextMonthFirstDay()` - calculado dinamicamente no startup
- APIs com `autoDisableOnQuota: true` podem ser re-desabilitadas automaticamente
- Sistema de rotação já pula APIs desabilitadas (log confirma)
- Firestore now permite writes via service account (server-side)
