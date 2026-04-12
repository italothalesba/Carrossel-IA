#!/usr/bin/env node
/**
 * Teste Final Completo Após Correções
 */

import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const results = [];
const log = (msg) => { console.log(msg); results.push(msg); };

// ============================================================
// 1. GOOGLE AI STUDIO (CORRIGIDO - sem aspectRatio)
// ============================================================
async function testGoogle() {
  log('\n============================================================');
  log('1. GOOGLE AI STUDIO (Nano Banana) - CORRIGIDO');
  log('============================================================');
  
  const apiKey = process.env.GOOGLE_API_KEY;
  try {
    // Teste SEM aspectRatio (correção aplicada)
    const res = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent', {
      method: 'POST',
      headers: { 'x-goog-api-key': apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: 'Generate a simple test image' }] }],
        generationConfig: { responseModalities: ['TEXT', 'IMAGE'] }
      })
    });
    
    if (res.ok) {
      const data = await res.json();
      for (const candidate of data.candidates || []) {
        for (const part of candidate.content?.parts || []) {
          if (part.inlineData?.data) {
            const size = Math.round(part.inlineData.data.length * 0.75 / 1024);
            log(`   SUCESSO! Imagem recebida: ~${size}KB`);
          }
        }
      }
    } else {
      const err = await res.json();
      log(`   ERRO ${res.status}: ${err.error?.message?.substring(0, 100) || 'Unknown'}`);
    }
  } catch (e) {
    log(`   EXCEÇÃO: ${e.message}`);
  }
}

// ============================================================
// 2. HUGGINGFACE (URL ATUALIZADA)
// ============================================================
async function testHuggingFace() {
  log('\n============================================================');
  log('2. HUGGINGFACE (URL ATUALIZADA - router.huggingface.co)');
  log('============================================================');
  
  const hfKey = process.env.HF_API_KEY;
  if (!hfKey || hfKey.length < 20) {
    log(`   CHAVE INCOMPLETA: "${hfKey}" (${hfKey?.length || 0} chars)`);
    log('   Ação necessária: Obter chave válida em huggingface.co/settings/tokens');
    return;
  }
  
  try {
    // Teste com NOVA URL
    const res = await fetch('https://router.huggingface.co/hf-inference/models/black-forest-labs/FLUX.1-dev', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${hfKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ inputs: 'A simple test image', parameters: { num_inference_steps: 4 } })
    });
    
    if (res.ok) {
      log('   SUCESSO! FLUX.1-dev está funcionando com nova URL');
    } else {
      const err = await res.text();
      log(`   ERRO ${res.status}: ${err.substring(0, 150)}`);
    }
  } catch (e) {
    log(`   EXCEÇÃO: ${e.message}`);
  }
}

// ============================================================
// 3. OPENROUTER (NOVA CHAVE ITALO)
// ============================================================
async function testOpenRouter() {
  log('\n============================================================');
  log('3. OPENROUTER (NOVA CHAVE ITALO)');
  log('============================================================');
  
  const keys = [
    { name: 'OpenRouter 1 (Italo - NOVA)', key: process.env.OPENROUTER_API_KEY },
    { name: 'OpenRouter 2 (Odonto)', key: process.env.OPENROUTER_API_KEY_BACKUP },
    { name: 'OpenRouter 3 (Coruja)', key: process.env.OPENROUTER_API_KEY_3 },
    { name: 'OpenRouter 4 (Dandhara)', key: process.env.OPENROUTER_API_KEY_4 }
  ];
  
  for (const { name, key } of keys) {
    log(`\n   Testando: ${name}`);
    if (!key) { log('   Chave não configurada'); continue; }
    
    try {
      const start = Date.now();
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);
      
      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${key}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'http://localhost:3018',
          'X-Title': 'Carrossel-IA'
        },
        body: JSON.stringify({
          model: 'nvidia/nemotron-3-super-120b-a12b:free',
          messages: [{ role: 'user', content: 'Say OK' }],
          max_tokens: 10
        }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      const latency = Date.now() - start;
      
      if (res.ok) {
        log(`   SUCESSO! (${latency}ms)`);
      } else {
        const err = await res.text();
        log(`   ERRO ${res.status} (${latency}ms): ${err.substring(0, 100)}`);
      }
    } catch (e) {
      if (e.name === 'AbortError') log('   TIMEOUT (>15s)');
      else log(`   EXCEÇÃO: ${e.message}`);
    }
  }
}

// ============================================================
// 4. FIREWORKS AI
// ============================================================
async function testFireworks() {
  log('\n============================================================');
  log('4. FIREWORKS AI (Status das 3 chaves)');
  log('============================================================');
  
  const keys = [
    { name: 'Fireworks 1 (Italo)', key: process.env.FIREWORKS_API_KEY },
    { name: 'Fireworks 2 (Coruja)', key: process.env.FIREWORKS_API_KEY_BACKUP_1 },
    { name: 'Fireworks 3 (Odonto)', key: process.env.FIREWORKS_API_KEY_BACKUP_2 }
  ];
  
  for (const { name, key } of keys) {
    log(`\n   Testando: ${name}`);
    if (!key) { log('   Chave não configurada'); continue; }
    
    try {
      const start = Date.now();
      const res = await fetch('https://api.fireworks.ai/inference/v1/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'accounts/fireworks/models/llama-v3p3-70b-instruct',
          messages: [{ role: 'user', content: 'Say OK' }],
          max_tokens: 10
        })
      });
      
      const latency = Date.now() - start;
      
      if (res.ok) {
        log(`   SUCESSO! (${latency}ms)`);
      } else {
        const err = await res.json();
        const msg = err.error?.message || err.message || 'Unknown';
        log(`   ERRO ${res.status} (${latency}ms): ${msg.substring(0, 100)}`);
        
        if (msg.includes('suspended') || msg.includes('spending limit')) {
          log('   → Conta suspensa - necessita pagamento/reativação');
        }
      }
    } catch (e) {
      log(`   EXCEÇÃO: ${e.message}`);
    }
  }
}

// ============================================================
// 5. GROQ
// ============================================================
async function testGroq() {
  log('\n============================================================');
  log('5. GROQ (Status das 3 chaves)');
  log('============================================================');
  
  const keys = [
    { name: 'Groq 1 (Italo)', key: process.env.GROQ_API_KEY },
    { name: 'Groq 2 (Odonto)', key: process.env.GROQ_API_KEY_BACKUP_1 },
    { name: 'Groq 3 (Coruja)', key: process.env.GROQ_API_KEY_BACKUP_2 }
  ];
  
  for (const { name, key } of keys) {
    log(`\n   Testando: ${name}`);
    if (!key) { log('   Chave não configurada'); continue; }
    
    try {
      const start = Date.now();
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [{ role: 'user', content: 'Say OK' }],
          max_tokens: 10
        })
      });
      
      const latency = Date.now() - start;
      
      if (res.ok) {
        const remaining = res.headers.get('x-ratelimit-remaining-requests');
        const tokens = res.headers.get('x-ratelimit-remaining-tokens');
        log(`   SUCESSO! (${latency}ms) - Requests: ${remaining}, Tokens: ${tokens}`);
      } else {
        const err = await res.text();
        log(`   ERRO ${res.status} (${latency}ms): ${err.substring(0, 100)}`);
      }
    } catch (e) {
      log(`   EXCEÇÃO: ${e.message}`);
    }
  }
}

// ============================================================
// 6. CLOUDFLARE (Imagens)
// ============================================================
async function testCloudflare() {
  log('\n============================================================');
  log('6. CLOUDFLARE WORKERS AI (FLUX.1 Schnell - Imagens)');
  log('============================================================');
  
  const token = process.env.CLOUDFLARE_API_TOKEN;
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  
  if (!token || !accountId) {
    log('   Chaves não configuradas');
    return;
  }
  
  log(`   Token: ${token.substring(0, 15)}...`);
  log(`   Account ID: ${accountId.substring(0, 15)}...`);
  
  try {
    const start = Date.now();
    const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/@cf/black-forest-labs/flux-1-schnell`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: 'A simple test image' })
    });
    
    const latency = Date.now() - start;
    
    if (res.ok) {
      const data = await res.json();
      if (data.result?.image) {
        const size = Math.round(data.result.image.length * 0.75 / 1024);
        log(`   SUCESSO! (${latency}ms) - Imagem: ~${size}KB`);
      } else {
        log(`   ERRO: Resposta sem imagem (${latency}ms)`);
      }
    } else {
      const err = await res.text();
      log(`   ERRO ${res.status} (${latency}ms): ${err.substring(0, 150)}`);
    }
  } catch (e) {
    log(`   EXCEÇÃO: ${e.message}`);
  }
}

// ============================================================
// EXECUTAR TODOS OS TESTES
// ============================================================
(async () => {
  console.log('\n' + '='.repeat(60));
  console.log('TESTE FINAL COMPLETO - APÓS CORREÇÕES');
  console.log('='.repeat(60));
  
  await testGoogle();
  await testHuggingFace();
  await testOpenRouter();
  await testFireworks();
  await testGroq();
  await testCloudflare();
  
  // Salvar relatório
  const logsDir = path.resolve(process.cwd(), 'logs');
  if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir, { recursive: true });
  
  fs.writeFileSync(
    path.resolve(logsDir, 'api-final-test-report.txt'),
    results.join('\n'),
    'utf-8'
  );
  
  console.log('\n✅ Relatório salvo em: logs/api-final-test-report.txt\n');
})();
