/**
 * Prompts Otimizados para Geração de Carrosséis
 * Texto em PT-BR para imagens, estrutura profissional rica
 */

/**
 * Prompt do Diagramador - Gera estrutura de 4 slides com conteúdo DENSO
 */
export function createDiagrammerPrompt(
  content: string,
  styleContext: string,
  mood: 'alerta' | 'estrategico' | 'comunicado' = 'estrategico'
): string {
  const moodConfig = {
    alerta: {
      emoji: '🚨',
      tone: 'URGENTE - Use palavras como "ATENÇÃO", "CUIDADO", "URGENTE", "PRAZO FINAL"',
      structure: 'Gancho alarmante → Explicação do risco → Como se proteger → CTA emergencial',
    },
    estrategico: {
      emoji: '💡',
      tone: 'EDUCATIVO - Use linguagem clara, exemplos práticos, dados concretos',
      structure: 'Oportunidade → Explicação detalhada → Passo a passo → CTA consultivo',
    },
    comunicado: {
      emoji: '✨',
      tone: 'INFORMATIVO - Linguagem acolhedora, institucional, profissional',
      structure: 'Comunicado → Detalhes → Benefícios → Cta institucional',
    },
  };

  const moodInfo = moodConfig[mood];

  return `Você é um ESTRATEGISTA DE CONTEÚDO para Carrosséis Instagram da Alfa Contabilidade. Retorne APENAS um JSON array. SEM análise. SEM explicações. SEM markdown.

CRÍTICO: Sua resposta inteira DEVE ser um JSON array começando com [ e terminando com ]. Mantenha CONCISO (máx 800 tokens).

CONTEXTO DE HUMO: ${moodInfo.emoji} ${moodInfo.tone}
ESTRUTURA NARRATIVA: ${moodInfo.structure}

══════════════════════════════════════════════════════════════
REGRAS DE OURO PARA CADA SLIDE:

SLIDE 1 (CAPA/GANCHO):
- título: FRASE DE IMPACTO EM CAIXA ALTA (máx 8 palavras)
  → Deve PARAR A ROLAGEM e criar CURIOSIDADE
  → Exemplos: "CUIDADO COM O LEÃO!", "VOCÊ ESTÁ PERDENDO DINHEIRO?", "NOVA LEI: O QUE MUDA?"
- texto: Subtítulo contextual (1-2 frases)
  → Explica o benefício ou perigo
  → Cria urgência ou curiosidade
  → Exemplo: "A Receita Federal mudou as regras e você precisa saber agora"

SLIDES 2-3 (CONTEÚDO):
- título: TEMA DO SLIDE em destaque (máx 6 palavras)
- texto: Conteúdo RICO e DENSO (máx 50 palavras por slide)
  → Use LISTAS, CHECKLISTS ou COMPARAÇÕES
  → Inclua DADOS CONCRETOS, prazos, valores quando possível
  → UM conceito central por slide
  → Exemplos de formatos:
    • Checklist: "✓ Declare até 31/05 ✓ Confira os bens ✓ Atualize seu CPF"
    • Comparação: "ANTES: Pague 20% | DEPOIS: Pague apenas 6%"
    • Infográfico: "Passo 1 → Passo 2 → Passo 3"
    • Lista: "3 erros fatais: 1) Não declarar... 2) Esquecer... 3) Ignorar..."

SLIDE 4 (CTA/SOLUÇÃO):
- título: FRASE DE POSICIONAMENTO (máx 6 palavras)
  → Reforce o valor da Alfa Contabilidade
  → Exemplos: "SUA PAZ DE ESPÍRITO NÃO TEM PREÇO", "NÓS RESOLVEMOS PARA VOCÊ"
- texto: Chamada para ação CLARA
  → Mencione 2-3 benefícios do serviço
  → Inclua CTA direto: "AGENDE SUA CONSULTORIA", "FALE CONOSCO AGORA"
  → Exemplo: "Analisamos seu caso | Garantimos sua segurança | Economizamos seu tempo. AGENDE AGORA!"
══════════════════════════════════════════════════════════════

ESTILO VISUAL:
${styleContext}

CONTEÚDO PARA TRANSFORMAR:
${content}

══════════════════════════════════════════════════════════════
FORMATO DE SAÍDA (EXATAMENTE 4 SLIDES):
[
  {
    "slide": 1,
    "titulo": "TÍTULO IMPACTANTE EM CAIXA ALTA",
    "texto": "Subtítulo contextual com 1-2 frases criando urgência/curiosidade",
    "slideType": "cover"
  },
  {
    "slide": 2,
    "titulo": "TEMA DO CONTEÚDO",
    "texto": "Conteúdo rico com listas, dados ou exemplos práticos",
    "slideType": "content"
  },
  {
    "slide": 3,
    "titulo": "CONTINUAÇÃO DO CONTEÚDO",
    "texto": "Mais conteúdo aprofundando o tema com exemplos práticos",
    "slideType": "content"
  },
  {
    "slide": 4,
    "titulo": "FRASE DE POSICIONAMENTO",
    "texto": "CTA direto com 2-3 benefícios e chamada para ação clara",
    "slideType": "cta"
  }
]

RESPONDA APENAS COM O JSON ARRAY (sem texto adicional):`;
}

/**
 * Prompt do Designer - Gera prompts de imagem COM TEXTO EM PT-BR
 * Inclui instruções para logo, footer e elementos visuais
 */
export function createImagePrompt(
  slideTitle: string,
  slideText: string,
  slideType: 'cover' | 'content' | 'cta',
  styleConfig: any,
  mood: 'alerta' | 'estrategico' | 'comunicado' = 'estrategico'
): string {
  const moodEmojis = {
    alerta: '🚨⚠️',
    estrategico: '💡📊',
    comunicado: '✨📋',
  };

  const moodColors = {
    alerta: 'vermelho vivo (#DC2626) e amarelo alerta (#F59E0B)',
    estrategico: 'azul escuro (#1E3A8A) e azul médio (#3B82F6)',
    comunicado: 'azul suave (#60A5FA) e cinza elegante (#9CA3AF)',
  };

  const formatContent = (text: string, maxLen: number) => {
    if (text.length <= maxLen) return text;
    return text.substring(0, maxLen) + '...';
  };

  // Elementos obrigatórios em TODAS as imagens
  const requiredElements = `
══════════════════════════════════════════════════════════════
ELEMENTOS OBRIGATÓRIOS EM TODAS AS IMAGENS:

1. LOGO DA EMPRESA:
   - Posição: Canto superior direito (top-right)
   - Tamanho: Médio (não muito grande, não muito pequeno)
   - Visibilidade: Sempre visível mas discreto
   - Formato: Logo profissional de contabilidade

2. RODAPÉ FIXO:
   - Texto EXATO: "Conteúdo completo em AlfaContabilidadeCariri.com.br"
   - Posição: Centralizado na parte inferior
   - Fonte: Pequena e sóbria (10-12pt equivalente)
   - Cor: Cinza escuro (#6B7280)

3. TEXTO EM PORTUGUÊS (PT-BR):
   - Título principal: ${formatContent(slideTitle, 60)}
   - Texto de apoio: ${formatContent(slideText, 120)}
   - TODO texto na imagem DEVE estar em PORTUGUÊS DO BRASIL
══════════════════════════════════════════════════════════════`;

  // Configuração específica por tipo de slide
  const slideTypeConfig = {
    cover: `
══════════════════════════════════════════════════════════════
SLIDE 1 - CAPA/GANCHO (Alto Impacto Visual):

LAYOUT:
- Título PRINCIPAL em destaque (maior elemento visual)
  → Texto: "${slideTitle}"
  → Fonte: Extra bold, caixa alta, grande (48-60pt)
  → Cor: ${moodColors[mood]}
  → Posição: Centro ou centro-esquerda
  
- Subtítulo contextual abaixo do título
  → Texto: "${formatContent(slideText, 80)}"
  → Fonte: Medium, menor que título (24-32pt)
  → Cor: Cinza escuro (#374151)

- Elemento visual de destaque:
  → Selo, ícone forte ou faixa colorida
  → Usar emoji de humor: ${moodEmojis[mood]}
  → Posição: Lado direito ou acima do título

- CTA Visual:
  → Ícone "arraste para o lado" (→ ou ≫)
  → Posição: Inferior direito
  → Cor: ${moodColors[mood]}

FUNDO:
- Cor sólida: ${styleConfig.backgroundColor || '#1E3A8A'}
- SEM gradientes complexos
- Pode ter padrão geométrico sutil (linhas, pontos)

COMPOSIÇÃO:
- Layout centralizado ou assimétrico equilibrado
- Alto contraste entre texto e fundo
- Espaço livre generoso (não poluir)
══════════════════════════════════════════════════════════════`,

    content: `
══════════════════════════════════════════════════════════════
SLIDES 2-3 - CONTEÚDO (Educativo/Informativo):

LAYOUT:
- Título do slide no topo
  → Texto: "${slideTitle}"
  → Fonte: Bold, grande (36-44pt)
  → Cor: ${moodColors[mood]}
  → Posição: Centralizado ou alinhado à esquerda

- Conteúdo principal em lista/checklist:
  → Texto: "${formatContent(slideText, 150)}"
  
  FORMATO PREFERENCIAL:
  ✓ Checklist: Cada item com ícone ✓ ou •
  ✓ Comparações: "ANTES ❌ vs DEPOIS ✓"
  ✓ Lista numerada: "1) ... 2) ... 3) ..."
  ✓ Tópicos com ícones: Cada ponto com ícone temático
  
  → Fonte body: Regular (18-24pt)
  → Cor texto: Cinza escuro (#1F2937)
  → Espaçamento: Generoso entre itens (16-24px)

- Ícones de suporte:
  → Estilo: Line icons, monocromáticos
  → Cor: ${moodColors[mood]}
  → Posição: Ao lado de cada tópico

FUNDO:
- Cor sólida: ${styleConfig.backgroundColor || '#FFFFFF'}
- Pode ter faixa colorida no topo com título
- SEM elementos distratoras

COMPOSIÇÃO:
- Layout limpo e organizado
- Foco na legibilidade
- Máximo 4 pontos por slide
- Espaço em branco generoso
══════════════════════════════════════════════════════════════`,

    cta: `
══════════════════════════════════════════════════════════════
SLIDE 4 - CHAMADA PARA AÇÃO (Conversão):

LAYOUT:
- Título de posicionamento no topo
  → Texto: "${slideTitle}"
  → Fonte: Extra bold (36-48pt)
  → Cor: ${moodColors[mood]}
  → Posição: Centralizado

- Bullet points dos benefícios (2-3 itens):
  → Texto: "${formatContent(slideText, 100)}"
  
  FORMATO:
  ✓ "✓ Analisamos seu caso"
  ✓ "✓ Garantimos sua segurança"
  ✓ "✓ Economizamos seu tempo"
  
  → Fonte: Medium (20-24pt)
  → Cor: Cinza escuro (#374151)
  → Ícones: ✓ em cor primária

- Logo em DESTAQUE (maior que nos outros slides):
  → Posição: Centro ou logo acima do CTA
  → Tamanho: Grande (mas não dominante)
  → Serve como "assinatura" da solução

- Botão CTA PRINCIPAL:
  → Texto: "AGENDE SUA CONSULTORIA" ou "FALE CONOSCO AGORA"
  → Formato: Retângulo arredondado (botão)
  → Cor de fundo: ${moodColors[mood]}
  → Cor do texto: Branco (#FFFFFF)
  → Fonte: Bold, caixa alta (24-28pt)
  → Posição: Inferior central
  → Efeito sutil de sombra

FUNDO:
- Cor sólida: ${styleConfig.backgroundColor || '#1E3A8A'}
- Pode ter padrão sutil ou textura leve
- Alto contraste com botão CTA

COMPOSIÇÃO:
- Hierarquia visual clara
- CTA como elemento mais chamativo (após título)
- Logo como selo de confiança
- Espaçamento generoso
══════════════════════════════════════════════════════════════`,
  };

  // Montar prompt final
  return `${requiredElements}

${slideTypeConfig[slideType]}

══════════════════════════════════════════════════════════════
REGRAS CRÍTICAS:
1. TODO texto na imagem DEVE estar em PORTUGUÊS DO BRASIL
2. NUNCA usar palavras em inglês (slide, content, CTA, etc.)
3. Logo sempre presente (top-right, discreto mas visível)
4. Rodapé SEMPRE com texto EXATO: "Conteúdo completo em AlfaContabilidadeCariri.com.br"
5. Design LIMPO e PROFISSIONAL (evitar poluição visual)
6. Alto contraste texto/fundo (legibilidade máxima)
7. Formato: 720x960px (proporção 3:4)
8. Estilo: Minimalista, corporativo, cores da Alfa Contabilidade
══════════════════════════════════════════════════════════════`;
}

/**
 * Prompt do Revisor - Melhora texto PT-BR
 */
export function createReviewerPrompt(
  slides: any[],
  managerFeedback: string,
  userConsiderations: string
): string {
  return `Você é um REVISOR DE CONTEÚDO especialista em marketing digital para contabilidade.

TAREFA: Revisar e melhorar o texto dos slides para:
1. Corrigir ortografia e gramática (PT-BR)
2. Melhorar fluidez e clareza
3. Garantir tom profissional e acessível
4. Adaptar para linguagem de contabilidade brasileira
5. Manter exatamente 4 slides

SLIDES ATUAIS:
${slides.map((s, i) => `Slide ${i + 1} (${s.slideType}):\nTítulo: ${s.title}\nTexto: ${s.text}`).join('\n\n')}

${managerFeedback ? `FEEDBACK DO GERENTE:\n${managerFeedback}` : ''}
${userConsiderations ? `CONSIDERAÇÕES DO USUÁRIO:\n${userConsiderations}` : ''}

REGRAS:
- Manter estrutura original (4 slides)
- Título do Slide 1 DEVE ser impactante e em CAIXA ALTA
- Slides 2-3 devem ter conteúdo DENSO com listas/checklists
- Slide 4 deve ter CTA claro e direto
- TODO texto em PORTUGUÊS DO BRASIL
- Máximo 50 palavras por slide
- Usar terminologia contábil brasileira correta

RETORNE JSON com exatamente 4 slides:
[
  {"slide": 1, "titulo": "...", "texto": "...", "slideType": "cover"},
  {"slide": 2, "titulo": "...", "texto": "...", "slideType": "content"},
  {"slide": 3, "titulo": "...", "texto": "...", "slideType": "content"},
  {"slide": 4, "titulo": "...", "texto": "...", "slideType": "cta"}
]`;
}

export default {
  createDiagrammerPrompt,
  createImagePrompt,
  createReviewerPrompt,
};
