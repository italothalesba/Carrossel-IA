# 🔥 Guia de Configuração do Firebase Auth

## Status Atual do Sistema

### ✅ Configurado e Funcionando
- [x] Firebase SDK inicializada
- [x] Firestore conectado (Database: `ai-studio-57535148-1989-4f65-834e-4cff16d06de9`)
- [x] Regras de segurança configuradas (`firestore.rules`)
- [x] Pinecone populado (6 estilos iniciais)

### ⚠️ Requer Ação Manual - Firebase Auth

Para que o **histórico de carrosséis** funcione corretamente, você precisa habilitar o **Google Authentication** no Firebase Console.

---

## 📋 Passo a Passo: Habilitar Google Auth

### 1️⃣ Acesse o Firebase Console
🔗 URL: https://console.firebase.google.com/project/gen-lang-client-0102122839/authentication/providers

### 2️⃣ Habilite o Google Sign-In

1. Clique em **"Adicionar novo provedor"**
2. Selecione **"Google"**
3. Ative a chave **"Ativar"**
4. Configure:
   - **Nome do projeto**: Carrossel-IA (ou o nome que preferir)
   - **E-mail de suporte do projeto**: seu-email@gmail.com
5. Clique em **"Salvar"**

### 3️⃣ Configure as Permissões

Na seção **"Configurações de permissão"**:
- ✅ Marque: **"Um endereço de e-mail por provedor"**
- ✅ Deixe desmarcado: "Permitir criação de várias contas com o mesmo e-mail"

### 4️⃣ Verifique o Domínio Autorizado

1. Vá para **Authentication > Settings**
2. Na seção **"Authorized domains"**, verifique se existe:
   - `localhost` (para desenvolvimento)
   - `gen-lang-client-0102122839.firebaseapp.com`

---

## 🎯 O Que Acontece Depois

### ✅ Com Auth Configurado:
```
Usuário faz login → Firestore salva histórico → Pode recuperar depois
```

**Coleção:** `carousel_history`
- Cada usuário vê apenas SEU histórico
- Salvamento automático ao gerar carrossel
- Feedback de qualidade salvo para aprendizado do estilo

### ⚠️ Sem Auth Configurado:
```
Usuário anônimo → Histórico fica só no navegador → Perde ao fechar
```

O sistema continuará funcionando para **gerar carrosséis**, mas o histórico **NÃO será salvo no Firestore**.

---

## 🧪 Testando a Configuração

Depois de habilitar o Google Auth:

1. Acesse: `http://localhost:3018`
2. Clique em **"Gestão de Estilos"** ou **"Criação de Carrossel"**
3. Se aparecer popup de login → **Auth funcionando!** ✅
4. Faça login com sua conta Google
5. Gere um carrossel de teste
6. Vá ao Firebase Console > Firestore e verifique a coleção `carousel_history`

---

## 🔍 Verificando no Firebase Console

### Firestore Data
URL: https://console.firebase.google.com/project/gen-lang-client-0102122839/firestore

**Coleções esperadas:**
```
📁 styles
  └─ [documentos de estilos visuais]
  
📁 carousel_history
  └─ [documentos com userId = seu UID]
  
📁 users (opcional)
  └─ [dados do usuário]
```

---

## 🚀 Resumo do Sistema Atual

| Componente | Status | Detalhes |
|------------|--------|----------|
| **Servidor** | 🟢 Online | Porta 3018 |
| **Pinecone** | 🟢 Online | 6 estilos populados |
| **Firestore** | 🟢 Conectado | Regras configuradas |
| **Firebase Auth** | 🟡 Pendente | Requer ação no console |
| **Google AI** | 🟢 Configurado | API key presente |
| **HuggingFace** | 🟢 Configurado | API key presente |
| **Replicate** | 🟢 Configurado | API key presente |
| **Anthropic** | 🟢 Configurado | API key presente |

---

## 💡 Dicas Importantes

1. **O sistema funciona sem auth?** 
   - ✅ Sim, para geração de carrosséis
   - ❌ Não, para salvar histórico permanentemente

2. **Posso usar outro método de auth?**
   - Sim! Email/senha, Facebook, etc.
   - O código usa `onAuthStateChanged`, que funciona com qualquer provider

3. **O Pinecone já está populado?**
   - ✅ Sim! Com 6 estilos iniciais:
     - Minimalista Tech
     - Corporativo Bold
     - Criativo Colorido
     - Elegante Luxo
     - Educacional Clean
     - Motivacional Dark

4. **Como adicionar mais estilos?**
   - Use a página "Gestão de Estilos" na aplicação
   - Ou execute `npx tsx diagnose-system.ts` novamente com novos templates

---

## 🆘 Troubleshooting

### Erro: "Permission denied" no Firestore
→ Verifique se as regras estão implantadas:
```bash
firebase deploy --only firestore:rules
```

### Erro: "Auth domain not authorized"
→ Adicione `localhost` em Authorized domains no Firebase Console

### Popup de login não aparece
→ Verifique se o popup blocker do navegador não está bloqueando

---

**Última atualização:** 8 de abril de 2026
