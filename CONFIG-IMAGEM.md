# 🔧 Configuração de Geradores de Imagem

## Problema

O sistema retornou erro 500 na geração de imagens porque **nenhum provedor está configurado**.

## Soluções Disponíveis

### 🥇 Opção 1: Google AI Studio (RECOMENDADO - GRÁTIS)
**Custo**: Grátis (50 imagens/mês)
**Qualidade**: Alta (Gemini/Nano Banana)

1. Acesse https://aistudio.google.com/app/apikey
2. Crie uma chave API
3. Adicione ao `.env`:
```
GOOGLE_API_KEY=sua_chave_aqui
```

---

### 🥈 Opção 2: Cloudflare Workers AI (GRÁTIS)
**Custo**: Grátis (10-20 imagens/dia)
**Qualidade**: Boa (Stable Diffusion XL)

1. Crie conta em https://dash.cloudflare.com
2. Vá em "Workers & Pages" > "Overview" > "Account ID" (copie)
3. Crie um API Token em "My Profile" > "API Tokens" > "Create Token" > "Edit Cloudflare Workers"
4. Adicione ao `.env`:
```
CLOUDFLARE_ACCOUNT_ID=seu_account_id
CLOUDFLARE_API_TOKEN=seu_token
```

---

### 🥉 Opção 3: HuggingFace (GRÁTIS)
**Custo**: Grátis (com limitações)
**Qualidade**: Boa (SDXL)

1. Crie conta em https://huggingface.co
2. Vá em https://huggingface.co/settings/tokens
3. Crie um token (tipo "Read")
4. Adicione ao `.env`:
```
HF_API_KEY=hf_seu_token
```

---

### 🏅 Opção 4: AI Horde (GRÁTIS, SEM CONFIG)
**Custo**: Grátis, sem chave
**Qualidade**: Variável (comunitário)
**Status**: ✅ Já configurado, mas pode ser instável

Este é o fallback automático. Não precisa configurar nada, mas pode falhar às vezes.

---

### 💎 Opção 5: Replicate (PAGO)
**Custo**: ~$0.001-0.01/imagem
**Qualidade**: Excelente (SDXL)

1. Crie conta em https://replicate.com
2. Adicione saldo mínimo ($5)
3. Copie API token em https://replicate.com/account/api-tokens
4. Adicione ao `.env`:
```
REPLICATE_API_KEY=r8_seu_token
```

---

## Arquivo `.env` Completo

```env
# APIs de Texto
OPENROUTER_API_KEY=sk-or-v1-...

# APIs de Imagem (escolha pelo menos 1)
GOOGLE_API_KEY=AIza...
CLOUDFLARE_ACCOUNT_ID=...
CLOUDFLARE_API_TOKEN=...
HF_API_KEY=hf_...
REPLICATE_API_KEY=r8_...

# Outras APIs
PINECONE_API_KEY=pcsk_...
```

---

## Como Testar

Após configurar:

1. Reinicie o servidor: `Ctrl+C` e `npm run dev`
2. Gere um carrossel
3. Clique em "Aprovar"
4. As imagens devem gerar automaticamente!

---

## Status Ativo

No seu console do navegador, você verá:
```
[IMAGE] Trying Google AI Studio...
[IMAGE] Google AI Studio success!
```

Ou:
```
[IMAGE] Trying Cloudflare...
[IMAGE] Cloudflare success!
```

---

## Recomendação

Para uso pessoal, **Google AI Studio** é o melhor:
- ✅ 50 imagens/mês grátis
- ✅ Alta qualidade
- ✅ Fácil configuração (só 1 chave)
- ✅ Rápido e confiável

Alternativamente, **Cloudflare** oferece mais imagens gratuitas por dia.
