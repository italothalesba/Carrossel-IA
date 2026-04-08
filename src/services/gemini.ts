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

async function analyzeCategory(ai: any, images: string[], categoryName: string): Promise<SlideStyleDetail> {
  if (!images || images.length === 0) return { imagesBase64: [], styleDescription: "" };
  
  const imageParts = images.map((base64: string) => ({
    inlineData: {
      data: base64.split(',')[1],
      mimeType: base64.split(',')[0].split(':')[1].split(';')[0],
    }
  }));

  const response = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: {
      parts: [
        ...imageParts,
        { text: `Analyze these reference images for a carousel ${categoryName} slide. Provide a highly detailed prompt describing their exact visual style, layout structure, text placement areas, color palette (with hex codes), lighting, and mood. This description will be used to instruct an AI image generator to replicate this exact style for a ${categoryName} slide. Be extremely descriptive about the aesthetics and composition.` }
      ]
    }
  });

  return { imagesBase64: images, styleDescription: response.text || "" };
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
You are an expert AI design assistant.
We are refining a visual style named "${style.name}".

Current ${slideType} style description:
${style[slideType].styleDescription}

Current brand extra instructions:
${style.metadata?.extraInstructions || 'None'}

The user generated a ${slideType} slide and gave this feedback:
Status: ${status.toUpperCase()}
User Comment: "${comment}"

Analyze the feedback. If REJECTED, add strict negative constraints or correct the style description to prevent this issue. If APPROVED, reinforce the positive aspects mentioned.

Return a JSON object with the updated fields:
{
  "updatedStyleDescription": "The new, refined style description for this slide type.",
  "updatedExtraInstructions": "The new, refined extra instructions for the brand (keep existing ones and add new ones if needed)."
}
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
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

export async function extractStyleFromImages(categorized: CategorizedImages, name: string, metadata?: StyleMetadata): Promise<StyleData> {
  const ai = getAi();
  
  const [cover, content, cta] = await Promise.all([
    analyzeCategory(ai, categorized.cover, "Cover (Capa)"),
    analyzeCategory(ai, categorized.content, "Content (Meio)"),
    analyzeCategory(ai, categorized.cta, "CTA (Último Slide)")
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
    model: "gemini-3.1-pro-preview",
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
      model: "gemini-3.1-pro-preview",
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
  if (onProgress) onProgress("Agente Designer: Definindo visual de cada slide (foco em cores sólidas)...");
  slides = await Promise.all(slides.map(async (slide, index) => {
    const prompt = `Você é um Diretor de Arte Sênior.
O usuário relatou problemas com "cores de background embaralhadas".
Sua tarefa é escrever um 'imagePrompt' detalhado para este slide.
Regra 1: Defina UMA cor de background principal e clara baseada no Style Context. NÃO misture cores no fundo.
Regra 2: Siga rigorosamente o Style Context.
Regra 3: O prompt deve ser em inglês para o gerador de imagens.

Style Context:
${styleContext}

Slide ${index + 1} Content:
Title: ${slide.title}
Text: ${slide.text}

Retorne um JSON apenas com o 'imagePrompt' atualizado.`;
    const res = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
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
    model: "gemini-3.1-pro-preview",
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

  const prompt = `Você é o "Gerente Topzão" de Qualidade.
O usuário revisou o rascunho do carrossel e deixou as seguintes considerações:
"${userConsiderations}"

Feedback anterior do gerente:
"${managerFeedback}"

Slides atuais:
${JSON.stringify(draftSlides, null, 2)}

Sua tarefa:
1. Aplique as considerações do usuário aos slides (textos ou prompts de imagem).
2. Garanta que a ortografia continue impecável e as cores de background não se embaralhem.
3. Forneça um novo feedback confirmando as alterações.

CRITICAL INSTRUCTION: You MUST return EXACTLY 4 slides in the 'slides' array. Do not return 1 slide. Return all 4 slides.

Retorne um JSON com:
{
  "slides": [array com EXATAMENTE 4 slides atualizados],
  "managerFeedback": "Seu novo feedback para o usuário"
}`;

  const res = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
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
  if (!activeStyle || activeStyle.imagesBase64.length === 0) {
    activeStyle = style.content;
  }
  if (!activeStyle || activeStyle.imagesBase64.length === 0) {
    activeStyle = style.cover;
  }
  if (!activeStyle || activeStyle.imagesBase64.length === 0) {
    activeStyle = style.cta;
  }

  const imageParts = (activeStyle.imagesBase64 || []).map((base64: string) => ({
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

  const styleInstruction = activeStyle.styleDescription 
    ? `\n\nCRITICAL INSTRUCTION: You MUST strictly follow this visual style for a ${slideType} slide:\n${activeStyle.styleDescription}\n\nBrand Colors to use: ${style.metadata?.colors || 'Follow reference images'}\nExtra Instructions: ${style.metadata?.extraInstructions || 'None'}${assetInstructions}\n\n${imageParts.length > 0 ? 'Use the provided reference images and assets as a visual guide for the exact aesthetic, colors, and layout.' : 'Follow the style description strictly to maintain visual consistency.'}`
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
        aspectRatio: "3:4"
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
