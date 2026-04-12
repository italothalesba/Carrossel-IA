/**
 * Skill Revisor
 * Revisa e corrige ortografia/gramática PT-BR slide por slide
 */

import { BaseSkill } from './base';
import { SkillContext, SkillResult, ReviewerInput, ReviewerOutput } from './types';
import { textGeneration, parseJsonOrThrow } from './text-generation';
import { SlideContent } from '../services/ai';
import { modelContext } from '../services/model-context';

export class ReviewerSkill extends BaseSkill<ReviewerInput, ReviewerOutput> {
  constructor() {
    super({
      name: 'Revisor',
      description: 'Corrige ortografia e gramática PT-BR em cada slide',
      model: 'Qwen/Qwen2.5-Coder-7B-Instruct',
      provider: 'openrouter',
      temperature: 0.3,
      maxTokens: 1024,
    });
  }

  validateInput(input: ReviewerInput): boolean {
    return super.validateInput(input) &&
           typeof input.slide === 'object' &&
           typeof input.slideNumber === 'number' &&
           input.slideNumber >= 1 && input.slideNumber <= 4;
  }

  validateOutput(output: ReviewerOutput): boolean {
    return super.validateOutput(output) &&
           typeof output.correctedSlide === 'object' &&
           typeof output.correctedSlide.title === 'string' &&
           typeof output.correctedSlide.text === 'string';
  }

  async execute(input: ReviewerInput, context?: SkillContext): Promise<SkillResult<ReviewerOutput>> {
    try {
      if (!this.validateInput(input)) {
        return this.createErrorResult('Invalid input for ReviewerSkill');
      }

      const prompt = `You are a Brazilian Portuguese grammar expert. Return ONLY JSON. NO explanations. NO thinking. NO analysis.

CRITICAL: Your ENTIRE response must be a single JSON object. Do NOT write any text before or after the JSON.

RULES:
- Fix Portuguese grammar and spelling errors (PT-BR)
- Improve clarity while keeping it concise
- Keep the professional tone
- Return ONLY {"title": "...", "text": "..."}

SLIDE ${input.slideNumber}:
Title: "${input.slide.title}"
Text: "${input.slide.text}"

RESPOND WITH JSON ONLY:`;

      // Obter modelo de texto selecionado pelo usuário
      const selectedTextModel = modelContext.getTextModel();
      const useModel = selectedTextModel !== 'auto-rotate' ? selectedTextModel : this.config.model;

      const startTime = Date.now();
      const response = await textGeneration(useModel, prompt, {
        max_new_tokens: this.config.maxTokens,
        temperature: this.config.temperature,
        return_full_text: false
      }, selectedTextModel !== 'auto-rotate' ? selectedTextModel : undefined);

      const corrected = parseJsonOrThrow<{ title?: string; text?: string }>(
        response.generated_text,
        `ReviewerSkill - Slide ${input.slideNumber}`
      );

      const correctedSlide: SlideContent = {
        ...input.slide,
        title: corrected.title || input.slide.title,
        text: corrected.text || input.slide.text
      };

      const latency = Date.now() - startTime;

      const result: ReviewerOutput = { correctedSlide };

      if (!this.validateOutput(result)) {
        return this.createErrorResult('Invalid output from ReviewerSkill');
      }

      return this.createSuccessResult(result, {
        model: this.config.model,
        provider: this.config.provider,
        latency
      });
    } catch (error) {
      return this.createErrorResult(
        error instanceof Error ? error.message : String(error)
      );
    }
  }
}
