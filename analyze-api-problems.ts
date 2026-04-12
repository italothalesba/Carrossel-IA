/**
 * Script para analisar problemas nos logs do servidor
 */

import fs from 'fs';
import path from 'path';

interface ApiProblem {
  provider: string;
  type: 'empty_response' | 'rate_limit' | 'quota_exceeded' | 'model_deprecated' | 'payment_required' | 'invalid_input' | 'kudos_upfront';
  count: number;
  lastError: string;
  recommendation: string;
}

const problems: Map<string, ApiProblem> = new Map();

function recordProblem(provider: string, type: ApiProblem['type'], error: string, recommendation: string) {
  const key = `${provider}_${type}`;
  const existing = problems.get(key);
  if (existing) {
    existing.count++;
    existing.lastError = error.substring(0, 100);
  } else {
    problems.set(key, { provider, type, count: 1, lastError: error.substring(0, 100), recommendation });
  }
}

console.log('\n' + '='.repeat(80));
console.log('📊 ANÁLISE DE PROBLEMAS NAS APIs');
console.log('='.repeat(80));
console.log(`🕐 ${new Date().toLocaleString('pt-BR')}\n`);

console.log('🔍 Problemas Identificados nos Logs:\n');

// Lista de problemas conhecidos baseados na análise
const knownProblems: ApiProblem[] = [
  {
    provider: 'Google AI Studio (Imagens)',
    type: 'quota_exceeded',
    count: 5,
    lastError: '429 - You exceeded your current quota',
    recommendation: '⏳ Aguardar próximo mês ou usar Cloudflare FLUX como principal'
  },
  {
    provider: 'HuggingFace (Imagens)',
    type: 'model_deprecated',
    count: 2,
    lastError: '410 - The requested model is deprecated',
    recommendation: '🔄 Atualizar para modelo atual (ex: stabilityai/stable-diffusion-3-5-large)'
  },
  {
    provider: 'Cloudflare FLUX',
    type: 'invalid_input',
    count: 1,
    lastError: '400 - Length of \'/prompt\' must be <= 2048',
    recommendation: '✂️ Truncar prompts para máximo 2048 caracteres'
  },
  {
    provider: 'Leonardo.AI',
    type: 'invalid_input',
    count: 2,
    lastError: 'Invalid prompt, maximum length of 1500 characters exceeded',
    recommendation: '✂️ Truncar prompts para máximo 1500 caracteres'
  },
  {
    provider: 'Replicate',
    type: 'payment_required',
    count: 2,
    lastError: '402 - Insufficient credit',
    recommendation: '💳 Adicionar créditos ou remover da lista de fallback'
  },
  {
    provider: 'AI Horde',
    type: 'kudos_upfront',
    count: 2,
    lastError: '403 - This request requires 13.34 kudos',
    recommendation: '⭐ Acumular kudos ou reduzir resolução/steps'
  },
  {
    provider: 'Todos Gemini (texto)',
    type: 'empty_response',
    count: 5,
    lastError: 'success: 0 chars',
    recommendation: '⚠️ Verificar formato de resposta esperado (JSON vs texto)'
  },
  {
    provider: 'SambaNova',
    type: 'empty_response',
    count: 1,
    lastError: 'success: 0 chars',
    recommendation: '⚠️ Modelo pode não suportar response_format JSON'
  },
  {
    provider: 'Together AI',
    type: 'empty_response',
    count: 1,
    lastError: 'success: 0 chars',
    recommendation: '⚠️ Verificar compatibilidade com response_format'
  },
  {
    provider: 'DeepSeek',
    type: 'empty_response',
    count: 1,
    lastError: 'success: 0 chars',
    recommendation: '⚠️ Pode estar retornando formato inesperado'
  },
  {
    provider: 'AIMLAPI',
    type: 'empty_response',
    count: 1,
    lastError: 'success: 0 chars',
    recommendation: '⚠️ Verificar resposta da API'
  },
  {
    provider: 'HuggingFace (texto)',
    type: 'empty_response',
    count: 1,
    lastError: 'success: 0 chars',
    recommendation: '⚠️ Formato de resposta pode ser array'
  },
  {
    provider: 'Nemotron 1',
    type: 'empty_response',
    count: 1,
    lastError: 'success: 0 chars',
    recommendation: '⚠️ Pode estar com quota limitada'
  },
  {
    provider: 'Gemma 4 31B',
    type: 'empty_response',
    count: 1,
    lastError: 'success: 0 chars',
    recommendation: '⚠️ Pode estar com quota limitada'
  }
];

knownProblems.forEach((p, i) => {
  const icon = p.type === 'quota_exceeded' || p.type === 'payment_required' ? '🔴' :
               p.type === 'model_deprecated' ? '⚠️' :
               p.type === 'empty_response' ? '🟡' : '🟠';
  
  console.log(`${icon} ${i + 1}. ${p.provider}`);
  console.log(`   Tipo: ${p.type}`);
  console.log(`   Ocorrências: ${p.count}`);
  console.log(`   Erro: ${p.lastError}`);
  console.log(`   ${p.recommendation}\n`);
});

// Resumo por categoria
console.log('='.repeat(80));
console.log('📈 RESUMO POR CATEGORIA:');
console.log('='.repeat(80));

const categories = {
  '🔴 Quota/Rate Limit Exceeded': knownProblems.filter(p => p.type === 'quota_exceeded').length,
  '💳 Pagamento/Crédito': knownProblems.filter(p => p.type === 'payment_required').length,
  '⚠️ Modelo Desatualizado': knownProblems.filter(p => p.type === 'model_deprecated').length,
  '✂️ Prompt Muito Longo': knownProblems.filter(p => p.type === 'invalid_input').length,
  '⭐ Sem Kudos/Crédito': knownProblems.filter(p => p.type === 'kudos_upfront').length,
  '🟡 Resposta Vazia (0 chars)': knownProblems.filter(p => p.type === 'empty_response').length
};

Object.entries(categories).forEach(([cat, count]) => {
  if (count > 0) {
    console.log(`${cat}: ${count} API(s)`);
  }
});

console.log('\n' + '='.repeat(80));
console.log('💡 RECOMENDAÇÕES PRIORITÁRIAS:');
console.log('='.repeat(80));

console.log(`
1. ✂️ **Truncar prompts para APIs de imagem**
   - Cloudflare FLUX: máx 2048 chars
   - Leonardo.AI: máx 1500 chars
   
2. 🔄 **Remover APIs pagas sem crédito**
   - Replicate (sem créditos)
   - Ou adicionar créditos
   
3. 🔄 **Atualizar modelo HuggingFace**
   - De: stabilityai/stable-diffusion-xl-base-1.0 (deprecated)
   - Para: stabilityai/stable-diffusion-3-5-large
   
4. ⚠️ **Google AI Studio com quota esgotada**
   - Aguardar renovação mensal
   - Usar Cloudflare FLUX como principal
   
5. 🔍 **Investigar respostas vazias**
   - 8 APIs retornaram 0 chars
   - Pode ser problema de parsing ou formato
   - Verificar se response_format é suportado

6. ⭐ **AI Horde sem kudos**
   - Contribuir com computação para ganhar kudos
   - Ou reduzir resolução/steps das requests
`);

console.log('='.repeat(80) + '\n');
