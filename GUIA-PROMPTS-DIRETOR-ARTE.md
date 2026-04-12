# 📐 GUIA DE PROMPTS - NÍVEL DIRETOR DE ARTE SÊNIOR

> **Modelos complexos e completos para criação e aprendizado de designs de capas**

---

## 🎯 VISÃO GERAL

Este guia contém **11 templates de prompts** divididos em duas categorias:

1. **CRIAÇÃO DE CAPAS** (6 templates) - Para gerar designs do zero
2. **APRENDIZADO E ANÁLISE** (5 templates) - Para analisar, compreender e aprender com designs existentes

Todos os templates seguem o **modelo de Diretor de Arte Sênior**, com:
- Hierarquia visual detalhada (6-10 níveis de composição)
- Especificações de textura, material e acabamento
- Instruções tipográficas precisas (família, peso, tamanho relativo)
- Paleta de cores com hex codes específicos
- Elementos visuais com posicionamento exato
- Parâmetros técnicos de geração (`--ar 9:16 --v 6.0 --style raw`)
- Contexto emocional e psicológico do design
- Notas de execução para o diretor de arte

---

## 📁 ARQUITETURA DE ARQUIVOS

```
src/config/
├── prompt-templates-capas.ts         # Templates de criação de capas
├── prompt-templates-aprendizado.ts   # Templates de análise e aprendizado
└── optimized-prompts.ts              # Prompts existentes do sistema (integração)
```

---

## 🎨 TEMPLATES DE CRIAÇÃO DE CAPAS

### 1. 🚨 ALERTA URGENTE

**Arquivo:** `src/config/prompt-templates-capas.ts`  
**Export:** `templateCapaAlertaUrgente`  
**Quando usar:** Golpes, alertas de segurança, prazos finais, urgências

**Estrutura (6 níveis):**
1. Fundo e Marca D'Água
2. Elemento Topo (Placa de Alerta)
3. Bloco de Texto Central (Tarjas)
4. Ilustração Central (Elemento Visual Principal)
5. Ícones de Apoio
6. Rodapé (Assinatura da Marca)

**Exemplo de uso:**
```typescript
import { preencherTemplateCapa } from '@/config/prompt-templates-capas';

const prompt = preencherTemplateCapa('alertaUrgente', {
  COR_FUNDO_PRIMARIA: 'branco puro #FFFFFF',
  PADRAO_TEXTO_FUNDO: 'motherboard traces',
  COR_TEXTO_FUNDO: 'marrom-avermelhada clara #A0522D',
  TEXTO_MARCA_AGUA: 'SIMPL',
  COR_MARCA_AGUA: 'cinza',
  COR_PLACA_ALERTA: 'amarela',
  // ... mais variáveis
});
```

**Variáveis principais:**
- `COR_FUNDO_PRIMARIA`, `PADRAO_TEXTO_FUNDO`, `COR_TEXTO_FUNDO`
- `TEXTO_MARCA_AGUA`, `COR_MARCA_AGUA`
- `COR_PLACA_ALERTA`, `ESTILO_PLACA`, `TEXTURA_PLACA`
- `TEXTO_PLACA_ALERTA`, `FONTE_PLACA`, `COR_TEXTO_PLACA`
- `NUMERO_TARJAS`, `COR_TARJAS`, `LINHAS_TARJA`
- `DESCRICAO_ILUSTRACAO_CENTRAL`
- `DESCRICAO_ICONES_APOIO`
- `DESCRICAO_RODAPE`, `NOME_MARCA`
- `ESTILO_GERAL`

---

### 2. 💡 EDUCATIVO/ESTRATÉGICO

**Arquivo:** `src/config/prompt-templates-capas.ts`  
**Export:** `templateCapaEducativo`  
**Quando usar:** Como fazer, guias, estratégias, oportunidades

**Estrutura (7 níveis):**
1. Fundo e Ambiente
2. Cabeçalho (Selo de Autoridade)
3. Título Principal (Gancho Visual)
4. Subtítulo Contextual
5. Ilustração/Ícones de Suporte
6. Indicador de Conteúdo (Slide Counter)
7. Rodapé (Assinatura da Marca)

**Estilos suportados:**
- Modern Corporate Memphis com elementos 3D sutis
- Minimalista editorial (Exame/Forbes)
- Tech startup vibe (Dribbble/Behance)

---

### 3. 📢 COMUNICADO INSTITUCIONAL

**Arquivo:** `src/config/prompt-templates-capas.ts`  
**Export:** `templateCapaComunicado`  
**Quando usar:** Novidades, atualizações, mudanças legislativas, comunicados oficiais

**Estrutura (8 níveis):**
1. Fundo e Base
2. Cabeçalho Institucional
3. Selo/Ícone de Destaque
4. Título do Comunicado
5. Subtítulo ou Ementa
6. Elemento Visual de Apoio
7. Indicador de Ação
8. Rodapé (Assinatura Institucional)

**Estilos suportados:**
- Institucional brasileiro moderno
- editorial premium (Harvard Business Review)
- clean corporate design

---

### 4. ✅ LISTA/CHECKLIST

**Arquivo:** `src/config/prompt-templates-capas.ts`  
**Export:** `templateCapaLista`  
**Quando usar:** Top erros, dicas, passos, rankings

**Estrutura (7 níveis):**
1. Fundo e Canvas
2. Badge Numérico (Quantificador)
3. Título da Lista
4. Preview dos Itens (Antena de Conteúdo)
5. Ícones Temáticos
6. CTA/Indicador de Scroll
7. Rodapé (Branding)

**Regra de ouro:** Listas devem ser ESCANEÁVEIS em 2 segundos

---

### 5. ⚖️ COMPARAÇÃO

**Arquivo:** `src/config/prompt-templates-capas.ts`  
**Export:** `templateCapaComparacao`  
**Quando usar:** Antes vs Depois, Errado vs Certo, A vs B

**Estrutura (9 níveis):**
1. Fundo e Divisão
2. Título da Comparação
3. Rótulos dos Lados
4. Elemento Visual Lado A (Negativo)
5. Elemento Visual Lado B (Positivo)
6. Versus/Conector Central
7. Texto de Apoio
8. CTA/Indicador de Continuidade
9. Rodapé (Branding)

**Regra de ouro:** Comparação deve ser INSTANTANEAMENTE compreensível (< 2 segundos)

---

### 6. 👥 BASTIDORES/HUMANO

**Arquivo:** `src/config/prompt-templates-capas.ts`  
**Export:** `templateCapaHumano`  
**Quando usar:** Equipe, processo, storytelling, bastidores

**Estrutura (8 níveis):**
1. Fundo e Atmosfera
2. Título Emocional (Hook Humano)
3. Subtítulo Contextual
4. Elemento Humano Focal
5. Elemento de Contexto (Cenário/Objetos)
6. Selo/Elemento de Credibilidade
7. Indicador de Conteúdo
8. Rodapé (Branding Humano)

**Estilos suportados:**
- Fotografia humanizada estilo startup
- Storytelling documentário corporativo
- Ilustração corporate Memphis

---

## 🧠 TEMPLATES DE APRENDIZADO E ANÁLISE

### 7. 🔬 ANÁLISE DE DNA VISUAL

**Arquivo:** `src/config/prompt-templates-aprendizado.ts`  
**Export:** `templateAnaliseDNAVisual`  
**Quando usar:** Analisar um design existente e extrair seu DNA visual

**O que retorna (10 seções):**
1. Identificação Geral
2. Paleta de Cores (com hex, %, função, psicologia)
3. Tipografia (família, pesos, hierarquia, legibilidade)
4. Composição e Layout (grid, regra dos terços, fluxo de leitura)
5. Elementos Visuais (ícones, formas, imagens, texturas, efeitos)
6. Hierarquia Visual (níveis 1-4 com % de atenção)
7. Psicologia e Mensagem (emoções, gatilhos, viéses)
8. Avaliação Crítica (pontos fortes/fracos, notas, melhorias)
9. Padrões e Tendências
10. DNA Estilo Resumo (em uma frase + palavras-chave)

**Formato:** JSON estruturado

---

### 8. 📋 EXTRAÇÃO DE STYLE GUIDE

**Arquivo:** `src/config/prompt-templates-aprendizado.ts`  
**Export:** `templateExtrairStyleGuide`  
**Quando usar:** Extrair um guia de estilo replicável de um design existente

**O que retorna:**
- Nome do Estilo
- Descrição Geral
- Cores (primária, secundária, acento, neutras com hex e regras)
- Tipografia (família, hierarquia completa com tamanhos)
- Elementos Visuais (ícones, formas, sombras, bordas, gradientes)
- Composição (grid, espaçamento, alinhamento)
- Padrões Recorrentes
- DOs e DONTs
- Contextos de Uso
- Exemplo de Replicação

**Formato:** JSON estruturado

---

### 9. 📊 ANÁLISE COMPARATIVA

**Arquivo:** `src/config/prompt-templates-aprendizado.ts`  
**Export:** `templateAnaliseComparativa`  
**Quando usar:** Comparar múltiplos designs entre si

**O que retorna:**
- Resumo Executivo
- Análise Individual de cada Design
- Comparação Direta (cores, tipografia, composição, elementos visuais)
- Rankings de Impacto, Legibilidade, Coerência
- Padrões Transversais
- Recomendações de Convergência
- Ranking Final

**Formato:** JSON estruturado

---

### 10. 🤖 APRENDIZADO DE ESTILO PARA IA

**Arquivo:** `src/config/prompt-templates-aprendizado.ts`  
**Export:** `templateAprendizadoEstiloIA`  
**Quando usar:** Criar manual técnico para treinar/instruir IA a gerar designs consistentes

**O que retorna:**
- Metadados do Estilo
- Canvas (dimensões, background, margens)
- Sistema de Cores (com RGB, HSL, combinações permitidas/proibidas)
- Sistema Tipográfico (escala completa com tamanhos em px)
- Biblioteca de Elementos (ícones, botões, badges, containers)
- Regras de Composição (grid, escala de espaçamento)
- Parâmetros de Geração para IA
- Exemplos de Prompt
- Validação (checklist, erros comuns, testes)

**Formato:** JSON estruturado otimizado para consumo por IA

---

### 11. 🔄 APRENDIZADO ITERATIVO (REFINAMENTO)

**Arquivo:** `src/config/prompt-templates-aprendizado.ts`  
**Export:** `templateAprendizadoIterativo`  
**Quando usar:** Analisar gap entre design atual e desejado, gerar instruções de refinamento

**O que retorna:**
- Estado Atual (descrição, pontos fortes/fracos, nota)
- Estado Desejado (descrição, referência, características)
- Gap Analysis (cores, tipografia, composição, elementos, hierarquia)
- Plano de Refinamento (prioridade alta/média/baixa)
- Prompt de Refinamento (completo e autocontidente)
- Critérios de Sucesso

**Formato:** JSON estruturado

---

## 🚀 COMO USAR

### Criando uma Capa

```typescript
import { preencherTemplateCapa, TemplateCapaKey } from '@/config/prompt-templates-capas';

// 1. Escolha o template
const template: TemplateCapaKey = 'alertaUrgente';

// 2. Preencha as variáveis
const variaveis = {
  COR_FUNDO_PRIMARIA: 'branco puro #FFFFFF',
  PADRAO_TEXTO_FUNDO: 'motherboard traces',
  COR_TEXTO_FUNDO: 'marrom-avermelhada clara #A0522D',
  TEXTO_MARCA_AGUA: 'SIMPL',
  COR_MARCA_AGUA: 'cinza',
  COR_PLACA_ALERTA: 'amarela',
  ESTILO_PLACA: 'uma placa de trânsito antiga e desgastada',
  TEXTURA_PLACA: 'metálica com sinais de ferrugem pesada nas bordas',
  TEXTO_PLACA_ALERTA: 'ALERTA MAXIMO',
  FONTE_PLACA: 'Sans-Serif Bold como Impact',
  COR_TEXTO_PLACA: 'preta sólida #000000',
  NUMERO_TARJAS: 'Quatro',
  COR_TARJAS: 'Amarelo-Ocre #D49A00',
  ALINHAMENTO_TARJAS: 'à esquerda',
  COR_TEXTO_TARJAS: 'branco puro #FFFFFF',
  FONTE_TARJAS: 'Roboto Heavy',
  LINHAS_TARJA: `Linha 1: 'Novo golpe envia boleto'
Linha 2: 'DAS FALSO' (FALSO é massiva)
Linha 3: 'com os DADOS REAIS' (DADOS REAIS em negrito extra)
Linha 4: 'da SUA EMPRESA' (SUA EMPRESA colossal)`,
  DESCRICAO_ILUSTRACAO_CENTRAL: `Abaixo do texto, pendendo da placa de alerta por uma linha metálica vertical preta, está um anzol de pesca enferrujado fisgando uma folha de papel branca (boleto) que sai de dentro de um envelope aberto`,
  DESCRICAO_ICONES_APOIO: `Vários triângulos vermelhos de Alerta com pontos de exclamação brancos flutuando de forma translúcida`,
  POSICAO_RODAPE: 'No canto inferior esquerdo',
  DESCRICAO_RODAPE: 'uma pílula preta sólida com bordas arredondadas contendo logo e nome da marca',
  NOME_MARCA: 'Alfa Contabilidade',
  ESTILO_GERAL: 'Mistura de fotografia macro com Flat Design e Gráficos Vetoriais. Nitidez extrema, 8k'
};

// 3. Gere o prompt
const prompt = preencherTemplateCapa(template, variaveis);

console.log(prompt);
```

### Analisando um Design

```typescript
import { preencherTemplateAprendizado } from '@/config/prompt-templates-aprendizado';

// 1. Escolha o template
const template = 'analiseDNAVisual';

// 2. Use o template (adicionando contexto da imagem)
const prompt = preencherTemplateAprendizado(template, {
  // O template já é completo, não precisa de variáveis obrigatórias
  // Você pode adicionar contexto específico se necessário
});

// 3. Envie para a IA junto com a imagem
// "Analise esta imagem usando o seguinte framework de análise:\n\n" + prompt
```

### Extraindo Style Guide

```typescript
import { preencherTemplateAprendizado } from '@/config/prompt-templates-aprendizado';

const prompt = preencherTemplateAprendizado('extrairStyleGuide', {});

// Envie para a IA com a imagem de referência
```

---

## 📋 CHECKLIST DE QUALIDADE DO PROMPT

Antes de enviar para a IA, verifique:

- [ ] Todas as variáveis `{{CHAVE}}` foram preenchidas?
- [ ] Cores têm hex codes específicos?
- [ ] Fontes têm família, peso e tamanho definidos?
- [ ] Posicionamentos estão claros (topo, centro, inferior)?
- [ ] Hierarquia visual está explícita?
- [ ] Elementos decorativos têm % de atenção definida?
- [ ] Proporção e parâmetros estão incluídos (`--ar 9:16 --v 6.0`)?
- [ ] Notas de execução foram mantidas?
- [ ] Texto em PT-BR para geração de imagens?
- [ ] Contexto emocional/psicológico está presente?

---

## 🎯 FLUXO DE TRABALHO RECOMENDADO

### Para Criar Capas do Zero

```
1. Escolha o template de criação adequado
   ↓
2. Preencha todas as variáveis com valores específicos
   ↓
3. Revise com o checklist de qualidade
   ↓
4. Envie para IA de geração de imagens
   ↓
5. Avalie o resultado
   ↓
6. Se necessário, use template de refinamento iterativo
```

### Para Aprender com Designs Existentes

```
1. Colete designs de referência
   ↓
2. Use template de Análise de DNA Visual
   ↓
3. Extraia Style Guide com template específico
   ↓
4. (Opcional) Compare múltiplos designs
   ↓
5. Gere manual de estilo para IA
   ↓
6. Use o estilo aprendido para criar novos designs
```

---

## 🔗 INTEGRAÇÃO COM SISTEMA EXISTENTE

Os templates podem ser integrados com o sistema de `prompt-expansion.ts` existente:

```typescript
import { expandPrompt } from '@/services/prompt-expansion';
import { preencherTemplateCapa } from '@/config/prompt-templates-capas';

// 1. Gere prompt base do template
const promptBase = preencherTemplateCapa('alertaUrgente', variaveis);

// 2. Expanda com Style DNA existente
const promptExpandido = expandPrompt(
  promptBase,
  styleDNA,
  slideTitle,
  slideText,
  slideType,
  slideNumber
);

// 3. Envie para IA
```

---

## 📚 REFERÊNCIAS

- **Prompts originais de referência:** Modelos fornecidos pelo usuário com nível de complexidade de Diretor de Arte Sênior
- **Parâmetros Midjourney:** `--ar 9:16 --v 6.0 --style raw --q 2`
- **WCAG AA Contrast:** Mínimo 4.5:1 para texto normal, 3:1 para texto grande
- **Proporção Instagram:** 720x960px (3:4) ou 1080x1920px (9:16)

---

## 📝 NOTAS DE VERSÃO

### v1.0 - Abril 2026

- ✅ 6 templates de criação de capas
- ✅ 5 templates de aprendizado e análise
- ✅ Funções utilitárias para preenchimento de variáveis
- ✅ Guia de referência rápida (este arquivo)

### Próximas Versões

- [ ] Templates para Stories e Reels
- [ ] Templates para banners web
- [ ] Integração automática com prompt-expansion.ts
- [ ] Validação automática de qualidade
- [ ] Biblioteca de exemplos preenchidos

---

## 💡 DICAS DE OURO

1. **Seja específico:** "vermelho vivo #DC2626" > "cor forte"
2. **Dê porcentagens:** "ocupa 35% do canvas" > "é grande"
3. **Defina hierarquia:** "elemento mais importante" > "tem vários elementos"
4. **Inclua contexto emocional:** "transmite urgência e alerta" > "é um alerta"
5. **Especifique parâmetros técnicos:** `--ar 9:16 --v 6.0 --style raw`
6. **Mantenha notas de execução:** São o "know-how" do diretor de arte
7. **Teste em escala de cinza:** Garanta que contraste funciona sem cor
8. **Pense em 3 escalas:** Full screen, grid do feed, thumbnail pequena

---

**Criado por:** Carrossel IA Pro  
**Última atualização:** Abril 2026  
**Licença:** Uso interno do projeto
