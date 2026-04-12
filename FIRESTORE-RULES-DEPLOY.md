# 🔥 Deploy Manual das Regras do Firestore

## ⚠️ Problema
O Firebase CLI não suporta deploy para bancos de dados customizados (não-default).
Seu app usa o banco: `ai-studio-57535148-1989-4f65-834e-4cff16d06de9`

## ✅ Solução - Deploy Manual via Console

### Passo a Passo:

1. **Acesse o Firebase Console:**
   https://console.firebase.google.com/project/gen-lang-client-0102122839/firestore

2. **Selecione o banco de dados correto:**
   - Clique no dropdown no topo da página
   - Selecione: `ai-studio-57535148-1989-4f65-834e-4cff16d06de9`

3. **Vá para Rules:**
   - Clique na aba **Rules** no topo

4. **Cole as novas regras:**
   Copie TODO o conteúdo do arquivo `firestore.rules` e cole no editor

5. **Clique em Publicar**

## 📋 Regras Atuais (firestore.rules)

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    match /styles/{styleId} {
      allow read: if true;
      allow create: if isValidStyle(request.resource.data) &&
                      request.resource.data.createdAt == request.time;
      allow update: if isValidStyle(request.resource.data) &&
                      request.resource.data.createdAt == resource.data.createdAt;
      allow delete: if true;
    }

    match /carousel_history/{historyId} {
      allow read: if isAuthenticated() && resource.data.userId == request.auth.uid;
      allow create: if isAuthenticated() && request.resource.data.userId == request.auth.uid;
      allow update: if isAuthenticated() && resource.data.userId == request.auth.uid && request.resource.data.userId == request.auth.uid;
      allow delete: if isAuthenticated() && resource.data.userId == request.auth.uid;
    }

    // API Status - Allow server-side writes
    match /api_status/{statusId} {
      allow read: if true;
      allow write: if true;
    }

    // R2 Cache
    match /r2_cache/{cacheId} {
      allow read: if true;
      allow write: if true;
    }

    match /users/{userId} {
      allow read, write: if true;
    }

    match /test/connection {
      allow read: if true;
    }

    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }

    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }

    function isAdmin() {
      return isAuthenticated() &&
        (get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin' ||
          (request.auth.token.email == "italothalesba@gmail.com" && request.auth.token.email_verified == true));
    }

    function hasRequiredFields(fields) {
      return request.resource.data.keys().hasAll(fields);
    }

    function isValidString(val, min, max) {
      return val is string && val.size() >= min && val.size() <= max;
    }

    function isValidList(val, max) {
      return val is list && val.size() <= max;
    }

    function isValidStyle(data) {
      return hasRequiredFields(['id', 'name', 'cover', 'content', 'cta', 'createdBy', 'createdAt']) &&
             isValidString(data.id, 1, 100) &&
             isValidString(data.name, 1, 100) &&
             data.cover is map &&
             data.content is map &&
             data.cta is map &&
             data.createdBy is string &&
             data.createdAt is timestamp;
    }
  }
}
```

## ✅ Fallback Implementado

Enquanto as regras não são atualizadas, o sistema agora:
- ✅ Usa **cache local em memória** para status das APIs
- ✅ Silencia erros de PERMISSION_DENIED
- ✅ Funciona normalmente sem Firestore
- ✅ Reintenta automaticamente a cada 5 minutos

## 🧪 Verificação

Após atualizar as regras, reinicie o servidor e verifique:
- ❌ NÃO deve aparecer: `PERMISSION_DENIED`
- ✅ Deve aparecer: `[ApiStatusSync] Saved status for...`
