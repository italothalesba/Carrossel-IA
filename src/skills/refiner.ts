/**
 * Skill Refinador (Refiner)
 * Refina o carrossel com base nas considerações do usuário
 */

import { BaseSkill } from './base';
import { SkillContext, SkillResult, RefinerInput, RefinerOutput } from './types';
import { textGeneration, parseJsonOrThrow } from './text-generation';
import { DraftResponse } from '../services/ai';
import { modelContext } from '../services/model-context';

export class RefinerSkill extends BaseSkill<RefinerInput, RefinerOutput> {
  constructor() {
    super({
      name: 'Refinador',
      description: 'Refina o carrossel com base nas considerações do usuário',
      model: 'Qwen/Qwen2.5-Coder-7B-Instruct',
      provider: 'openrouter',
      temperature: 0.5,
      maxTokens: 2048,
    });
  }

  validateInput(input: RefinerInput): boolean {
    return super.validateInput(input) && 
           Array.isArray(input.slides) &&
           input.slides.length === 4 &&
           typeof input.managerFeedback === 'string' &&
           typeof input.userConsiderations === 'string';
  }

  validateOutput(output: RefinerOutput): boolean {
    return super.validateOutput(output) && 
           typeof output.draftResponse === 'object' &&
           Array.isArray(output.draftResponse.slides) &&
           typeof output.draftResponse.managerFeedback === 'string';
  }

  async execute(input: RefinerInput, context?: SkillContext): Promise<SkillResult<RefinerOutput>> {
    try {
      if (!this.validateInput(input)) {
        return this.createErrorResult('Invalid input for RefinerSkill');
      }

      const prompt = `Você é o "Gerente Topzão" de Qualidade.
O usuário revisou o rascunho do carrossel e deixou as seguintes considerações:
"${input.userConsiderations}"

Feedback anterior do gerente:
"${input.managerFeedback}"

Slides atuais:
${JSON.stringify(input.slides, null, 2)}

Sua tarefa:
1. Aplique as considerações do usuário aos slides (textos ou prompts de imagem).
2. Garanta que a ortografia continue impecável e as cores de background não se embaralhem.
3. Forneça um novo feedback confirmando as alterações.

CRITICAL INSTRUCTION: You MUST return EXACTLY 4 slides in the 'slides' array. Do not return 1 slide. Return all 4 slides.

Retorne APENAS um JSON válido com:
{
  "slides": [array com EXATAMENTE 4 slides atualizados],
  "managerFeedback": "Seu novo feedback para o usuário"
}. Não inclua nenhum outro texto.`;

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
        'RefinerSkill'
      );

      const latency = Date.now() - startTime;

      const result: RefinerOutput = { draftResponse };

      if (!this.validateOutput(result)) {
        return this.createErrorResult('Invalid output from RefinerSkill');
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
