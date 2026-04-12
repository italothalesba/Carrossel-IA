# 🔧 Como Configurar Pinecone

## ❌ Problema Atual

A API key do Pinecone está **inválida ou expirada**:

```
❌ Falha na conexão: The API key you provided was rejected
```

## ✅ Como Resolver

### Passo 1: Obter Nova API Key

1. **Acesse Pinecone Console:**
   - URL: https://app.pinecone.io
   - Faça login com Google ou GitHub

2. **Criar API Key:**
   - No menu lateral, clique em **"API Keys"**
   - Clique em **"Create API Key"**
   - Dê um nome (ex: "Carrossel-IA")
   - Copie a chave gerada (começa com `pcsk_`)

### Passo 2: Adicionar ao Projeto

1. **Abra o arquivo `.env.local`:**
   ```
   C:\Users\italo\OneDrive\Área de Trabalho\PRODUÇÃO.IA\Carrossel-IA\.env.local
   ```

2. **Localize a seção do Pinecone:**
   ```env
   # ==========================================
   # PINECONE (Vector Database)
   # ==========================================
   PINECONE_API_KEY=
   ```

3. **Cole sua nova API key:**
   ```env
   PINECONE_API_KEY=pcsk_sua-chave-completa-aqui
   ```

4. **Salve o arquivo**

### Passo 3: Verificar Conexão

Execute o diagnóstico:

```bash
npx tsx diagnose-pinecone.ts
```

Você deve ver:

```
✅ Conexão estabelecida em 234ms
✅ 1 índice(s) encontrado(s):

📊 carousel-styles
   Status: ✅ Pronto
   Dimensões: 1024
   Métrica: cosine
```

## 📋 Criar Índice (Se Não Existir)

Se o diagnóstico mostrar "Nenum índice encontrado":

### Via Pinecone Console:

1. Acesse: https://app.pinecone.io
2. Clique em **"Create Index"**
3. Configure:
   ```
   Name: carousel-styles
   Dimension: 1024
   Metric: cosine
   Cloud: aws (ou gcp)
   Region: us-east-1 (ou disponível)
   Type: Serverless
   ```
4. Clique em **"Create Index"**
5. Aguarde 1-2 minutos até status "Ready"

### Via Script (Opcional):

```typescript
import { Pinecone } from '@pinecone-database/pinecone';

const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });

await pc.createIndex({
  name: 'carousel-styles',
  dimension: 1024,
  metric: 'cosine',
  spec: {
    serverless: {
      cloud: 'aws',
      region: 'us-east-1'
    }
  }
});

console.log('✅ Índice criado!');
```

## 🎯 Plano Gratuito - Limites

O plano gratuito (Starter) inclui:

- ✅ **1 projeto**
- ✅ **1 índice serverless**
- ✅ **Até 2GB** de armazenamento
- ✅ **~750.000 vetores** (dependendo da dimensão)
- ✅ **Sem custo financeiro**
- ✅ **Não expira** (renovação contínua)

### Limites de Uso:

- **Requests:** Sem limite rígido, mas há rate limiting automático
- **Armazenamento:** 2GB máximo
- **Índices:** Apenas 1 índice serverless
- **Projetos:** Apenas 1 projeto

## 🔍 Verificando Uso Atual

Para verificar quanto espaço está usando:

```bash
npx tsx diagnose-pinecone.ts
```

Veção "4️⃣ ESTATÍSTICAS DOS ÍNDICES" mostrará:

```
📊 carousel-styles
   Total de vetores: 150
   Namespaces: 3
   Dimensões: 1024
```

## ⚠️ Problemas Comuns

### "API key was rejected"

**Causas:**
- Chave incorreta ou incompleta
- Chave expirada
- Chave revogada

**Solução:**
1. Gere nova chave em https://app.pinecone.io
2. Copie **completamente** (sem cortar caracteres)
3. Cole no `.env.local`
4. Reinicie o servidor

### "Index not found"

**Causas:**
- Índice ainda não foi criado
- Índice em processo de criação

**Solução:**
1. Verifique em https://app.pinecone.io se índice existe
2. Se não existir, crie seguindo passos acima
3. Aguarde status "Ready" (1-2 min)

### "Quota exceeded"

**Causas:**
- Atingiu limite de 2GB
- Atingiu limite de vetores

**Solução:**
1. Delete vetores antigos:
   ```bash
   curl -X POST http://localhost:3018/api/pinecone/clear
   ```
2. Ou faça upgrade para plano pago

### "Timeout" ou "Network error"

**Causas:**
- Problema de conexão
- Firewall bloqueando
- Pinecone indisponível

**Solução:**
1. Verifique internet
2. Tente acessar https://app.pinecone.io no navegador
3. Verifique status em https://status.pinecone.io

## 📊 Para Que Serve o Pinecone?

No projeto Carrossel-IA, o Pinecone é usado para:

1. **Armazenar estilos visuais** como vetores (embeddings)
2. **Buscar estilos similares** por similaridade
3. **Aprender preferências** do usuário
4. **Recomendar estilos** baseados em histórico

### Como Funciona:

```
Usuário cria carrossel → Estilo é analisado
                       → Convertido em vetor (1024 dimensões)
                       → Salvo no Pinecone
                       
Próximo carrossel → Busca estilos similares no Pinecone
                  → Aplica preferências do usuário
```

## 🚀 Após Configurar

Com o Pinecone configurado, você poderá:

✅ Salvar estilos automaticamente  
✅ Buscar estilos similares  
✅ Aprender preferências do usuário  
✅ Reutilizar estilos aprovados  
✅ Gerar carrosséis com estilo consistente  

---

**Próximo passo:** Obter API key em https://app.pinecone.io
