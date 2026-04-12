/**
 * ============================================================================
 * ORQUESTRADOR DE GERAÇÃO COM PADRÃO RIGOROSO
 * ============================================================================
 * 
 * Este serviço garante que TODA geração de carrossel siga o padrão rigoroso:
 * 1. Usa modelos de aprendizado para analisar referências
 * 2. Usa modelos de criação com hierarquia visual detalhada
 * 3. Integra com Nano Banana respeitando limites gratuitos
 * 4. Considera aprendizado anterior (StyleDNA, Pinecone, feedback)
 * 5. Garante consistência visual entre CAPA/MEIO/CTA
 * 
 * FLUXO RIGOROSO:
 * CAPA (Slide 1): Modelo rigoroso de capa + Nano Banana (prioridade alta)
 * MEIO (Slides 2-3): Modelo rigoroso de meio + fallback inteligente
 * CTA (Slide 4): Modelo rigoroso de CTA + Nano Banana se disponível
 */

import { 
  modelosCriacaoRigorosos, 
  modelosAprendizadoRigorosos,
  preencherModeloCriacao,
  gerarVariaveisDefaultCriacao,
  TipoSlide 
} from '../config/modelos-rigorosos-capas-meio-cta';
import { 
  generateImageWithNanoBanana,
  decidirModeloImagem,
  getNanoBananaStatus 
} from './nano-banana-manager';
import { StyleDNA } from './styleDNA';

export interface CarouselGenerationConfig {
  style: {
    name: string;
    cover: {
      styleDescription: string;
      imagesBase64: string[];
      styleDNA?: StyleDNA;
    };
    content: {
      styleDescription: string;
      imagesBase64: string[];
      styleDNA?: StyleDNA;
    };
    cta: {
      styleDescription: string;
      imagesBase64: string[];
      styleDNA?: StyleDNA;
    };
    assets?: {
      logo?: string;
      background?: string;
    };
    metadata?: {
      colors?: string;
      extraInstructions?: string;
      mood?: string;
    };
  };
  content: {
    slide1: {
      title: string;
      text: string;
    };
    slide2: {
      title: string;
      text: string;
    };
    slide3: {
      title: string;
      text: string;
    };
    slide4: {
      title: string;
      text: string;
    };
  };
  customVariables?: Record<string, string>;
}

export interface GeneratedSlide {
  slideNumber: number;
  slideType: 'cover' | 'content' | 'cta';
  imagePrompt: string;
  imageUrl: string;
  modelUsed: string;
  success: boolean;
  title: string;
  text: string;
}

export interface CarouselGenerationResult {
  slides: GeneratedSlide[];
  nanoBananaUsage: {
    used: number;
    remaining: number;
    total: number;
  };
  modelsUsed: {
    cover: string;
    content: string[];
    cta: string;
  };
  success: boolean;
  errors: string[];
}

/**
 * Gera um prompt rigoroso para um slide específico
 */
export function gerarPromptRigoroso(
  slideType: TipoSlide,
  slideNumber: number,
  content: { title: string; text: string },
  style: CarouselGenerationConfig['style'],
  customVariables?: Record<string, string>
): string {
  console.log(`[PROMPT RIGOROSO] Generating ${slideType} slide ${slideNumber}`);
  
  // 1. Obter variáveis default
  const defaultVars = gerarVariaveisDefaultCriacao(slideType);
  
  // 2. Merge com variáveis customizadas
  const variables = { ...defaultVars, ...customVariables };
  
  // 3. Enriquecer com StyleDNA se disponível
  const slideDNA = style[slideType]?.styleDNA;
  if (slideDNA) {
    // Extrair cores do DNA
    const bgColor = slideDNA.dominantColors.find(c => c.role === 'background');
    const accentColor = slideDNA.dominantColors.find(c => c.role === 'accent');
    const textColor = slideDNA.dominantColors.find(c => c.role === 'text');
    
    if (bgColor) {
      variables.COR_FUNDO = `${bgColor.hex}`;
      variables.COR_FUNDO_HEX = bgColor.hex;
    }
    if (accentColor) {
      variables.COR_TARJAS = `${accentColor.hex}`;
      variables.COR_BOTAO = accentColor.hex;
      variables.COR_BOTAO_HEX = accentColor.hex;
    }
    if (textColor) {
      variables.COR_TEXTO_TARJAS = textColor.hex;
      variables.COR_TITULO = textColor.hex;
    }
    
    // Extrair padrão do fundo
    if (slideDNA.backgroundStyle.type === 'solid') {
      variables.PADRAO_FUNDO = 'motherboard traces';
    }
  }
  
  // 4. Enriquecer com metadata do estilo
  if (style.metadata?.colors) {
    const hexCodes = style.metadata.colors.match(/#[0-9A-Fa-f]{6}/g);
    if (hexCodes && hexCodes.length > 0) {
      variables.COR_FUNDO_HEX = hexCodes[0];
    }
  }
  
  // 5. Adicionar instruções extras
  if (style.metadata?.extraInstructions) {
    variables.ESTILO_FINAL = `${variables.ESTILO_FINAL}\n\nADDITIONAL STYLE INSTRUCTIONS:\n${style.metadata.extraInstructions}`;
  }
  
  // 6. Customizar conteúdo específico do slide
  if (slideType === 'capa') {
    variables.TEXTO_ELEMENTO_TOPO = content.title.substring(0, 30).toUpperCase();
    variables.LINHAS_TARJA_DETALHADAS = formatarTarjasParaCapa(content.text);
  } else if (slideType === 'meio') {
    variables.NUMERO_SLIDE = slideNumber.toString();
    variables.LINHAS_TITULO_DETALHADAS = `Linha 1: "${content.title}" em fonte Roboto Black, cor cinza escuro, tamanho 8% da altura`;
    variables.DESCRICAO_CORPO_CONTEUDO = formatarCorpoParaMeio(content.text);
  } else if (slideType === 'cta') {
    variables.TEXTO_TITULO_CTA = content.title;
    variables.DESCRICAO_BENEFICIOS = formatarBeneficiosParaCTA(content.text);
  }
  
  // 7. Preencher modelo rigoroso
  const prompt = preencherModeloCriacao(slideType, variables);
  
  console.log(`[PROMPT RIGOROSO] Generated ${slideType} prompt: ${prompt.length} chars`);
  
  return prompt;
}

/**
 * Formata texto em tarjas para capa
 */
function formatarTarjasParaCapa(text: string): string {
  // Divide texto em até 4 linhas com destaque progressivo
  const parts = text.split(/[,.]/).filter(Boolean).slice(0, 4);
  
  let linhas = '';
  for (let i = 0; i < 4; i++) {
    const part = parts[i] || `Linha ${i + 1}`;
    const destaque = i === 1 ? ' (A palavra principal deve ser colossal)' :
                     i === 2 ? ' (Em negrito extra)' :
                     i === 3 ? ' (Colossal e esticada na tarja)' : '';
    linhas += `Linha ${i + 1}: '${part.trim()}'${destaque}\n`;
  }
  
  return linhas.trim();
}

/**
 * Formata conteúdo para slide de meio
 */
function formatarCorpoParaMeio(text: string): string {
  const items = text.split(/[,.;]/).filter(Boolean).slice(0, 3);
  
  return `Lista com ${items.length} itens usando bullets check verde #10B981:
${items.map((item, i) => `- Item ${i + 1}: '✓ ${item.trim()}'`).join('\n')}
- Fonte: Inter Regular, cor cinza escuro #374151, tamanho 4% da altura
- Espaçamento entre itens: 16px
- Alinhamento: à esquerda`;
}

/**
 * Formata benefícios para CTA
 */
function formatarBeneficiosParaCTA(text: string): string {
  const items = text.split(/[,.;]/).filter(Boolean).slice(0, 3);
  
  return `Abaixo do título, ${items.length} benefícios em lista vertical com checks:
${items.map((item, i) => `- ✓ "${item.trim()}"`).join('\n')}
- Fonte: Inter Medium, cor cinza escuro #374151, tamanho 5% da altura
- Espaçamento: 20px generoso
- Alinhamento: centralizado`;
}

/**
 * Gera carrossel completo com padrão rigoroso
 */
export async function gerarCarrosselRigoroso(
  config: CarouselGenerationConfig
): Promise<CarouselGenerationResult> {
  console.log('[CARROSSEL RIGOROSO] Starting generation with strict pattern');
  
  const slides: GeneratedSlide[] = [];
  const errors: string[] = [];
  const modelsUsed = {
    cover: '',
    content: [] as string[],
    cta: '',
  };
  
  // SLIDE 1: CAPA
  try {
    console.log('[CARROSSEL RIGOROSO] Generating COVER (Slide 1)');
    
    const coverPrompt = gerarPromptRigoroso(
      'capa',
      1,
      config.content.slide1,
      config.style,
      config.customVariables
    );
    
    const coverResult = await generateImageWithNanoBanana(
      coverPrompt,
      'cover',
      1
    );
    
    modelsUsed.cover = coverResult.model;
    
    slides.push({
      slideNumber: 1,
      slideType: 'cover',
      imagePrompt: coverPrompt,
      imageUrl: coverResult.imageUrl,
      modelUsed: coverResult.model,
      success: coverResult.success,
      title: config.content.slide1.title,
      text: config.content.slide1.text,
    });
    
    if (!coverResult.success) {
      errors.push('Cover slide generation failed');
    }
  } catch (error) {
    console.error('[CARROSSEL RIGOROSO] Cover error:', error);
    errors.push(`Cover error: ${error instanceof Error ? error.message : String(error)}`);
  }
  
  // SLIDE 2: CONTEÚDO 1
  try {
    console.log('[CARROSSEL RIGOROSO] Generating CONTENT 1 (Slide 2)');
    
    const content1Prompt = gerarPromptRigoroso(
      'meio',
      2,
      config.content.slide2,
      config.style,
      config.customVariables
    );
    
    const content1Result = await generateImageWithNanoBanana(
      content1Prompt,
      'content',
      2
    );
    
    modelsUsed.content.push(content1Result.model);
    
    slides.push({
      slideNumber: 2,
      slideType: 'content',
      imagePrompt: content1Prompt,
      imageUrl: content1Result.imageUrl,
      modelUsed: content1Result.model,
      success: content1Result.success,
      title: config.content.slide2.title,
      text: config.content.slide2.text,
    });
  } catch (error) {
    console.error('[CARROSSEL RIGOROSO] Content 1 error:', error);
    errors.push(`Content 1 error: ${error instanceof Error ? error.message : String(error)}`);
  }
  
  // SLIDE 3: CONTEÚDO 2
  try {
    console.log('[CARROSSEL RIGOROSO] Generating CONTENT 2 (Slide 3)');
    
    const content2Prompt = gerarPromptRigoroso(
      'meio',
      3,
      config.content.slide3,
      config.style,
      config.customVariables
    );
    
    const content2Result = await generateImageWithNanoBanana(
      content2Prompt,
      'content',
      3
    );
    
    modelsUsed.content.push(content2Result.model);
    
    slides.push({
      slideNumber: 3,
      slideType: 'content',
      imagePrompt: content2Prompt,
      imageUrl: content2Result.imageUrl,
      modelUsed: content2Result.model,
      success: content2Result.success,
      title: config.content.slide3.title,
      text: config.content.slide3.text,
    });
  } catch (error) {
    console.error('[CARROSSEL RIGOROSO] Content 2 error:', error);
    errors.push(`Content 2 error: ${error instanceof Error ? error.message : String(error)}`);
  }
  
  // SLIDE 4: CTA
  try {
    console.log('[CARROSSEL RIGOROSO] Generating CTA (Slide 4)');
    
    const ctaPrompt = gerarPromptRigoroso(
      'cta',
      4,
      config.content.slide4,
      config.style,
      config.customVariables
    );
    
    const ctaResult = await generateImageWithNanoBanana(
      ctaPrompt,
      'cta',
      4
    );
    
    modelsUsed.cta = ctaResult.model;
    
    slides.push({
      slideNumber: 4,
      slideType: 'cta',
      imagePrompt: ctaPrompt,
      imageUrl: ctaResult.imageUrl,
      modelUsed: ctaResult.model,
      success: ctaResult.success,
      title: config.content.slide4.title,
      text: config.content.slide4.text,
    });
  } catch (error) {
    console.error('[CARROSSEL RIGOROSO] CTA error:', error);
    errors.push(`CTA error: ${error instanceof Error ? error.message : String(error)}`);
  }
  
  // Status do Nano Banana
  const nanoStatus = getNanoBananaStatus();
  
  const result: CarouselGenerationResult = {
    slides,
    nanoBananaUsage: {
      used: nanoStatus.requestsUsed,
      remaining: nanoStatus.requestsRemaining,
      total: nanoStatus.monthlyLimit,
    },
    modelsUsed,
    success: slides.filter(s => s.success).length > 0,
    errors,
  };
  
  console.log('[CARROSSEL RIGOROSO] Generation complete:', {
    totalSlides: slides.length,
    successfulSlides: slides.filter(s => s.success).length,
    nanoBananaUsed: result.nanoBananaUsage.used,
    modelsUsed,
    errors: errors.length,
  });
  
  return result;
}

/**
 * Aprende com feedback do usuário e atualiza estilo
 */
export function aprenderComFeedbackRigoroso(
  slideType: 'cover' | 'content' | 'cta',
  feedback: 'approved' | 'rejected',
  comment: string,
  currentStyle: CarouselGenerationConfig['style']
): CarouselGenerationConfig['style'] {
  console.log(`[APRENDIZADO RIGOROSO] ${slideType} ${feedback}: ${comment}`);
  
  // Se rejeitado, adicionar instruções para evitar problema no futuro
  if (feedback === 'rejected' && comment) {
    const extraInstructions = currentStyle.metadata?.extraInstructions || '';
    const newInstructions = `\n\nFEEDBACK LEARNED (${slideType}):\n- User rejected: "${comment}"\n- AVOID this in future generations\n- Adjust style accordingly`;
    
    return {
      ...currentStyle,
      metadata: {
        ...currentStyle.metadata,
        extraInstructions: extraInstructions + newInstructions,
      },
    };
  }
  
  return currentStyle;
}

export default {
  gerarPromptRigoroso,
  gerarCarrosselRigoroso,
  aprenderComFeedbackRigoroso,
};
