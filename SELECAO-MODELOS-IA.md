# 🎯 SeleÇÃO DE MODELOS DE IA - NOVA FUNCIONALIDADE

## 📋 Resumo

O projeto agora permite **escolher qual modelo de IA** será usado para:
1. **Geração de TEXTO** - Diagramação, revisão, design textual e gerenciamento
2. **Geração de IMAGEM** - Criação das imagens dos slides

## 🎨 Interface no Layout

### Onde Encontrar
- Na página **Criação de Carrossel** (`CarouselCreation.tsx`)
- NO TOPO da barra lateral esquerda (acima do seletor de estilo visual)
- Seção expansível chamada **"Modelos de IA"** com ícone de CPU

### Como Usar
1. Clique na seção **"Modelos de IA"** para expandir
2. Escolha o modelo de **TEXTO** desejado
3. Escolha o modelo de **IMAGEM** desejado
4. As escolhas são **salvas automaticamente** no navegador

## 🤖 Modelos de TEXTO Disponíveis

| Modelo | Provider | Velocidade | Qualidade | Descrição |
|--------|----------|------------|-----------|-----------|
| **DeepSeek Chat** | DeepSeek | ⚡ Rápido | ⭐⭐⭐ Alta | Chinês potente, excelente para PT-BR |
| **Llama 3.3 70B (Groq)** | Groq | ⚡ Rápido | ⭐⭐⭐ Alta | Extremamente rápido, bom para geração rápida |
| **Qwen Plus** | Alibaba DashScope | 🕐 Médio | ⭐⭐⭐ Alta | Modelo Chinês da Alibaba |
| **Nemotron 3 Super 120B** | OpenRouter | 🕐 Médio | ⭐⭐⭐ Alta | NVIDIA de alta qualidade, grátis |
| **Gemma 4 31B** | OpenRouter | 🕐 Médio | ⭐⭐⭐ Alta | Modelo Google, bom para criativo |
| **Claude 3.5 Sonnet** | Anthropic | 🕐 Médio | ⭐⭐⭐ Alta | Alta qualidade, texto natural |
| **Gemini 2.0 Flash** | Google | ⚡ Rápido | ⭐⭐⭐ Alta | Rápido e versátil |
| **Llama 3.3 70B (Fireworks)** | Fireworks AI | 🕐 Médio | ⭐⭐⭐ Alta | Boa alternativa via Fireworks |
| **Llama 3.1 8B (SambaNova)** | SambaNova | ⚡ Rápido | ⭐⭐ Standard | Leve, bom para tarefas simples |
| **Llama 3.3 70B (AIML)** | AIMLAPI | 🕐 Médio | ⭐⭐⭐ Alta | Boa opção de backup |
| **Llama 3.3 70B Turbo** | Together AI | ⚡ Rápido | ⭐⭐⭐ Alta | Versão turbo, rápida |
| **Qwen 2.5 7B** | HuggingFace | 🕐 Médio | ⭐⭐ Standard | Leve via HuggingFace |
| **🔄 Rotação Automática** | Sistema | ⚡ Rápido | ⭐⭐⭐ Alta | **PADRÃO** - Sistema escolhe o melhor |

## 🖼️ Modelos de IMAGEM Disponíveis

| Modelo | Provider | Velocidade | Qualidade | Descrição |
|--------|----------|------------|-----------|-----------|
| **Imagen 3.0 Generate** | Google AI Studio | 🕐 Médio | ⭐⭐⭐ Ultra | **PADRÃO** - Alta qualidade Google |
| **FLUX-1 Schnell** | Cloudflare | ⚡ Rápido | ⭐⭐ Alta | Rápido e eficiente |
| **FLUX-1 Dev** | HuggingFace | 🕐 Médio | ⭐⭐ Alta | Mais detalhado |
| **Stable Diffusion XL** | Replicate | 🕐 Médio | ⭐⭐ Alta | Confiável |
| **Leonardo.AI** | Leonardo.AI | 🐢 Lento | ⭐⭐⭐ Ultra | Proprietário alta qualidade |
| **🔄 Fallback Automático** | Sistema | 🕐 Médio | ⭐⭐⭐ Ultra | **PADRÃO** - Tenta em sequência |

## 💡 Como Funciona

### Modos de Operação

#### 1. **Rotação Automática** (PADRÃO)
- O sistema escolhe automaticamente o **melhor provider disponível**
- Considera: quota, velocidade, sucesso recente
- Usa sistema de ranking inteligente
- **Recomendado para a maioria dos usuários**

#### 2. **Modelo Específico**
- Você força o uso de um modelo específico
- Útil para testar ou quando tem preferência
- Se o modelo falhar, o sistema usa fallback inteligente

### Persistência
- Suas escolhas são **salvas automaticamente** no `localStorage`
- Ao retornar, os mesmos modelos estarão selecionados
- Para trocar, basta selecionar novamente

## 🔧 Implementação Técnica

### Arquivos Criados/Modificados

#### ✨ Novos Arquivos
1. **`src/config/ai-models.ts`**
   - Definição de todos os modelos disponíveis
   - Interfaces TypeScript
   - Funções de load/save do localStorage

2. **`src/components/ModelSelector.tsx`**
   - Componente visual de seleção
   - Interface bonita com ícones de velocidade
   - Expansível/colapsável

3. **`src/services/model-context.ts`**
   - Contexto global singleton
   - Permite que skills acessem modelos selecionados
   - Atualização em tempo real

#### 📝 Arquivos Modificados
1. **`src/pages/CarouselCreation.tsx`**
   - Adicionado estado `selectedModels`
   - Integrado componente `ModelSelector`
   - Atualiza contexto global quando muda

2. **`server.ts`**
   - Endpoint `/api/ai/text-generation` aceita `preferredModel`
   - Endpoint `/api/ai/generate-image` aceita `preferredModel`
   - Filtra providers baseado na escolha do usuário

3. **`src/services/ai.ts`**
   - Funções `textGeneration()` e `generateAiImage()` aceitam `preferredModel`

4. **`src/skills/text-generation.ts`**
   - Função exportada atualizada para enviar `preferredModel`

5. **`src/skills/diagrammer.ts`**
   - Primeira skill atualizada a usar modelo selecionado
   - Usa `modelContext.getTextModel()` para obter escolha

### Fluxo de Dados

```
Usuário seleciona modelo
       ↓
ModelSelector component
       ↓
handleModelChange() no CarouselCreation
       ↓
modelContext.updateModels()
       ↓
Skills chamam modelContext.getTextModel()
       ↓
Servidor filtra providers compatíveis
       ↓
Executa com modelo escolhido
```

## 🎯 Próximos Passos (TODO)

### Texto ✅ (IMPLEMENTADO)
- [x] Seleção de modelo de texto
- [x] Integração com DiagrammerSkill
- [ ] Integrar com ReviewerSkill
- [ ] Integrar com DesignerSkill
- [ ] Integrar com ManagerSkill
- [ ] Integrar com RefinerSkill

### Imagem 🚧 (PARCIALMENTE IMPLEMENTADO)
- [x] Seleção de modelo de imagem
- [x] Log do modelo selecionado no servidor
- [ ] Implementar seleção direta de modelo de imagem
- [ ] Atualizar pipeline de geração de imagens

## 🐛 Troubleshooting

### "Modelo não está funcionando"
- Verifique se a chave de API está no `.env`
- Veja os logs do console para ver qual provider está sendo usado
- Tente o modo "Rotação Automática"

### "Não aparece a seção de Modelos"
- Verifique se está na página de Criação de Carrossel
- Clique no cabeçalho "Modelos de IA" para expandir
- Verifique o console do navegador por erros

### "Build falhou"
- Execute `npm install` para garantir dependências atualizadas
- Verifique se todos os arquivos TypeScript foram salvos
- Veja erros específicos no terminal

## 📊 Benefícios

1. **Controle Total** - Você decide qual IA usar
2. **Flexibilidade** - Teste diferentes modelos
3. **Economia** - Escolha modelos grátis se quota acabou
4. **Qualidade** - Use o melhor modelo para cada tarefa
5. **Transparência** - Veja quais modelos estão disponíveis

## 🔐 Notas de Segurança

- Chaves de API **NUNCA** são expostas ao frontend
- Seleção é apenas uma preferência enviada ao backend
- Server valida se modelo é válido antes de usar
- Fallback automático se modelo escolhido falhar

---

**Criado em:** 10 de Abril de 2026  
**Versão:** 1.0.0  
**Status:** ✅ Funcional (Texto completo, Imagem parcial)
