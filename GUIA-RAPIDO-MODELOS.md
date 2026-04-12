# 🚀 GUIA RÁPIDO - Seleção de Modelos de IA

## Como Usar (Passo a Passo)

### 1️⃣ Abra o Aplicativo
```bash
npm run dev
```
Acesse: `http://localhost:5173`

### 2️⃣ Vá para "Criação de Carrossel"
- Clique no menu lateral esquerdo
- Selecione **"Criação de Carrossel"**

### 3️⃣ Escolha os Modelos de IA
- No topo da barra lateral esquerda, você verá **"🔧 Modelos de IA"**
- Clique para expandir
- Você verá duas seções:

#### 📝 Modelo de TEXTO (Geração de Conteúdo)
Escolha entre:
- **🔄 Rotação Automática** (RECOMENDADO) - Sistema escolhe o melhor
- **Grok 2 (xAI)** - Modelo da xAI (Elon Musk), excelente raciocínio 🆕
- **DeepSeek Chat** - Chinês potente, rápido
- **Llama 3.3 70B (Groq)** - Extremamente rápido
- **Claude 3.5 Sonnet** - Alta qualidade de texto
- **Gemini 2.0 Flash** - Rápido e versátil
- E mais 9 outros modelos...

#### 🖼️ Modelo de IMAGEM (Geração de Slides)
Escolha entre:
- **🔄 Fallback Automático** (RECOMENDADO) - Tenta em sequência
- **🍌 Nano Banana (Gemini 2.5 Flash Image)** - Google, grátis 50 imgs/mês 🆕
- **FLUX-1 Schnell** - Rápido
- **FLUX-1 Dev** - Mais detalhado
- **Stable Diffusion XL** - Confiável
- **Leonardo.AI** - Alta qualidade

### 4️⃣ Crie Seu Carrossel
1. Selecione o **estilo visual**
2. Digite ou cole seu **conteúdo**
3. Clique em **"GERAR CARROSSEL"**
4. Aguarde o pipeline de IA trabalhar ✨

### 5️⃣ Dicas Importantes

✅ **Suas escolhas são salvas automaticamente**
- Não precisa selecionar toda vez
- Ao voltar ao app, seus modelos estarão lá

⚡ **Velocidade dos Modelos**
- ⚡ Verde = Rápido (1-3 segundos)
- 🕐 Amarelo = Médio (3-8 segundos)
- 🐢 Vermelho = Lento (8-15 segundos)

💡 **Quando Usar Cada Modo**

| Situação | Texto | Imagem |
|----------|-------|--------|
| Uso normal | 🔄 Auto | 🔄 Auto |
| Quer qualidade máxima | Claude 3.5 Sonnet | Imagen 3.0 |
| Com pressa | Groq ou DeepSeek | FLUX Schnell |
| API principal caiu | Qualquer outro | Qualquer outro |
| Testando diferentes | Vários modelos | Vários modelos |

### 6️⃣ Solução de Problemas

**❌ "API falhou"**
- Tente o modo "Rotação Automática"
- Verifique se a chave `.env` está configurada
- Aguarde 1 minuto e tente novamente (rate limit)

**❌ "Não aparece a seção de Modelos"**
- Certifique-se que está na página "Criação de Carrossel"
- Clique no cabeçalho "Modelos de IA" para expandir
- Recarregue a página (Ctrl+R)

**❌ "Modelo escolhido não funciona"**
- O sistema automaticamente faz fallback
- Verifique os logs no console do navegador
- Tente outro modelo ou use Auto

## 📊 Visual do Seletor

```
┌──────────────────────────────────────┐
│ 🔧 Modelos de IA              [▼]   │
│    [DeepSeek Chat] [Imagen 3.0]     │
└──────────────────────────────────────┘

Clicando para expandir:

┌──────────────────────────────────────┐
│ 🔧 Modelos de IA              [▲]   │
├──────────────────────────────────────┤
│ 📝 Modelo de TEXTO                   │
│                                      │
│ ✅ DeepSeek Chat          ⚡         │
│    Chinês potente, excelente...      │
│                                      │
│ ⭕ Llama 3.3 70B (Groq)   ⚡         │
│    Extremamente rápido...            │
│                                      │
│ ⭕ Claude 3.5 Sonnet       🕐        │
│    Alta qualidade, texto...          │
│                                      │
│ ... mais 10 modelos ...              │
│                                      │
│ 🖼️ Modelo de IMAGEM                  │
│                                      │
│ ✅ Imagen 3.0 Generate    🕐        │
│    Google, alta qualidade...         │
│                                      │
│ ⭕ FLUX-1 Schnell         ⚡         │
│    Rápido e eficiente...             │
│                                      │
│ ... mais 4 modelos ...               │
│                                      │
│ 💡 Dica: O modo "Rotação Auto..."   │
└──────────────────────────────────────┘
```

## 🎯 Exemplo de Uso

### Cenário 1: Uso Normal
```
Modelo de Texto: 🔄 Rotação Automática
Modelo de Imagem: 🔄 Fallback Automático
```
→ Deixa o sistema decidir o melhor provider

### Cenário 2: Preciso de Qualidade Máxima
```
Modelo de Texto: Claude 3.5 Sonnet
Modelo de Imagem: Imagen 3.0 Generate
```
→ Melhor qualidade possível, mas mais lento

### Cenário 3: Estou com Pressa
```
Modelo de Texto: Llama 3.3 70B (Groq)
Modelo de Imagem: FLUX-1 Schnell
```
→ Geração mais rápida

### Cenário 4: API Principal Caiu
```
Modelo de Texto: DeepSeek Chat (ou outro)
Modelo de Imagem: FLUX-1 Dev (ou outro)
```
→ Usa providers alternativos

---

## 🎓 Quer Saber Mais?

Veja o arquivo completo: **`SELECAO-MODELOS-IA.md`**

Lá tem:
- Lista completa de todos os modelos
- Detalhes técnicos de implementação
- Troubleshooting avançado
- Notas de segurança

---

**Divirta-se criando carrosseis incríveis! 🎨✨**
