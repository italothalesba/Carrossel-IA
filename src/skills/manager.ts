/**
 * Skill Gerente (Manager)
 * Revisão final de qualidade e feedback ao usuário
 */

import { BaseSkill } from './base';
import { SkillContext, SkillResult, ManagerInput, ManagerOutput } from './types';
import { textGeneration, parseJsonOrThrow } from './text-generation';
import { DraftResponse } from '../services/ai';
import { modelContext } from '../services/model-context';

export class ManagerSkill extends BaseSkill<ManagerInput, ManagerOutput> {
  constructor() {
    super({
      name: 'Gerente',
      description: 'Revisão final de qualidade e feedback ao usuário',
      model: 'Qwen/Qwen2.5-Coder-7B-Instruct',
      provider: 'openrouter',
      temperature: 0.5,
      maxTokens: 4096,
    });
  }

  validateInput(input: ManagerInput): boolean {
    return super.validateInput(input) && 
           Array.isArray(input.slides) &&
           input.slides.length === 4 &&
           typeof input.styleContext === 'string';
  }

  validateOutput(output: ManagerOutput): boolean {
    return super.validateOutput(output) && 
           typeof output.draftResponse === 'object' &&
           Array.isArray(output.draftResponse.slides) &&
           typeof output.draftResponse.managerFeedback === 'string';
  }

  async execute(input: ManagerInput, context?: SkillContext): Promise<SkillResult<ManagerOutput>> {
    try {
      if (!this.validateInput(input)) {
        return this.createErrorResult('Invalid input for ManagerSkill');
      }

      const prompt = `You are the Quality Control Manager for Instagram carousels.

TASK: Review all 4 slides and provide final approval.

REVIEW CRITERIA:
1. Spelling and grammar (PT-BR) - must be perfect
2. Image prompts consistency with style
3. Logical flow from slide 1 to 4
4. Exactly 4 slides (no more, no less)

STYLE CONTEXT:
${input.styleContext}

CURRENT SLIDES:
${JSON.stringify(input.slides, null, 2)}

OUTPUT FORMAT: Return ONLY valid JSON with exactly 4 slides and feedback.
{
  "slides": [4 slide objects],
  "managerFeedback": "Professional feedback in PT-BR about what you approved or changed"
}`;

      // Obter modelo de texto selecionado pelo usuário
      const selectedTextModel = modelContext.getTextModel();
      const useModel = selectedTextModel !== 'auto-rotate' ? selectedTextModel : this.config.model;

      const startTime = Date.now();
      const response = await textGeneration(useModel, prompt, {
        max_new_tokens: this.config.maxTokens,
        temperature: this.config.temperature,
        return_full_text: false
      }, selectedTextModel !== 'auto-rotate' ? selectedTextModel : undefined);

      const draftResponse = parseJsonOrThrow<DraftResponse>(
        response.generated_text,
        'ManagerSkill'
      );

      const latency = Date.now() - startTime;

      const result: ManagerOutput = { draftResponse };

      if (!this.validateOutput(result)) {
        return this.createErrorResult('Invalid output from ManagerSkill');
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
