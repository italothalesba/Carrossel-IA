/**
 * Skill Designer - Cria prompts de imagem detalhados para cada slide
 * COM 3 PRIORIDADES:
 * 1. StyleDNA generatedVisualPrompt (máxima fidelidade)
 * 2. DNA fields (alta fidelidade)
 * 3. Generic fallback (mínima)
 */

import { BaseSkill } from './base';
import { SkillContext, SkillResult, DesignerInput, DesignerOutput } from './types';
import { textGeneration, parseJsonOrThrow } from './text-generation';
import { SlideContent } from '../services/ai';
import { modelContext } from '../services/model-context';

export class DesignerSkill extends BaseSkill<DesignerInput, DesignerOutput> {
  constructor() {
    super({ name: 'Designer', description: 'Cria prompts de imagem detalhados para cada slide', model: 'Qwen/Qwen2.5-Coder-7B-Instruct', provider: 'openrouter', temperature: 0.7, maxTokens: 2048 });
  }

  validateInput(input: DesignerInput): boolean { return super.validateInput(input) && typeof input.slide === 'object' && typeof input.slideNumber === 'number' && typeof input.styleContext === 'string'; }
  validateOutput(output: DesignerOutput): boolean { return super.validateOutput(output) && typeof output.slide === 'object' && typeof output.slide.imagePrompt === 'string' && output.slide.imagePrompt.length > 0; }

  async execute(input: DesignerInput, context?: SkillContext): Promise<SkillResult<DesignerOutput>> {
    try {
      if (!this.validateInput(input)) return this.createErrorResult('Invalid input for DesignerSkill');
      const slideType = input.slideNumber === 1 ? 'cover' : input.slideNumber === 4 ? 'cta' : 'content';
      const dna = input.styleDNA?.[slideType];

      // PRIORIDADE 1: StyleDNA generatedVisualPrompt
      if (dna?.generatedVisualPrompt && dna.generatedVisualPrompt.length > 50) {
        let imagePrompt = dna.generatedVisualPrompt;
        imagePrompt += `\n\nSLIDE CONTENT: Title="${input.slide.title}", Text="${input.slide.text}"`;
        if (dna.negativePrompt) imagePrompt += `\n\nAVOID: ${dna.negativePrompt}`;
        if (input.styleAssets?.logo) imagePrompt += `\n\nLOGO PNG (transparent) → top-right, LEAVE CLEAN.`;
        if (input.styleAssets?.background) imagePrompt += `\n\nBACKGROUND PNG → base layer.`;
        imagePrompt += `\n\nTECHNICAL: 720x960px, 3:4 Instagram portrait, PT-BR text`;
        console.log(`[DesignerSkill] ✅ Priority 1: StyleDNA visualPrompt (${imagePrompt.length} chars)`);
        return this.createSuccessResult({ slide: { ...input.slide, imagePrompt } }, { model: this.config.model, provider: this.config.provider, latency: 0, source: 'styleDNA-visualPrompt' });
      }

      // PRIORIDADE 2: DNA fields
      if (dna) {
        console.log(`[DesignerSkill] ⚠️ Priority 2: Partial DNA`);
        return this.buildPromptFromDNA(input, dna, slideType);
      }

      // PRIORIDADE 3: Generic fallback
      console.log(`[DesignerSkill] ❌ Priority 3: No DNA, generic`);
      return this.buildGenericPrompt(input, slideType);
    } catch (error) { return this.createErrorResult(error instanceof Error ? error.message : String(error)); }
  }

  private async buildPromptFromDNA(input: DesignerInput, dna: any, slideType: string): Promise<SkillResult<DesignerOutput>> {
    const dominantColors = dna.dominantColors || [];
    const bgColor = dominantColors.find((c: any) => c.role === 'background')?.hex || '#FFFFFF';
    const accentColor = dominantColors.find((c: any) => c.role === 'accent')?.hex || '#6366F1';
    const textColor = dominantColors.find((c: any) => c.role === 'text')?.hex || '#1E293B';
    const prompt = `Instagram carousel ${slideType} slide, 720x960px, 3:4 ratio\n\n[STYLE DNA - REPLICATE EXACTLY]\nBackground: ${dna.backgroundStyle?.type || 'solid'}, ${dna.backgroundStyle?.complexity || 'minimal'}, ${dna.backgroundStyle?.dominantTone || 'cool'} tone, ${bgColor}\nLayout: ${dna.layoutPattern?.type || 'centered'}, ${dna.layoutPattern?.alignment || 'center'} alignment, ${dna.layoutPattern?.contentZones || 2} zones\nTypography: ${dna.typographyStyle?.fontFamily || 'sans-serif'}, ${dna.typographyStyle?.weight || 'bold'}, ${dna.typographyStyle?.hierarchy || 'two-level'}, ${dna.typographyStyle?.treatment || 'uppercase'}\nVisual: ${dna.visualElements?.hasIcons ? dna.visualElements.iconStyle + ' icons' : 'No icons'} | ${dna.visualElements?.hasDecorativeShapes ? dna.visualElements.shapeLanguage + ' shapes' : 'No shapes'} | ${dna.visualElements?.hasGradients ? 'Gradients' : 'No gradients'} | ${dna.visualElements?.hasShadows ? 'Shadows' : 'No shadows'}\n${dna.mood ? `Mood: ${Object.entries(dna.mood).filter(([, v]) => (v as number) > 60).map(([k, v]) => `${k} ${v}%`).join(', ')}` : ''}\nColors: ${dominantColors.map((c: any) => `${c.role}: ${c.hex} (${c.percentage}%)`).join(', ') || `BG:${bgColor} Accent:${accentColor} Text:${textColor}`}\n${dna.negativePrompt ? `[AVOID] ${dna.negativePrompt}` : ''}\n\n${input.styleAssets?.logo ? 'LOGO PNG (transparent) → top-right, LEAVE CLEAN' : ''}${input.styleAssets?.background ? 'BACKGROUND PNG → base layer' : ''}\n\nSLIDE ${input.slideNumber}/4: Title="${input.slide.title}", Text="${input.slide.text}"`;
    const selectedTextModel = modelContext.getTextModel();
    const useModel = selectedTextModel !== 'auto-rotate' ? selectedTextModel : this.config.model;
    const response = await textGeneration(useModel, prompt, { max_new_tokens: this.config.maxTokens, temperature: this.config.temperature, return_full_text: false }, selectedTextModel !== 'auto-rotate' ? selectedTextModel : undefined);
    const designed = parseJsonOrThrow<{ imagePrompt?: string }>(response.generated_text, `DesignerSkill Slide ${input.slideNumber}`);
    const imagePrompt = designed.imagePrompt || (designed as any).Prompt || (designed as any).prompt || (designed as any).image_prompt || input.slide.imagePrompt || '';
    return this.createSuccessResult({ slide: { ...input.slide, imagePrompt } }, { model: this.config.model, provider: this.config.provider, latency: 0, source: 'styleDNA-fields' });
  }

  private async buildGenericPrompt(input: DesignerInput, slideType: string): Promise<SkillResult<DesignerOutput>> {
    const imagePrompt = `Instagram carousel ${slideType} slide, 720x960px, 3:4 ratio, professional business design, solid color background, clean layout with title "${input.slide.title}" and body text "${input.slide.text}", top-right corner clean for logo overlay, footer text area at bottom`;
    return this.createSuccessResult({ slide: { ...input.slide, imagePrompt } }, { model: this.config.model, provider: this.config.provider, latency: 0, source: 'generic-fallback' });
  }
}
