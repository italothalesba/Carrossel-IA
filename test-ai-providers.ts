/**
 * Teste Direto das APIs de IA
 */

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function testAIProviders() {
  console.log('\n🤖 === TESTE DE APIs DE IA ===\n');
  
  const hfApiKey = process.env.HF_API_KEY;
  const googleApiKey = process.env.GOOGLE_API_KEY;
  
  console.log(`HF_API_KEY: ${hfApiKey ? '✅ ' + hfApiKey.substring(0, 15) + '...' : '❌ Não configurada'}`);
  console.log(`GOOGLE_API_KEY: ${googleApiKey ? '✅ ' + googleApiKey.substring(0, 15) + '...' : '❌ Não configurada'}`);
  
  // Teste 1: HuggingFace Qwen
  if (hfApiKey) {
    console.log('\n🔍 Teste 1: HuggingFace Qwen...');
    try {
      const response = await fetch('https://router.huggingface.co/hf-inference/models/Qwen/Qwen2.5-Coder-7B-Instruct', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${hfApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          inputs: 'Retorne APENAS este JSON: {"test": true}',
          parameters: {
            max_new_tokens: 100,
            temperature: 0.7,
            return_full_text: false
          }
        })
      });
      
      console.log(`Status: ${response.status}`);
      const data = await response.json();
      console.log('Resposta:', JSON.stringify(data).substring(0, 200));
      
      if (response.ok) {
        console.log('✅ HuggingFace funcionando!');
      } else {
        console.log('❌ HuggingFace falhou');
      }
    } catch (e: any) {
      console.log('❌ Erro HuggingFace:', e.message);
    }
  }
  
  // Teste 2: Google Gemini
  if (googleApiKey) {
    console.log('\n🔍 Teste 2: Google Gemini...');
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${googleApiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: 'Retorne APENAS: {"test": true}' }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 100
          }
        })
      });
      
      console.log(`Status: ${response.status}`);
      const data = await response.json();
      
      if (response.ok) {
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
        console.log('Resposta:', text.substring(0, 200));
        console.log('✅ Google Gemini funcionando!');
      } else {
        console.log('❌ Google Gemini falhou:', JSON.stringify(data).substring(0, 200));
      }
    } catch (e: any) {
      console.log('❌ Erro Google:', e.message);
    }
  }
}

testAIProviders();
