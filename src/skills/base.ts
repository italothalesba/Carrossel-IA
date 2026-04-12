/**
 * Skill Base - Classe abstrata para todas as Skills
 */

import { Skill, SkillConfig, SkillContext, SkillResult } from './types';

export abstract class BaseSkill<TInput = any, TOutput = any> implements Skill<TInput, TOutput> {
  readonly name: string;
  readonly description: string;
  readonly config: SkillConfig;

  constructor(config: SkillConfig) {
    this.name = config.name;
    this.description = config.description;
    this.config = config;
  }

  abstract execute(input: TInput, context?: SkillContext): Promise<SkillResult<TOutput>>;

  validateInput(input: TInput): boolean {
    // Implementação base - subclasses devem sobrescrever
    return input !== null && input !== undefined;
  }

  validateOutput(output: TOutput): boolean {
    // Implementação base - subclasses devem sobrescrever
    return output !== null && output !== undefined;
  }

  protected createSuccessResult(data: TOutput, metadata?: any): SkillResult<TOutput> {
    return {
      success: true,
      data,
      metadata
    };
  }

  protected createErrorResult(error: string): SkillResult<TOutput> {
    return {
      success: false,
      error
    };
  }
}
