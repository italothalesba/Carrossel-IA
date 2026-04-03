import { GoogleGenAI, Type } from "@google/genai";

function getAi() {
  let apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    try {
      // @ts-ignore
      apiKey = process.env.API_KEY;
    } catch (e) {
      // ignore
    }
  }
  if (!apiKey) {
    throw new Error("API Key is missing. Please set it in the Secrets panel.");
  }
  return new GoogleGenAI({ apiKey });
}

export interface StyleData {
  id: string;
  name: string;
  imagesBase64: string[];
  embeddings: any;
}

export interface SlideContent {
  title: string;
  text: string;
  imagePrompt: string;
}

export async function extractStyleFromImages(imagesBase64: string[], name: string): Promise<StyleData> {
  const ai = getAi();
  const contents = imagesBase64.map(base64 => ({
    inlineData: {
      data: base64.split(',')[1],
      mimeType: base64.split(',')[0].split(':')[1].split(';')[0],
    }
  }));

  const result = await ai.models.embedContent({
    model: 'gemini-embedding-2-preview',
    contents: contents,
  });

  return {
    id: Date.now().toString(),
    name,
    imagesBase64,
    embeddings: result.embeddings,
  };
}

export async function generateCarouselContent(content: string, style: StyleData): Promise<SlideContent[]> {
  const ai = getAi();
  const imageParts = style.imagesBase64.map(base64 => ({
    inlineData: {
      data: base64.split(',')[1],
      mimeType: base64.split(',')[0].split(':')[1].split(';')[0],
    }
  }));

  const response = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: {
      parts: [
        { text: `Based on the following content and the provided reference images (which represent the desired visual style), generate a 4-slide Instagram carousel.\n\nContent:\n${content}\n\nSlide 1: Hook/Title\nSlide 2 & 3: Development/Main points\nSlide 4: Conclusion/Call to Action\n\nFor each slide, provide a short title, the main text (keep it concise for an image), and a detailed prompt for an AI image generator to create the background/main graphic for this slide, incorporating the visual style seen in the reference images.` },
        ...imageParts
      ]
    },
    config: {
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
    }
  });

  return JSON.parse(response.text || "[]");
}

export async function generateSlideImage(prompt: string, style: StyleData): Promise<string> {
  const ai = getAi();
  const imageParts = style.imagesBase64.map(base64 => ({
    inlineData: {
      data: base64.split(',')[1],
      mimeType: base64.split(',')[0].split(':')[1].split(';')[0],
    }
  }));

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        ...imageParts,
        { text: `Generate an image for a carousel slide based on this prompt, strictly following the visual style, colors, and layout of the provided reference images. Prompt: ${prompt}` },
      ],
    },
    config: {
      imageConfig: {
        aspectRatio: "1:1"
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
