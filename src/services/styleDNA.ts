/**
 * Style DNA - Extração Avançada de Padrões Visuais
 *
 * Extrai "DNA Visual" de imagens de referência para criar
 * estilos com semelhança real às imagens enviadas.
 * 
 * INTEGRADO COM: prompt-expansion.ts para máxima fidelidade
 */

export interface StyleDNA {
  // Cores dominantes extraídas da imagem
  dominantColors: {
    hex: string;
    percentage: number;
    role: 'background' | 'primary' | 'accent' | 'text' | 'neutral';
  }[];

  // Padrões de layout detectados
  layoutPattern: {
    type: 'centered' | 'asymmetric' | 'grid' | 'minimal' | 'layered';
    contentZones: number;
    textToImageRatio: 'text-heavy' | 'balanced' | 'image-heavy';
    alignment: 'left' | 'center' | 'right' | 'mixed';
  };

  // Estilo tipográfico
  typographyStyle: {
    fontFamily: 'sans-serif' | 'serif' | 'display' | 'handwriting' | 'monospace';
    weight: 'light' | 'regular' | 'medium' | 'bold' | 'extra-bold';
    hierarchy: 'single' | 'two-level' | 'multi-level';
    treatment: 'uppercase' | 'title-case' | 'sentence-case' | 'mixed';
  };

  // Elementos visuais
  visualElements: {
    hasIcons: boolean;
    iconStyle: 'line' | 'filled' | 'illustration' | 'none';
    hasDecorativeShapes: boolean;
    shapeLanguage: 'rounded' | 'sharp' | 'mixed' | 'organic';
    hasLines: boolean;
    hasGradients: boolean;
    hasTextures: boolean;
    hasShadows: boolean;
    bulletStyle?: 'dots' | 'dashes' | 'arrows' | 'custom-icons' | 'numbers' | 'none';
    cornerTreatment?: 'sharp' | 'slightly-rounded' | 'rounded' | 'fully-rounded';
    hasFramingElements?: boolean;
    hasWatermarks?: boolean;
    badgeElements?: boolean;
    ribbonElements?: boolean;
  };

  // Estilo de fundo
  backgroundStyle: {
    type: 'solid' | 'gradient' | 'texture' | 'pattern' | 'image' | 'abstract';
    complexity: 'minimal' | 'simple' | 'moderate' | 'complex';
    dominantTone: 'warm' | 'cool' | 'neutral' | 'vibrant' | 'muted' | 'dark' | 'light';
  };

  // Mood e atmosfera
  mood: {
    professional: number;
    playful: number;
    serious: number;
    luxurious: number;
    minimal: number;
    energetic: number;
    corporate: number;
    creative: number;
  };

  // Prompt gerado a partir da análise
  generatedVisualPrompt: string;

  // Negativo: o que EVITAR baseado na análise
  negativePrompt: string;
}

/**
 * Extrai Style DNA de múltiplas imagens de referência
 * Usa análise combinada para criar fingerprint visual preciso
 */
export async function extractStyleDNAFromImages(
  imagesBase64: string[],
  slideType: 'cover' | 'content' | 'cta'
): Promise<StyleDNA> {
  const analysisPrompt = `You are an expert Visual Design Analyst analyzing ${imagesBase64.length} reference image(s) for a carousel ${slideType} slide.

Analyze EVERY visible aspect and return a detailed JSON:

1. COLORS: List ALL dominant colors with EXACT hex codes and their specific role (background, accent, text, neutral, primary)
2. LAYOUT: Describe composition type, alignment, content zones, text-to-image ratio
3. TYPOGRAPHY: Font style (sans-serif/serif/display), weight, size hierarchy, text treatment (uppercase/title-case/sentence-case)
4. GRAPHIC ELEMENTS: Icons (line/filled/illustration/none), shapes (rounded/sharp/mixed/organic), decorative elements, lines, patterns
5. BACKGROUND: Type (solid/gradient/texture/pattern/image/abstract), complexity, dominant tone
6. BRANDING: Logo placement, watermarks, signature elements
7. VISUAL HIERARCHY: What draws the eye first/second/third
8. MOOD: Rate 0-100 for: professional, playful, serious, luxurious, minimal, energetic, corporate, creative
9. BULLET STYLE: dots, dashes, arrows, custom-icons, numbers, or none
10. CORNER TREATMENT: sharp, slightly-rounded, rounded, or fully-rounded
11. NEGATIVE CONSTRAINTS: What this style explicitly does NOT have (no gradients, no photos, no shadows, etc.)

IMPORTANT: Be extremely specific with hex color codes. Extract the EXACT colors from the images, do not approximate.

Return ONLY valid JSON matching this structure:
{
  "dominantColors": [{"hex": "#XXXXXX", "percentage": 0-100, "role": "background|primary|accent|text|neutral"}],
  "layoutPattern": {"type": "centered|asymmetric|grid|minimal|layered", "contentZones": 1-5, "textToImageRatio": "text-heavy|balanced|image-heavy", "alignment": "left|center|right|mixed"},
  "typographyStyle": {"fontFamily": "sans-serif|serif|display|handwriting|monospace", "weight": "light|regular|medium|bold|extra-bold", "hierarchy": "single|two-level|multi-level", "treatment": "uppercase|title-case|sentence-case|mixed"},
  "visualElements": {"hasIcons": true/false, "iconStyle": "line|filled|illustration|none", "hasDecorativeShapes": true/false, "shapeLanguage": "rounded|sharp|mixed|organic", "hasLines": true/false, "hasGradients": true/false, "hasTextures": true/false, "hasShadows": true/false, "bulletStyle": "dots|dashes|arrows|custom-icons|numbers|none", "cornerTreatment": "sharp|slightly-rounded|rounded|fully-rounded"},
  "backgroundStyle": {"type": "solid|gradient|texture|pattern|image|abstract", "complexity": "minimal|simple|moderate|complex", "dominantTone": "warm|cool|neutral|vibrant|muted|dark|light"},
  "mood": {"professional": 0-100, "playful": 0-100, "serious": 0-100, "luxurious": 0-100, "minimal": 0-100, "energetic": 0-100, "corporate": 0-100, "creative": 0-100},
  "generatedVisualPrompt": "A highly detailed English language image generation prompt that would recreate this exact visual style. Include exact hex color codes, specific layout measurements, typography treatment, visual elements with sizes and positions, and all visual details described in English for AI image generators. Be extremely specific and detailed - aim for 500+ characters.",
  "negativePrompt": "What to AVOID: list everything this style does NOT have, in comma-separated format for negative prompting."
}`;

  const response = await fetch('/api/ai/analyze-style-images', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      images: imagesBase64,
      prompt: analysisPrompt,
      slideType
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Style DNA extraction failed: ${response.status} ${error}`);
  }

  const data = await response.json();
  return data.dna as StyleDNA;
}

/**
 * Gera prompt de imagem ultra-detalhado baseado no Style DNA
 * AGORA INTEGRADO com prompt-expansion para máxima fidelidade ao estilo aprendido
 */
export function generateImagePromptFromDNA(
  dna: StyleDNA,
  slideContent: string,
  slideType: 'cover' | 'content' | 'cta',
  logoBase64?: string,
  backgroundBase64?: string,
  styleMetadata?: {
    colors?: string;
    extraInstructions?: string;
  },
  slideNumber?: number,
  slideTitle?: string,
  slideText?: string
): string {
  const bgColor = dna.dominantColors.find(c => c.role === 'background')?.hex || '#FFFFFF';
  const accentColor = dna.dominantColors.find(c => c.role === 'accent')?.hex || '#6366F1';
  const textColor = dna.dominantColors.find(c => c.role === 'text')?.hex || '#1E293B';

  // Extrair título e texto do conteúdo se não fornecidos separadamente
  const title = slideTitle || extractTitleFromContent(slideContent);
  const text = slideText || extractBodyFromContent(slideContent);
  const sNumber = slideNumber || (slideType === 'cover' ? 1 : slideType === 'cta' ? 4 : 2);

  // TENTAR usar prompt-expansion se disponível (integração principal)
  let expandedPrompt: string | null = null;
  try {
    const { expandPrompt } = require('./prompt-expansion');
    const expanded = expandPrompt(
      dna.generatedVisualPrompt || `Instagram ${slideType} slide`,
      dna,
      title,
      text,
      slideType,
      sNumber
    );
    expandedPrompt = expanded.expandedPrompt;
  } catch (e) {
    console.warn('[StyleDNA] prompt-expansion not available, using detailed fallback');
  }

  // Assets disponíveis
  const assetsSection = `
BRAND ASSETS:
${logoBase64 ? `- LOGO: A custom brand logo is available (base64 encoded). Embed this logo in the top-right corner (medium size, always visible but discreet). This is the ACTUAL brand logo, not a placeholder.` : '- LOGO: No custom logo. Use a generic, professional accounting logo placeholder in the top-right corner.'}
${backgroundBase64 ? `- BACKGROUND: A custom brand background image is available (base64 encoded). Use it as the full slide background, ensuring text remains readable with proper contrast (add darkening overlay if needed). This is the ACTUAL brand background.` : '- BACKGROUND: No custom background image. Use solid color only (no gradients, no textures).'}
`;

  const extraInstructionsSection = styleMetadata?.extraInstructions
    ? `\nADDITIONAL STYLE INSTRUCTIONS:\n${styleMetadata.extraInstructions}\n`
    : '';

  // FIDELIDADE AO DNA: Regras de verificação
  const dnaFidelityRules = generateDNAFidelityRules(dna);

  // Se temos o prompt expandido ultra-detalhado, usá-lo como base principal
  if (expandedPrompt && expandedPrompt.length > 5000) {
    return `ULTRA-DETAILED STYLE DNA PROMPT (expanded from brand reference images):

${expandedPrompt}

${assetsSection}

${extraInstructionsSection}

${dnaFidelityRules}

CONTENT TO APPLY THIS STYLE TO:
Title: "${title}"
Body: "${text}"

FINAL VERIFICATION: Before generating, verify that ALL DNA specifications are followed. The generated image must be visually indistinguishable from the original brand reference images used to extract this Style DNA.`;
  }

  // FALLBACK: prompt detalhado (sem expansion)
  return generateDetailedFallbackPrompt(dna, slideContent, slideType, title, text, assetsSection, extraInstructionsSection, dnaFidelityRules);
}

/**
 * Gera prompt detalhado de fallback quando prompt-expansion não está disponível
 */
function generateDetailedFallbackPrompt(
  dna: StyleDNA,
  slideContent: string,
  slideType: 'cover' | 'content' | 'cta',
  title: string,
  text: string,
  assetsSection: string,
  extraInstructionsSection: string,
  dnaFidelityRules: string
): string {
  const bgColor = dna.dominantColors.find(c => c.role === 'background')?.hex || '#FFFFFF';
  const accentColor = dna.dominantColors.find(c => c.role === 'accent')?.hex || '#6366F1';
  const textColor = dna.dominantColors.find(c => c.role === 'text')?.hex || '#1E293B';

  return `Instagram carousel ${slideType} slide (720x960px, 3:4 ratio) matching exact reference style:

${assetsSection}

BACKGROUND: ${dna.backgroundStyle.type} with ${dna.backgroundStyle.complexity} complexity, dominant tone is ${dna.backgroundStyle.dominantTone}, primary background color ${bgColor}. ${dna.backgroundStyle.type === 'solid' ? 'The background must be a SINGLE UNIFORM FLAT SOLID color with ZERO gradient, ZERO texture, ZERO pattern, ZERO variation. Every pixel of the background must display the exact same hex color value.' : ''}

COLORS - USE EXACTLY THESE HEX VALUES AND NO OTHERS:
${dna.dominantColors.map(c => `- ${c.role.toUpperCase()}: ${c.hex} (${c.percentage}% of composition). ${getColorRoleDetail(c)}`).join('\n')}

LAYOUT: ${dna.layoutPattern.type} composition, ${dna.layoutPattern.contentZones} content zones, ${dna.layoutPattern.textToImageRatio}, ${dna.layoutPattern.alignment} alignment. ${getLayoutDetail(dna.layoutPattern)}

TYPOGRAPHY: ${dna.typographyStyle.fontFamily} font family, ${dna.typographyStyle.weight} weight, ${dna.typographyStyle.hierarchy} hierarchy, ${dna.typographyStyle.treatment} treatment. ${getTypographyDetail(dna.typographyStyle)}

VISUAL ELEMENTS:
${dna.visualElements.hasIcons ? `- ${dna.visualElements.iconStyle.toUpperCase()} icons present. Style: ${dna.visualElements.iconStyle}, use accent color ${accentColor}. All icons must come from the same icon family for consistency.` : '- NO icons present. Do not add any icon elements, icon-like shapes, or pseudo-icon decorative elements.'}
${dna.visualElements.hasDecorativeShapes ? `- ${dna.visualElements.shapeLanguage.toUpperCase()} decorative shapes present. Opacity: 10-20%. Use colors from the defined palette only.` : '- NO decorative shapes present. Do not add any circles, rectangles, blobs, geometric accents, or ornamental elements.'}
${dna.visualElements.hasLines ? `- Lines/dividers present. Use 1-2px stroke weight in neutral color at 30-50% opacity.` : '- NO lines or dividers present. Content sections are separated through spacing, typography, and color differences alone.'}
${dna.visualElements.hasGradients ? '- Gradients used subtly. Direction and colors must match the palette.' : '- NO gradients. Background must be a SINGLE UNIFORM FLAT SOLID color with ZERO gradient effect, ZERO texture, ZERO pattern, ZERO photographs, ZERO visual noise.'}
${dna.visualElements.hasTextures ? `- Textures present at 5-15% opacity. Texture color matches the background color.` : '- NO textures. Surface must be completely smooth, flat, and clean with zero texture, zero grain, zero noise, zero pattern of any kind.'}
${dna.visualElements.hasShadows ? `- Soft shadows for depth. X offset: 0px, Y: 2-4px, blur: 8-16px, opacity: 10-20%, color: #000000.` : '- NO shadows. Design is completely flat with zero drop shadows, zero inner shadows, zero depth effects.'}

MOOD TARGET: ${getMoodDescription(dna.mood)}

MANDATORY ELEMENTS:
1. LOGO: Always present in top-right corner (medium size, visible but discreet)
2. FOOTER: "Conteúdo completo em AlfaContabilidadeCariri.com.br" at bottom center, small text
3. ALL TEXT IN BRAZILIAN PORTUGUESE (PT-BR) - NEVER use English in the final image

CONTENT TO APPLY THIS STYLE TO:
Title: "${title}"
Body: "${text}"

${extraInstructionsSection}
${dnaFidelityRules}

CRITICAL: Match the reference images EXACTLY in visual style. Same colors, same layout pattern, same typography treatment, same graphic element style. Do NOT create a generic design - replicate the visual DNA of the references.`;
}

/**
 * Gera regras de fidelidade ao DNA para verificação final
 */
function generateDNAFidelityRules(dna: StyleDNA): string {
  const rules: string[] = [];

  const bg = dna.dominantColors.find(c => c.role === 'background');
  if (bg) {
    rules.push(`BACKGROUND COLOR FIDELITY: The background MUST use EXACTLY ${bg.hex} with zero tolerance for substitution. No similar colors, no approximations, no system default colors.`);
  }

  const txt = dna.dominantColors.find(c => c.role === 'text');
  if (txt) {
    rules.push(`TEXT COLOR FIDELITY: All text MUST use EXACTLY ${txt.hex}. No black (#000000) unless that is the specified text color.`);
  }

  const acc = dna.dominantColors.find(c => c.role === 'accent');
  if (acc) {
    rules.push(`ACCENT COLOR FIDELITY: Accent elements MUST use EXACTLY ${acc.hex}. No similar hues or approximations.`);
  }

  if (!dna.visualElements.hasGradients) {
    rules.push('GRADIENT PROHIBITION: The style explicitly has NO gradients. Background must be solid flat color. No color transitions, no fades, no blends.');
  }
  if (!dna.visualElements.hasTextures) {
    rules.push('TEXTURE PROHIBITION: The style explicitly has NO textures. Surface must be completely smooth. No paper grain, no noise, no pattern.');
  }
  if (!dna.visualElements.hasShadows) {
    rules.push('SHADOW PROHIBITION: The style explicitly has NO shadows. Design is completely flat. No drop shadows, no depth effects, no 3D layering.');
  }
  if (!dna.visualElements.hasIcons) {
    rules.push('ICON PROHIBITION: The style explicitly has NO icons. Do not add icon elements, icon-like shapes, or pseudo-icon decorative elements.');
  }
  if (!dna.visualElements.hasDecorativeShapes) {
    rules.push('SHAPE PROHIBITION: The style explicitly has NO decorative shapes. Do not add circles, rectangles, blobs, geometric accents, or ornamental elements.');
  }

  rules.push(`TYPOGRAPHY FIDELITY: Use ${dna.typographyStyle.fontFamily} font, ${dna.typographyStyle.weight} weight, ${dna.typographyStyle.treatment} treatment. Do not substitute with similar fonts.`);
  rules.push(`LAYOUT FIDELITY: Use ${dna.layoutPattern.type} composition with ${dna.layoutPattern.alignment} alignment. Logo safe zone (top-right 12% x 8%) must remain completely clean.`);
  rules.push('LANGUAGE FIDELITY: ALL text must be in Brazilian Portuguese (PT-BR). No English text except the brand URL "AlfaContabilidadeCariri.com.br".');

  const topMoods = Object.entries(dna.mood).filter(([, v]) => v > 60);
  if (topMoods.length > 0) {
    rules.push(`MOOD FIDELITY: The design must convey: ${topMoods.map(([k, v]) => `${k} (${v}%)`).join(', ')}. Avoid moods with scores below 40.`);
  }

  const negPrompt = dna.negativePrompt;
  if (negPrompt && negPrompt.length > 10) {
    rules.push(`NEGATIVE CONSTRAINTS FROM DNA: ${negPrompt}`);
  }

  return `DNA FIDELITY RULES (NON-NEGOTIABLE):\n${rules.join('\n')}`;
}

/**
 * Extrai título do conteúdo se não fornecido separadamente
 */
function extractTitleFromContent(content: string): string {
  const titleMatch = content.match(/Title:\s*["']?([^"',\n]+)["']?/i);
  if (titleMatch) return titleMatch[1].trim();
  return content.substring(0, 80).replace(/[,.\n].*/, '').trim();
}

/**
 * Extrai corpo do conteúdo se não fornecido separadamente
 */
function extractBodyFromContent(content: string): string {
  const bodyMatch = content.match(/Body:\s*["']?([^"'\n]+)["']?/i);
  if (bodyMatch) return bodyMatch[1].trim();
  return content.substring(0, 200).trim();
}

/**
 * Retorna descrição detalhada do papel de cada cor
 */
function getColorRoleDetail(color: { hex: string; percentage: number; role: string }): string {
  const details: Record<string, string> = {
    background: 'This color serves as the primary canvas background covering 100% of the 720x960px canvas area. Must be applied uniformly with zero variation, zero gradient, zero texture, zero pattern. Every single pixel must display the exact same hex color value.',
    accent: 'This color serves as the accent for interactive elements, CTAs, icons, bullets, and visual emphasis. Should occupy 10-15% of total visual area and contrast well with both background and text colors.',
    text: 'This color serves as the primary text color for all readable content including titles, body text, and footer. Must maintain minimum WCAG AA contrast ratio of 4.5:1 against the background.',
    primary: 'This color serves as the primary design color for major visual elements including section backgrounds, headers, and content containers. Typically occupies 25-35% of total visual area.',
    neutral: 'This color serves as the neutral supporting color for secondary text, borders, dividers, and subtle backgrounds. Typically occupies 10-20% of total visual area.',
  };
  return details[color.role] || `This color serves as a ${color.role} element in the composition.`;
}

/**
 * Retorna descrição detalhada do layout
 */
function getLayoutDetail(layout: StyleDNA['layoutPattern']): string {
  const details: Record<string, string> = {
    centered: 'All primary elements are symmetrically aligned along the vertical center axis at x=360px. Left and right margins are equal. Creates formal, balanced, professional appearance.',
    asymmetric: 'Elements are deliberately offset from center creating dynamic visual tension. Heavier elements on one side balanced by quantity or color intensity on the opposite side.',
    grid: 'Canvas is divided into a structured grid with defined cells. Content is placed within grid cells creating organized, systematic appearance. Grid lines may be visible as subtle dividers.',
    minimal: 'Maximum negative space with fewest possible elements. Each element has generous breathing room. Emphasis on what is NOT present rather than what IS present.',
    layered: 'Multiple visual layers stacked with varying opacity. Background layer, content layer, decorative layer, and overlay layer create depth and visual complexity.',
  };

  const zoneDescriptions: Record<number, string> = {
    1: 'Single content zone: the entire canvas is used as one unified area with no section separation.',
    2: 'Two content zones: header/title zone (top 15-20% of canvas) and body/content zone (middle 50-60%).',
    3: 'Three content zones: header (top 15-20%), body (middle 50-60%), and footer (bottom 10-15%).',
    4: 'Four content zones: hero (top 10%), header (next 15%), body (middle 50%), footer (bottom 25%).',
    5: 'Five content zones: hero, subtitle header, body, CTA section, and footer with distinct visual roles.',
  };

  let desc = details[layout.type] || 'Standard layout composition.';
  desc += ` Content zones: ${zoneDescriptions[layout.contentZones] || 'Multiple zones defined.'}`;
  desc += ` Text-to-image ratio: ${layout.textToImageRatio === 'text-heavy' ? 'Text dominates (70-80%), background must be simple.' : layout.textToImageRatio === 'balanced' ? 'Text and visuals share equally (45-55% each).' : 'Visuals dominate (70-80%), text is minimal.'}`;
  desc += ` Logo safe zone: top-right corner (pixel columns 634-719, rows 0-76) MUST remain completely clean and empty.`;

  return desc;
}

/**
 * Retorna descrição detalhada da tipografia
 */
function getTypographyDetail(typo: StyleDNA['typographyStyle']): string {
  const familyDetails: Record<string, string> = {
    'sans-serif': 'Sans-serif typefaces: clean, modern, highly legible. Recommended: Inter, Roboto, Helvetica Neue, SF Pro Display, Open Sans, or Montserrat. All support Portuguese diacritical marks.',
    'serif': 'Serif typefaces: traditional, authoritative, editorial. Recommended: Playfair Display, Merriweather, Georgia, or Lora. All support Portuguese diacritical marks.',
    'display': 'Display typefaces: large-size, maximum impact, distinctive. Recommended: Bebas Neue, Montserrat Black, Oswald, or Raleway ExtraBold. All support Portuguese character sets.',
    'handwriting': 'Handwriting typefaces: casual, personal, artistic. Recommended: Caveat, Pacifico, or Dancing Script. Use sparingly for accent text only.',
    'monospace': 'Monospace typefaces: technical, digital, precise. Recommended: Fira Code, JetBrains Mono, or Source Code Pro.',
  };

  const weightDetails: Record<string, string> = {
    light: 'Light weight (300): delicate, thin strokes. Only for large display text (24px+). Not for body text.',
    regular: 'Regular weight (400): standard for body text, optimized for comfortable extended reading at 14px+.',
    medium: 'Medium weight (500): slightly emphasized, ideal for subtitles and secondary headings.',
    bold: 'Bold weight (700): strong emphasis, used for titles and headings. Creates clear visual hierarchy over regular body text.',
    'extra-bold': 'Extra-bold weight (800-900): maximum impact, for hero text and critical headlines only. Use sparingly.',
  };

  let desc = familyDetails[typo.fontFamily] || '';
  desc += ` Title weight: ${weightDetails[typo.weight] || ''}`;

  const hierarchyDetails: Record<string, string> = {
    single: 'Single-level hierarchy: all text uses approximately same size. Differentiation through weight, color, or capitalization.',
    'two-level': 'Two-level hierarchy: title (8-12% of canvas height, 77-115px) and body (4-6%, 38-58px). Clear visual distinction.',
    'multi-level': 'Multi-level hierarchy: hero title (12-15%), subtitles (6-8%), body (4-6%), footer (2-3%). Detailed information architecture.',
  };
  desc += ` Hierarchy: ${hierarchyDetails[typo.hierarchy] || ''}`;

  const treatmentDetails: Record<string, string> = {
    uppercase: 'Uppercase treatment: ALL LETTERS CAPITAL. Increase letter-spacing by 1-2px. Best for titles of 6 words or fewer.',
    'title-case': 'Title-case treatment: first letter of each major word capitalized. Professional, suitable for headings.',
    'sentence-case': 'Sentence-case treatment: only first letter of first word capitalized. Most readable for body text.',
    mixed: 'Mixed treatment: different text levels use different treatments. e.g., uppercase titles with sentence-case body.',
  };
  desc += ` Treatment: ${treatmentDetails[typo.treatment] || ''}`;

  desc += ' ALL text in Brazilian Portuguese with correct diacritical marks (á, é, ã, ç, â, ê, ô). No English text.';

  return desc;
}

/**
 * Retorna descrição detalhada do mood
 */
function getMoodDescription(mood: StyleDNA['mood']): string {
  const descriptions: Record<string, string> = {
    professional: mood.professional > 70 ? 'VERY HIGH professionalism. Use structured layouts, clean typography, restrained colors, business-appropriate content. Every element communicates credibility.' : mood.professional > 40 ? 'Moderately professional. Business-appropriate but can include some creative expression.' : 'Low priority on professionalism.',
    playful: mood.playful > 70 ? 'VERY HIGH playfulness. Use fun elements, rounded shapes, bright accents, friendly iconography.' : mood.playful > 40 ? 'Some playful elements acceptable within professional framework.' : 'Avoid playful elements. Keep design serious.',
    serious: mood.serious > 70 ? 'VERY HIGH seriousness. Use formal layouts, authoritative typography, sober colors. Avoid anything casual or decorative.' : mood.serious > 40 ? 'Professional but can include some approachable language.' : 'Avoid serious formal aesthetics.',
    luxurious: mood.luxurious > 70 ? 'VERY HIGH luxury. Convey premium through generous spacing, sophisticated typography, rich colors, refined details.' : mood.luxurious > 40 ? 'Some premium touches acceptable but remain accessible.' : 'Avoid luxury signals. Keep design accessible.',
    minimal: mood.minimal > 70 ? 'VERY HIGH minimalism. Maximum negative space, every element earns its place. Apple-level simplicity.' : mood.minimal > 40 ? 'Negative space important but balance with visual interest.' : 'Design can be rich and detailed.',
    energetic: mood.energetic > 70 ? 'VERY HIGH energy. Dynamic, vibrant, active. Use diagonal angles, bold colors, motion-indicating elements.' : mood.energetic > 40 ? 'Some energy through color/layout while maintaining calm professionalism.' : 'Avoid energetic visual language. Keep design calm.',
    corporate: mood.corporate > 70 ? 'VERY HIGH corporate. Enterprise-grade standards, formal layouts, brand consistency. Avoid startup-aesthetic.' : mood.corporate > 40 ? 'Business-appropriate but can incorporate contemporary design.' : 'Design can be casual or creative rather than formal.',
    creative: mood.creative > 70 ? 'VERY HIGH creativity. Push boundaries with unconventional layouts, artistic elements, expressive typography. Design portfolio quality.' : mood.creative > 40 ? 'Some artistic expression within professional framework. Include 1-2 creative accents.' : 'Prioritize clarity over artistic expression.',
  };

  return Object.entries(mood)
    .filter(([, v]) => v > 40)
    .map(([k]) => descriptions[k] || '')
    .filter(Boolean)
    .join('\n');
}

/**
 * Ajusta o StyleDNA baseado em feedback de aprovação/rejeição
 * Usado para aprendizado contínuo do estilo
 */
export function adjustDNAFromFeedback(
  currentDNA: StyleDNA,
  status: 'approved' | 'rejected',
  comment: string
): Partial<StyleDNA> {
  const adjustments: Partial<StyleDNA> = {};
  const commentLower = comment.toLowerCase();

  // Análise semântica do comentário
  const hasColorIssue = commentLower.includes('color') || commentLower.includes('cor') || commentLower.includes('ton');
  const hasLayoutIssue = commentLower.includes('layout') || commentLower.includes('position') || commentLower.includes('align') || commentLower.includes('dispost');
  const hasTypographyIssue = commentLower.includes('font') || commentLower.includes('tipografia') || commentLower.includes('text') || commentLower.includes('fonte');
  const hasVisualIssue = commentLower.includes('icon') || commentLower.includes('shape') || commentLower.includes('forma') || commentLower.includes('element');
  const hasBackgroundIssue = commentLower.includes('background') || commentLower.includes('fundo') || commentLower.includes('gradient');
  const hasMoodIssue = commentLower.includes('mood') || commentLower.includes('tom') || commentLower.includes('vibe') || commentLower.includes('formal') || commentLower.includes('casual');

  if (status === 'approved') {
    // Feedback positivo: reforçar o DNA atual
    // Aumentar ligeiramente scores de mood que já estão altos
    if (currentDNA.mood) {
      const topMoods = Object.entries(currentDNA.mood)
        .filter(([, v]) => v > 60)
        .map(([k]) => k);

      if (topMoods.length > 0) {
        adjustments.mood = { ...currentDNA.mood };
        topMoods.forEach(key => {
          (adjustments.mood as any)[key] = Math.min(100, (adjustments.mood as any)[key] + 3);
        });
      }
    }

    // Reforçar que este estilo funciona - manter cores e elementos
    console.log('[DNA FEEDBACK] ✅ Approved - reinforcing current DNA patterns');
  } else {
    // Feedback negativo: ajustar baseado no tipo de reclamação
    adjustments.mood = { ...currentDNA.mood };

    if (hasColorIssue) {
      console.log('[DNA FEEDBACK] 🎨 Color issue detected - adjusting palette');
      // Se cores são problema, ajustar o background para tom mais suave
      const bg = currentDNA.dominantColors?.find(c => c.role === 'background');
      if (bg) {
        // Criar variação mais clara do background
        const { r, g, b } = hexToRgbSimple(bg.hex);
        const lighterBg = rgbToHexSimple(
          Math.min(255, r + 20),
          Math.min(255, g + 20),
          Math.min(255, b + 20)
        );
        adjustments.dominantColors = currentDNA.dominantColors?.map(c =>
          c.role === 'background' ? { ...c, hex: lighterBg } : c
        );
      }
    }

    if (hasMoodIssue || hasVisualIssue) {
      if (commentLower.includes('formal') || commentLower.includes('serious')) {
        adjustments.mood.professional = Math.max(0, (adjustments.mood.professional || 70) - 10);
        adjustments.mood.creative = Math.min(100, (adjustments.mood.creative || 40) + 10);
      }
      if (commentLower.includes('casual') || commentLower.includes('playful')) {
        adjustments.mood.playful = Math.min(100, (adjustments.mood.playful || 20) + 10);
        adjustments.mood.serious = Math.max(0, (adjustments.mood.serious || 60) - 10);
      }
      console.log('[DNA FEEDBACK] 🎭 Mood adjustment based on feedback');
    }

    if (hasLayoutIssue) {
      console.log('[DNA FEEDBACK] 📐 Layout issue detected - keeping current structure');
      // Não mudar layout drasticamente, mas registrar que há problema
    }

    if (hasTypographyIssue) {
      console.log('[DNA FEEDBACK] 🔤 Typography issue detected');
      // Sugerir mudança de tratamento se relevante
      if (commentLower.includes('uppercase') || commentLower.includes('maiúscula')) {
        adjustments.typographyStyle = {
          ...currentDNA.typographyStyle,
          treatment: 'title-case' as const
        };
      }
    }

    if (hasBackgroundIssue) {
      console.log('[DNA FEEDBACK] 🖼️ Background issue detected');
      // Se background é problema, simplificar
      if (currentDNA.backgroundStyle.type !== 'solid') {
        adjustments.backgroundStyle = {
          ...currentDNA.backgroundStyle,
          type: 'solid' as const,
          complexity: 'minimal' as const
        };
      }
    }

    // Se não identificou problema específico, ajuste genérico suave
    if (!hasColorIssue && !hasLayoutIssue && !hasTypographyIssue && !hasVisualIssue && !hasBackgroundIssue && !hasMoodIssue) {
      console.log('[DNA FEEDBACK] ⚡ Generic adjustment - minor tweaks');
      // Reduzir ligeiramente scores altos para dar espaço a alternativas
      Object.keys(adjustments.mood).forEach(key => {
        const val = (adjustments.mood as any)[key] || (currentDNA.mood as any)[key];
        if (val > 70) (adjustments.mood as any)[key] = val - 5;
        else if (val < 30) (adjustments.mood as any)[key] = val + 5;
      });
    }
  }

  return adjustments;
}

/**
 * Helpers simples para conversão de cor (sem dependências externas)
 */
function hexToRgbSimple(hex: string): { r: number; g: number; b: number } {
  const h = hex.replace('#', '');
  return {
    r: parseInt(h.substring(0, 2), 16),
    g: parseInt(h.substring(2, 4), 16),
    b: parseInt(h.substring(4, 6), 16)
  };
}

function rgbToHexSimple(r: number, g: number, b: number): string {
  return '#' + [r, g, b]
    .map(x => Math.max(0, Math.min(255, x)).toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase();
}

/**
 * Estratégia unificada para geração de prompts de imagem
 * Escolhe automaticamente a melhor estratégia baseada nos dados disponíveis
 * 
 * PRIORIDADES:
 * 1. Se tem StyleDNA completo + prompt-expansion disponível → Ultra-detailed (100K+ chars)
 * 2. Se tem StyleDNA completo → Detailed (5-10K chars)
 * 3. Se tem partial DNA → Medium (1-2K chars)
 * 4. Se não tem DNA → Fallback genérico (500 chars)
 */
export function unifyImagePrompt(
  dna: StyleDNA | null | undefined,
  slideContent: string,
  slideType: 'cover' | 'content' | 'cta',
  logoBase64?: string,
  backgroundBase64?: string,
  styleMetadata?: {
    colors?: string;
    extraInstructions?: string;
  },
  slideNumber?: number,
  slideTitle?: string,
  slideText?: string,
  existingImagePrompt?: string
): { prompt: string; strategy: string; charCount: number } {
  
  // Verificar se já temos um imagePrompt de alta qualidade do DesignerSkill
  if (existingImagePrompt && existingImagePrompt.length > 500) {
    const hasGeneratedPrompt = existingImagePrompt.includes('generatedVisualPrompt') || 
                               existingImagePrompt.includes('[STYLE DNA');
    if (hasGeneratedPrompt && dna) {
      // DesignerSkill já gerou um bom prompt - enriquecer com DNA fidelity rules
      const fidelityRules = generateDNAFidelityRules(dna);
      const enrichedPrompt = `${existingImagePrompt}\n\n${fidelityRules}\n\nCONTENT: Title="${slideTitle || ''}", Body="${slideText || ''}"`;
      return {
        prompt: enrichedPrompt,
        strategy: 'designer-skill-enriched',
        charCount: enrichedPrompt.length
      };
    }
  }

  // Verificar qualidade do DNA disponível
  const hasCompleteDNA = dna && 
    dna.dominantColors?.length > 0 && 
    dna.generatedVisualPrompt?.length > 100 &&
    dna.layoutPattern?.type &&
    dna.typographyStyle?.fontFamily;

  const hasPartialDNA = dna && 
    dna.dominantColors?.length > 0;

  if (hasCompleteDNA) {
    // TENTAR prompt-expansion primeiro (máximo detalhe)
    try {
      const { expandPrompt } = require('./prompt-expansion');
      const title = slideTitle || extractTitleFromContent(slideContent);
      const text = slideText || extractBodyFromContent(slideContent);
      const sNumber = slideNumber || (slideType === 'cover' ? 1 : slideType === 'cta' ? 4 : 2);

      const expanded = expandPrompt(
        dna.generatedVisualPrompt || `Instagram ${slideType} slide`,
        dna as any,
        title,
        text,
        slideType,
        sNumber
      );

      if (expanded.expandedPrompt.length > 5000) {
        // Adicionar assets e contexto extra
        const assetsSection = `
BRAND ASSETS:
${logoBase64 ? '- LOGO: Custom brand logo available. Embed in top-right corner (medium, discreet).' : '- LOGO: No custom logo. Use generic professional placeholder.'}
${backgroundBase64 ? '- BACKGROUND: Custom brand background available. Use as full slide background.' : '- BACKGROUND: No custom background. Use solid color only.'}`;

        const extraSection = styleMetadata?.extraInstructions ? `\n\nADDITIONAL INSTRUCTIONS:\n${styleMetadata.extraInstructions}` : '';

        return {
          prompt: expanded.expandedPrompt + assetsSection + extraSection,
          strategy: 'ultra-detailed-expanded',
          charCount: expanded.expandedPrompt.length + assetsSection.length + extraSection.length
        };
      }
    } catch (e) {
      console.warn('[UNIFY] prompt-expansion not available, falling back to detailed DNA prompt');
    }

    // Fallback para detailed DNA prompt
    const detailedPrompt = generateImagePromptFromDNA(
      dna as StyleDNA,
      slideContent,
      slideType,
      logoBase64,
      backgroundBase64,
      styleMetadata,
      slideNumber,
      slideTitle,
      slideText
    );

    return {
      prompt: detailedPrompt,
      strategy: 'detailed-dna',
      charCount: detailedPrompt.length
    };
  }

  if (hasPartialDNA) {
    // DNA parcial - gerar prompt médio com dados disponíveis
    const bgColor = dna.dominantColors?.find(c => c.role === 'background')?.hex || '#FFFFFF';
    const textColor = dna.dominantColors?.find(c => c.role === 'text')?.hex || '#1E293B';
    const accentColor = dna.dominantColors?.find(c => c.role === 'accent')?.hex || '#6366F1';

    const mediumPrompt = `Instagram carousel ${slideType} slide, 720x960px, 3:4 ratio.

STYLE DNA (partial):
- Background: solid ${bgColor}
- Text color: ${textColor}
- Accent color: ${accentColor}
- Layout: ${dna.layoutPattern?.type || 'centered'} composition
- Typography: ${dna.typographyStyle?.fontFamily || 'sans-serif'}, ${dna.typographyStyle?.weight || 'bold'}
- Visual elements: ${dna.visualElements?.hasIcons ? 'icons present' : 'no icons'} | ${dna.visualElements?.hasDecorativeShapes ? 'decorative shapes' : 'no shapes'}

CONTENT:
Title: "${slideTitle || slideContent.substring(0, 50)}"
Body: "${slideText || slideContent.substring(0, 150)}"

All text in Brazilian Portuguese (PT-BR).`;

    return {
      prompt: mediumPrompt,
      strategy: 'partial-dna',
      charCount: mediumPrompt.length
    };
  }

  // SEM DNA - fallback genérico
  const fallbackPrompt = `Instagram carousel ${slideType} slide, 720x960px, 3:4 ratio, professional business design.

CONTENT:
Title: "${slideTitle || slideContent.substring(0, 50)}"
Body: "${slideText || slideContent.substring(0, 150)}"

Clean, modern design with solid color background. All text in Brazilian Portuguese (PT-BR).`;

  return {
    prompt: fallbackPrompt,
    strategy: 'generic-fallback',
    charCount: fallbackPrompt.length
  };
}
