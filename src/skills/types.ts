/**
 * Sistema de Skills para Carrossel-IA
 *
 * As Skills substituem os antigos Agentes e representam
 * capacidades especializadas reutilizáveis no pipeline de criação.
 */

import { StyleData, SlideContent, DraftResponse } from '../services/ai';
import { StyleDNA } from '../services/styleDNA';

// ==========================================
// INTERFACES BASE
// ==========================================

export interface SkillConfig {
  name: string;
  description: string;
  model: string;
  provider: string;
  temperature: number;
  maxTokens: number;
}

export interface SkillContext {
  content?: string;
  style?: StyleData;
  slides?: SlideContent[];
  styleContext?: string;
  userConsiderations?: string;
  managerFeedback?: string;
}

export interface SkillResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  metadata?: {
    model?: string;
    provider?: string;
    tokensUsed?: number;
    latency?: number;
  };
}

// ==========================================
// INTERFACE BASE DA SKILL
// ==========================================

export interface Skill<TInput = any, TOutput = any> {
  readonly name: string;
  readonly description: string;
  readonly config: SkillConfig;
  
  execute(input: TInput, context?: SkillContext): Promise<SkillResult<TOutput>>;
  
  validateInput(input: TInput): boolean;
  validateOutput(output: TOutput): boolean;
}

// ==========================================
// TIPOS ESPECÍFICOS DE SKILLS
// ==========================================

export interface DiagrammerInput {
  content: string;
  styleContext: string;
}

export interface DiagrammerOutput {
  slides: SlideContent[];
}

export interface ReviewerInput {
  slide: SlideContent;
  slideNumber: number;
}

export interface ReviewerOutput {
  correctedSlide: SlideContent;
}

export interface DesignerInput {
  slide: SlideContent;
  slideNumber: number;
  styleContext: string;
  styleAssets?: {
    logo?: string;      // base64 do logo
    background?: string; // base64 do background
  };
  styleDNA?: {
    cover?: StyleDNA;
    content?: StyleDNA;
    cta?: StyleDNA;
  };
  styleMetadata?: {
    colors?: string;
    extraInstructions?: string;
    audience?: string;
    tone?: string;
  };
}

export interface DesignerOutput {
  slide: SlideContent;
}

export interface ManagerInput {
  slides: SlideContent[];
  styleContext: string;
}

export interface ManagerOutput {
  draftResponse: DraftResponse;
}

export interface RefinerInput {
  slides: SlideContent[];
  managerFeedback: string;
  userConsiderations: string;
  style: StyleData;
}

export interface RefinerOutput {
  draftResponse: DraftResponse;
}
