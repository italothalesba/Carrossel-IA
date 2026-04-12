/**
 * Prompt Expansion Service - 200K+ chars, 100% real information, ZERO ASCII dividers
 */

export interface ExpandedPrompt {
  originalPrompt: string;
  expandedPrompt: string;
  characterCount: number;
}

export function expandPrompt(
  originalPrompt: string,
  styleDNA: any,
  slideTitle: string,
  slideText: string,
  slideType: string,
  slideNumber: number
): ExpandedPrompt {
  const dna = styleDNA?.[slideType.toLowerCase()] || styleDNA?.cover || {};
  const colors = dna?.dominantColors || [];
  const typo = dna?.typographyStyle || {};
  const layout = dna?.layoutPattern || {};
  const visual = dna?.visualElements || {};
  const mood = dna?.mood || {};
  const bg = dna?.backgroundStyle || {};
  const genPrompt = dna?.generatedVisualPrompt || originalPrompt;
  const negPrompt = dna?.negativePrompt || '';

  let full = '';

  // Canvas & Background
  full += generateCanvasBackground(slideType, slideNumber, bg, colors);

  // Color System
  full += generateColorSystem(colors, slideType);

  // Typography
  full += generateTypographySystem(typo, colors, slideType);

  // Layout & Composition
  full += generateLayoutSystem(layout, colors, slideType);

  // Visual Elements
  full += generateVisualElements(visual, colors, slideType);

  // Mood & Atmosphere
  full += generateMoodSystem(mood, slideType);

  // Slide Content
  full += generateSlideContent(slideTitle, slideText, slideType, slideNumber, typo, colors);

  // Negative Prompts
  full += generateNegativePrompts(visual, bg, colors, negPrompt, slideType);

  // Step by Step
  full += generateStepByStep(colors, typo, layout, visual, bg, slideTitle, slideText, slideType);

  // Quality Checklist
  full += generateQualityChecklist(colors, typo, layout, visual, bg, slideType);

  // Master Prompt
  full += generateMasterPrompt(originalPrompt, genPrompt, colors, typo, layout, visual, mood, bg, slideTitle, slideText, slideType, slideNumber, negPrompt);

  return {
    originalPrompt,
    expandedPrompt: full,
    characterCount: full.length
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function hexToRgb(hex: string) {
  const h = hex.replace('#', '');
  return { r: parseInt(h.substring(0, 2), 16), g: parseInt(h.substring(2, 4), 16), b: parseInt(h.substring(4, 6), 16) };
}

function rgbToHsl(r: number, g: number, b: number) {
  const rn = r / 255, gn = g / 255, bn = b / 255;
  const max = Math.max(rn, gn, bn), min = Math.min(rn, gn, bn);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === rn) h = ((gn - bn) / d + (gn < bn ? 6 : 0)) / 6;
    else if (max === gn) h = ((bn - rn) / d + 2) / 6;
    else h = ((rn - gn) / d + 4) / 6;
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

function rgbToHsv(r: number, g: number, b: number) {
  const rn = r / 255, gn = g / 255, bn = b / 255;
  const max = Math.max(rn, gn, bn), min = Math.min(rn, gn, bn);
  let h = 0;
  const s = max === 0 ? 0 : (max - min) / max;
  const v = max;
  if (max !== min) {
    const d = max - min;
    if (max === rn) h = ((gn - bn) / d + (gn < bn ? 6 : 0)) / 6;
    else if (max === gn) h = ((bn - rn) / d + 2) / 6;
    else h = ((rn - gn) / d + 4) / 6;
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), v: Math.round(v * 100) };
}

function getLuminance(r: number, g: number, b: number) {
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}

function getContrastRatio(lum1: number, lum2: number) {
  const l1 = Math.max(lum1, lum2), l2 = Math.min(lum1, lum2);
  return (l1 + 0.05) / (l2 + 0.05);
}

function getColorPsychology(r: number, g: number, b: number): string {
  const hsl = rgbToHsl(r, g, b);
  const hue = hsl.h, sat = hsl.s, light = hsl.l;
  let psychology = '';
  if (light > 90) psychology += 'This extremely light color evokes purity, cleanliness, and openness. It creates a sense of space and airiness in the composition. In Brazilian business culture, very light colors convey transparency, honesty, and approachability. ';
  else if (light < 10) psychology += 'This extremely dark color evokes sophistication, authority, and power. It creates visual weight and grounds the composition. In Brazilian business culture, very dark colors convey seriousness, expertise, and premium quality. ';
  if (hue >= 0 && hue < 30) psychology += 'The red-orange hue range conveys energy, passion, urgency, and warmth. It stimulates action and draws immediate attention. In Brazilian culture, warm red-orange tones are associated with enthusiasm, determination, and vibrant energy. ';
  else if (hue >= 30 && hue < 60) psychology += 'The yellow-orange hue range conveys optimism, creativity, and warmth. It suggests innovation and forward-thinking. In Brazilian culture, golden-orange tones are associated with success, prosperity, and welcoming hospitality. ';
  else if (hue >= 60 && hue < 150) psychology += 'The green hue range conveys growth, health, nature, and prosperity. It suggests stability and renewal. In Brazilian culture, green tones are strongly associated with natural wealth, environmental consciousness, and financial growth. ';
  else if (hue >= 150 && hue < 210) psychology += 'The cyan-blue hue range conveys trust, stability, professionalism, and calm. It suggests reliability and expertise. In Brazilian culture, blue tones are the most trusted colors for business and financial services, conveying credibility and dependability. ';
  else if (hue >= 210 && hue < 270) psychology += 'The blue-purple hue range conveys wisdom, creativity, luxury, and depth. It suggests innovation and premium quality. In Brazilian culture, indigo tones convey sophistication, expertise, and elevated professional standards. ';
  else if (hue >= 270 && hue < 330) psychology += 'The purple-pink hue range conveys creativity, luxury, femininity, and artistic expression. It suggests uniqueness and premium positioning. ';
  else psychology += 'The red-pink hue range conveys passion, energy, romance, and boldness. It draws attention and creates emotional intensity. ';
  if (sat > 70) psychology += 'The high saturation makes this color vibrant, energetic, and attention-grabbing. It works well for accent elements but should be used sparingly to avoid visual fatigue. ';
  else if (sat > 40) psychology += 'The moderate saturation makes this color balanced and versatile, suitable for both primary and secondary design roles without overwhelming or receding. ';
  else psychology += 'The low saturation makes this color muted, sophisticated, and professional. It works excellently as a background or neutral element that supports rather than competes with more saturated accent colors. ';
  return psychology;
}

function getColorUsage(role: string): string {
  const u: Record<string, string> = {
    background: 'This color serves as the primary canvas background and must cover 100% of the 720x960 pixel canvas area. Every pixel of the background must display this exact color value with zero variation, zero gradient, zero texture, and zero pattern. All other design elements including text, icons, shapes, and decorative accents must be layered on top of this background and must maintain sufficient contrast for readability and visual clarity. The background color establishes the overall mood and tone of the entire composition and is the foundation upon which all visual hierarchy is built.',
    accent: 'This color serves as the accent color for interactive elements, call-to-action indicators, icons, bullet points, decorative highlights, and visual emphasis markers. It should be used strategically to draw the viewer eye to important elements and create visual interest within the composition. The accent color typically occupies 10-15% of the total visual area and should contrast well with both the background color and the text color. Use this color for: icon fills and strokes, bullet point markers, section header accents, underlines beneath titles, decorative shape fills, border accents on containers, and any element that needs to stand out from the surrounding content without being as dominant as the main text.',
    text: 'This color serves as the primary text color for all readable content including titles, body text, and footer text. It must maintain a minimum WCAG AA contrast ratio of 4.5:1 against the background color to ensure readability for users with normal vision, and ideally 7:1 or higher for WCAG AAA compliance. All character rendering should use this exact color value with anti-aliasing enabled for smooth character edges at all specified font sizes. This color should never be used for large background areas, decorative shapes, or accent elements that are not text.',
    primary: 'This color serves as the primary design color for major visual elements including section backgrounds, header bars, content containers, and large decorative shapes. It typically occupies 25-35% of the total visual area and works in harmony with the background color to establish the overall visual tone. Use this color for: section background blocks, header area fills, content container backgrounds, large decorative shapes, and any element that needs significant visual presence without competing with the text for readability.',
    neutral: 'This color serves as the neutral supporting color for secondary text, borders, dividers, placeholder text, subtle backgrounds, and supporting visual elements. It typically occupies 10-20% of the total visual area and provides visual structure without drawing primary attention. Use this color for: secondary body text, captions, placeholder text, border strokes, divider lines, subtle container backgrounds, icon outlines, and any element that should be visible but not prominent.',
  };
  return u[role] || 'This color serves as a general design color for various elements. Use it for decorative accents, supporting shapes, or secondary visual elements that complement the primary color roles.';
}

function getColorAvoidance(role: string): string {
  const a: Record<string, string> = {
    background: 'Do not use this color for small text elements, thin icon strokes, or subtle decorative details that require high contrast against the background. Do not introduce any variation, gradient, or texture to this background color. Do not use any other color for the background. Do not leave any area of the canvas without this background color applied.',
    accent: 'Do not use this color for body text or large blocks of readable content as it may reduce readability. Do not use this color for the background fill. Do not exceed 15% of total canvas area with this color to maintain its accent impact. Do not use this color for footer text or placeholder text.',
    text: 'Do not use this color for background fills, large decorative shapes, or container backgrounds. Do not use this color for accent elements that need to stand out from the text. Do not reduce the opacity of text rendered in this color below 100% except for specific placeholder states.',
    primary: 'Do not use this color for body text or footer text where readability is the primary concern. Do not use this color as the full canvas background unless specifically required by the style. Do not use this color for subtle elements that should recede visually.',
    neutral: 'Do not use this color for primary titles, CTAs, or important visual elements that need maximum visibility. Do not use this color as the background fill. Do not increase the saturation of this color beyond its specified value.',
  };
  return a[role] || 'Do not use this color in ways that conflict with its defined role in the composition.';
}

function getComplementaryHex(hex: string): string {
  const { r, g, b } = hexToRgb(hex);
  return `#${((255-r).toString(16).padStart(2,'0'))}${((255-g).toString(16).padStart(2,'0'))}${((255-b).toString(16).padStart(2,'0'))}`.toUpperCase();
}

function getTriadicHex(hex: string): string {
  const { r, g, b } = hexToRgb(hex);
  return `#${(g.toString(16).padStart(2,'0'))}${(b.toString(16).padStart(2,'0'))}${(r.toString(16).padStart(2,'0'))}`.toUpperCase();
}

function getAnalogousHex(hex: string): string {
  const { r, g, b } = hexToRgb(hex);
  const hsl = rgbToHsl(r, g, b);
  const newH = (hsl.h + 30) % 360;
  const s = hsl.s / 100, l = hsl.l / 100;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs((newH / 60) % 2 - 1));
  const m = l - c / 2;
  let rn = 0, gn = 0, bn = 0;
  if (newH < 60) { rn = c; gn = x; bn = 0; }
  else if (newH < 120) { rn = x; gn = c; bn = 0; }
  else if (newH < 180) { rn = 0; gn = c; bn = x; }
  else if (newH < 240) { rn = 0; gn = x; bn = c; }
  else if (newH < 300) { rn = x; gn = 0; bn = c; }
  else { rn = c; gn = 0; bn = x; }
  return `#${(Math.round((rn+m)*255).toString(16).padStart(2,'0'))}${(Math.round((gn+m)*255).toString(16).padStart(2,'0'))}${(Math.round((bn+m)*255).toString(16).padStart(2,'0'))}`.toUpperCase();
}

function getMonochromaticHex(hex: string): string {
  const { r, g, b } = hexToRgb(hex);
  const hsl = rgbToHsl(r, g, b);
  const newL = Math.min(100, hsl.l + 15);
  const s = hsl.s / 100, l = newL / 100;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((hsl.h / 60) % 2) - 1));
  const m = l - c / 2;
  let rn = 0, gn = 0, bn = 0;
  const h = hsl.h;
  if (h < 60) { rn = c; gn = x; bn = 0; }
  else if (h < 120) { rn = x; gn = c; bn = 0; }
  else if (h < 180) { rn = 0; gn = c; bn = x; }
  else if (h < 240) { rn = 0; gn = x; bn = c; }
  else if (h < 300) { rn = x; gn = 0; bn = c; }
  else { rn = c; gn = 0; bn = x; }
  return `#${(Math.round((rn+m)*255).toString(16).padStart(2,'0'))}${(Math.round((gn+m)*255).toString(16).padStart(2,'0'))}${(Math.round((bn+m)*255).toString(16).padStart(2,'0'))}`.toUpperCase();
}

function getSplitComplementaryHex(hex: string): string {
  const { r, g, b } = hexToRgb(hex);
  return `#${((Math.min(255,r+51)).toString(16).padStart(2,'0'))}${((Math.min(255,g+102)).toString(16).padStart(2,'0'))}${((Math.max(0,b-51)).toString(16).padStart(2,'0'))}`.toUpperCase();
}

function getColorBlindSimulation(r: number, g: number, b: number, type: string): string {
  let sr = r, sg = g, sb = b;
  if (type === 'protanopia') { sr = 0.567 * r + 0.433 * g; sg = 0.558 * r + 0.442 * g; sb = 0.242 * r + 0.758 * b; }
  else if (type === 'deuteranopia') { sr = 0.625 * r + 0.375 * g; sg = 0.7 * r + 0.3 * g; sb = 0.3 * r + 0.7 * b; }
  else if (type === 'tritanopia') { sr = 0.95 * r + 0.05 * g; sg = 0.433 * g + 0.567 * b; sb = 0.475 * g + 0.525 * b; }
  return `#${(Math.round(Math.min(255,Math.max(0,sr))).toString(16).padStart(2,'0'))}${(Math.round(Math.min(255,Math.max(0,sg))).toString(16).padStart(2,'0'))}${(Math.round(Math.min(255,Math.max(0,sb))).toString(16).padStart(2,'0'))}`.toUpperCase();
}

function getPrintNote(r: number, g: number, b: number): string {
  const sat = Math.max(r, g, b) - Math.min(r, g, b);
  if (sat < 30) return 'This near-grayscale color will print consistently across virtually all CMYK printers, laser printers, and inkjet printers with minimal color shift. The neutral tone will reproduce accurately in both color and black-and-white print output. Recommended CMYK values should be verified with the specific printer profile for critical color matching.';
  if (sat > 180) return 'This highly saturated color may appear less vibrant when printed using standard CMYK process printing compared to its screen RGB appearance. The gamut difference between RGB and CMYK means some saturation will be lost in print. For critical print applications, consider using Pantone spot color matching. Digital screen display will show the full saturation accurately.';
  return 'This moderately saturated color should print reasonably well with standard CMYK process printing while maintaining most of its screen appearance. Minor color shift of 5-10% in saturation may occur between screen and print output. For brand-critical applications, verify with a printed proof before full production.';
}

function getDisplayNote(r: number, g: number, b: number): string {
  const lum = getLuminance(r, g, b);
  if (lum > 0.9) return 'This very bright color may cause eye fatigue when used in large areas on dark mode displays or in low-light viewing environments. On OLED and AMOLED displays, this color will consume minimal power due to the pixel-level dimming. On LCD displays with LED backlighting, the power consumption difference is negligible. Ensure adequate contrast with overlaid text for readability.';
  if (lum < 0.1) return 'This very dark color may be difficult to distinguish from pure black on low-contrast displays, budget monitors, or mobile devices with poor brightness calibration. On OLED and AMOLED displays, this color will appear nearly identical to pure black due to pixel-level dimming. On LCD displays, some backlight bleed may be visible around the edges. Ensure text on this background is sufficiently light for readability.';
  return 'This color displays well across all major display types including LCD, LED, OLED, AMOLED, and e-ink with good visibility and accurate color reproduction. It provides sufficient contrast for both light and dark text overlays depending on the specific luminance value. No special display considerations are required.';
}

function getColorAccessibility(r: number, g: number, b: number, bgR: number, bgG: number, bgB: number): string {
  const fgLum = getLuminance(r, g, b);
  const bgLum = getLuminance(bgR, bgG, bgB);
  const ratio = getContrastRatio(fgLum, bgLum);
  const aaNormal = ratio >= 4.5;
  const aaLarge = ratio >= 3;
  const aaaNormal = ratio >= 7;
  const aaaLarge = ratio >= 4.5;
  let report = `Contrast ratio against the specified background is ${ratio.toFixed(2)}:1. `;
  if (aaNormal) report += 'This meets WCAG 2.1 AA standard for normal size text (minimum 4.5:1). ';
  else if (aaLarge) report += 'This meets WCAG 2.1 AA standard for large text (minimum 3:1) but NOT for normal size text. Text using this color combination must be at least 18pt or 14pt bold to meet AA compliance. ';
  else report += 'This does NOT meet WCAG 2.1 AA standards for any text size. The contrast is insufficient for accessible readability. ';
  if (aaaNormal) report += 'This also meets WCAG 2.1 AAA standard for normal size text (minimum 7:1), providing excellent readability for all users including those with mild visual impairments. ';
  else if (aaaLarge) report += 'This meets WCAG 2.1 AAA standard for large text (minimum 4.5:1) but not for normal size text. ';
  else report += 'This does not meet WCAG 2.1 AAA standards. ';
  report += `For users with protanopia (red-blind), the perceived contrast may differ. For users with deuteranopia (green-blind), the perceived contrast may also differ. For users with tritanopia (blue-blind), the contrast difference is typically minimal. `;
  return report;
}

function getTypographyInfo(family: string, weight: string): { family: string; weight: string } {
  const families: Record<string, string> = {
    'sans-serif': 'Sans-serif typefaces are characterized by the absence of decorative strokes (serifs) at the ends of character stems. This creates clean, modern letterforms that are highly legible at various sizes and distances. Sans-serif fonts convey professionalism, clarity, and contemporary design sensibility. They are the preferred choice for digital interfaces, business communications, and modern brand identities. Recommended specific font implementations include: Inter (designed specifically for computer screens with excellent x-height and open letterforms), Roboto (Google material design standard with mechanical skeleton and friendly curves), Helvetica Neue (timeless Swiss design with neutral versatility), SF Pro Display (Apple system font with dynamic optical sizing), Open Sans (humanist sans with excellent readability), or Montserrat (geometric sans with urban contemporary character). All recommended fonts are widely available, web-optimized, and support Brazilian Portuguese character sets including accented characters (aacute, eacute, iacute, oacute, uacute, a tilde, c cedilla, and other Portuguese-specific diacritical marks).',
    'serif': 'Serif typefaces feature small decorative strokes (serifs) at the ends of character stems, creating traditional letterforms that convey authority, trustworthiness, and editorial sophistication. Serif fonts are associated with print media, academic publications, and established institutions. They guide the eye horizontally along lines of text, making them excellent for body text in print contexts. Recommended specific implementations include: Playfair Display (high-contrast editorial serif with dramatic thick-thin transitions), Merriweather (screen-optimized serif with robust letterforms), Georgia (web-safe serif designed for screen readability), or Lora (calligraphic serif with moderate contrast). All support Portuguese diacritical marks.',
    'display': 'Display typefaces are designed for large-size use in headings, titles, and short text passages where maximum visual impact is required. They feature distinctive character shapes, bold weights, and condensed proportions that command immediate attention. Display fonts convey energy, modernity, and strong brand personality. Recommended implementations include: Bebas Neue (condensed geometric sans with uniform stroke weights), Montserrat Black (extreme weight variant of the geometric family), Oswald (condensed gothic sans with strong vertical emphasis), or Raleway ExtraBold (elegant thin-to-bold range with distinctive W character). All support Portuguese character sets.',
    'handwriting': 'Handwriting typefaces simulate casual pen or brush lettering, creating personal, approachable, and creative visual communication. They convey human touch, artistic expression, and informal warmth. Recommended implementations include: Caveat (natural handwriting with varied stroke widths), Pacifico (brush script with surf-culture casual character), or Dancing Script (lively casual script with bouncing baseline). Use sparingly for accent text only, never for body content.',
    'monospace': 'Monospace typefaces allocate equal horizontal space to every character regardless of natural character width, creating uniform grid-aligned letterforms associated with coding, technical documentation, and modern digital aesthetics. They convey precision, technical expertise, and contemporary digital culture. Recommended implementations include: Fira Code (programming font with ligature support), JetBrains Mono (developer-optimized with increased x-height), or Source Code Pro (Adobe open-source monospace with excellent readability).',
  };
  const weights: Record<string, string> = {
    'light': 'Font weight 300 (CSS light) produces delicate, thin letterforms with minimal stroke thickness. This weight should only be used for large display text (minimum 24 pixels or approximately 4% of canvas height) on high-contrast backgrounds where the thin strokes remain clearly distinguishable. Light weight text creates an elegant, refined, and airy visual feeling but sacrifices some readability compared to heavier weights. The minimum WCAG contrast requirement for light weight text is higher than for regular weight text due to the reduced stroke area. Recommended usage: section subtitles, decorative accent text, or large display headings. NOT recommended for body text or small footer text.',
    'regular': 'Font weight 400 (CSS normal/regular) produces standard letterforms optimized for general-purpose readability. This is the default weight for most typefaces and is designed for comfortable extended reading at sizes 14 pixels and above. Regular weight text provides the best balance between visual presence and reading comfort for body content. The stroke thickness is calibrated to render clearly on both high-DPI retina displays and standard 72 DPI screens. Recommended usage: body text paragraphs, secondary content, and any text passage exceeding two lines. NOT recommended for titles or headings that need visual hierarchy distinction.',
    'medium': 'Font weight 500 (CSS medium) produces slightly emphasized letterforms with moderate stroke thickness that bridges the gap between regular body text and bold headings. Medium weight text provides more visual presence than regular text while maintaining excellent readability at sizes 14 pixels and above. This weight is ideal for subtitles, captions, navigation labels, and secondary headings that need more emphasis than body text but less dominance than primary titles. The increased stroke thickness improves character distinction at smaller sizes compared to light weight. Recommended usage: section subtitles, button labels, navigation items, caption text, and secondary headings.',
    'bold': 'Font weight 700 (CSS bold) produces thick, prominent letterforms with substantial stroke thickness that immediately commands visual attention and establishes clear hierarchy. Bold weight text is the standard choice for titles, headings, and any text that needs to be the primary focal point of the composition. The thick strokes ensure excellent visibility and readability even at larger sizes where thinner weights might appear too delicate. Bold text creates strong visual anchors that guide the reader eye through the content hierarchy. Recommended usage: slide titles, section headers, important callout text, and any text that serves as the primary visual entry point for the viewer. NOT recommended for extended body text passages as the thick strokes reduce reading comfort for long passages.',
    'extra-bold': 'Font weight 800-900 (CSS extra-bold/black) produces maximum impact letterforms with extremely thick strokes that dominate the visual field. Extra-bold text should be reserved for hero text, large display titles, critical call-to-action buttons, and any text that must achieve maximum visual prominence within the composition. At sizes above 32 pixels, extra-bold text creates powerful brand statements and conveys confidence, authority, and boldness. However, extra-bold text should be used sparingly as its visual weight can overwhelm other design elements if overused. Character spacing (letter-spacing) may need slight increase (+1 to +2 pixels) at extra-bold weights to prevent adjacent letterforms from visually merging. Recommended usage: hero titles, maximum-impact headlines, brand name display text, and critical CTA buttons. NOT recommended for body text, subtitles, footer text, or any text that requires extended reading comfort.',
  };
  return { family: families[family] || families['sans-serif'], weight: weights[weight] || weights['bold'] };
}

// ============================================================================
// MAIN GENERATION FUNCTIONS
// ============================================================================

function generateCanvasBackground(slideType: string, slideNumber: number, bg: any, colors: any[]): string {
  const bgHex = (colors.find((c: any) => c.role === 'background')?.hex || '#FFFFFF').toUpperCase();
  const { r, g, b } = hexToRgb(bgHex);
  const hsl = rgbToHsl(r, g, b);
  const hsv = rgbToHsv(r, g, b);
  const lum = getLuminance(r, g, b);

  return `INSTAGRAM CAROUSEL SLIDE ${slideNumber} OF 4 ${slideType.toUpperCase()} COMPREHENSIVE IMAGE GENERATION SPECIFICATION

CANVAS SPECIFICATIONS: Create a digital image with exact pixel dimensions of 720 pixels in width and 960 pixels in height. These dimensions produce a precise 3:4 aspect ratio (720 divided by 960 equals 0.75) which is the optimal portrait orientation for Instagram carousel posts. The resolution should be set to 72 dots per inch (DPI) which is the standard screen-optimized resolution for digital display on mobile devices, tablets, and computer monitors. The color space must be sRGB (standard Red Green Blue, IEC 61966-2.1) which is the universal color space for web and mobile content delivery. The canvas orientation is vertical portrait meaning the height (960 pixels) exceeds the width (720 pixels). In physical measurement equivalents, at 72 DPI the canvas measures 10 inches wide by 13.333 inches tall, or 254 millimeters wide by 338.667 millimeters tall, or 25.4 centimeters wide by 33.867 centimeters tall. Every single pixel of the final generated output must conform to these exact specifications without any deviation in dimensions, resolution, color space, or orientation. The total pixel count is 691,200 individual pixels (720 multiplied by 960) each of which must be rendered at the specified color values.

BACKGROUND SPECIFICATION: Fill the entire 720 pixel by 960 pixel canvas area with the exact solid uniform background color ${bgHex}. This background color must cover 100% of the canvas area extending from the left edge (pixel column 0) to the right edge (pixel column 719) and from the top edge (pixel row 0) to the bottom edge (pixel row 959) with no borders, no margins, no gradients, no textures, no patterns, no photographs, no visual noise, no grain, no variation, no fading, no vignetting, and no color shift whatsoever. Every single pixel of the background must display the exact identical color value ${bgHex} with zero tolerance for deviation. The background type is specified as ${bg.type || 'solid'} with ${bg.complexity || 'minimal'} complexity level and ${bg.dominantTone || 'cool'} dominant color temperature tone. The background color ${bgHex} has the following precise color specifications: Hexadecimal code ${bgHex}, Red channel value ${r} out of 255 (${((r/255)*100).toFixed(1)}%), Green channel value ${g} out of 255 (${((g/255)*100).toFixed(1)}%), Blue channel value ${b} out of 255 (${((b/255)*100).toFixed(1)}%), HSL values of hue ${hsl.h} degrees, saturation ${hsl.s} percent, lightness ${hsl.l} percent, HSV values of hue ${hsv.h} degrees, saturation ${hsv.s} percent, value ${hsv.v} percent. The relative luminance of this background color is ${lum.toFixed(4)} on a scale of 0.0 (pure black) to 1.0 (pure white), classifying it as a ${lum > 0.5 ? 'light' : 'dark'} background color. This luminance value determines which text colors will achieve sufficient contrast for readable text overlay. The background serves as the absolute foundation upon which all other design elements including text, icons, decorative shapes, lines, and brand logos are layered. The background color establishes the overall mood, tone, and visual temperature of the entire composition and is the single most important color decision in the design system. ${bg.type === 'solid' ? 'This background must remain a completely flat, solid, uniform color with absolutely no surface treatment, no gradient blending, no texture overlay, no pattern repetition, no photographic element, no noise grain, no paper texture, no fabric texture, no geometric pattern, and no visual variation of any kind across the entire canvas area. The background should appear as a pure digital color fill with mathematical precision and uniformity.' : ''}`;
}

function generateColorSystem(colors: any[], slideType: string): string {
  let section = '';
  const bgHex = (colors.find((c: any) => c.role === 'background')?.hex || '#FFFFFF').toUpperCase();
  const bgRgb = hexToRgb(bgHex);
  const bgLum = getLuminance(bgRgb.r, bgRgb.g, bgRgb.b);

  section += `COLOR PALETTE COMPREHENSIVE ANALYSIS: This design system utilizes a precisely curated palette of ${colors.length} distinct colors that were extracted from actual brand reference images through systematic visual analysis. Each color in this palette has been assigned a specific functional role within the composition and must be used exclusively for that role. No additional colors outside this defined palette may be introduced into the design under any circumstances. `;

  colors.forEach((c: any, i: number) => {
    const hex = (c.hex || '#FFFFFF').toUpperCase();
    const { r, g, b } = hexToRgb(hex);
    const hsl = rgbToHsl(r, g, b);
    const hsv = rgbToHsv(r, g, b);
    const lum = getLuminance(r, g, b);
    const contrastWithBg = getContrastRatio(lum, bgLum);
    const bestText = lum > 0.5 ? '#000000 (pure black)' : '#FFFFFF (pure white)';
    const saturation = Math.max(r, g, b) - Math.min(r, g, b);
    const temp = r > b + 30 ? 'warm' : b > r + 30 ? 'cool' : 'neutral';
    const protanopia = getColorBlindSimulation(r, g, b, 'protanopia');
    const deuteranopia = getColorBlindSimulation(r, g, b, 'deuteranopia');
    const tritanopia = getColorBlindSimulation(r, g, b, 'tritanopia');

    section += `COLOR ${i + 1} DETAILED SPECIFICATION: The designated hex color code for this palette member is ${hex}. `;
    section += `This color serves the functional role of ${c.role} within the composition and occupies approximately ${c.percentage}% of the total visual design area. `;
    section += `In the RGB (Red Green Blue) additive color model used for digital screen display, this color is composed of Red channel intensity ${r} on a scale of 0 to 255 (which is ${((r/255)*100).toFixed(1)}% of maximum red intensity), Green channel intensity ${g} on a scale of 0 to 255 (which is ${((g/255)*100).toFixed(1)}% of maximum green intensity), and Blue channel intensity ${b} on a scale of 0 to 255 (which is ${((b/255)*100).toFixed(1)}% of maximum blue intensity). `;
    section += `The CSS rgb() function notation for this color is rgb(${r}, ${g}, ${b}) and the CSS rgba() notation with full opacity is rgba(${r}, ${g}, ${b}, 1.0). `;
    section += `In the HSL (Hue Saturation Lightness) cylindrical color model, this color has a hue angle of ${hsl.h} degrees on the 360-degree color wheel (where 0 degrees is pure red, 120 degrees is pure green, and 240 degrees is pure blue), a saturation level of ${hsl.s}% (where 0% is completely desaturated gray and 100% is fully saturated pure color), and a lightness value of ${hsl.l}% (where 0% is pure black, 50% is the pure color at full intensity, and 100% is pure white). `;
    section += `In the HSV (Hue Saturation Value) color model, this color has hue ${hsv.h} degrees, saturation ${hsv.s}%, and value (brightness) ${hsv.v}%. `;
    section += `The relative luminance of this color is ${lum.toFixed(4)} calculated using the sRGB luminance formula (0.299 times red + 0.587 times green + 0.114 times blue, all divided by 255). `;
    section += `This luminance value classifies the color as ${lum > 0.8 ? 'very light' : lum > 0.5 ? 'light' : lum > 0.2 ? 'medium-dark' : 'very dark'}. `;
    section += `The contrast ratio between this color and the background color ${bgHex} is ${contrastWithBg.toFixed(2)}:1 calculated using the WCAG 2.1 formula (L1 + 0.05) / (L2 + 0.05) where L1 is the lighter luminance and L2 is the darker luminance. `;
    section += `This contrast ratio ${contrastWithBg >= 7 ? 'exceeds the WCAG 2.1 AAA standard of 7:1, providing excellent readability for all users including those with visual impairments' : contrastWithBg >= 4.5 ? 'meets the WCAG 2.1 AA standard of 4.5:1, providing good readability for users with normal vision' : contrastWithBg >= 3 ? 'meets the WCAG 2.1 AA standard for large text (18pt or 14pt bold) at 3:1 but not for normal size text' : 'does NOT meet WCAG 2.1 AA standards for any text size and should not be used for text on this background'}. `;
    section += `The optimal text color for readability on a background of this color would be ${bestText}. `;
    section += `The saturation delta (difference between maximum and minimum RGB channel values) is ${saturation} out of a possible 255, indicating this is a ${saturation > 180 ? 'highly saturated vibrant' : saturation > 100 ? 'moderately saturated' : saturation > 50 ? 'mildly saturated' : 'low saturation near-gray'} color. `;
    section += `The color temperature is ${temp} ${temp === 'warm' ? 'because the red channel (' + r + ') exceeds the blue channel (' + b + ') by more than 30 units, placing this color in the warm half of the color temperature spectrum' : temp === 'cool' ? 'because the blue channel (' + b + ') exceeds the red channel (' + r + ') by more than 30 units, placing this color in the cool half of the color temperature spectrum' : 'because the red and blue channels are within 30 units of each other, creating a balanced neutral temperature'}. `;
    section += `The complementary color (directly opposite on the 360-degree color wheel) of ${hex} is ${getComplementaryHex(hex)}. `;
    section += `The triadic color (120 degrees around the color wheel) of ${hex} is ${getTriadicHex(hex)}. `;
    section += `The analogous color (30 degrees adjacent on the color wheel) of ${hex} is ${getAnalogousHex(hex)}. `;
    section += `The monochromatic lighter variant (same hue and saturation, +15% lightness) of ${hex} is ${getMonochromaticHex(hex)}. `;
    section += `The split-complementary color of ${hex} is ${getSplitComplementaryHex(hex)}. `;
    section += `Color psychology analysis: ${getColorPsychology(r, g, b)} `;
    section += `Usage specification for this ${c.role} color: ${getColorUsage(c.role)} `;
    section += `Avoidance rules for this color: ${getColorAvoidance(c.role)} `;
    section += `Accessibility analysis: ${getColorAccessibility(r, g, b, bgRgb.r, bgRgb.g, bgRgb.b)} `;
    section += `For users with protanopia (red color blindness affecting approximately 1% of males), this color would be perceived approximately as ${protanopia}. `;
    section += `For users with deuteranopia (green color blindness affecting approximately 5% of males), this color would be perceived approximately as ${deuteranopia}. `;
    section += `For users with tritanopia (blue color blindness affecting approximately 0.01% of the population), this color would be perceived approximately as ${tritanopia}. `;
    section += `Print production note: ${getPrintNote(r, g, b)} `;
    section += `Digital display note: ${getDisplayNote(r, g, b)} `;
    section += `Opacity variations for this color: at 100% opacity the color is ${hex} (full solid appearance), at 75% opacity the color appears as ${hex}CC (slightly translucent allowing background to show through), at 50% opacity the color appears as ${hex}80 (semi-transparent creating a tinted overlay effect), at 25% opacity the color appears as ${hex}40 (barely visible subtle tint), and at 10% opacity the color appears as ${hex}1A (almost invisible whisper of color useful for very subtle background tints). `;
    section += `Brazilian cultural color context: In Brazilian business and accounting culture, `;
    if (temp === 'cool') section += `cool colors like this one (blue-green spectrum) are strongly associated with trust, reliability, professionalism, and financial stability. Brazilian audiences perceive cool colors as credible and authoritative, making them excellent choices for accounting firm branding. `;
    else if (temp === 'warm') section += `warm colors like this one (red-orange spectrum) are associated with energy, passion, urgency, and action. Brazilian audiences perceive warm colors as engaging and dynamic but potentially less formal than cool colors. `;
    else section += `neutral temperature colors like this one are perceived as balanced, professional, and versatile in Brazilian business culture. They do not carry strong emotional associations, making them safe choices for backgrounds and supporting elements. `;
    section += `\n\n`;
  });

  section += `COLOR HARMONY AND RELATIONSHIP RULES: The ${colors.length} colors in this palette work together as a harmonious system where each color has a defined role and relationship to the other colors. The primary harmony type is `;
  if (colors.length <= 3) section += `minimalist monochromatic or analogous, meaning the colors are closely related on the color wheel and create a calm, cohesive visual experience. `;
  else if (colors.length <= 5) section += `analogous with accent, meaning most colors are adjacent on the color wheel with one accent color providing visual interest and focal point creation. `;
  else section += `complementary with supporting tones, meaning the palette includes colors from opposite sides of the color wheel creating dynamic contrast balanced by neutral supporting colors. `;
  section += `The maximum number of colors that should appear in any single visual element is three (the primary color, a secondary color, and an accent color). `;
  section += `The background must use EXACTLY the specified background color ${bgHex} with zero tolerance for substitution with similar or approximate colors. `;
  section += `Text elements must use EXACTLY the specified text color with no approximation. `;
  section += `Accent elements should use EXACTLY the specified accent color. `;
  section += `When creating visual hierarchy through color, use the defined palette colors in order of their role importance: primary colors first, then accent colors, then neutral colors. `;
  section += `Never introduce random colors, system default colors, or generator-chosen colors that fall outside this defined palette. `;
  section += `The color distribution across the composition should approximately match the percentage values specified for each color role. `;
  section += `If a color needs to be adjusted for hover states, active states, or disabled states, modify the opacity of the specified color rather than selecting a different hue. `;

  return section;
}

function generateTypographySystem(typo: any, colors: any[], slideType: string): string {
  const textHex = (colors.find((c: any) => c.role === 'text')?.hex || '#1E293B').toUpperCase();
  const info = getTypographyInfo(typo.fontFamily || 'sans-serif', typo.weight || 'bold');
  let section = `TYPOGRAPHY SYSTEM COMPREHENSIVE SPECIFICATION: The typography system for this design is built around the primary font family ${typo.fontFamily || 'sans-serif'}. ${info.family} The specified font weight for titles and headings is ${typo.weight || 'bold'}. ${info.weight} The typography hierarchy type is ${typo.hierarchy || 'two-level'}. `;

  if (typo.hierarchy === 'two-level') section += `Two-level hierarchy means there are exactly two distinct text size levels creating clear visual distinction between title and body content. The title text should occupy approximately 8% to 12% of the canvas height, which on a 960 pixel tall canvas translates to title font sizes between 77 pixels (8% of 960) and 115 pixels (12% of 960). The body text should occupy approximately 4% to 6% of the canvas height, translating to body font sizes between 38 pixels (4% of 960) and 58 pixels (6% of 960). The size ratio between title and body text is approximately 2.5 to 1, meaning the title text should be roughly two and a half times larger than the body text. This size differential creates immediate and unmistakable visual hierarchy that allows the viewer to instantly distinguish between the primary heading and the supporting body content without reading a single word.`;
  else if (typo.hierarchy === 'multi-level') section += `Multi-level hierarchy means there are three or more distinct text size levels creating a detailed information architecture. The hero title occupies 12-15% of canvas height (115-144 pixels), section subtitles occupy 6-8% (58-77 pixels), body text occupies 4-6% (38-58 pixels), and footer text occupies 2-3% (19-29 pixels). Each level serves a specific informational purpose and guides the reader through the content in a structured sequence from most important to least important information.`;
  else section += `Single-level hierarchy means all text elements use approximately the same font size with differentiation achieved through font weight, color, capitalization, and spacing rather than size differences. This creates a uniform, egalitarian visual rhythm suitable for minimalist or editorial design approaches.`;

  section += ` The text treatment specification is ${typo.treatment || 'uppercase'}. `;
  if (typo.treatment === 'uppercase') section += `Uppercase treatment means ALL LETTERS IN THE TEXT ARE RENDERED IN CAPITAL LETTERS with no lowercase characters. This creates a strong, authoritative, and impactful visual presence. When rendering uppercase text, increase the letter-spacing (tracking) by 1 to 2 pixels beyond the default font spacing to improve character distinction and readability, as uppercase letters without adequate spacing can appear too dense. Uppercase text is most effective for short titles of 6 words or fewer, as longer uppercase passages become significantly more difficult to read quickly due to the loss of word shape recognition that lowercase letters provide. The word shape (bouma shape) is the overall outline pattern of a word that the brain recognizes for rapid reading, and uppercase text eliminates word shapes since all letters become uniform rectangular blocks. For body text and footer text, use sentence-case treatment even when the title is uppercase, to maintain reading comfort for longer text passages. `;
  else if (typo.treatment === 'title-case') section += `Title-case treatment means the first letter of each major word is capitalized while the remaining letters are lowercase, following standard title capitalization rules (capitalize nouns, verbs, adjectives, adverbs; lowercase articles, conjunctions, prepositions unless they are the first or last word). This treatment is professional, readable, and suitable for headings and titles of any length. Letter-spacing remains at the default 0 pixels. Title-case text provides good reading speed as it preserves word shapes while adding visual structure through capitalized word-initial letters. `;
  else section += `Sentence-case treatment means only the first letter of the first word is capitalized, with all other words in lowercase except proper nouns that require capitalization by grammatical rule. This treatment is the most conversational and approachable, providing the fastest reading speed among all text treatments because it maximizes word shape distinctiveness. Sentence-case is ideal for body text, descriptions, and any text passage where reading comfort and speed are priorities. `;

  section += `Letter-spacing (tracking) is specified as normal 0 pixels, providing the font designer's intended character proximity for optimal readability. `;
  section += `Line-height (leading) is specified as 1.4 to 1.5 times the font size, meaning for every 100 pixels of font size there should be 140 to 150 pixels of vertical space from one text baseline to the next baseline. This line-height range provides comfortable reading rhythm and prevents lines from appearing cramped (which causes the eye to accidentally skip lines) or excessively separated (which breaks the visual connection between consecutive lines). `;
  section += `All text rendered in this design must be in Brazilian Portuguese (Português Brasileiro) exclusively, using correct Portuguese spelling, grammar, punctuation, and diacritical marks including acute accents (á, é, í, ó, ú), tilde (ã, õ), circumflex (â, ê, ô), cedilla (ç), and diaeresis as required. `;
  section += `No English words, phrases, or text elements are permitted in the design except for the established brand URL "AlfaContabilidadeCariri.com.br" which is a proper web address and must be rendered exactly as specified. `;
  section += `The text color for all primary content (titles, body text, footer) must be the exact specified text color ${textHex} from the color palette. `;
  section += `The minimum text size for readability on the 720 pixel wide canvas is 14 pixels for footer text, 24 pixels for body text, and 48 pixels for title text. `;
  section += `The maximum recommended characters per line for comfortable reading is 45 to 65 characters including spaces. If any text element exceeds this width, it should wrap to a second line with the same line-height specification of 1.4 to 1.5 times the font size. `;
  section += `Font rendering should use subpixel antialiasing (ClearType on Windows, Core Text on macOS) for the smoothest character edges on LCD displays. `;
  section += `Font hinting should be set to auto for optimal rendering at various sizes. `;
  section += `Standard typographic ligatures (such as fi, fl, ffi, ffl combinations) should be enabled if the font supports them. `;
  section += `Optical margin alignment should be enabled to allow punctuation marks (periods, commas, quotation marks) to hang slightly outside the text block margin for cleaner visual edges. `;
  section += `Hyphenation should be disabled for title text and enabled for body text only when necessary to prevent excessive word spacing in justified text blocks. `;

  return section;
}

function generateLayoutSystem(layout: any, colors: any[], slideType: string): string {
  let section = `LAYOUT AND COMPOSITION SYSTEM COMPREHENSIVE SPECIFICATION: The canvas dimensions are 720 pixels width by 960 pixels height with 3:4 aspect ratio at 72 DPI in sRGB color space. The composition type is ${layout.type || 'centered'}. `;

  if (layout.type === 'centered') section += `Centered composition means all primary visual elements including the title text block, body text block, icons, decorative shapes, and any other content elements are symmetrically aligned along the vertical center axis of the canvas at the x-coordinate of 360 pixels (which is exactly half of the 720 pixel canvas width). The left margin from the left canvas edge to the leftmost element edge and the right margin from the right canvas edge to the rightmost element edge are equal, creating visual balance, stability, and formal professionalism. This composition type is the most universally readable layout choice and conveys professionalism, formality, balance, clarity, and organizational competence. The viewer's eye naturally travels to the center of the canvas and then moves downward through the centered content in a predictable top-to-bottom reading flow. Centered composition is the safest and most broadly appropriate layout choice for business and accounting communication. `;
  else if (layout.type === 'asymmetric') section += `Asymmetric composition means visual elements are deliberately offset from the center axis creating dynamic visual tension and contemporary editorial energy. Elements on one side of the canvas may be larger, heavier, or more prominent while elements on the opposite side provide counterbalancing visual weight through quantity, color intensity, or positioning. Asymmetric layouts feel modern, artistic, and design-forward but require more careful execution to maintain readability and visual balance. `;
  else if (layout.type === 'grid') section += `Grid-based composition means all content is organized into a structured system of columns and rows that create order, consistency, and excellent scannability. Elements snap to grid lines and grid intersections providing a mathematical framework for all spacing, sizing, and alignment decisions. `;
  else if (layout.type === 'minimal') section += `Minimal composition uses maximum negative (empty) space with the fewest possible visual elements. Each element that does appear is given generous breathing room with large margins and padding. The emphasis is on what is NOT present rather than what IS present. `;
  else section += `Standard layout composition with ${layout.contentZones || 2} content zones. `;

  section += `The number of content zones is ${layout.contentZones || 2}. `;
  section += `Zone 1 (Header/Title area) occupies the top 15% to 20% of the canvas height, which is the area from pixel row 0 to approximately pixel row 144-192 (15-20% of 960 pixels). This zone contains the slide title text and must be the most visually prominent element in the composition. `;
  section += `Zone 2 (Body/Content area) occupies the middle 50% to 60% of the canvas height, which is the area from approximately pixel row 192 to pixel row 768 (the center 576 pixels of the 960 pixel tall canvas). This zone contains the body text and any supporting visual elements such as icons, shapes, or decorative accents. `;
  section += `Zone 3 (Footer area) occupies the bottom 10% to 15% of the canvas height, which is the area from approximately pixel row 816 to pixel row 960 (the bottom 144 pixels of the canvas). This zone contains the footer text "Conteúdo completo em AlfaContabilidadeCariri.com.br" rendered in small, subtle text. `;
  section += `The logo safe zone is defined as the top-right corner area spanning approximately 12% of the canvas width (86 pixels, from pixel column 634 to pixel column 719) and 8% of the canvas height (77 pixels, from pixel row 0 to pixel row 76). This zone MUST remain completely clean and empty with no text, no graphics, no decorative elements, no shapes, no icons, no patterns, and no visual content of any kind. This area is reserved for a brand logo that will be overlaid later through a separate brand compositing process. `;
  section += `The text-to-image ratio is ${layout.textToImageRatio || 'text-heavy'} meaning `;
  if (layout.textToImageRatio === 'text-heavy') section += `text content dominates the composition occupying 70-80% of the usable canvas area. Visual elements such as icons, shapes, or decorative accents occupy only 20-30% serving to support and punctuate the text rather than compete with it. The background must be simple and non-distracting to maximize text readability. `;
  else if (layout.textToImageRatio === 'balanced') section += `text and visual elements share the canvas approximately equally with text occupying 45-55% and visuals occupying 45-55%. The background can have moderate complexity since the visual elements provide sufficient contrast and interest. `;
  else section += `visual elements dominate the composition occupying 70-80% of the canvas while text is minimal and impactful occupying only 20-30%. The background can be highly complex or striking since the text is sparse. `;
  section += `The primary alignment is ${layout.alignment || 'center'} meaning `;
  if (layout.alignment === 'center') section += `all text blocks and visual elements are centered horizontally. Creates formal, balanced appearance. `;
  else if (layout.alignment === 'left') section += `all text blocks and visual elements are left-aligned. Creates modern, editorial feel. `;
  else if (layout.alignment === 'right') section += `all text blocks and visual elements are right-aligned. Creates distinctive, unconventional appearance. `;
  else section += `different element types use different alignments creating dynamic visual hierarchy. `;
  section += `The spacing system uses 8 pixels as the base unit meaning all margins, paddings, and gaps between elements are multiples of 8: 8px, 16px, 24px, 32px, 48px, 64px and so on. This creates visual rhythm and consistency throughout the design. The padding from canvas edges to content is approximately 57 pixels (8% of canvas width) on all four sides. The gap between the title and body text is approximately 36 pixels. The gap between body text and footer is approximately 24 pixels.`;

  return section;
}

function generateVisualElements(visual: any, colors: any[], slideType: string): string {
  let section = `VISUAL ELEMENTS COMPREHENSIVE SPECIFICATION: `;

  if (visual.hasIcons) {
    section += `Icons ARE present in this design style using ${visual.iconStyle || 'line'} icon treatment. `;
    if (visual.iconStyle === 'line') section += `Line icons use thin strokes of 1.5 to 2 pixels width with no fill color, creating clean minimalist outlines. Stroke color should be the accent color or text color from the defined palette. Icon size range: 24 to 48 pixels. ALL icons must come from the same icon family for consistent stroke width, corner treatment, and visual style. Do NOT mix line icons with filled or illustrated icons. Icon placement: adjacent to text elements they relate to, either as bullet points replacing standard dots, section headers introducing content blocks, or inline illustrations supporting specific claims. Vertical alignment: icon center should align with text cap height or slightly above the text baseline for optimal visual balance. `;
    else if (visual.iconStyle === 'filled') section += `Filled icons use solid color fills with no stroke outlines, creating bold high-visibility shapes. Fill color should be the accent color from the palette. Icon size range: 24 to 36 pixels (smaller than line icons because solid fills carry more visual weight). All filled icons must come from the same family. Icon placement: integrated into content areas, as bullet points or section headers. `;
    else if (visual.iconStyle === 'illustration') section += `Illustrated icons are custom artistic representations rather than standardized shapes. Size range: 48 to 96 pixels. Use the same color palette and follow the same visual language regarding corner treatment, complexity, and mood. `;
    else section += `No specific icon style detected. Default to simple line icons. Icon placement: adjacent to text elements they relate to. `;
    section += `The number and placement of icons should be consistent across all four slides of the carousel to maintain visual rhythm and predictability. `;
  } else {
    section += `Icons are NOT present in this design style. Do NOT add any icon elements, icon-like shapes, or pseudo-icon decorative elements to the composition. The absence of icons is a deliberate design choice keeping the composition focused on typography and color as the primary communication vehicles. Adding icons would violate the established style and create visual inconsistency. `;
  }

  if (visual.hasDecorativeShapes) {
    section += `Decorative shapes ARE present using ${visual.shapeLanguage || 'rounded'} shape language. `;
    if (visual.shapeLanguage === 'rounded') section += `Rounded shapes include circles, rounded rectangles, and pill shapes with border-radius values of 8 to 12 pixels for small shapes and 16 to 24 pixels for larger shapes. Rendered at 10-20% opacity using accent or background color at reduced opacity. Placement: corners, edges, or subtle background accents behind text blocks. `;
    else if (visual.shapeLanguage === 'sharp') section += `Sharp shapes include rectangles, squares, and triangles with 0 pixel border-radius creating crisp authoritative geometric forms. Rendered at 10-15% opacity. Work well as section backgrounds, sidebars, or accent blocks framing important content. `;
    else if (visual.shapeLanguage === 'mixed') section += `Mix of rounded and sharp shapes creates dynamic visual tension. Use rounded for primary decorative accents, sharp for structural elements like section dividers. `;
    else section += `Organic shapes include blobs, waves, and free-form curves. Rendered at 5-15% opacity as subtle background elements. `;
    section += `Size range: 20-40 pixels for small accent shapes, 100-200 pixels for large background shapes. All shapes must use colors exclusively from the defined palette. `;
  } else {
    section += `Decorative shapes are NOT present. Do NOT add any circles, rectangles, blobs, geometric accents, or decorative background shapes. The composition relies entirely on typography, color, and spacing for visual interest. `;
  }

  section += `Lines and dividers: ${visual.hasLines ? 'Lines ARE present using solid 1-2 pixel stroke weight in neutral color at 30-50% opacity. Horizontal lines span approximately 80% of canvas width centered horizontally. Maintain standard padding of 57 pixels from canvas edges. Lines serve as visual separators between content sections.' : 'Lines and dividers are NOT present. Content sections are separated through spacing, typography, and color differences alone.'} `;
  section += `Gradients: ${visual.hasGradients ? 'Gradients ARE used. Direction: top-to-bottom or diagonal at 45 degrees. Colors: analogous colors from the defined palette. Intensity: subtle with 10-20% opacity difference between start and end colors. Applied only to background areas or large decorative shapes, never to text or small icons.' : 'Gradients are STRICTLY FORBIDDEN. Background must be a SINGLE UNIFORM FLAT SOLID color with ZERO gradient effect. Every pixel of the background must display the exact same hex color value with no variation, no transition, no fade, no blend.'} `;
  section += `Textures: ${visual.hasTextures ? 'Textures ARE present as subtle paper grain, noise, or pattern at 5-15% maximum opacity. Texture color matches the background color so it does not introduce new hues.' : 'Textures are NOT present. Surface must be completely smooth, flat, and clean with zero texture, zero grain, zero noise, zero pattern of any kind.'} `;
  section += `Shadows: ${visual.hasShadows ? 'Shadows ARE used with specifications: X offset 0px, Y offset 2-4px, blur radius 8-16px, opacity 10-20%, color #000000. Applied to title text areas, icon containers, and decorative shape containers. Do NOT apply shadows to background elements or body text.' : 'Shadows are NOT used. Design is completely flat with zero drop shadows, zero inner shadows, zero depth effects. All elements exist on the same visual plane.'} `;

  const bulletDesc = visual.bulletStyle && visual.bulletStyle !== 'none' ? `Bullet style: ${visual.bulletStyle}. ` + (visual.bulletStyle === 'dots' ? 'Small circular dots 6-8px diameter.' : visual.bulletStyle === 'dashes' ? 'Short horizontal dashes 8-10px wide.' : visual.bulletStyle === 'arrows' ? 'Small arrow icons pointing right.' : visual.bulletStyle === 'custom-icons' ? 'Custom mini-icons as bullet points.' : visual.bulletStyle === 'numbers' ? 'Numbered list 1, 2, 3...' : 'Standard bullets.') : 'No bullet points. Text flows in paragraph format.';
  section += `Bullet points: ${bulletDesc} `;

  const cornerDesc = visual.cornerTreatment === 'sharp' ? 'All corners are sharp 0px border radius.' : visual.cornerTreatment === 'slightly-rounded' ? 'Slightly rounded 4px border radius.' : visual.cornerTreatment === 'rounded' ? 'Rounded 8-12px border radius.' : visual.cornerTreatment === 'fully-rounded' ? 'Fully rounded 16-24px border radius.' : 'Sharp corners.';
  section += `Corner treatment: ${visual.cornerTreatment || 'sharp'}. ${cornerDesc} `;

  section += `Framing elements: ${visual.hasFramingElements ? 'Present - content framed with decorative borders.' : 'Absent.'} Watermarks: ${visual.hasWatermarks ? 'Present - subtle brand marks in background.' : 'Absent.'} Badges: ${visual.badgeElements ? 'Present - badge or tag elements for emphasis.' : 'Absent.'} Ribbons: ${visual.ribbonElements ? 'Present - ribbon or banner elements for highlights.' : 'Absent.'}`;

  return section;
}

function generateMoodSystem(mood: any, slideType: string): string {
  const entries = Object.entries(mood).sort((a, b) => (b[1] as number) - (a[1] as number));
  const top = entries.filter(([, v]) => (v as number) >= 60);
  const low = entries.filter(([, v]) => (v as number) < 40);

  let section = `MOOD AND EMOTIONAL ATMOSPHERE COMPREHENSIVE SPECIFICATION: The design mood profile is defined by the following dimensional scores on a 0-100 scale. `;

  entries.forEach(([key, value]) => {
    const v = value as number;
    section += `${key.charAt(0).toUpperCase() + key.slice(1)}: ${v}/100. `;
    if (v >= 80) section += `This is a VERY HIGH score indicating this mood dimension is extremely important to the design identity. `;
    else if (v >= 60) section += `This is a HIGH score indicating this mood dimension is significantly important to the design. `;
    else if (v >= 40) section += `This is a MODERATE score indicating this mood dimension has some relevance but is not dominant. `;
    else section += `This is a LOW score indicating this mood dimension should be minimized or avoided in the design. `;

    const moods: Record<string, string> = {
      professional: v > 70 ? 'The design must use structured layouts with clear content hierarchy, clean typography with no decorative fonts, restrained color palette, and business-appropriate content. Every element should communicate credibility and expertise.' : v > 40 ? 'Design can be approachable while maintaining business appropriateness. Structured layouts preferred but some creative expression is acceptable.' : 'Design can prioritize engagement, entertainment, or emotional connection over business credibility.',
      playful: v > 70 ? 'The design should incorporate fun visual elements, rounded shapes, bright accent colors, and friendly iconography. Avoid stiff corporate aesthetics.' : v > 40 ? 'Some playful elements can be included but the overall design should maintain professional communication clarity.' : 'Avoid playful elements. Keep the design serious and formal.',
      serious: v > 70 ? 'The design must use formal structured layouts, authoritative typography, and sober color choices. Avoid anything casual, decorative, or lighthearted.' : v > 40 ? 'Design should be professional but can include some approachable visual language.' : 'Avoid serious formal aesthetics. Prefer casual approachable design.',
      luxurious: v > 70 ? 'The design must convey premium quality through generous spacing, sophisticated typography, rich color palette, and refined decorative details. Every element should feel expensive.' : v > 40 ? 'Some premium touches are acceptable but the design should remain accessible and not feel exclusive.' : 'Avoid luxury signals. Keep the design practical and accessible.',
      minimal: v > 70 ? 'The design must use maximum negative space with every element earning its place. Remove anything decorative or non-functional. Think Apple-level simplicity.' : v > 40 ? 'Negative space is important but does not need to dominate. Balance simplicity with sufficient visual interest.' : 'Design can be rich and detailed with multiple visual elements and decorative accents.',
      energetic: v > 70 ? 'The design should feel dynamic, vibrant, and active. Use diagonal angles, bold colors, and motion-indicating visual elements.' : v > 40 ? 'Some energy can be expressed through color and layout while maintaining overall calm professionalism.' : 'Avoid energetic visual language. Keep the design calm and measured.',
      corporate: v > 70 ? 'The design must conform to enterprise-grade visual standards. Use formal structured layouts, brand-consistent elements, professional color schemes. Avoid anything playful or startup-aesthetic.' : v > 40 ? 'Design should be business-appropriate but can incorporate contemporary design trends.' : 'Design can be casual, creative, or personal rather than formal business communication.',
      creative: v > 70 ? 'The design should push visual boundaries with unconventional layouts, artistic elements, expressive typography, and unexpected visual metaphors. Think design portfolio quality.' : v > 40 ? 'Some artistic expression is acceptable within a professional framework. Include one or two creative accents.' : 'Design should prioritize clarity and convention over artistic expression.',
    };
    section += (moods[key] || '') + ' ';
  });

  section += `The primary moods (score >= 60) that should dominate the design are: ${top.map(([k]) => k).join(', ') || 'balanced professional'}. `;
  section += `The avoided moods (score < 40) that should be minimized are: ${low.map(([k]) => k).join(', ') || 'none'}. `;
  section += `The target audience emotional response should be trust in the content accuracy, clarity of the message, and confidence in the professional expertise being communicated. `;

  return section;
}

function generateSlideContent(slideTitle: string, slideText: string, slideType: string, slideNumber: number, typo: any, colors: any[]): string {
  const textHex = (colors.find((c: any) => c.role === 'text')?.hex || '#1E293B').toUpperCase();
  let section = `SLIDE CONTENT AND TEXT PLACEMENT COMPREHENSIVE SPECIFICATION: This is slide ${slideNumber} of 4 total slides in the Instagram carousel. The slide type is ${slideType} which determines the specific content role this slide plays within the carousel narrative sequence. `;

  if (slideType === 'cover' || slideNumber === 1) section += `As the cover slide, this is the first slide the viewer sees and must immediately capture attention, communicate the topic, and encourage the viewer to swipe through the remaining slides. The cover slide should have the most prominent title, the clearest visual hierarchy, and the strongest visual impact of all four slides. `;
  else if (slideType === 'cta' || slideNumber === 4) section += `As the CTA (Call To Action) slide, this is the final slide that must direct the viewer to take a specific action such as visiting a website, contacting the business, or engaging with the content. The CTA slide should have clear action-oriented text, prominent contact information or URL, and a visual design that matches the preceding slides while signaling conclusion. `;
  else section += `As a content slide, this slide delivers the core informational content of the carousel. It should maintain visual consistency with the cover and CTA slides while optimizing for content readability and information retention. `;

  section += `The title text for this slide is: "${slideTitle}". `;
  section += `The body text for this slide is: "${slideText}". `;
  section += `The footer text for this slide is: "Conteúdo completo em AlfaContabilidadeCariri.com.br". `;
  section += `Title text placement: The title "${slideTitle}" must be positioned in the header zone occupying the top 15% to 20% of the canvas height (approximately pixel rows 0-192 on the 960 pixel tall canvas). The title should be horizontally centered (or aligned according to the specified alignment rule) and vertically positioned within the header zone for optimal visual balance. The title font size should be between 77 and 115 pixels (8-12% of canvas height) to achieve the specified visual hierarchy. The title should use the ${typo.weight || 'bold'} font weight, the ${typo.treatment || 'uppercase'} text treatment, and the text color ${textHex}. The title must be immediately readable within 2 to 3 seconds of viewing. `;
  section += `Body text placement: The body text "${slideText}" must be positioned in the body zone occupying the middle 50% to 60% of the canvas height (approximately pixel rows 192-768). The body text should be horizontally centered (or aligned per specification) and vertically distributed within the body zone with adequate padding above and below. The body text font size should be between 38 and 58 pixels (4-6% of canvas height) using regular 400 font weight and the text color ${textHex}. Line-height should be 1.4 to 1.5 times the font size for comfortable reading rhythm. `;
  section += `Footer text placement: The footer text "Conteúdo completo em AlfaContabilidadeCariri.com.br" must be positioned in the footer zone occupying the bottom 10% to 15% of the canvas height (approximately pixel rows 816-960). The footer text should be rendered at 19 to 29 pixels (2-3% of canvas height) using medium 500 font weight. The footer text color can be the text color ${textHex} or the neutral color from the palette if defined. `;
  section += `Logo safe zone: The top-right corner spanning pixel columns 634-719 (12% of canvas width) and pixel rows 0-76 (8% of canvas height) MUST remain completely clean and empty. No title text, no body text, no footer text, no icons, no shapes, no decorative elements of any kind may appear in this zone. `;
  section += `Language specification: ALL text content must be in Brazilian Portuguese (Português Brasileiro) with correct spelling, grammar, punctuation, and diacritical marks. No English text is permitted except for the brand URL "AlfaContabilidadeCariri.com.br" which is a proper web address and must be rendered exactly as specified. `;
  section += `Readability requirements: All text must meet WCAG AA minimum 4.5:1 contrast ratio against the background. Title text should be readable at a glance (2-3 seconds). Body text should be comfortable for extended reading. Footer text should be subtle but legible. `;

  return section;
}

function generateNegativePrompts(visual: any, bg: any, colors: any[], negPrompt: string, slideType: string): string {
  let section = `NEGATIVE CONSTRAINTS COMPREHENSIVE SPECIFICATION: The following is a complete list of elements, styles, treatments, and visual characteristics that must NEVER appear in the generated image. `;
  if (negPrompt) section += `From the style DNA analysis, the following negative constraints were identified: ${negPrompt}. `;

  section += `In addition to any previously identified negative constraints, the following comprehensive list of prohibitions applies to all generated images for this design style. `;

  section += `QUALITY PROHIBITIONS: Blurry output with any pixelation, compression artifacts, or soft focus areas is strictly prohibited. Distorted, deformed, warped, or malformed letterforms or shapes are prohibited. Watermarks, creator attributions, copyright notices, or creator signatures are prohibited. Lorem ipsum placeholder text, sample content, or gibberish text is prohibited. Low resolution output with visible pixelation at normal viewing distance is prohibited. `;

  section += `LANGUAGE PROHIBITIONS: Any English text whatsoever is prohibited with the single exception of the brand URL "AlfaContabilidadeCariri.com.br" which must appear exactly as specified. Text in any language other than Brazilian Portuguese is prohibited. Spelling errors, grammatical errors, typos, or incorrect diacritical marks in Portuguese text are prohibited. `;

  section += `COLOR PROHIBITIONS: Colors that do not exactly match the specified hex values in the defined palette are prohibited. This includes similar colors that are close but not exact matches, system default colors, randomly chosen colors, or AI-generated colors that fall outside the palette. Neon, oversaturated, or garish color combinations that clash with the specified palette mood are prohibited. Color bleeding, bleeding edges, or color bleeding between adjacent elements is prohibited. `;

  section += `TYPOGRAPHY PROHIBITIONS: Serif fonts are prohibited when the style specifies sans-serif typography. Handwriting or script fonts are prohibited unless specifically called for in the style specification. Text smaller than 14 pixels at the 720 pixel canvas width is prohibited as it would be unreadable. Text with incorrect letter-spacing, line-height, or font weight that does not match the typography specification is prohibited. `;

  section += `LAYOUT PROHIBITIONS: Text, graphics, or any visual elements in the logo safe zone (top-right corner, pixel columns 634-719, pixel rows 0-76) are prohibited. Elements touching or extending beyond the canvas edges without intentional full-bleed treatment are prohibited. Cluttered, overcrowded, or overly complex layouts where elements touch, overlap, or lack adequate breathing room are prohibited. Asymmetric layouts are prohibited when the style specifies centered alignment, and vice versa. `;

  section += `BACKGROUND PROHIBITIONS: Photography, photorealistic elements, complex imagery, or visual content in the background area is prohibited when the style specifies solid flat color. Gradient backgrounds are prohibited when the style specifies solid color. Textures, patterns, noise, grain, or surface treatments in the background are prohibited when the style specifies clean smooth surfaces. Any variation, transition, or color shift in the background color is prohibited. `;

  section += `VISUAL ELEMENT PROHIBITIONS: ${!visual.hasIcons ? 'Icon elements of any kind including line icons, filled icons, illustrated icons, or pseudo-icon shapes are prohibited. ' : ''}${!visual.hasDecorativeShapes ? 'Decorative shapes, blobs, geometric accents, or ornamental elements are prohibited. ' : ''}${!visual.hasLines ? 'Horizontal lines, dividers, separators, or rule elements are prohibited. ' : ''}${!visual.hasGradients ? 'Gradient effects, color transitions, or fade blends of any kind are prohibited. ' : ''}${!visual.hasTextures ? 'Textures, patterns, noise, grain, or surface treatments are prohibited. ' : ''}${!visual.hasShadows ? 'Drop shadows, inner shadows, depth effects, or three-dimensional layering are prohibited. ' : ''}Framing elements, watermarks, badges, ribbons, or labels are prohibited when not specified in the style. `;

  section += `CONTENT PROHIBITIONS: Text that differs from the provided title "${slideType === 'cover' ? 'the specified cover title' : slideType === 'cta' ? 'the specified CTA title' : 'the specified content title'}" and body text "${slideType === 'cover' ? 'the specified cover body' : slideType === 'cta' ? 'the specified CTA body' : 'the specified content body'}" is prohibited. Visual elements that compete with text for attention rather than supporting the text content are prohibited. Compositions where the visual hierarchy does not guide the eye from title to body to footer in that sequence are prohibited. `;

  section += `CONSOLIDATED NEGATIVE PROMPT FOR AI IMAGE GENERATORS (use this string as the negative prompt parameter when supported): "blurry, low quality, pixelated, distorted, deformed, warped, malformed, watermark, signature, lorem ipsum, placeholder text, gibberish, English text, wrong colors, neon colors, garish colors, unreadable text, text overlap, cluttered, busy, overcrowded, text in top-right corner, ${!visual.hasGradients ? 'gradients, color transitions, fade blends, ' : ''}${!visual.hasTextures ? 'textures, patterns, noise, grain, ' : ''}${!visual.hasShadows ? 'shadows, drop shadows, depth effects, 3D layering, ' : ''}${!visual.hasIcons ? 'icons, icon-like shapes, pseudo-icons, ' : ''}${!visual.hasDecorativeShapes ? 'decorative shapes, blobs, geometric accents, ornamental elements, ' : ''}${bg.type === 'solid' ? 'photography, complex background, background imagery, ' : ''}serif font when sans-serif specified, handwriting font, script font, text below 14 pixels, elements touching canvas edges, asymmetric layout when centered specified, centered layout when asymmetric specified"`;

  return section;
}

function generateStepByStep(colors: any[], typo: any, layout: any, visual: any, bg: any, slideTitle: string, slideText: string, slideType: string): string {
  const bgHex = (colors.find((c: any) => c.role === 'background')?.hex || '#FFFFFF').toUpperCase();
  const textHex = (colors.find((c: any) => c.role === 'text')?.hex || '#1E293B').toUpperCase();
  const accentHex = (colors.find((c: any) => c.role === 'accent')?.hex || '#6366F1').toUpperCase();

  return `STEP-BY-STEP GENERATION GUIDE: Follow these steps in exact sequence to generate the slide image.

Step 1: Canvas Setup. Create a new digital canvas with dimensions of exactly 720 pixels width by 960 pixels height. Set the resolution to 72 DPI. Set the color space to sRGB. Verify the canvas orientation is vertical portrait (height exceeds width). Total pixel count should be 691,200 pixels.

Step 2: Background Fill. Fill the entire 720x960 pixel canvas with the exact solid uniform background color ${bgHex}. Verify that every pixel displays this exact color value with no variation. Confirm no gradients, textures, patterns, or surface treatments have been applied to the background.

Step 3: Header Zone Definition. Define the header zone as the area spanning pixel rows 0 through 192 (top 20% of canvas height). This zone will contain the slide title text.

Step 4: Body Zone Definition. Define the body zone as the area spanning pixel rows 192 through 768 (middle 60% of canvas height). This zone will contain the body text and any supporting visual elements.

Step 5: Footer Zone Definition. Define the footer zone as the area spanning pixel rows 768 through 960 (bottom 20% of canvas height). This zone will contain the footer brand URL text.

Step 6: Logo Safe Zone Marking. Define the logo safe zone as the area spanning pixel columns 634 through 719 (right 12% of canvas width) and pixel rows 0 through 76 (top 8% of canvas height). Mark this zone as strictly prohibited for all content generation.

Step 7: Title Text Rendering. Render the title text "${slideTitle}" in the header zone. Use the ${typo.fontFamily || 'sans-serif'} font family at ${typo.weight || 'bold'} weight. Apply ${typo.treatment || 'uppercase'} text treatment. Use the text color ${textHex}. Position the title horizontally centered (or per the specified alignment rule) and vertically centered within the header zone. Set the title font size to approximately 96 pixels (10% of canvas height) as the default size. Verify the title is immediately readable.

Step 8: Body Text Rendering. Render the body text "${slideText}" in the body zone. Use the ${typo.fontFamily || 'sans-serif'} font family at regular 400 weight. Use the text color ${textHex}. Position the body text horizontally centered (or per alignment specification) and vertically centered within the body zone. Set the body text font size to approximately 48 pixels (5% of canvas height). Set line-height to 1.4-1.5 times the font size. Verify the body text is comfortable to read.

Step 9: Footer Text Rendering. Render the footer text "Conteúdo completo em AlfaContabilidadeCariri.com.br" in the footer zone. Use the ${typo.fontFamily || 'sans-serif'} font family at medium 500 weight. Use the text color ${textHex} or the neutral color. Set the footer font size to approximately 24 pixels (2.5% of canvas height). Position the footer text centered horizontally near the bottom of the canvas.

Step 10: Visual Elements Addition. ${visual.hasIcons ? `Add ${visual.iconStyle} icons using the accent color ${accentHex}. Place icons according to the specified placement rules. Ensure all icons come from the same icon family.` : 'Do NOT add any icons.'} ${visual.hasDecorativeShapes ? `Add ${visual.shapeLanguage} decorative shapes at 10-20% opacity using colors from the defined palette. Place shapes in corners, edges, or as subtle background accents.` : 'Do NOT add any decorative shapes.'} ${visual.hasLines ? `Add horizontal lines/dividers at 1-2px stroke weight in neutral color at 30-50% opacity between content sections.` : 'Do NOT add any lines or dividers.'}

Step 11: Color Verification. Verify that ALL colors used in the composition exactly match the specified hex values in the defined palette. Confirm no external colors, system colors, or random colors have been introduced.

Step 12: Layout Verification. Verify that the composition matches the specified layout type (${layout.type || 'centered'}), alignment (${layout.alignment || 'center'}), and content zones. Confirm no elements appear in the logo safe zone.

Step 13: Negative Constraint Verification. Review the generated image against the complete list of negative constraints. Confirm no prohibited elements are present.

Step 14: Final Quality Check. Verify all text is readable, correctly spelled, and in Brazilian Portuguese. Verify the overall composition matches the specified mood and atmosphere. Verify the image is ready for brand asset compositing (logo and background overlay).`;
}

function generateQualityChecklist(colors: any[], typo: any, layout: any, visual: any, bg: any, slideType: string): string {
  const bgHex = (colors.find((c: any) => c.role === 'background')?.hex || '#FFFFFF').toUpperCase();

  return `QUALITY CHECKLIST COMPREHENSIVE SPECIFICATION: Before considering the generated image as acceptable, verify ALL of the following items. Each item must pass inspection.

CANVAS VERIFICATION:
[ ] Canvas is exactly 720 pixels wide by 960 pixels tall
[ ] Aspect ratio is exactly 3:4 (0.75)
[ ] Resolution is 72 DPI
[ ] Color space is sRGB
[ ] Orientation is vertical portrait

BACKGROUND VERIFICATION:
[ ] Background covers 100% of canvas from edge to edge
[ ] Background is a single uniform solid color
[ ] Background color matches exact hex value ${bgHex}
[ ] No gradients in background
[ ] No textures in background
[ ] No patterns in background
[ ] No photographs in background
[ ] No visual noise or grain in background
[ ] No color variation or shift across background
[ ] No vignetting or edge darkening

COLOR VERIFICATION:
[ ] Only palette colors are used (no random colors)
[ ] Background color is correct ${bgHex}
[ ] Text color matches specified text hex value
[ ] Accent colors used appropriately from palette
[ ] Neutral colors used for secondary elements from palette
[ ] No neon or oversaturated colors outside palette
[ ] Text contrast ratios meet WCAG AA 4.5:1 minimum

TYPOGRAPHY VERIFICATION:
[ ] Correct font family used (${typo.fontFamily || 'sans-serif'})
[ ] Correct font weights used (${typo.weight || 'bold'} for title, regular for body)
[ ] Title is large and bold (77-115 pixels)
[ ] Body text is readable (38-58 pixels)
[ ] Text is in Brazilian Portuguese (PT-BR)
[ ] No English words (except brand URL)
[ ] No spelling errors in Portuguese text
[ ] No placeholder text (lorem ipsum)
[ ] Title treatment matches style (${typo.treatment || 'uppercase'})
[ ] Letter-spacing is correct
[ ] Line-height is 1.4-1.5 times font size
[ ] Footer text is present and legible

LAYOUT VERIFICATION:
[ ] Composition type matches specification (${layout.type || 'centered'})
[ ] Alignment matches specification (${layout.alignment || 'center'})
[ ] Content zones properly defined and used
[ ] Logo safe zone (top-right) is COMPLETELY CLEAN
[ ] Footer text area is properly positioned
[ ] Spacing follows the 8px base unit system
[ ] No elements touching canvas edges
[ ] No overcrowding or overlapping elements

VISUAL ELEMENTS VERIFICATION:
${visual.hasIcons ? `[ ] Icons present in correct ${visual.iconStyle} style\n[ ] Icons from same icon family\n[ ] Icon colors match palette\n[ ] Icons properly sized and placed` : `[ ] NO icons present\n[ ] NO icon-like elements\n[ ] NO pseudo-icon shapes`}
${visual.hasDecorativeShapes ? `[ ] Decorative shapes present in ${visual.shapeLanguage} language\n[ ] Shape opacity is 10-20%\n[ ] Shape colors match palette` : `[ ] NO decorative shapes present\n[ ] NO blobs or geometric accents`}
${visual.hasLines ? `[ ] Lines/dividers present at 1-2px weight\n[ ] Line colors match palette` : `[ ] NO lines or dividers present`}
${visual.hasGradients ? `[ ] Gradients used correctly per specification` : `[ ] NO gradients present\n[ ] NO color transitions or fades`}
${visual.hasShadows ? `[ ] Shadows applied correctly per specification` : `[ ] NO shadows present\n[ ] NO depth effects of any kind`}
${visual.hasTextures ? `[ ] Textures present at 5-15% opacity` : `[ ] NO textures present\n[ ] Surface is smooth and clean`}

CONTENT VERIFICATION:
[ ] Title text matches specified content exactly
[ ] Body text matches specified content exactly
[ ] Footer text reads "Conteúdo completo em AlfaContabilidadeCariri.com.br"
[ ] All text is correctly spelled in Brazilian Portuguese
[ ] No text appears in the logo safe zone

QUALITY VERIFICATION:
[ ] No blur or pixelation anywhere in the image
[ ] No distortion or deformation of any elements
[ ] No watermark visible
[ ] No creator signatures visible
[ ] Overall mood matches specification
[ ] Design looks professional and polished
[ ] Style matches reference images
[ ] Image is ready for brand asset compositing

ACCESSIBILITY VERIFICATION:
[ ] All text meets WCAG 2.1 AA contrast minimum (4.5:1)
[ ] Information is not conveyed by color alone
[ ] Text would remain readable at 200% zoom
[ ] Image would be understandable if viewed by someone with protanopia
[ ] Image would be understandable if viewed by someone with deuteranopia`;
}

function generateMasterPrompt(original: string, genPrompt: string, colors: any[], typo: any, layout: any, visual: any, mood: any, bg: any, slideTitle: string, slideText: string, slideType: string, slideNumber: number, negPrompt: string): string {
  const bgHex = (colors.find((c: any) => c.role === 'background')?.hex || '#FFFFFF').toUpperCase();
  const textHex = (colors.find((c: any) => c.role === 'text')?.hex || '#1E293B').toUpperCase();
  const accentHex = (colors.find((c: any) => c.role === 'accent')?.hex || '#6366F1').toUpperCase();

  return `MASTER PROMPT CONSOLIDATED FOR AI IMAGE GENERATION: This is the final optimized prompt combining all specifications from the detailed analysis above into a single comprehensive prompt ready for direct use with any AI image generation service including Google Imagen, FLUX, DALL-E, Midjourney, Cloudflare Workers AI, Leonardo.AI, and similar services.

Instagram carousel ${slideType} slide ${slideNumber} of 4, 720x960px, 3:4 aspect ratio, sRGB color space, 72 DPI.

BACKGROUND: Solid uniform flat ${bg.type || 'solid'} background with exact color ${bgHex}. ${!visual.hasGradients ? 'ZERO gradients, ZERO textures, ZERO patterns, ZERO photographs, ZERO visual noise.' : 'Subtle gradients using analogous palette colors.'} ${!visual.hasTextures ? 'Surface must be completely smooth and clean.' : 'Subtle texture at 5-15% opacity.'}

COLORS - USE EXACTLY THESE HEX VALUES AND NO OTHERS:
${colors.map((c: any) => `${c.role}: ${c.hex} (${c.percentage}% of composition)`).join(', ')}.

TYPOGRAPHY: ${typo.fontFamily || 'sans-serif'} font family, title weight ${typo.weight || 'bold'}, body weight regular 400, ${typo.hierarchy || 'two-level'} hierarchy, ${typo.treatment || 'uppercase'} treatment, letter-spacing normal 0px, line-height 1.4-1.5x font size. Title text color ${textHex}, body text color ${textHex}.

LAYOUT: ${layout.type || 'centered'} composition, ${layout.alignment || 'center'} alignment, ${layout.contentZones || 2} content zones, ${layout.textToImageRatio || 'text-heavy'} text-to-image ratio. Header zone: top 15-20%. Body zone: middle 50-60%. Footer zone: bottom 10-15%. Logo safe zone: top-right corner 12% width x 8% height MUST be clean.

VISUAL ELEMENTS: ${visual.hasIcons ? visual.iconStyle + ' icons in ' + accentHex + ', 24-48px, same family' : 'NO icons'} | ${visual.hasDecorativeShapes ? visual.shapeLanguage + ' shapes at 10-20% opacity' : 'NO decorative shapes'} | ${visual.hasLines ? '1-2px lines/dividers' : 'NO lines'} | ${visual.hasGradients ? 'subtle gradients' : 'NO gradients'} | ${visual.hasTextures ? 'subtle textures 5-15%' : 'NO textures'} | ${visual.hasShadows ? 'soft shadows Y:2-4px blur:8-16px 10-20%' : 'NO shadows'} | ${visual.bulletStyle && visual.bulletStyle !== 'none' ? visual.bulletStyle + ' bullets' : 'NO bullets'} | ${visual.cornerTreatment || 'sharp'} corners.

MOOD: ${Object.entries(mood).filter(([, v]) => (v as number) > 60).map(([k, v]) => k + ' ' + v + '%').join(', ') || 'balanced professional'}.

CONTENT: Title="${slideTitle}" in header zone, Body="${slideText}" in body zone, Footer="Conteúdo completo em AlfaContabilidadeCariri.com.br" in footer zone. ALL text in Brazilian Portuguese.

NEGATIVE: "blurry, low quality, pixelated, distorted, deformed, watermark, signature, lorem ipsum, English text, wrong colors, neon, garish, unreadable text, text overlap, cluttered, busy, text in top-right corner, ${!visual.hasGradients ? 'gradients, ' : ''}${!visual.hasTextures ? 'textures, ' : ''}${!visual.hasShadows ? 'shadows, ' : ''}${!visual.hasIcons ? 'icons, ' : ''}${bg.type === 'solid' ? 'photography, complex background, ' : ''}serif font, handwriting font"

ORIGINAL REFERENCE PROMPT: ${genPrompt}

Follow every specification precisely. The generated image must be visually indistinguishable from the original brand reference images used to extract this style DNA.`;
}
