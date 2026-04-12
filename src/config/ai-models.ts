// Configuração de Modelos de IA Disponíveis

export interface TextModel {
  id: string;
  name: string;
  provider: string;
  model: string;
  envKey: string;
  description: string;
  speed: 'fast' | 'medium' | 'slow';
  quality: 'high' | 'medium' | 'standard';
}

export interface ImageModel {
  id: string;
  name: string;
  provider: string;
  model: string;
  envKey: string;
  description: string;
  quality: 'ultra' | 'high' | 'standard';
  speed: 'fast' | 'medium' | 'slow';
}

// Modelos de TEXTO disponíveis
export const TEXT_MODELS: TextModel[] = [
  {
    id: 'deepseek-chat',
    name: 'DeepSeek Chat',
    provider: 'DeepSeek',
    model: 'deepseek-chat',
    envKey: 'DEEPSEEK_API_KEY',
    description: 'Modelo Chinês potente e rápido, excelente para PT-BR',
    speed: 'fast',
    quality: 'high'
  },
  {
    id: 'groq-llama-70b',
    name: 'Llama 3.3 70B (Groq)',
    provider: 'Groq',
    model: 'llama-3.3-70b-versatile',
    envKey: 'GROQ_API_KEY',
    description: 'Extremamente rápido, bom para geração rápida de conteúdo',
    speed: 'fast',
    quality: 'high'
  },
  {
    id: 'qwen-plus',
    name: 'Qwen Plus (Alibaba)',
    provider: 'DashScope',
    model: 'qwen-plus',
    envKey: 'ALIYUN_DASHSCOPE_API_KEY',
    description: 'Modelo Chinês da Alibaba, bom custo-benefício',
    speed: 'medium',
    quality: 'high'
  },
  {
    id: 'nemotron-120b',
    name: 'Nemotron 3 Super 120B',
    provider: 'OpenRouter',
    model: 'nvidia/nemotron-3-super-120b-a12b:free',
    envKey: 'OPENROUTER_API_KEY',
    description: 'Modelo NVIDIA de alta qualidade, grátis via OpenRouter',
    speed: 'medium',
    quality: 'high'
  },
  {
    id: 'gemma-4-31b',
    name: 'Gemma 4 31B',
    provider: 'OpenRouter',
    model: 'google/gemma-4-31b-it:free',
    envKey: 'OPENROUTER_API_KEY',
    description: 'Modelo Google, bom para conteúdo criativo',
    speed: 'medium',
    quality: 'high'
  },
  {
    id: 'claude-3-sonnet',
    name: 'Claude 3.5 Sonnet',
    provider: 'Anthropic',
    model: 'claude-3-5-sonnet-20241022',
    envKey: 'ANTHROPIC_API_KEY',
    description: 'Alta qualidade, excelente para texto natural',
    speed: 'medium',
    quality: 'high'
  },
  {
    id: 'gemini-2-flash',
    name: 'Gemini 2.0 Flash',
    provider: 'Google',
    model: 'gemini-2.0-flash',
    envKey: 'GOOGLE_API_KEY',
    description: 'Modelo Google, rápido e versátil',
    speed: 'fast',
    quality: 'high'
  },
  {
    id: 'grok-2',
    name: 'Grok 4.20 Reasoning (xAI)',
    provider: 'xAI',
    model: 'grok-4.20-reasoning',
    envKey: 'XAI_API_KEY',
    description: 'Modelo da xAI (Elon Musk), excelente para raciocínio',
    speed: 'fast',
    quality: 'high'
  },
  {
    id: 'llama-70b-fireworks',
    name: 'Llama 3.3 70B (Fireworks)',
    provider: 'Fireworks AI',
    model: 'llama-v3p3-70b-instruct',
    envKey: 'FIREWORKS_API_KEY',
    description: 'Boa alternativa via Fireworks',
    speed: 'medium',
    quality: 'high'
  },
  {
    id: 'llama-8b-sambanova',
    name: 'Llama 3.1 8B (SambaNova)',
    provider: 'SambaNova',
    model: 'Meta-Llama-3.1-8B-Instruct',
    envKey: 'SAMBANOVA_API_KEY',
    description: 'Modelo leve, bom para tarefas simples',
    speed: 'fast',
    quality: 'standard'
  },
  {
    id: 'llama-70b-aiml',
    name: 'Llama 3.3 70B (AIML)',
    provider: 'AIMLAPI',
    model: 'meta-llama/Llama-3.3-70B-Instruct',
    envKey: 'AIML_API_KEY',
    description: 'Via AIML API, boa opção de backup',
    speed: 'medium',
    quality: 'high'
  },
  {
    id: 'llama-70b-together',
    name: 'Llama 3.3 70B Turbo',
    provider: 'Together AI',
    model: 'Llama-3.3-70B-Instruct-Turbo',
    envKey: 'TOGETHER_API_KEY',
    description: 'Versão turbo, rápida e eficiente',
    speed: 'fast',
    quality: 'high'
  },
  {
    id: 'qwen-7b-hf',
    name: 'Qwen 2.5 7B (HuggingFace)',
    provider: 'HuggingFace',
    model: 'Qwen/Qwen2.5-7B-Instruct',
    envKey: 'HF_API_KEY',
    description: 'Modelo leve via HuggingFace',
    speed: 'medium',
    quality: 'standard'
  },
  {
    id: 'auto-rotate',
    name: '🔄 Rotação Automática',
    provider: 'Sistema',
    model: 'auto',
    envKey: 'ALL',
    description: 'Deixar o sistema escolher automaticamente o melhor provider',
    speed: 'fast',
    quality: 'high'
  }
];

// Modelos de IMAGEM disponíveis
export const IMAGE_MODELS: ImageModel[] = [
  {
    id: 'nano-banana',
    name: 'Nano Banana (Gemini 2.5 Flash Image)',
    provider: 'Google AI Studio',
    model: 'gemini-2.5-flash-image',
    envKey: 'GOOGLE_API_KEY',
    description: '🍌 Nano Banana - Geração de imagens via Gemini 2.5 Flash, grátis (50 imgs/mês)',
    quality: 'ultra',
    speed: 'medium'
  },
  {
    id: 'flux-schnell',
    name: 'FLUX-1 Schnell',
    provider: 'Cloudflare Workers AI',
    model: '@cf/black-forest-labs/flux-1-schnell',
    envKey: 'CLOUDFLARE_API_TOKEN',
    description: 'Rápido e eficiente, bom fallback',
    quality: 'high',
    speed: 'fast'
  },
  {
    id: 'flux-dev',
    name: 'FLUX-1 Dev',
    provider: 'HuggingFace',
    model: 'black-forest-labs/FLUX.1-dev',
    envKey: 'HF_API_KEY',
    description: 'Versão dev do FLUX, mais detalhado',
    quality: 'high',
    speed: 'medium'
  },
  {
    id: 'sdxl',
    name: 'Stable Diffusion XL',
    provider: 'Replicate',
    model: 'stability-ai/sdxl',
    envKey: 'REPLICATE_API_TOKEN',
    description: 'SDXL via Replicate, confiável',
    quality: 'high',
    speed: 'medium'
  },
  {
    id: 'leonardo-ai',
    name: 'Leonardo.AI',
    provider: 'Leonardo.AI',
    model: 'leonardo-diffusion',
    envKey: 'LEONARDO_API_KEY',
    description: 'Modelo proprietário de alta qualidade',
    quality: 'ultra',
    speed: 'slow'
  },
  {
    id: 'auto-fallback',
    name: '🔄 Fallback Automático',
    provider: 'Sistema',
    model: 'auto',
    envKey: 'ALL',
    description: 'Tentar em sequência: Imagen → FLUX → SDXL → Leonardo',
    quality: 'ultra',
    speed: 'medium'
  }
];

// Estado global dos modelos selecionados
export interface SelectedModels {
  textModel: string; // model ID
  imageModel: string; // model ID
}

// Carregar do localStorage ou usar padrão
export function loadSelectedModels(): SelectedModels {
  try {
    const stored = localStorage.getItem('selected_ai_models');
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.warn('Failed to load selected models:', e);
  }
  return {
    textModel: 'auto-rotate',
    imageModel: 'auto-fallback'
  };
}

// Salvar no localStorage
export function saveSelectedModels(models: SelectedModels) {
  try {
    localStorage.setItem('selected_ai_models', JSON.stringify(models));
  } catch (e) {
    console.warn('Failed to save selected models:', e);
  }
}

// Função para verificar se um modelo está disponível
export function isModelAvailable(modelId: string, models: Array<{id: string; envKey: string}>): boolean {
  const model = models.find(m => m.id === modelId);
  if (!model) return false;
  if (model.envKey === 'ALL') return true; // Auto-rotate/fallback sempre disponível
  
  // Verificar se a chave existe no environment (via backend)
  // Isso será verificado no server-side
  return true;
}
