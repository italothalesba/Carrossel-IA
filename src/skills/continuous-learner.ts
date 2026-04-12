/**
 * Skill de Aprendizado Contínuo
 * Recebe feedback do usuário via chat e aprimora estilos e skills
 */

import { BaseSkill } from './base';
import { SkillContext, SkillResult } from './types';
import { textGeneration, parseJsonOrThrow } from './text-generation';
import { StyleData } from '../services/ai';

export interface ContinuousLearnerInput {
  style: StyleData;
  userMessage: string;
  conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>;
  slideType?: 'cover' | 'content' | 'cta' | 'all';
  context?: {
    recentGenerations?: Array<{
      slideType: string;
      title: string;
      text: string;
      imagePrompt: string;
      timestamp: number;
    }>;
    previousFeedback?: Array<{
      status: 'approved' | 'rejected';
      comment: string;
      timestamp: number;
    }>;
  };
}

export interface ContinuousLearnerOutput {
  response: string;
  styleUpdates?: {
    coverStyle?: string;
    contentStyle?: string;
    ctaStyle?: string;
    extraInstructions?: string;
    colors?: string;
    audience?: string;
    tone?: string;
  };
  suggestions?: string[];
  appliedChanges: boolean;
}

export class ContinuousLearnerSkill extends BaseSkill<ContinuousLearnerInput, ContinuousLearnerOutput> {
  constructor() {
    super({
      name: 'Aprendizado Contínuo',
      description: 'Analisa feedback do usuário e aprimora estilos e skills continuamente',
      model: 'Qwen/Qwen2.5-Coder-7B-Instruct',
      provider: 'openrouter',
      temperature: 0.5,
      maxTokens: 4096,
    });
  }

  validateInput(input: ContinuousLearnerInput): boolean {
    return super.validateInput(input) &&
           typeof input.style === 'object' &&
           typeof input.userMessage === 'string' &&
           input.userMessage.length > 0;
  }

  validateOutput(output: ContinuousLearnerOutput): boolean {
    return super.validateOutput(output) &&
           typeof output.response === 'string' &&
           output.response.length > 0;
  }

  async execute(input: ContinuousLearnerInput, context?: SkillContext): Promise<SkillResult<ContinuousLearnerOutput>> {
    try {
      if (!this.validateInput(input)) {
        return this.createErrorResult('Invalid input for ContinuousLearnerSkill');
      }

      const style = input.style;
      const slideType = input.slideType || 'all';

      // Construir contexto do estilo atual
      const styleContext = `
STYLE NAME: ${style.name}
AUDIENCE: ${style.metadata?.audience || 'Not specified'}
TONE: ${style.metadata?.tone || 'Not specified'}
BRAND COLORS: ${style.metadata?.colors || 'Not specified'}
EXTRA INSTRUCTIONS: ${style.metadata?.extraInstructions || 'None'}

COVER SLIDE STYLE:
${style.cover.styleDescription || 'Not yet defined'}

CONTENT SLIDE STYLE:
${style.content.styleDescription || 'Not yet defined'}

CTA SLIDE STYLE:
${style.cta.styleDescription || 'Not yet defined'}
`;

      // Construir histórico de gerações recentes
      const recentGenerationsContext = input.context?.recentGenerations 
        ? `\nRECENT GENERATIONS (Last 5):\n${input.context.recentGenerations.map(gen => 
            `- [${gen.slideType}] "${gen.title}": ${gen.text}\n  Image: ${gen.imagePrompt}\n  Time: ${new Date(gen.timestamp).toLocaleString('pt-BR')}`
          ).join('\n')}`
        : '';

      // Construir histórico de feedback anterior
      const previousFeedbackContext = input.context?.previousFeedback
        ? `\nPREVIOUS FEEDBACK:\n${input.context.previousFeedback.map(fb =>
            `- ${fb.status === 'approved' ? '✅ APPROVED' : '❌ REJECTED'}: "${fb.comment}" (${new Date(fb.timestamp).toLocaleString('pt-BR')})`
          ).join('\n')}`
        : '';

      // Construir histórico da conversa
      const conversationHistoryContext = input.conversationHistory && input.conversationHistory.length > 0
        ? `\nCONVERSATION HISTORY:\n${input.conversationHistory.slice(-10).map(msg =>
            `${msg.role === 'user' ? 'USER' : 'ASSISTANT'}: ${msg.content}`
          ).join('\n')}`
        : '';

      const prompt = `You are an EXPERT Visual Style Consultant and Carousel Design Coach with 20+ years of experience in brand design, content strategy, and visual communication. You specialize in Instagram carousel design and continuous style improvement.

YOUR ROLE:
1. Listen to user feedback about their carousel styles and generations
2. Analyze what works and what doesn't
3. Provide actionable suggestions to improve the style
4. Update style descriptions and instructions based on feedback
5. Learn from patterns across multiple generations
6. Suggest improvements proactively

${styleContext}
${recentGenerationsContext}
${previousFeedbackContext}
${conversationHistoryContext}

CURRENT USER MESSAGE:
${input.userMessage}

YOUR TASK:
1. Analyze the user's message in context of their style and history
2. If they're giving feedback about a specific slide type (${slideType}), focus on that
3. Identify patterns: what they like, what they don't like, recurring issues
4. Provide specific, actionable suggestions (not generic advice)
5. If appropriate, update style parameters (descriptions, colors, instructions)
6. Be conversational, helpful, and professional
7. ALWAYS respond in Brazilian Portuguese (PT-BR)

OUTPUT FORMAT: Return ONLY a valid JSON object with these fields:
{
  "response": "Your conversational response to the user in PT-BR, acknowledging their feedback and explaining what you learned or changed",
  "styleUpdates": {
    "coverStyle": "Updated cover style description (or null if no change)",
    "contentStyle": "Updated content style description (or null if no change)",
    "ctaStyle": "Updated CTA style description (or null if no change)",
    "extraInstructions": "Updated extra instructions (or null if no change)",
    "colors": "Updated brand colors (or null if no change)",
    "audience": "Updated audience (or null if no change)",
    "tone": "Updated tone (or null if no change)"
  },
  "suggestions": ["Specific suggestion 1", "Specific suggestion 2", "Specific suggestion 3"],
  "appliedChanges": true/false
}

RULES:
- Be specific and detailed in style updates (include hex colors, layout details, typography rules)
- Only update fields that the user actually gave feedback about
- If no changes are needed, set appliedChanges to false
- Always include at least 2 suggestions for future improvement
- Keep the response conversational but professional
- Write the response field in Brazilian Portuguese`;

      const startTime = Date.now();
      const response = await textGeneration(this.config.model, prompt, {
        max_new_tokens: this.config.maxTokens,
        temperature: this.config.temperature,
        return_full_text: false
      });

      const result = parseJsonOrThrow<ContinuousLearnerOutput>(
        response.generated_text,
        'ContinuousLearnerSkill'
      );

      const latency = Date.now() - startTime;

      if (!this.validateOutput(result)) {
        return this.createErrorResult('Invalid output from ContinuousLearnerSkill');
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
