import { jsPDF } from 'jspdf';

export const generateMasterPromptPDF = () => {
  const doc = new jsPDF();
  
  const margin = 15;
  const pageWidth = doc.internal.pageSize.getWidth();
  const maxLineWidth = pageWidth - margin * 2;
  let cursorY = margin;

  const addText = (text: string, fontSize: number, isBold: boolean = false, color: number[] = [0, 0, 0]) => {
    doc.setFontSize(fontSize);
    doc.setFont('helvetica', isBold ? 'bold' : 'normal');
    doc.setTextColor(color[0], color[1], color[2]);
    
    const lines = doc.splitTextToSize(text, maxLineWidth);
    
    // Check if we need a new page
    if (cursorY + (lines.length * fontSize * 0.4) > doc.internal.pageSize.getHeight() - margin) {
      doc.addPage();
      cursorY = margin;
    }
    
    doc.text(lines, margin, cursorY);
    cursorY += (lines.length * fontSize * 0.4) + 5; // Add some spacing
  };

  // Title
  addText('MASTER PROMPT: AI Carousel Generator Pro', 18, true, [107, 33, 168]); // Purple color
  cursorY += 5;

  addText('Funcao: Engenheiro de Software Senior, Especialista em IA Generativa e Arquiteto de Solucoes.', 12, false, [100, 100, 100]);
  cursorY += 5;

  // Section 1
  addText('1. Visao Geral do Projeto', 14, true);
  addText('Um aplicativo web Full-Stack projetado para automatizar a criacao de carrosseis para redes sociais. O sistema permite criar "Estilos Visuais", gerar conteudo persuasivo (copy) e imagens consistentes usando IA, alem de possuir um sistema de RAG (Retrieval-Augmented Generation) para auto-selecao de estilos e um loop de aprendizado continuo baseado em feedback do usuario.', 11);
  cursorY += 5;

  // Section 2
  addText('2. Stack Tecnologica', 14, true);
  addText('- Frontend: React 18, TypeScript, Vite, Tailwind CSS, Lucide React.', 11);
  addText('- Backend: Node.js, Express (servindo a API do Pinecone e o middleware do Vite).', 11);
  addText('- Armazenamento Local: IndexedDB para persistencia de historico e estilos no navegador.', 11);
  addText('- Banco de Dados Vetorial: Pinecone (Index: carousel-styles, Dimension: 768, Metric: cosine).', 11);
  addText('- APIs de IA (Google Gemini):', 11);
  addText('  * gemini-3.1-pro-preview: Para geracao de copy, prompts de imagem e aprendizado de feedback.', 11);
  addText('  * imagen-3.0-generate-002: Para geracao das imagens finais dos slides.', 11);
  addText('  * text-embedding-004: Para vetorizar os estilos e permitir a busca semantica (RAG).', 11);
  cursorY += 5;

  // Section 3
  addText('3. Fluxos de Funcionamento (User Flows)', 14, true);
  addText('A. Gestao de Estilos e RAG (Pinecone)', 12, true);
  addText('1. O usuario cria um estilo definindo regras para Capa, Conteudo e CTA.\n2. O sistema usa o modelo text-embedding-004 para converter a descricao do estilo em um vetor de 768 dimensoes.\n3. O vetor e salvo no Pinecone via backend Express.\n4. O estilo completo e salvo no IndexedDB local.', 11);
  cursorY += 3;

  addText('B. Geracao de Carrossel (Auto-Selecao)', 12, true);
  addText('1. O usuario insere um texto base.\n2. O sistema vetoriza esse texto e consulta o Pinecone buscando o estilo mais semanticamente compativel.\n3. O estilo e selecionado automaticamente.', 11);
  cursorY += 3;

  addText('C. Pipeline de Geracao (Gemini + Imagen)', 12, true);
  addText('1. Geracao de Texto: O Gemini 3.1 Pro recebe o texto base e o estilo, e retorna um JSON com 4 slides.\n2. Geracao de Imagens: Para cada slide, o sistema junta o Prompt de Imagem base com as regras especificas daquele tipo de slide e envia para o Imagen 3.\n3. Historico: O resultado final e salvo no IndexedDB.', 11);
  cursorY += 3;

  addText('D. Loop de Aprendizado (Feedback)', 12, true);
  addText('1. O usuario avalia um slide gerado (Gostei/Nao Gostei) e deixa um comentario.\n2. O Gemini 3.1 Pro analisa o comentario, o status e as regras atuais do estilo.\n3. A IA reescreve as regras do estilo para corrigir o erro ou reforcar o acerto.\n4. O estilo e atualizado no IndexedDB e o vetor e re-sincronizado no Pinecone.', 11);
  cursorY += 5;

  // Section 4
  addText('4. Engenharia de Prompts (O "Cerebro" do Sistema)', 14, true);
  
  addText('Prompt 1: Geracao de Conteudo (Copywriting)', 12, true);
  addText('Modelo: gemini-3.1-pro-preview', 10, false, [100, 100, 100]);
  const prompt1 = `You are an expert copywriter and social media strategist.
Create a 4-slide carousel based on the following content:
"{content}"

The visual style is: {style.name}
Style description: {style.description}

Slide 1 MUST be a catchy cover/hook.
Slide 2 and 3 MUST be the core value/content.
Slide 4 MUST be a strong Call to Action (CTA).

For each slide, provide:
1. title: Short, punchy headline (max 6 words)
2. text: The main text content for the slide (max 20 words)
3. imagePrompt: A detailed, descriptive prompt for an AI image generator to create the background/visual for this specific slide. It should match the visual style.

Return ONLY a valid JSON array of objects with these exact keys: title, text, imagePrompt.`;
  addText(prompt1, 10, false, [50, 50, 50]);
  cursorY += 5;

  addText('Prompt 2: Refinamento de Prompt de Imagem', 12, true);
  addText('Modelo: gemini-3.1-pro-preview', 10, false, [100, 100, 100]);
  const prompt2 = `You are an expert prompt engineer for AI image generation.
We need to generate an image for a carousel slide.

Slide Type: {slideType} (cover, content, or cta)
Base concept for this slide: {basePrompt}

The image MUST strictly follow this visual style:
{style[slideType].styleDescription}

Brand Extra Instructions:
{style.metadata?.extraInstructions || 'None'}

Create a highly detailed, comma-separated prompt optimized for an image generator (like Midjourney or Imagen).
Include lighting, camera angles, colors, textures, and the specific style constraints mentioned above.
DO NOT include any text, typography, or words in the image prompt (the text will be added via HTML/CSS overlay).
Return ONLY the final prompt string, nothing else.`;
  addText(prompt2, 10, false, [50, 50, 50]);
  cursorY += 5;

  addText('Prompt 3: Loop de Aprendizado (Feedback)', 12, true);
  addText('Modelo: gemini-3.1-pro-preview', 10, false, [100, 100, 100]);
  const prompt3 = `You are an expert AI design assistant.
We are refining a visual style named "{style.name}".

Current {slideType} style description:
{style[slideType].styleDescription}

Current brand extra instructions:
{style.metadata?.extraInstructions || 'None'}

The user generated a {slideType} slide and gave this feedback:
Status: {status.toUpperCase()}
User Comment: "{comment}"

Analyze the feedback. If REJECTED, add strict negative constraints or correct the style description to prevent this issue. If APPROVED, reinforce the positive aspects mentioned.

Return a JSON object with the updated fields:
{
  "updatedStyleDescription": "The new, refined style description for this slide type.",
  "updatedExtraInstructions": "The new, refined extra instructions for the brand (keep existing ones and add new ones if needed)."
}`;
  addText(prompt3, 10, false, [50, 50, 50]);

  // Save the PDF
  doc.save('Master_Prompt_CarouselAI.pdf');
};
