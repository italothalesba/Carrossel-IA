# 🔍 Diagnóstico do Pinecone - Status Atual

## ❌ Resultado do Diagnóstico

**Data:** 09/04/2026, 10:42:59

### Problema Identificado

```
❌ API key do Pinecone foi REJEITADA
Erro: The API key you provided was rejected
```

### Configuração Atual

| Item | Status | Detalhe |
|------|--------|---------|
| **API Key no `.env`** | ⚠️ Placeholder | `pcsk_...` (incompleta) |
| **API Key no `.env.local`** | ❌ Inválida | 8 caracteres, rejeitada |
| **Conexão** | ❌ Falhou | Authorization error |
| **Índices** | ❓ Não verificado | Não foi possível conectar |

## 🔧 Como Resolver

### 1️⃣ Obter Nova API Key

1. Acesse: **https://app.pinecone.io**
2. Faça login (Google ou GitHub)
3. Menu lateral → **API Keys**
4. Clique em **Create API Key**
5. Copie a chave **COMPLETA** (começa com `pcsk_`)

### 2️⃣ Atualizar Configuração

Abra `.env.local` e substitua:

```env
# ANTES (inválido)
PINECONE_API_KEY=

# DEPOIS (válido)
PINECONE_API_KEY=pcsk_sua-chave-completa-aqui
```

⚠️ **Importante:**
- Copie a chave **inteira** (não corte caracteres)
- Não adicione espaços no início/fim
- Salve o arquivo

### 3️⃣ Verificar Conexão

Execute:

```bash
npx tsx diagnose-pinecone.ts
```

**Resultado esperado:**
```
✅ Conexão estabelecida em 234ms
✅ 1 índice(s) encontrado(s):

📊 carousel-styles
   Status: ✅ Pronto
   Dimensões: 1024
   Métrica: cosine
```

### 4️⃣ Via Endpoint (com servidor rodando)

```bash
curl http://localhost:3018/api/pinecone/health
```

**Resposta esperada:**
```json
{
  "status": "ok",
  "configured": true,
  "latency": 234,
  "indexes": [...],
  "targetIndex": {
    "name": "carousel-styles",
    "exists": true,
    "stats": {
      "totalRecordCount": 150
    }
  }
}
```

## 📋 Criar Índice (se necessário)

Se após conectar não houver índice:

1. Acesse: https://app.pinecone.io
2. **Create Index**
3. Configuração recomendada:
   ```
   Name: carousel-styles
   Dimension: 1024
   Metric: cosine
   Type: Serverless
   Cloud: aws
   Region: us-east-1
   ```

## 🎯 Plano Gratuito

O plano Starter (grátis) inclui:

- ✅ 1 projeto
- ✅ 1 índice serverless
- ✅ ~2GB armazenamento (~750k vetores)
- ✅ Sem expiração
- ✅ **Sem custo financeiro**

## 📊 Para Que Serve?

No Carrossel-IA, o Pinecone:

1. **Armazena estilos visuais** como vetores
2. **Busca estilos similares** por similaridade
3. **Aprende preferências** do usuário
4. **Recomenda estilos** baseado em histórico

### Fluxo:

```
Usuário cria carrossel
       ↓
Estilo é analisado
       ↓
Convertido em vetor (1024 dimensões)
       ↓
Salvo no Pinecone ← Busca similares
       ↓              ↓
Próximo carrossel ← Usa preferências
```

## 📁 Arquivos de Diagnóstico

Criados para ajudar:

- **`diagnose-pinecone.ts`** - Script de diagnóstico completo
- **`PINECONE-SETUP.md`** - Guia completo de configuração
- **`PINECONE-DIAGNOSTIC.md`** - Este arquivo (resumo)

## ⚠️ Erros Comuns e Soluções

| Erro | Causa | Solução |
|------|-------|---------|
| `API key was rejected` | Chave inválida/expirada | Gerar nova chave |
| `Index not found` | Índice não criado | Criar via console |
| `Quota exceeded` | Limite de 2GB atingido | Deletar vetores antigos |
| `Timeout` | Problema de rede | Verificar internet/firewall |

## ✅ Checklist de Configuração

- [ ] Acessar https://app.pinecone.io
- [ ] Criar/fazer login
- [ ] Gerar nova API key
- [ ] Copiar chave completa
- [ ] Colar em `.env.local`
- [ ] Salvar arquivo
- [ ] Executar `npx tsx diagnose-pinecone.ts`
- [ ] Verificar conexão OK
- [ ] Criar índice se necessário
- [ ] Reiniciar servidor

---

**Status:** ⏳ Aguardando configuração da API key  
**Próximo passo:** Obter chave em https://app.pinecone.io
