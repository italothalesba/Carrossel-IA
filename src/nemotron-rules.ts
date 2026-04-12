/**
 * Regras de Geração Otimizadas para NVIDIA Nemotron 3 Super 120B
 * 
 * Capacidades:
 * ✅ Geração de texto, código e raciocínio complexo
 * ✅ JSON estruturado
 * ✅ Contexto de até 1M tokens
 * ✅ Raciocínio multi-etapas
 * 
 * NÃO Suporta:
 * ❌ Embeddings (vetores)
 * ❌ Geração de imagens
 * ❌ Áudio ou multimodalidade
 * 
 * Melhores Práticas:
 * - Prompts claros e diretos
 * - Instruções explícitas de formato JSON
 * - Evitar markdown code blocks (adicionar regex fallback)
 */

// ==========================================
// REGRAS PARA NEMOTRON - SKILL DIAGRAMADOR
// ==========================================
export const NEMOTRON_DIAGRAMMER_RULES = {
  model: 'nvidia/nemotron-3-super-120b-a12b:free',
  provider: 'openrouter',
  temperature: 0.7,
  maxTokens: 2048,
  
  // Prompt otimizado para Nemotron
  prompt: (content: string, styleContext: string) => `You are an expert Instagram Carousel Content Strategist.

TASK: Convert the raw content below into exactly 4 slides for an Instagram carousel.

RULES:
1. Slide 1 must be a strong hook/title that grabs attention immediately
2. Slides 2 and 3 must develop the main points concisely
3. Slide 4 must be a clear conclusion with a Call to Action
4. Keep text per slide under 50 words for readability
5. Write in Brazilian Portuguese (PT-BR)

STYLE CONTEXT:
${styleContext}

RAW CONTENT:
${content}

OUTPUT FORMAT: Return ONLY a valid JSON array. No explanations, no markdown.
[
  {"title": "Slide 1 Title", "text": "Slide 1 content", "imagePrompt": "brief visual idea"},
  {"title": "Slide 2 Title", "text": "Slide 2 content", "imagePrompt": "brief visual idea"},
  {"title": "Slide 3 Title", "text": "Slide 3 content", "imagePrompt": "brief visual idea"},
  {"title": "Slide 4 Title", "text": "Slide 4 content", "imagePrompt": "brief visual idea"}
]`
};

// ==========================================
// REGRAS PARA NEMOTRON - SKILL REVISOR
// ==========================================
export const NEMOTRON_REVIEWER_RULES = {
  model: 'nvidia/nemotron-3-super-120b-a12b:free',
  provider: 'openrouter',
  temperature: 0.3,
  maxTokens: 1024,
  
  prompt: (slideTitle: string, slideText: string, slideNumber: number) => `You are a Senior Brazilian Portuguese Copy Editor.

TASK: Review and correct this Instagram carousel slide.

RULES:
1. Fix ALL spelling, grammar, and punctuation errors (PT-BR)
2. Improve clarity and impact while keeping it concise
3. Ensure the tone matches professional Instagram content
4. Return ONLY a valid JSON object with "title" and "text" fields
5. Do NOT add explanations or extra text

SLIDE ${slideNumber}:
Title: ${slideTitle}
Text: ${slideText}

OUTPUT: {"title": "corrected title", "text": "corrected text"}`
};

// ==========================================
// REGRAS PARA NEMOTRON - SKILL DESIGNER
// ==========================================
export const NEMOTRON_DESIGNER_RULES = {
  model: 'nvidia/nemotron-3-super-120b-a12b:free',
  provider: 'openrouter',
  temperature: 0.7,
  maxTokens: 1024,
  
  prompt: (slideTitle: string, slideText: string, styleContext: string, slideNumber: number, slideType: string) => `You are a Senior Art Director specializing in Instagram carousel design.

TASK: Create a detailed image generation prompt for this slide.

RULES:
1. Define ONE solid background color (no gradients, no mixed colors)
2. Follow the Style Context exactly
3. Write the prompt in English (for AI image generators)
4. Specify hex color codes for all elements
5. Include layout, typography, and icon details
6. Return ONLY a valid JSON with "imagePrompt" field

STYLE CONTEXT:
${styleContext}

SLIDE ${slideNumber} (${slideType}):
Title: ${slideTitle}
Text: ${slideText}

OUTPUT: {"imagePrompt": "detailed prompt in English with solid background, hex colors, layout details"}`
};

// ==========================================
// REGRAS PARA NEMOTRON - SKILL GERENTE
// ==========================================
export const NEMOTRON_MANAGER_RULES = {
  model: 'nvidia/nemotron-3-super-120b-a12b:free',
  provider: 'openrouter',
  temperature: 0.5,
  maxTokens: 4096,
  
  prompt: (slidesJson: string, styleContext: string) => `You are the Quality Control Manager for Instagram carousels.

TASK: Review all 4 slides and provide final approval.

REVIEW CRITERIA:
1. Spelling and grammar (PT-BR) - must be perfect
2. Image prompts consistency with style
3. Logical flow from slide 1 to 4
4. Exactly 4 slides (no more, no less)

STYLE CONTEXT:
${styleContext}

CURRENT SLIDES:
${slidesJson}

OUTPUT FORMAT: Return ONLY valid JSON with exactly 4 slides and feedback.
{
  "slides": [4 slide objects],
  "managerFeedback": "Professional feedback in PT-BR about what you approved or changed"
}`
};

// ==========================================
// RESUMO: O QUE NEMOTRON SUPORTA NO SISTEMA
// ==========================================
export const NEMOTRON_CAPABILITIES = {
  // ✅ SUPORTA - Usar Nemotron
  supported: [
    'Geração de texto (Diagramador)',
    'Revisão ortográfica (Revisor)',
    'Criação de prompts de imagem (Designer)',
    'Revisão final (Gerente)',
    'JSON estruturado',
    'Raciocínio complexo',
    'Contexto longo (até 1M tokens)'
  ],
  
  // ❌ NÃO SUPORTA - Usar outros providers
  notSupported: [
    'Embeddings/vetores (usar Gemini/HuggingFace)',
    'Geração de imagens (usar Cloudflare/Leonardo/HuggingFace)',
    'Áudio ou multimodalidade',
    'Análise de imagens (usar Claude/Gemini Vision)'
  ]
};
