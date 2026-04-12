const AI_API_BASE = '/api/ai';
import { StyleDNA, generateImagePromptFromDNA } from './styleDNA';
import { SkillOrchestrator } from '../skills/orchestrator';
import { createImagePrompt } from '../config/optimized-prompts';

// Instância singleton do orquestrador de skills
const skillOrchestrator = new SkillOrchestrator();

async function postAi(path: string, body: any): Promise<any> {
  const response = await fetch(`${AI_API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`AI proxy error: ${response.status} ${errorText}`);
  }

  return response.json();
}

function parseJsonOrThrow<T>(text: string, context: string): T {
  try {
    // Remover markdown code blocks se presentes
    let cleanedText = text;
    
    // Remove ```json ... ``` ou ``` ... ```
    const jsonBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonBlockMatch) {
      cleanedText = jsonBlockMatch[1].trim();
    }
    
    // Também remove qualquer texto antes do primeiro { ou [
    const firstBrace = cleanedText.indexOf('{');
    const firstBracket = cleanedText.indexOf('[');
    if (firstBrace !== -1 || firstBracket !== -1) {
      const startIndex = firstBrace !== -1 && (firstBrace < firstBracket || firstBracket === -1) 
        ? firstBrace 
        : firstBracket;
      cleanedText = cleanedText.substring(startIndex);
    }
    
    // Se o JSON está truncado (comum em respostas longas), tenta encontrar o último } ou ] válido
    try {
      return JSON.parse(cleanedText) as T;
    } catch {
      // JSON inválido, tenta truncar no último fechamento válido
      const lastBrace = cleanedText.lastIndexOf('}');
      const lastBracket = cleanedText.lastIndexOf(']');
      
      if (lastBrace > 0 || lastBracket > 0) {
        // Encontra a posição do último fechamento válido
        const lastIndex = Math.max(lastBrace, lastBracket);
        const truncatedText = cleanedText.substring(0, lastIndex + 1);
        
        try {
          return JSON.parse(truncatedText) as T;
        } catch {
          // Ainda inválido, tenta remover campos parcialmente escritos
          // Remove tudo após o último "value" completo (terminado em " ou } ou ,)
          const fixedText = truncatedText.replace(/,\s*"[^"]*$/, '}').replace(/:\s*"[^"]*$/, '"}');
          try {
            return JSON.parse(fixedText) as T;
          } catch {
            // Última tentativa: normalizar aspas e tentar extrair valor específico para Designer
            // Se for contexto de Designer, tenta extrair imagePrompt/Prompt/prompt
            if (context.includes('design step')) {
              const imagePromptMatch = cleanedText.match(/["'](?:imagePrompt|Prompt|prompt|image_prompt)["']\s*:\s*["']([\s\S]*?)["']/);
              if (imagePromptMatch) {
                return { imagePrompt: imagePromptMatch[1] } as T;
              }
            }
            throw new Error(`Unable to parse JSON after multiple attempts`);
          }
        }
      }
      
      // Fallback: tenta extrair campo específico para Designer
      if (context.includes('design step')) {
        const imagePromptMatch = cleanedText.match(/["'](?:imagePrompt|Prompt|prompt|image_prompt)["']\s*:\s*["']([\s\S]*?)["']/);
        if (imagePromptMatch) {
          return { imagePrompt: imagePromptMatch[1] } as T;
        }
      }
      
      throw new Error(`Unable to parse JSON`);
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(`${context} failed to parse JSON response. Error: ${message}. Response was: ${JSON.stringify(text)}`);
  }
}

async function textGeneration(model: string, inputs: string, parameters: any, preferredModel?: string): Promise<any> {
  return postAi('/text-generation', { model, inputs, parameters, preferredModel });
}

async function featureExtraction(model: string, inputs: string): Promise<any> {
  return postAi('/feature-extraction', { model, inputs });
}

async function analyzeCategory(images: string[], categoryName: string): Promise<SlideStyleDetail> {
  if (!images || images.length === 0) return { imagesBase64: [], styleDescription: "" };

  const result = await postAi('/analyze-category', { images, categoryName });
  return { imagesBase64: images, styleDescription: result.styleDescription || "" };
}

async function generateAiImage(prompt: string, preferredModel?: string): Promise<string> {
  const result = await postAi('/generate-image', { prompt, preferredModel });
  return result.output;
}

export interface CategorizedImages {
  cover: string[];
  content: string[];
  cta: string[];
}

export interface SlideStyleDetail {
  imagesBase64: string[];
  styleDescription: string;
}

export interface StyleMetadata {
  audience?: string;
  tone?: string;
  colors?: string;
  extraInstructions?: string;
}

export interface StyleData {
  id: string;
  name: string;
  cover: SlideStyleDetail;
  content: SlideStyleDetail;
  cta: SlideStyleDetail;
  metadata?: StyleMetadata;
  assets?: {
    logo?: string;
    background?: string;
  };
  styleDNA?: {
    cover?: StyleDNA;
    content?: StyleDNA;
    cta?: StyleDNA;
  };
}

export interface SlideContent {
  title: string;
  text: string;
  imagePrompt: string;
  hasImage?: boolean;
}

export async function embedText(text: string): Promise<number[]> {
  // Usar endpoint do servidor para evitar uso de process.env no cliente
  const response = await fetch(`${AI_API_BASE}/embed`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`embedText failed: ${response.status} ${error}`);
  }

  const data = await response.json();
  
  if (data.embedding) {
    return data.embedding as number[];
  }

  throw new Error("Failed to generate embedding");
}

export async function learnFromFeedback(
  style: StyleData,
  slideType: 'cover' | 'content' | 'cta',
  status: 'approved' | 'rejected',
  comment: string
): Promise<StyleData> {
  // Usar endpoint do servidor para evitar uso de process.env no cliente
  const response = await fetch(`${AI_API_BASE}/learn-from-feedback`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      style,
      slideType,
      status,
      comment
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`learnFromFeedback failed: ${response.status} ${error}`);
  }

  const data = await response.json();
  return data.updatedStyle;
}

export async function upsertStyleToPinecone(style: StyleData) {
  // Extrair Style DNA
  let styleDNA: { cover?: StyleDNA; content?: StyleDNA; cta?: StyleDNA } = {};

  // SE o estilo já tem StyleDNA (extraído no cliente via Gemini Vision), usar diretamente
  const existingDNA = style.styleDNA;
  if (existingDNA) {
    console.log('[STYLE] Using existing StyleDNA from style object');
    if (existingDNA.cover) styleDNA.cover = existingDNA.cover;
    if (existingDNA.content) styleDNA.content = existingDNA.content;
    if (existingDNA.cta) styleDNA.cta = existingDNA.cta;
    console.log('[STYLE] Loaded', Object.keys(styleDNA).length, 'DNA types from existing style');
  }

  // Senão, tentar extrair das imagens (fallback)
  if (Object.keys(styleDNA).length === 0) {
    // Enviar imagens para o servidor extrair Style DNA
    if (style.cover.imagesBase64?.length > 0) {
      const coverResponse = await fetch('/api/ai/analyze-style-images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          images: style.cover.imagesBase64,
          slideType: 'cover',
          prompt: ''
        })
      });
      if (coverResponse.ok) {
        const data = await coverResponse.json();
        styleDNA.cover = data.dna;
      }
    }
    if (style.content.imagesBase64?.length > 0) {
      const contentResponse = await fetch('/api/ai/analyze-style-images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          images: style.content.imagesBase64,
          slideType: 'content',
          prompt: ''
        })
      });
      if (contentResponse.ok) {
        const data = await contentResponse.json();
        styleDNA.content = data.dna;
      }
    }
    if (style.cta.imagesBase64?.length > 0) {
      const ctaResponse = await fetch('/api/ai/analyze-style-images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          images: style.cta.imagesBase64,
          slideType: 'cta',
          prompt: ''
        })
      });
      if (ctaResponse.ok) {
        const data = await ctaResponse.json();
        styleDNA.cta = data.dna;
      }
    }
    
    console.log('[STYLE] Extracted Style DNA:', Object.keys(styleDNA).length, 'types');
  }

  // Criar descrição ultra-detalhada para embedding
  const combinedDescription = `
STYLE NAME: ${style.name}
AUDIENCE: ${style.metadata?.audience || 'General'}
TONE: ${style.metadata?.tone || 'Neutral'}
BRAND COLORS: ${style.metadata?.colors || 'Not specified'}
EXTRA INSTRUCTIONS: ${style.metadata?.extraInstructions || 'None'}
COVER SLIDE STYLE: ${style.cover.styleDescription || 'Not yet defined'}
CONTENT SLIDE STYLE: ${style.content.styleDescription || 'Not yet defined'}
CTA SLIDE STYLE: ${style.cta.styleDescription || 'Not yet defined'}
  `;

  // Gerar embedding VIA SERVER (process.env não existe no browser)
  const embeddingResponse = await fetch('/api/ai/embed', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: combinedDescription })
  });

  if (!embeddingResponse.ok) {
    throw new Error("Failed to generate embedding");
  }

  const embeddingData = await embeddingResponse.json();
  const embedding = embeddingData.embedding;

  // Preparar metadata para Pinecone
  const metadata: Record<string, any> = {
    name: style.name,
    audience: style.metadata?.audience || '',
    tone: style.metadata?.tone || '',
    colors: style.metadata?.colors || '',
    extraInstructions: style.metadata?.extraInstructions || '',
    coverDesc: style.cover.styleDescription || '',
    contentDesc: style.content.styleDescription || '',
    ctaDesc: style.cta.styleDescription || '',
    type: 'carousel-style',
    lastUpdated: Date.now().toString(),
    // CORREÇÃO #6: Salvar assets no metadata para busca
    hasLogo: !!style.assets?.logo ? 'true' : 'false',
    hasBackground: !!style.assets?.background ? 'true' : 'false'
  };

  // Adicionar Style DNA se disponível
  if (styleDNA.cover) metadata.coverDNA = JSON.stringify(styleDNA.cover);
  if (styleDNA.content) metadata.contentDNA = JSON.stringify(styleDNA.content);
  if (styleDNA.cta) metadata.ctaDNA = JSON.stringify(styleDNA.cta);

  const response = await fetch('/api/pinecone/upsert', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id: style.id,
      values: embedding,
      metadata
    })
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || "Failed to upsert to Pinecone");
  }

  // Retornar estilo com Style DNA
  const styleWithDNA = { ...style, styleDNA };
  return styleWithDNA;
}

export async function queryStyleFromPinecone(content: string): Promise<string | null> {
  // Gerar embedding via servidor (process.env não existe no browser)
  try {
    const embeddingResponse = await fetch('/api/ai/embed', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: content })
    });

    if (!embeddingResponse.ok) {
      console.warn('[PINECONE] Embedding failed:', embeddingResponse.status);
      return null;
    }

    const embeddingData = await embeddingResponse.json();
    const embedding = embeddingData.embedding;

    const response = await fetch('/api/pinecone/query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ vector: embedding })
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    if (data.matches && data.matches.length > 0) {
      // Retornar descrição do estilo similar como contexto
      const match = data.matches[0];
      const meta = match.metadata || {};
      return `Similar Style: ${meta.name || 'Unknown'} | Colors: ${meta.colors || 'N/A'} | Cover: ${meta.coverDesc || 'N/A'} | Content: ${meta.contentDesc || 'N/A'} | CTA: ${meta.ctaDesc || 'N/A'} | Extra: ${meta.extraInstructions || 'N/A'}`;
    }
    return null;
  } catch (err) {
    console.warn('[PINECONE] Query failed:', err);
    return null;
  }
}

export async function extractStyleFromImages(categorized: CategorizedImages, name: string, metadata?: StyleMetadata): Promise<StyleData> {
  const [cover, content, cta] = await Promise.all([
    analyzeCategory(categorized.cover, "Cover (Capa)"),
    analyzeCategory(categorized.content, "Content (Meio)"),
    analyzeCategory(categorized.cta, "CTA (Último Slide)")
  ]);

  return {
    id: Date.now().toString(),
    name,
    cover,
    content,
    cta,
    metadata
  };
}

export interface DraftResponse {
  slides: SlideContent[];
  managerFeedback: string;
}

export async function draftCarouselContent(
  content: string,
  style: StyleData,
  onProgress?: (status: string) => void
): Promise<DraftResponse> {
  // Usar o SkillOrchestrator ao invés de agentes diretos
  return skillOrchestrator.draftCarouselContent(content, style, onProgress);
}

export async function refineCarouselContent(
  draftSlides: SlideContent[],
  managerFeedback: string,
  userConsiderations: string,
  style: StyleData,
  onProgress?: (status: string) => void
): Promise<DraftResponse> {
  // Usar o SkillOrchestrator ao invés de agentes diretos
  return skillOrchestrator.refineCarouselContent(draftSlides, managerFeedback, userConsiderations, style, onProgress);
}

export async function generateSlideImage(
  prompt: string,
  style: StyleData,
  slideType: 'cover' | 'content' | 'cta',
  slideTitle?: string,
  slideText?: string
): Promise<string> {
  // Debug: verificar se styleDNA está presente
  const hasStyleDNA = !!style.styleDNA;
  const dnaKeys = hasStyleDNA ? Object.keys(style.styleDNA) : [];
  const hasAssets = !!style.assets?.logo || !!style.assets?.background;
  console.log(`[IMAGE DEBUG] style.styleDNA exists: ${hasStyleDNA}, keys: ${dnaKeys.join(',')}, hasAssets: ${hasAssets}, slideType: ${slideType}`);

  // Verificar se o estilo tem Style DNA armazenado
  const styleDNA = style.styleDNA?.[slideType];

  // Obter assets do estilo (logo e background)
  const logoBase64 = style.assets?.logo || undefined;
  const backgroundBase64 = style.assets?.background || undefined;

  let fullPrompt: string;

  // PRIORIDADE 1: Se o prompt JÁ contém imagePrompt do DesignerSkill, usá-lo como base
  // e enriquecer com DNA specs para fidelidade máxima
  const isDesignerPrompt = prompt.length > 100 && (
    prompt.includes('STYLE DNA') ||
    prompt.includes('generatedVisualPrompt') ||
    prompt.includes('720x960') ||
    prompt.includes('[STYLE DNA')
  );

  if (styleDNA && slideTitle && slideText) {
    // USAR STYLE DNA - Gera prompt ultra-detalhado integrado com prompt-expansion
    const slideNum = slideType === 'cover' ? 1 : slideType === 'cta' ? 4 : 2;
    fullPrompt = generateImagePromptFromDNA(
      styleDNA,
      prompt,
      slideType,
      logoBase64,
      backgroundBase64,
      {
        colors: style.metadata?.colors,
        extraInstructions: style.metadata?.extraInstructions
      },
      slideNum,
      slideTitle,
      slideText
    );
    const promptLen = fullPrompt.length;
    console.log(`[IMAGE] Using Style DNA for ${slideType}: ${styleDNA.dominantColors.length} colors, ${styleDNA.backgroundStyle.type} bg, logo: ${!!logoBase64}, bg: ${!!backgroundBase64}, prompt: ${promptLen} chars`);
  } else {
    // FALLBACK INTELIGENTE: Usa assets reais, cores do StyleDNA e instruções do estilo
    // CORREÇÃO BUG #2: NÃO usa optimized-prompts.ts hardcoded - usa dados reais do estilo

    // Tentar enriquecer com estilos similares do Pinecone
    let pineconeContext = '';
    try {
      const similarStyle = await queryStyleFromPinecone(
        `${style.name} ${style.metadata?.audience || ''} ${style.metadata?.colors || ''} ${style[slideType]?.styleDescription || ''}`
      );
      if (similarStyle) {
        pineconeContext = `\n\nREFERENCE FROM SIMILAR STYLE:\n${similarStyle}`;
        console.log(`[IMAGE] Enhanced with Pinecone similar style context (${similarStyle.length} chars)`);
      }
    } catch (err) {
      console.warn('[IMAGE] Pinecone context query failed, using basic fallback:', err);
    }

    // Usar descrições de estilo do objeto style
    let activeStyle = style[slideType];
    if (!activeStyle || !activeStyle.styleDescription) {
      activeStyle = style.content;
    }
    if (!activeStyle || !activeStyle.styleDescription) {
      activeStyle = style.cover;
    }
    if (!activeStyle || !activeStyle.styleDescription) {
      activeStyle = style.cta;
    }

    const styleDescription = activeStyle?.styleDescription || '';
    const brandColors = style.metadata?.colors || '';
    const extraInstructions = style.metadata?.extraInstructions || '';
    const styleName = style.name || 'Custom Style';
    const mood = (style.metadata as any)?.mood || 'estrategico';

    // CORREÇÃO BUG #2: Extrair cores do StyleDNA se disponível (prioridade sobre hardcoded)
    const styleDNAData = style.styleDNA?.[slideType];
    let bgColor = '#FFFFFF';
    let accentColor = '#6366F1';
    let textColor = '#1E293B';
    let colorPaletteDesc = '';

    if (styleDNAData && styleDNAData.dominantColors && styleDNAData.dominantColors.length > 0) {
      // Usar cores extraídas das imagens de referência (prioridade máxima)
      const bgCol = styleDNAData.dominantColors.find(c => c.role === 'background');
      const accCol = styleDNAData.dominantColors.find(c => c.role === 'accent' || c.role === 'primary');
      const txtCol = styleDNAData.dominantColors.find(c => c.role === 'text');

      if (bgCol) bgColor = bgCol.hex;
      if (accCol) accentColor = accCol.hex;
      if (txtCol) textColor = txtCol.hex;

      colorPaletteDesc = `
EXACT COLOR PALETTE (extracted from brand reference images):
${styleDNAData.dominantColors.map(c => `- ${c.role.toUpperCase()}: ${c.hex} (${c.percentage}% of design)`).join('\n')}
USE THESE COLORS EXACTLY - they are the brand's actual colors, not guesses.`;
    } else if (brandColors) {
      // Usar cores da metadata se não há DNA
      const hexCodes = brandColors.match(/#[0-9A-Fa-f]{6}/g) || [];
      if (hexCodes.length >= 1) bgColor = hexCodes[0];
      if (hexCodes.length >= 2) accentColor = hexCodes[1];
      if (hexCodes.length >= 3) textColor = hexCodes[2];
      colorPaletteDesc = `\nBRAND COLORS (from style metadata): ${brandColors}`;
    }

    // CORREÇÃO BUG #2: Montar prompt com assets REAIS (não genéricos)
    const logoSection = logoBase64
      ? `\nBRAND LOGO: A custom brand logo is available (base64 encoded). The logo MUST be embedded in the top-right corner of the image, medium size, always visible but discreet. This is the ACTUAL brand logo, not a placeholder.`
      : `\nBRAND LOGO: No custom logo available. Use a clean, professional accounting logo placeholder in the top-right corner.`;

    const backgroundSection = backgroundBase64
      ? `\nBACKGROUND: A custom brand background image is available (base64 encoded). This background MUST be used as the full slide background. Ensure text remains readable with proper contrast (add overlay if needed). This is the ACTUAL brand background, not a generic color.`
      : `\nBACKGROUND: No custom background image. Use solid color only: ${bgColor}. No gradients, no textures, no patterns.`;

    const negativePromptSection = styleDNAData?.negativePrompt
      ? `\nSTRICTLY AVOID (negative constraints from brand analysis):\n${styleDNAData.negativePrompt}`
      : '';

    const dnaVisualElements = styleDNAData ? `
VISUAL STYLE (extracted from brand references):
- Layout: ${styleDNAData.layoutPattern.type} composition, ${styleDNAData.layoutPattern.alignment} alignment
- Typography: ${styleDNAData.typographyStyle.fontFamily} font, ${styleDNAData.typographyStyle.weight} weight, ${styleDNAData.typographyStyle.treatment}
- Elements: ${styleDNAData.visualElements.hasIcons ? `${styleDNAData.visualElements.iconStyle} icons` : 'No icons'}${styleDNAData.visualElements.hasDecorativeShapes ? `, ${styleDNAData.visualElements.shapeLanguage} shapes` : ''}${styleDNAData.visualElements.hasGradients ? ', gradients' : ', NO gradients'}${styleDNAData.visualElements.hasShadows ? ', soft shadows' : ', NO shadows'}
- Background style: ${styleDNAData.backgroundStyle.type}, ${styleDNAData.backgroundStyle.complexity}, ${styleDNAData.backgroundStyle.dominantTone} tone
- Mood: ${Object.entries(styleDNAData.mood).filter(([, v]) => (v as number) > 60).map(([k, v]) => `${k} (${v}%)`).join(', ')}
` : '';

    fullPrompt = `Instagram carousel ${slideType} slide (720x960px, 3:4 ratio) for brand "${styleName}":

${logoSection}
${backgroundSection}
${colorPaletteDesc}
${dnaVisualElements}
${extraInstructions ? `\nADDITIONAL BRAND INSTRUCTIONS:\n${extraInstructions}` : ''}
${styleDescription ? `\nSTYLE DESCRIPTION:\n${styleDescription}` : ''}
${negativePromptSection}
${pineconeContext}

MANDATORY ELEMENTS:
1. ALL TEXT IN BRAZILIAN PORTUGUESE (PT-BR) - NEVER use English in the final image
2. Title: "${slideTitle || prompt}"
3. Body text: "${slideText || ''}"
4. Footer text: "Conteúdo completo em AlfaContabilidadeCariri.com.br" (bottom center, small, #6B7280)

CRITICAL: Match the brand style EXACTLY. Same colors, same layout pattern, same typography treatment. Do NOT create a generic design - replicate the visual DNA of the brand references.`;

    console.log(`[IMAGE] FALLBACK+ with real assets for ${slideType}: logo=${!!logoBase64}, bg=${!!backgroundBase64}, dna=${!!styleDNAData}, colors=${colorPaletteDesc.length > 30 ? 'from_DNA' : brandColors ? 'from_metadata' : 'defaults'} (${fullPrompt.length} chars)`);
  }

  return generateAiImage(fullPrompt);
}
