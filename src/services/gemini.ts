import { GoogleGenAI, Type } from "@google/genai";

function getAi(needsPaidKey: boolean = false) {
  let apiKey;
  
  if (needsPaidKey) {
    try {
      // @ts-ignore
      apiKey = process.env.API_KEY;
    } catch (e) {
      // ignore
    }
    if (!apiKey) {
      throw new Error("Paid API Key is missing. Please select it in the UI.");
    }
  } else {
    try {
      // @ts-ignore
      apiKey = process.env.GEMINI_API_KEY;
    } catch (e) {
      // ignore
    }
    if (!apiKey) {
      try {
        // @ts-ignore
        apiKey = process.env.API_KEY;
      } catch (e) {
        // ignore
      }
    }
    if (!apiKey) {
      throw new Error("API Key is missing.");
    }
  }
  
  return new GoogleGenAI({ apiKey });
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
}

export interface SlideContent {
  title: string;
  text: string;
  imagePrompt: string;
}

async function incrementalLearnStyle(
  ai: any,
  image: string,
  category: string,
  currentDescription: string
): Promise<string> {
  const imagePart = {
    inlineData: {
      data: image.split(',')[1],
      mimeType: image.split(',')[0].split(':')[1].split(';')[0],
    }
  };

  const prompt = `
AJA COMO UM DIRETOR DE ARTE E DESIGNER GRÁFICO SÊNIOR.
Sua tarefa é realizar um aprendizado incremental de estilo visual para um slide de ${category.toUpperCase()}.

ESTRUTURA ATUAL APRENDIDA:
${currentDescription || "Nenhuma descrição prévia."}

INSTRUÇÃO:
Analise a nova imagem de referência fornecida e ACRESCENTE detalhes à descrição acima. Você deve ser 100% preciso e rigoroso, nunca esquecendo o que já foi aprendido, apenas somando novas nuances, texturas, regras de composição e detalhes técnicos.

Siga rigorosamente esta hierarquia visual para a descrição consolidada:
1. FUNDO E NEGATIVO: Detalhes de cores, padrões (ex: motherboard traces), marcas d'água translúcidas.
2. ELEMENTO TOPO: Texturas realistas (metal, ferrugem), formas, tipografia interna.
3. TARJAS DE MENSAGEM: Cores exatas, fontes, regras de escalonamento para impacto psicológico.
4. PONTO FOCAL CENTRAL: Metáforas visuais, mistura de Flat Vector e Realismo Macro.
5. PARTÍCULAS E ÍCONES: Elementos flutuantes, transparências, volumes.
6. RODAPÉ INSTITUCIONAL: Formatos (pill form), ícones 3D, tipografia minimalista.

ESTILO FINAL: Especifique separação entre elementos, balanço vertical e nitidez 8k.

Retorne APENAS a descrição de estilo consolidada, ultra-detalhada e técnica em Português.
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: {
      parts: [imagePart, { text: prompt }]
    }
  });

  return response.text || currentDescription;
}

export async function embedText(text: string): Promise<number[]> {
  const ai = getAi();
  const result = await ai.models.embedContent({
    model: 'gemini-embedding-2-preview',
    contents: text,
  });
  
  if (result.embeddings && result.embeddings.length > 0) {
    return result.embeddings[0].values;
  }
  throw new Error("Failed to generate embeddings");
}

export async function learnFromFeedback(
  style: StyleData,
  slideType: 'cover' | 'content' | 'cta',
  status: 'approved' | 'rejected',
  comment: string
): Promise<StyleData> {
  const ai = getAi();
  const prompt = `
AJA COMO UM DIRETOR DE ARTE E DESIGNER GRÁFICO SÊNIOR.
Estamos refinando o aprendizado visual do estilo "${style.name}" para o tipo de slide: ${slideType.toUpperCase()}.

DESCRIÇÃO ATUAL DO ESTILO (${slideType}):
${style[slideType].styleDescription}

INSTRUÇÕES EXTRAS DA MARCA:
${style.metadata?.extraInstructions || 'Nenhuma'}

FEEDBACK DO USUÁRIO:
Status: ${status.toUpperCase()}
Comentário: "${comment}"

SUA TAREFA:
1. Analise o feedback. Se REPROVADO, identifique o que falhou na hierarquia visual (Fundo, Elemento Topo, Tarjas, Ponto Focal, Partículas ou Rodapé) e adicione restrições negativas rigorosas.
2. Se APROVADO, reforce os elementos que funcionaram, mantendo a estrutura de "Diretor de Arte Sênior".
3. Mantenha a descrição focada em:
   - Hierarquia Visual (1 a 6).
   - Contraste entre Vetor Flat e Fotografia Macro.
   - Tipografia de impacto psicológico.

Retorne um JSON:
{
  "updatedStyleDescription": "A nova descrição refinada seguindo o padrão rigoroso.",
  "updatedExtraInstructions": "Novas instruções extras consolidadas."
}
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-flash-latest',
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
    }
  });

  const text = response.text;
  if (!text) throw new Error("Failed to generate feedback response");
  
  const result = JSON.parse(text);
  
  const updatedStyle = { ...style };
  updatedStyle[slideType] = {
    ...updatedStyle[slideType],
    styleDescription: result.updatedStyleDescription
  };
  
  updatedStyle.metadata = {
    ...updatedStyle.metadata,
    extraInstructions: result.updatedExtraInstructions
  };
  
  return updatedStyle;
}

export async function upsertStyleToPinecone(style: StyleData) {
  const combinedDescription = `
    Style Name: ${style.name}
    Audience: ${style.metadata?.audience || 'General'}
    Tone: ${style.metadata?.tone || 'Neutral'}
    Brand Colors: ${style.metadata?.colors || 'Not specified'}
    Extra Instructions: ${style.metadata?.extraInstructions || 'None'}
    Cover Style: ${style.cover.styleDescription}
    Content Style: ${style.content.styleDescription}
    CTA Style: ${style.cta.styleDescription}
  `;
  
  const embedding = await embedText(combinedDescription);
  
  const response = await fetch('/api/pinecone/upsert', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id: style.id,
      values: embedding,
      metadata: {
        name: style.name,
        audience: style.metadata?.audience || '',
        tone: style.metadata?.tone || '',
        colors: style.metadata?.colors || '',
        extraInstructions: style.metadata?.extraInstructions || '',
        coverDesc: style.cover.styleDescription,
        contentDesc: style.content.styleDescription,
        ctaDesc: style.cta.styleDescription
      }
    })
  });
  
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || "Failed to upsert to Pinecone");
  }
}

export async function queryStyleFromPinecone(content: string): Promise<string | null> {
  const embedding = await embedText(content);
  
  const response = await fetch('/api/pinecone/query', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ vector: embedding })
  });
  
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || "Failed to query Pinecone");
  }
  
  const data = await response.json();
  if (data.matches && data.matches.length > 0) {
    return data.matches[0].id;
  }
  return null;
}

export async function extractStyleFromImages(
  categorized: CategorizedImages, 
  name: string, 
  metadata?: StyleMetadata,
  onProgress?: (status: string) => void
): Promise<StyleData> {
  const ai = getAi();
  
  const styleData: StyleData = {
    id: Date.now().toString(),
    name,
    cover: { imagesBase64: categorized.cover, styleDescription: "" },
    content: { imagesBase64: categorized.content, styleDescription: "" },
    cta: { imagesBase64: categorized.cta, styleDescription: "" },
    metadata
  };

  const totalImages = categorized.cover.length + categorized.content.length + categorized.cta.length;
  let processedCount = 0;

  const processCategory = async (images: string[], category: 'cover' | 'content' | 'cta', label: string) => {
    for (const img of images) {
      processedCount++;
      if (onProgress) onProgress(`Aprendendo ${label}: Imagem ${processedCount} de ${totalImages}...`);
      styleData[category].styleDescription = await incrementalLearnStyle(
        ai, 
        img, 
        label, 
        styleData[category].styleDescription
      );
    }
  };

  await processCategory(categorized.cover, 'cover', 'Capa');
  await processCategory(categorized.content, 'content', 'Meio');
  await processCategory(categorized.cta, 'cta', 'CTA');

  return styleData;
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
  const ai = getAi();
  
  const styleContext = `
  Audience: ${style.metadata?.audience || 'General'}
  Tone: ${style.metadata?.tone || 'Neutral'}
  Brand Colors: ${style.metadata?.colors || 'Not specified'}
  Extra Instructions: ${style.metadata?.extraInstructions || 'None'}
  Cover Style: ${style.cover.styleDescription}
  Content Style: ${style.content.styleDescription}
  CTA Style: ${style.cta.styleDescription}
  `;

  const schemaConfig = {
    responseMimeType: "application/json",
    responseSchema: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          text: { type: Type.STRING },
          imagePrompt: { type: Type.STRING }
        },
        required: ["title", "text", "imagePrompt"]
      }
    }
  };

  // Agent 1: Diagrammer
  if (onProgress) onProgress("Agente Diagramador: Estruturando o conteúdo em 4 slides...");
  const diagrammerPrompt = `You are an expert Content Diagrammer for Instagram carousels.
Convert the following raw content into a 4-slide carousel structure.
Slide 1: Hook/Title
Slide 2 & 3: Development/Main points
Slide 4: Conclusion/Call to Action

Content:
${content}

Output a JSON array with 4 objects containing 'title', 'text' (concise), and a basic 'imagePrompt'.`;

  const diagrammerResponse = await ai.models.generateContent({
    model: "gemini-flash-latest",
    contents: diagrammerPrompt,
    config: schemaConfig as any
  });
  let slides: SlideContent[] = JSON.parse(diagrammerResponse.text || "[]");

  // Agent 2: Reviewer (Slide by Slide)
  if (onProgress) onProgress("Agente Revisor: Analisando ortografia rigorosamente slide por slide...");
  slides = await Promise.all(slides.map(async (slide, index) => {
    const prompt = `Você é um Revisor Ortográfico Sênior nativo do Brasil.
Revise rigorosamente o texto deste slide. Corrija QUALQUER erro de português, pontuação ou gramática.
Melhore a fluidez, mas mantenha o texto conciso e impactante para redes sociais.
Slide ${index + 1}:
Título: ${slide.title}
Texto: ${slide.text}

Retorne um JSON com 'title' e 'text' corrigidos.`;
    const res = await ai.models.generateContent({
      model: "gemini-flash-latest",
      contents: prompt,
      config: { 
        responseMimeType: "application/json", 
        responseSchema: { 
          type: Type.OBJECT, 
          properties: { title: { type: Type.STRING }, text: { type: Type.STRING } } 
        } 
      }
    });
    const corrected = JSON.parse(res.text || "{}");
    return { ...slide, title: corrected.title || slide.title, text: corrected.text || slide.text };
  }));

  // Agent 3: Designer (Slide by Slide)
  if (onProgress) onProgress("Agente Designer: Aplicando modelos rigorosos de Diretor de Arte...");
  slides = await Promise.all(slides.map(async (slide, index) => {
    let slideType: 'cover' | 'content' | 'cta' = 'content';
    if (index === 0) slideType = 'cover';
    else if (index === slides.length - 1) slideType = 'cta';

    const prompt = `ACT AS A SENIOR ART DIRECTOR AND GRAPHIC DESIGNER. 
Your task is to write a highly detailed 'imagePrompt' in ENGLISH for a ${slideType.toUpperCase()} slide.
The composition must be super clean, employing extreme sharpness (8k) and strictly following this visual hierarchy:

1. BACKGROUND AND NEGATIVE SPACE: Pure white background. Overlaid with an intricate pattern of 'motherboard traces' (printed circuits) in thin reddish-brown/earthy light lines. At the top, as a watermark filling the empty space, reading '[BRAND/CONTEXT]' in gigantic, translucent gray letters (partially cut off at the edges).
2. TOP ELEMENT (MACRO PHOTOGRAPHY / REALISTIC TEXTURE): At the top, hanging, a rectangular yellow plate with rounded edges. The material simulates real metal with signs of heavy rust and wear to provide intense contrast with the rest of the art which is vectorial. Internal text centered: '[KEYWORD]' in solid black Sans-Serif Bold font.
3. MESSAGE STRIPS (SELECTIVE TYPOGRAPHY): Solid Ocher-Yellow (#D49A00) horizontal strips with left alignment. White 'Segoe UI' or 'Roboto' Heavy font. For psychological impact, the typography is scaled:
   - Line 1: [Common Text]
   - Line 2: [IMPACT TEXT 1] (Massive/Colossal)
   - Line 3: [Common Text] [IMPACT TEXT 2] (Extra Bold)
   - Line 4: [Common Text] [IMPACT TEXT 3] (Colossal and stretched across the strip)
4. CENTRAL FOCAL POINT (THE THREAT): Hanging from the top plate by a black metal wire, a Flat vector illustration mixed with macro realism showing a visual metaphor (e.g., a rusted metal fish hook, a digital worm with circuit patterns) that represents the core message.
5. PARTICLES AND ICONS: Floating translucently around the entire central core, dozens of vector '[SYMBOL, e.g., Red Alert/Exclamation]' triangles giving volume to the composition.
6. INSTITUTIONAL FOOTER: At the bottom-left, always maintain the black pill form (black pill form). Inside on the left, a black circle with the '[BRAND SYMBOL, e.g., Alpha (α)]' icon in polished 3D metallic gold texture. Right next to it in the pill: text '[COMPANY NAME, e.g., Alfa Contabilidade]' in minimalist bright white.
7. SEAMLESS PANORAMIC CONNECTION: This is slide ${index + 1} of 4. To create a seamless swiping effect, ensure that a specific visual element (like a thick orange circuit line or a floating metallic wire) exits the RIGHT edge of this slide and enters the LEFT edge of the next slide at the exact same vertical position. This element must visually "complete" the transition between slides.

STYLE AND FINAL PARAMETERS: Sub-pixel scale with obvious separation between Flat Vector and Macro Photography elements (Metal, Rust, Neon). Vertical visual balance. Extreme sharpness, 8k.
--ar 4:5 --v 6.0 --style raw

Style Context to integrate:
${styleContext}

Slide ${index + 1} Content:
Title: ${slide.title}
Text: ${slide.text}

Return a JSON object with the 'imagePrompt' field containing the full, detailed prompt in English.`;
    const res = await ai.models.generateContent({
      model: "gemini-flash-latest",
      contents: prompt,
      config: { 
        responseMimeType: "application/json", 
        responseSchema: { 
          type: Type.OBJECT, 
          properties: { imagePrompt: { type: Type.STRING } } 
        } 
      }
    });
    const designed = JSON.parse(res.text || "{}");
    return { ...slide, imagePrompt: designed.imagePrompt || slide.imagePrompt };
  }));

  // Agent 4: Manager
  if (onProgress) onProgress("Agente Gerente Topzão: Fazendo a revisão geral final...");
  const managerPrompt = `Você é o "Gerente Topzão" de Qualidade.
Revise estes 4 slides (textos e prompts de imagem).
Avalie rigorosamente:
1. A ortografia está impecável (PT-BR)?
2. Os prompts de imagem estão com cores de background consistentes e não embaralhadas?
3. O conteúdo flui bem?

Se encontrar erros, corrija-os diretamente nos slides.
Forneça um feedback crítico, profissional e direto para o usuário sobre o que você achou do resultado e o que ajustou.

CRITICAL INSTRUCTION: You MUST return EXACTLY 4 slides in the 'slides' array. Do not return 1 slide. Return all 4 slides.

Slides atuais:
${JSON.stringify(slides, null, 2)}

Retorne um JSON com:
{
  "slides": [array com EXATAMENTE 4 slides possivelmente corrigidos],
  "managerFeedback": "Seu feedback para o usuário"
}`;

  const managerResponse = await ai.models.generateContent({
    model: "gemini-flash-latest",
    contents: managerPrompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          slides: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: { title: { type: Type.STRING }, text: { type: Type.STRING }, imagePrompt: { type: Type.STRING } },
              required: ["title", "text", "imagePrompt"]
            }
          },
          managerFeedback: { type: Type.STRING }
        },
        required: ["slides", "managerFeedback"]
      }
    }
  });

  return JSON.parse(managerResponse.text || "{}");
}

export async function refineCarouselContent(
  draftSlides: SlideContent[],
  managerFeedback: string,
  userConsiderations: string,
  style: StyleData,
  onProgress?: (status: string) => void
): Promise<DraftResponse> {
  const ai = getAi();
  if (onProgress) onProgress("Agente Gerente Topzão: Aplicando suas considerações...");

  const prompt = `AJA COMO UM DIRETOR DE ARTE E DESIGNER GRÁFICO SÊNIOR.
Você é o "Gerente Topzão" de Qualidade.
O usuário revisou o rascunho do carrossel e deixou as seguintes considerações:
"${userConsiderations}"

Feedback anterior do gerente:
"${managerFeedback}"

Slides atuais:
${JSON.stringify(draftSlides, null, 2)}

Sua tarefa:
1. Aplique as considerações do usuário aos slides (textos ou prompts de imagem).
2. Garanta que a ortografia continue impecável.
3. CRITICAL: For any 'imagePrompt' updates, follow this strict visual hierarchy:
   - BACKGROUND AND NEGATIVE SPACE: Pure white background. Overlaid with an intricate pattern of 'motherboard traces' (printed circuits) in thin reddish-brown/earthy light lines. At the top, as a watermark filling the empty space, reading '[BRAND/CONTEXT]' in gigantic, translucent gray letters (partially cut off at the edges).
   - TOP ELEMENT (MACRO PHOTOGRAPHY / REALISTIC TEXTURE): At the top, hanging, a rectangular yellow plate with rounded edges. The material simulates real metal with signs of heavy rust and wear to provide intense contrast with the rest of the art which is vectorial. Internal text centered: '[KEYWORD]' in solid black Sans-Serif Bold font.
   - MESSAGE STRIPS (SELECTIVE TYPOGRAPHY): Solid Ocher-Yellow (#D49A00) horizontal strips with left alignment. White 'Segoe UI' or 'Roboto' Heavy font. For psychological impact, the typography is scaled (Massive/Colossal/Extra Bold).
   - CENTRAL FOCAL POINT (THE THREAT): Hanging from the top plate by a black metal wire, a Flat vector illustration mixed with macro realism showing a visual metaphor (e.g., a rusted metal fish hook, a digital worm with circuit patterns).
   - PARTICLES AND ICONS: Floating translucently around the entire central core, dozens of vector '[SYMBOL, e.g., Red Alert/Exclamation]' triangles giving volume to the composition.
   - INSTITUTIONAL FOOTER: At the bottom-left, always maintain the black pill form (black pill form). Inside on the left, a black circle with the '[BRAND SYMBOL, e.g., Alpha (α)]' icon in polished 3D metallic gold texture. Right next to it in the pill: text '[COMPANY NAME, e.g., Alfa Contabilidade]' in minimalist bright white.
   - SEAMLESS FLOW: Ensure a continuous visual element (circuit line, wire, or shape) flows from the right edge of one slide to the left edge of the next to create a seamless panoramic effect.
   - FINAL PARAMETERS: Sub-pixel scale with obvious separation between Flat Vector and Macro Photography elements (Metal, Rust, Neon). Vertical visual balance. Extreme sharpness, 8k. End with "--ar 4:5 --v 6.0 --style raw".
4. Forneça um novo feedback confirmando as alterações.

CRITICAL INSTRUCTION: You MUST return EXACTLY 4 slides in the 'slides' array. Do not return 1 slide. Return all 4 slides.

Retorne um JSON com:
{
  "slides": [array com EXATAMENTE 4 slides atualizados],
  "managerFeedback": "Seu novo feedback para o usuário"
}`;

  const res = await ai.models.generateContent({
    model: "gemini-flash-latest",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          slides: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: { title: { type: Type.STRING }, text: { type: Type.STRING }, imagePrompt: { type: Type.STRING } },
              required: ["title", "text", "imagePrompt"]
            }
          },
          managerFeedback: { type: Type.STRING }
        },
        required: ["slides", "managerFeedback"]
      }
    }
  });

  return JSON.parse(res.text || "{}");
}

export async function generateSlideImage(prompt: string, style: StyleData, slideType: 'cover' | 'content' | 'cta'): Promise<string> {
  const ai = getAi();
  
  let activeStyle = style[slideType];
  if (!activeStyle || !activeStyle.imagesBase64 || activeStyle.imagesBase64.length === 0) {
    activeStyle = style.content;
  }
  if (!activeStyle || !activeStyle.imagesBase64 || activeStyle.imagesBase64.length === 0) {
    activeStyle = style.cover;
  }
  if (!activeStyle || !activeStyle.imagesBase64 || activeStyle.imagesBase64.length === 0) {
    activeStyle = style.cta;
  }

  const imageParts = (activeStyle?.imagesBase64 || []).map((base64: string) => ({
    inlineData: {
      data: base64.split(',')[1],
      mimeType: base64.split(',')[0].split(':')[1].split(';')[0],
    }
  }));

  let assetInstructions = "";
  if (style.assets?.logo) {
    imageParts.push({
      inlineData: {
        data: style.assets.logo.split(',')[1],
        mimeType: style.assets.logo.split(',')[0].split(':')[1].split(';')[0],
      }
    });
    assetInstructions += "\n- A LOGO image is provided in the reference images. You MUST include this logo appropriately in the slide.";
  }
  if (style.assets?.background) {
    imageParts.push({
      inlineData: {
        data: style.assets.background.split(',')[1],
        mimeType: style.assets.background.split(',')[0].split(':')[1].split(';')[0],
      }
    });
    assetInstructions += "\n- A BACKGROUND image is provided in the reference images. You MUST use this as the background for the slide.";
  }

  const styleInstruction = activeStyle?.styleDescription 
    ? `\n\nCRITICAL INSTRUCTION: You MUST strictly follow this visual style for a ${slideType} slide:\n${activeStyle?.styleDescription}\n\nBrand Colors to use: ${style.metadata?.colors || 'Follow reference images'}\nExtra Instructions: ${style.metadata?.extraInstructions || 'None'}${assetInstructions}\n\n${imageParts.length > 0 ? 'Use the provided reference images and assets as a visual guide for the exact aesthetic, colors, and layout.' : 'Follow the style description strictly to maintain visual consistency.'}`
    : `\n\nstrictly following the visual style, colors, and layout. Brand Colors: ${style.metadata?.colors || 'Follow reference images'}. Extra Instructions: ${style.metadata?.extraInstructions || 'None'}${assetInstructions}.`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        ...imageParts,
        { text: `Generate an image for a carousel slide based on this prompt: "${prompt}".${styleInstruction}` },
      ],
    },
    config: {
      imageConfig: {
        aspectRatio: "4:5"
      }
    },
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
    }
  }
  
  throw new Error("Failed to generate image");
}
