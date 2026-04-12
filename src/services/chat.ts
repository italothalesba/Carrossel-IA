/**
 * Serviço de Chat com IA para Aprendizado de Estilos
 */

import { StyleData } from './ai';
import { ContinuousLearnerSkill, ContinuousLearnerInput, ContinuousLearnerOutput } from '../skills/continuous-learner';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
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
  appliedChanges?: boolean;
}

export interface ChatSession {
  id: string;
  styleId: string;
  styleName: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
}

export interface ChatInput {
  message: string;
  style: StyleData;
  slideType?: 'cover' | 'content' | 'cta' | 'all';
  conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>;
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

const learner = new ContinuousLearnerSkill();

export async function sendChatMessage(input: ChatInput): Promise<{
  response: ChatMessage;
  styleUpdates?: ContinuousLearnerOutput['styleUpdates'];
}> {
  const learnerInput: ContinuousLearnerInput = {
    style: input.style,
    userMessage: input.message,
    conversationHistory: input.conversationHistory,
    slideType: input.slideType || 'all',
    context: input.context
  };

  const result = await learner.execute(learnerInput);

  if (!result.success || !result.data) {
    throw new Error(`Chat AI failed: ${result.error}`);
  }

  const chatMessage: ChatMessage = {
    id: Date.now().toString(),
    role: 'assistant',
    content: result.data.response,
    timestamp: Date.now(),
    styleUpdates: result.data.styleUpdates,
    suggestions: result.data.suggestions,
    appliedChanges: result.data.appliedChanges
  };

  return {
    response: chatMessage,
    styleUpdates: result.data.styleUpdates
  };
}

export function createChatSession(style: StyleData): ChatSession {
  return {
    id: `chat_${Date.now()}`,
    styleId: style.id,
    styleName: style.name,
    messages: [],
    createdAt: Date.now(),
    updatedAt: Date.now()
  };
}
