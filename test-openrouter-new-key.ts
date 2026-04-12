#!/usr/bin/env node
/**
 * Teste da NOVA chave OpenRouter do Italo
 */

import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const NEW_KEY = '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';

console.log('\n============================================================');
console.log('TESTE: NOVA Chave OpenRouter do Italo');
console.log('============================================================');
console.log(`Nova chave: ${NEW_KEY.substring(0, 20)}...`);
console.log(`Tamanho: ${NEW_KEY.length} caracteres`);

const models = [
  {
    name: 'Nemotron 3 Super 120B (free)',
    model: 'nvidia/nemotron-3-super-120b-a12b:free'
  },
  {
    name: 'Gemma 4 31B (free)',
    model: 'google/gemma-4-31b-it:free'
  }
];

async function testModel(modelInfo) {
  console.log(`\n------------------------------------------------------------`);
  console.log(`Testando: ${modelInfo.name}`);
  console.log(`Modelo: ${modelInfo.model}`);
  console.log(`------------------------------------------------------------`);

  try {
    const start = Date.now();
    const timeout = 20000;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${NEW_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost:3018',
        'X-Title': 'Carrossel-IA-Pro'
      },
      body: JSON.stringify({
        model: modelInfo.model,
        messages: [{ role: 'user', content: 'Say OK' }],
        max_tokens: 10
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);
    const latency = Date.now() - start;

    if (res.ok) {
      const data = await res.json();
      console.log(`   SUCESSO! (${latency}ms)`);
      console.log(`   Resposta: ${data.choices?.[0]?.message?.content || 'N/A'}`);
    } else {
      const err = await res.text();
      console.log(`   Erro ${res.status} (${latency}ms): ${err.substring(0, 200)}`);

      if (res.status === 401) console.log(`   Chave inválida`);
      else if (res.status === 429) console.log(`   Rate limit excedido`);
      else if (res.status >= 500) console.log(`   Erro do servidor`);
    }
  } catch (e) {
    if (e.name === 'AbortError') {
      console.log(`   TIMEOUT (>20s)`);
    } else {
      console.log(`   Exceção: ${e.message}`);
    }
  }
}

(async () => {
  for (const model of models) {
    await testModel(model);
  }

  console.log('\n============================================================');
  console.log('RESUMO');
  console.log('============================================================\n');
})();
