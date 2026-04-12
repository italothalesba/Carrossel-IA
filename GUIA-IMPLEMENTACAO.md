# 🎯 Guia de Implementação - Carrossel IA Pro

**Baseado nas Diretrizes de Padronização da Alfa Contabilidade**

---

## 📋 **Checklist de Implementação**

### ✅ **1. Configuração de Design (design-config.ts)**

**Status:** ✅ CRIADO

**Localização:** `src/config/design-config.ts`

**Contém:**
- ✅ Configurações do logo (posição, tamanho, visibilidade)
- ✅ Rodapé fixo com texto exato
- ✅ Paleta de cores completa (primária, secundária, alerta)
- ✅ 3 Moods de design (alerta, estratégico, comunicado)
- ✅ Biblioteca de ícones
- ✅ Configurações de tipografia
- ✅ Estrutura de slides (cover, content, cta)

---

### ✅ **2. Prompts Otimizados (optimized-prompts.ts)**

**Status:** ✅ CRIADO

**Localização:** `src/config/optimized-prompts.ts`

**Funções:**

#### `createDiagrammerPrompt()`
- ✅ Gera prompts para conteúdo RICO em PT-BR
- ✅ Estrutura profissional de 4 slides
- ✅ 3 Moods configuráveis
- ✅ Regras de ouro para cada tipo de slide
- ✅ Exemplos concretos incluídos

#### `createImagePrompt()`
- ✅ Gera prompts para geração de imagens
- ✅ **Texto em PT-BR explícito**
- ✅ **Logo obrigatório em todas as imagens**
- ✅ **Rodapé fixo com URL**
- ✅ Configuração específica por tipo de slide
- ✅ Instruções detalhadas de layout

#### `createReviewerPrompt()`
- ✅ Gera prompts para revisão de texto
- ✅ Foco em PT-BR e terminologia contábil
- ✅ Mantém estrutura de 4 slides

---

### ✅ **3. Diagrammer Atualizado (diagrammer.ts)**

**Status:** ✅ ATUALIZADO

**Mudanças:**
- ✅ Importa `createDiagrammerPrompt` de optimized-prompts
- ✅ Usa mood configurável (default: 'estrategico')
- ✅ maxTokens aumentado para 4096 (permite conteúdo mais rico)
- ✅ Mantém parsing robusto de JSON (com reparo de truncados)

---

### ✅ **4. Geração de Imagens Atualizada (ai.ts)**

**Status:** ✅ ATUALIZADO

**Mudanças na função `generateSlideImage()`:**
- ✅ Importa `createImagePrompt` de optimized-prompts
- ✅ Aceita parâmetros `slideTitle` e `slideText`
- ✅ Gera prompts com texto PT-BR explícito
- ✅ Inclui instruções para logo e footer
- ✅ Fallback para Style DNA quando disponível

---

### ⏳ **5. Integração com StyleManagement**

**Status:** 🔄 EM PROGRESSO

**Próximos Passos:**

1. **Adicionar campos no formulário de estilo:**
   ```typescript
   interface StyleData {
     // ... existing fields ...
     logoUrl?: string;           // URL do logo
     logoPosition?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
     logoSize?: 'small' | 'medium' | 'large';
     backgroundType?: 'solid' | 'gradient' | 'texture';
     footerText?: string;        // Texto do rodapé personalizado
   }
   ```

2. **Adicionar upload de logo:**
   ```tsx
   <input 
     type="file" 
     accept="image/png" 
     onChange={handleLogoUpload}
   />
   ```

3. **Converter logo para base64:**
   ```typescript
   const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
     const file = e.target.files?.[0];
     if (file) {
       const reader = new FileReader();
       reader.onload = (event) => {
         const base64 = event.target?.result as string;
         setStyle({ ...style, logoUrl: base64 });
       };
       reader.readAsDataURL(file);
     }
   };
   ```

4. **Salvar logo no Firestore:**
   ```typescript
   await updateDoc(doc(db, 'styles', styleId), {
     logoUrl: style.logoUrl,
     logoPosition: style.logoPosition,
     logoSize: style.logoSize,
   });
   ```

---

### ⏳ **6. Integração com CarouselCreation**

**Status:** 🔄 EM PROGRESSO

**Próximos Passos:**

1. **Passar título e texto para geração de imagens:**
   ```typescript
   // ANTES:
   const imageUrl = await generateSlideImage(
     slide.imagePrompt,
     style,
     slideType
   );

   // DEPOIS:
   const imageUrl = await generateSlideImage(
     slide.imagePrompt,
     style,
     slideType,
     slide.title,    // NOVO
     slide.text      // NOVO
   );
   ```

2. **Selecionar mood do conteúdo:**
   ```typescript
   const mood = detectMoodFromContent(content); // 'alerta' | 'estrategico' | 'comunicado'
   
   const draft = await draftCarouselContent(
     content,
     style,
     mood,  // NOVO
     onProgress
   );
   ```

3. **Aplicar configurações de design:**
   ```typescript
   import { ALFA_CONTABILIDADE_CONFIG } from '../config/design-config';
   
   // Usar config ao gerar imagens
   const imageUrl = await generateSlideImage(
     slide.imagePrompt,
     {
       ...style,
       logoUrl: style.logoUrl || ALFA_CONTABILIDADE_CONFIG.logo.url,
       footerText: style.footerText || ALFA_CONTABILIDADE_CONFIG.footer.text,
     },
     slideType,
     slide.title,
     slide.text
   );
   ```

---

## 🎨 **Estrutura de Conteúdo por Tipo de Slide**

### **Slide 1: CAPA (Hook/Gancho)**

**Elementos Essenciais:**
```
┌─────────────────────────────────────┐
│                              [LOGO] │
│                                     │
│   [SELO/ÍCONE]                      │
│   TÍTULO IMPACTANTE EM CAIXA ALTA   │
│   Subtítulo contextual              │
│   criando urgência/curiosidade       │
│                                     │
│                              [→ ≫]  │
│                                     │
│   Conteúdo completo em              │
│   AlfaContabilidadeCariri.com.br    │
└─────────────────────────────────────┘
```

**Exemplo de Conteúdo:**
```json
{
  "slide": 1,
  "titulo": "CUIDADO COM O LEÃO DO IMPOSTO DE RENDA!",
  "texto": "A Receita Federal apertou o cerco e multas de até 20% estão sendo aplicadas. Veja como evitar problemas agora.",
  "slideType": "cover"
}
```

### **Slides 2-3: CONTEÚDO**

**Formatos Preferenciais:**

#### 1. Checklist
```
┌─────────────────────────────────────┐
│                              [LOGO] │
│                                     │
│   CHECKLIST: IRPF 2026              │
│                                     │
│   ✓ Declare até 31/05               │
│   ✓ Confira todos os bens           │
│   ✓ Atualize seu CPF                │
│   ✓ Reúna comprovantes              │
│   ✓ Junte recibos de despesas       │
│                                     │
│   Conteúdo completo em              │
│   AlfaContabilidadeCariri.com.br    │
└─────────────────────────────────────┘
```

#### 2. Comparação
```
┌─────────────────────────────────────┐
│                              [LOGO] │
│                                     │
│   ANTES ❌ vs DEPOIS ✓              │
│                                     │
│   ANTES:                            │
│   ❌ Pague 20% de IR                │
│   ❌ Multas de 75%                  │
│   ❌ Processos longos               │
│                                     │
│   DEPOIS:                           │
│   ✓ Apenas 6% com planejamento      │
│   ✓ Zero multas com compliance      │
│   ✓ Processo ágil e seguro          │
│                                     │
│   Conteúdo completo em              │
│   AlfaContabilidadeCariri.com.br    │
└─────────────────────────────────────┘
```

#### 3. Lista com Ícones
```
┌─────────────────────────────────────┐
│                              [LOGO] │
│                                     │
│   3 ERROS FATAIS NO IR              │
│                                     │
│   1) 🗓️ Não declarar até prazo      │
│      → Multa de 1% ao mês           │
│                                     │
│   2) 💰 Esquecer bens no exterior   │
│      → Multa de R$ 5.000            │
│                                     │
│   3) 📄 Ignorar recibos             │
      → Perda de deduções valiosas    │
│                                     │
│   Conteúdo completo em              │
│   AlfaContabilidadeCariri.com.br    │
└─────────────────────────────────────┘
```

### **Slide 4: CTA (Solução)**

**Elementos Essenciais:**
```
┌─────────────────────────────────────┐
│                                     │
│   SUA PAZ DE ESPÍRITO               │
│   NÃO TEM PREÇO                     │
│                                     │
│   ✓ Analisamos seu caso             │
│   ✓ Garantimos sua segurança        │
│   ✓ Economizamos seu tempo          │
│                                     │
│         [LOGO GRANDE]               │
│                                     │
│   ┌─────────────────────────────┐   │
│   │  AGENDE SUA CONSULTORIA     │   │
│   └─────────────────────────────┘   │
│                                     │
│   Conteúdo completo em              │
│   AlfaContabilidadeCariri.com.br    │
└─────────────────────────────────────┘
```

**Exemplo de Conteúdo:**
```json
{
  "slide": 4,
  "titulo": "SUA PAZ DE ESPÍRITO NÃO TEM PREÇO",
  "texto": "Analisamos seu caso | Garantimos sua segurança | Economizamos seu tempo. AGENDE SUA CONSULTORIA AGORA!",
  "slideType": "cta"
}
```

---

## 🎭 **Moods de Design - Detalhes**

### **Mood 1: ALERTA URGENTE 🚨**

**Quando Usar:**
- Prazos finais (IRPF, Simples Nacional)
- Mudanças de lei obrigatórias (NFS-e)
- Alertas de golpes (DAS Falso)
- Multas e penalidades iminentes

**Direção Visual:**
```
Cores:
- Primária: Vermelho vivo (#DC2626)
- Secundária: Amarelo alerta (#F59E0B)
- Fundo: Branco ou cinza claro (#F9FAFB)

Ícones:
- ⚠️ Atenção
- 🚨 Emergência
- 🗓️ Prazo/Calendário
- ❌ Erro/Proibido
- 🛑 Pare/Alerta
- ⏰ Tempo esgotando

Fontes:
- Títulos: Extra bold, caixa alta
- Textos: Medium, direto
- Sem serifas (sans-serif)

Layout:
- Alto contraste
- Elementos grandes e chamativos
- Pouco espaço em branco (urgência)
```

### **Mood 2: ESTRATÉGICO & EDUCATIVO 💡**

**Quando Usar:**
- Análise de oportunidades fiscais (REARP)
- Dicas de gestão (Valor vs. Preço)
- Explicação de temas complexos (Reforma Tributária)
- Guias e tutoriais

**Direção Visual:**
```
Cores:
- Primária: Azul escuro (#1E3A8A)
- Secundária: Azul médio (#3B82F6)
- Acento: Dourado ou azul secundário (#F59E0B)
- Fundo: Branco (#FFFFFF)

Ícones:
- 📈 Gráficos/Crescimento
- 💡 Ideias/Oportunidades
- 🛡️ Proteção/Segurança
- ⚖️ Balanço/Justiça
- 🎯 Objetivos/Metas
- 🔗 Conexões/Links

Fontes:
- Títulos: Sans-serif limpa
- Destaques: Serifada elegante (citações)
- Textos: Regular, legível

Layout:
- Organizado e estruturado
- Checklists e comparações
- Espaço em branco generoso
```

### **Mood 3: COMUNICADO & INFORMATIVO ✨**

**Quando Usar:**
- Recessos e feriados
- Boas-vindas a novos clientes
- Mensagens institucionais
- Atualizações de serviço

**Direção Visual:**
```
Cores:
- Primária: Azul suave (#60A5FA)
- Secundária: Cinza elegante (#9CA3AF)
- Acento: Cores temáticas sutis
  (dourado/prata no Natal, confete no Carnaval)
- Fundo: Claro e aberto (#F9FAFB)

Ícones:
- 🗓️ Calendário/Eventos
- ✨ Celebração/Brilho
- 🌿 Renovação/Crescimento
- ☕ Acolhimento/Conforto

Fontes:
- Títulos: Medium, amigável
- Textos: Regular, acolhedor
- Legibilidade máxima

Layout:
- Tons mais leves e abertos
- Espaçamento generoso
- Tom institucional mas acolhedor
```

---

## 📚 **Biblioteca de Ícones**

### Estilo de Iconografia:
- **Tipo:** Clean, de linha (line icons)
- **Cor:** Monocromático (uma cor da paleta)
- **Função:** Simplificar conceitos complexos
- **Regra:** Autoexplicativo sempre que possível

### Ícones por Categoria:

#### **Urgência/Prazos:**
```
⚠️  Atenção/Alerta
🚨  Emergência
🗓️  Calendário/Prazo
⏰  Tempo/Contagem regressiva
❌  Erado/Proibido
🛑  Pare/Interrompa
```

#### **Finanças/Dinheiro:**
```
💰  Dinheiro/Economia
📊  Gráficos/Análise
💵  Pagamentos/Impostos
💳  Cartão/Crédito
🏦  Banco/Instituição
```

#### **Educação/Informação:**
```
💡  Ideia/Oportunidade
📖  Guia/Tutorial
📋  Checklist/Formulário
📝  Declaração/Registro
🎓  Aprendizado/Conhecimento
```

#### **Proteção/Segurança:**
```
🛡️  Proteção/Defesa
⚖️  Balanço/Legal
🔒  Segurança/Privacidade
✅  Aprovado/Correto
🎯  Objetivo/Meta
```

#### **Comunicação/Institucional:**
```
✨  Celebração/Brilho
🌿  Renovação/Crescimento
☕  Acolhimento/Conforto
📢  Comunicado/Anúncio
🤝  Parceria/Colaboração
```

---

## 🎯 **Regras de Ouro (Inalteráveis)**

### 1. **Clareza Acima de Tudo**
- Design limpo, organizado e profissional
- Evitar poluição visual
- Cada elemento deve ter um propósito
- Menos é mais

### 2. **Logo Sempre Visível**
- Posição: Canto superior direito
- Tamanho: Médio (discreto mas presente)
- Visível em TODAS as artes
- Não deve dominar o design

### 3. **Rodapé Fixo**
- Texto EXATO: "Conteúdo completo em AlfaContabilidadeCariri.com.br"
- Fonte pequena e sóbria
- Centralizado na parte inferior
- Presente em TODOS os slides

### 4. **Paleta de Cores**
- Usar cores primária e secundária da Alfa
- Cores de alerta (vermelho, amarelo) com intenção estratégica
- Baseado no "mood" do post

### 5. **Uma Ideia por Slide**
- Foco em UM conceito central
- Máximo 4 pontos por slide
- Facilitar absorção visual
- Legibilidade máxima

---

## 📊 **Exemplo de Fluxo Completo**

### **Cenário:** Criar carrossel sobre IRPF 2026

#### **Passo 1: Usuário Insere Conteúdo**
```
"Declare o Imposto de Renda 2026 até 31 de maio para evitar multas. 
A Receita Federal está cruzando dados bancários e aplicando multas 
de até 20% para quem declarar fora do prazo. Planeje-se!"
```

#### **Passo 2: Sistema Detecta Mood**
```
Mood: ALERTA URGENTE 🚨
Motivo: Prazo final, multas, declaração obrigatória
```

#### **Passo 3: Diagramador Gera Estrutura**
```json
[
  {
    "slide": 1,
    "titulo": "ATENÇÃO: PRAZO DO IRPF 2026 ESTÁ ACABANDO!",
    "texto": "Faltam poucos dias para o fim da declaração. Multas de até 20% estão sendo aplicadas. Veja o que fazer agora.",
    "slideType": "cover"
  },
  {
    "slide": 2,
    "titulo": "CHECKLIST: O QUE FAZER AGORA",
    "texto": "✓ Reúna todos os informes de rendimento\n✓ Confira extratos bancários de 2025\n✓ Junte recibos de despesas médicas\n✓ Liste bens e atualize valores\n✓ Declare ATÉ 31/05/2026",
    "slideType": "content"
  },
  {
    "slide": 3,
    "titulo": "CUIDADO: MULTAS E PENALIDADES",
    "texto": "❌ 1% ao mês sobre imposto devido (mínimo R$ 165,74)\n❌ 50% de multa por omissão de rendimentos\n❌ 75% em caso de fraude comprobada\n❌ Receita cruza dados bancários automaticamente",
    "slideType": "content"
  },
  {
    "slide": 4,
    "titulo": "NÓS RESOLVEMOS PARA VOCÊ",
    "texto": "Declaramos seu IR com segurança | Garantimos sua conformidade | Evitamos multas desnecessárias. AGENDE SUA CONSULTORIA ANTES DO PRAZO!",
    "slideType": "cta"
  }
]
```

#### **Passo 4: Sistema Gera Imagens**
```
Para cada slide, gera prompt com:
✅ Texto em PT-BR (título + texto do slide)
✅ Logo no canto superior direito
✅ Rodapé com URL
✅ Cores de alerta (vermelho/amarelo)
✅ Ícones temáticos (⚠️🗓️❌✓🛑)
✅ Formato 720x960px (3:4)
```

#### **Passo 5: Usuário Revisa e Dá Feedback**
```
Slide 1: 👍 "Perfeito, título impactante!"
Slide 2: 👍 "Checklist completo e claro"
Slide 3: 👎 "Muito negativo, adicionar alerta visual"
Slide 4: 👍 "CTA claro e direto"
```

#### **Passo 6: Sistema Aprende**
```
Feedback processado →
Atualiza estilo no Firestore →
Sincroniza com Pinecone →
Próximo carrossel será MELHOR!
```

---

## ✅ **Status de Implementação**

| Componente | Status | Arquivo |
|------------|--------|---------|
| Configuração de Design | ✅ Completo | `src/config/design-config.ts` |
| Prompts Otimizados | ✅ Completo | `src/config/optimized-prompts.ts` |
| Diagrammer Atualizado | ✅ Completo | `src/skills/diagrammer.ts` |
| Geração de Imagens | ✅ Completo | `src/services/ai.ts` |
| Upload de Logo | 🔄 Pendente | `src/pages/StyleManagement.tsx` |
| Integração CarouselCreation | 🔄 Pendente | `src/pages/CarouselCreation.tsx` |
| Mood Detection | 🔄 Pendente | `src/services/ai.ts` |
| Documentação | ✅ Completo | `README-PRO.md` + este arquivo |

---

**Documento criado:** 10/04/2026
**Versão:** 2.0.0-Pro
**Baseado nas diretrizes de:** Alfa Contabilidade
