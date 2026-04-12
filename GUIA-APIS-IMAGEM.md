# 📋 Guia Completo: Como Obter APIs de Geração de Imagens

## ✅ JÁ CONFIGURADAS:

| Serviço | Status | Chave |
|---------|--------|-------|
| **Cloudflare Workers AI** | ✅ Configurado | Token + Account ID |
| **HuggingFace** | ✅ Configurado | hf_rkxo... |
| **ModelsLab** | ✅ Configurado | VYgiftx9Y... |
| **AI Horde** | ✅ Automático | Sem chave necessária |

---

## 🔧 FALTAM CONFIGURAR:

### 1️⃣ **Leonardo.AI** - $150 créditos/mês grátis

**Passo a passo:**
1. Acesse: https://leonardo.ai
2. Clique em **"Sign Up"** (use Google ou email)
3. Após login, vá em: https://app.leonardo.ai/api-keys
4. Clique em **"Create API Key"**
5. Dê um nome (ex: "Carrossel IA")
6. Copie a chave (começa com `leo_...` ou `pk_...`)
7. Cole no `.env.local`:
```
LEONARDO_API_KEY=sua_chave_aqui
```

**Limite grátis:** $150 tokens renovados mensalmente (~3.000-5.000 imagens)

---

### 2️⃣ **Playground AI** - 500 imagens/dia grátis

**Atenção:** Playground AI **NÃO tem API pública gratuita** para desenvolvedores.

**Alternativas:**
- **Use via interface web:** https://playgroundai.com
- **Use o exportador de prompts:** Acesse `/export-images` e copie os prompts
- **Cole manualmente** no site do Playground AI

**Se quiser API paga:**
1. Acesse: https://playgroundai.com
2. Faça upgrade para plano pago
3. Obtenha API key no painel

---

### 3️⃣ **Bing Image Creator (DALL-E 3)** - 15 boost/dia

**Atenção:** Microsoft **NÃO oferece API pública gratuita** para o Bing Image Creator.

**Alternativas:**
- **Use via web:** https://www.bing.com/images/create
- **Use conta Microsoft gratuita** (Outlook/Hotmail)
- **Copie prompts** do exportador e cole no Bing
- **15 boosts/dia** = ~15 imagens rápidas, depois demora mais

**Se quiser API DALL-E paga:**
1. Acesse: https://platform.openai.com
2. Crie conta e adicione créditos ($5 mínimo)
3. Obtenha API key em: https://platform.openai.com/api-keys
4. Configure no sistema (requer código adicional)

---

### 4️⃣ **Ideogram** - 100 imagens/dia grátis

**Passo a passo:**
1. Acesse: https://ideogram.ai
2. Clique em **"Sign Up"** (Google ou email)
3. Vá em: https://ideogram.ai/settings/api
4. Clique em **"Generate API Key"**
5. Copie a chave
6. Adicione ao sistema (requer implementação adicional)

**Limite grátis:** ~100 imagens/dia (renova diariamente)
**Nota:** Ideogram tem API em beta - verifique disponibilidade atual

---

## 🎯 RECOMENDAÇÃO DE USO:

### Para uso AUTOMÁTICO (já configurado):
```
1. Cloudflare Workers AI (10-20 imgs/dia) ← PRIMEIRO
2. HuggingFace SDXL (generoso) ← SEGUNDO
3. ModelsLab (20 créditos totais) ← TERCEIRO
4. AI Horde (comunitário, ilimitado) ← QUARTO
```

### Para uso MANUAL (via /export-images):
```
1. Bing Image Creator (15/dia, melhor qualidade)
2. Ideogram (100/dia, ótimo para texto)
3. Playground AI (500/dia, versátil)
4. Leonardo.AI (5.000/mês, profissional)
```

---

## 📊 Comparação Rápida:

| Serviço | API? | Grátis? | Qualidade | Melhor Para |
|---------|------|---------|-----------|-------------|
| **Cloudflare** | ✅ | 10-20/dia | ⭐⭐⭐⭐⭐ | Uso automático |
| **HuggingFace** | ✅ | Generoso | ⭐⭐⭐⭐⭐ | Uso automático |
| **ModelsLab** | ✅ | 20 total | ⭐⭐⭐⭐ | Backup |
| **AI Horde** | ✅ | Ilimitado | ⭐⭐⭐ | Emergência |
| **Leonardo.AI** | ✅ | $150/mês | ⭐⭐⭐⭐⭐ | Profissional |
| **Bing/DALL-E 3** | ❌ | 15/dia | ⭐⭐⭐⭐⭐ | Texto em imagens |
| **Ideogram** | ⚠️ | 100/dia | ⭐⭐⭐⭐⭐ | Texto em imagens |
| **Playground AI** | ❌ | 500/dia | ⭐⭐⭐⭐ | Variedade |

---

## 🚀 Próximos Passos:

1. **Para agora:** Use os 4 geradores automáticos já configurados
2. **Obtenha Leonardo.AI:** Melhor custo-benefício grátis ($150/mês)
3. **Use exportador:** `/export-images` para gerar manualmente
4. **Monitore uso:** Veja console para saber qual gerador está sendo usado

---

**Dica:** Com Cloudflare + HuggingFace + ModelsLab + AI Horde, você já tem **geração automática ilimitada** sem precisar de mais nada! 🎉
