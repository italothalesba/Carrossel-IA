const PORT = 3018;
const BASE_URL = `http://localhost:${PORT}`;

async function runTests() {
  console.log('🚀 Iniciando testes de conexão...\n');

  // 1. Testar Pinecone Health
  try {
    const res = await fetch(`${BASE_URL}/api/pinecone/health`);
    const data = await res.json();
    console.log('✅ Pinecone Health:', data.status === 'ok' ? 'ONLINE' : 'OFFLINE', data);
  } catch (e) {
    console.log('❌ Pinecone Health: ERRO DE CONEXÃO', e.message);
  }

  // 2. Testar Text Generation (Alibaba / Google / HF / OpenAI)
  try {
    console.log('\n--- Testando Geração de Texto ---');
    const res = await fetch(`${BASE_URL}/api/ai/text-generation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        inputs: 'Responda apenas com a palavra "OK" se você estiver funcionando.',
        parameters: { max_new_tokens: 10 }
      })
    });
    const data = await res.json();
    console.log('✅ Text Generation:', data.generated_text?.trim() || 'Resposta vazia');
  } catch (e) {
    console.log('❌ Text Generation: ERRO', e.message);
  }

  // 3. Testar Image Generation (Replicate)
  try {
    console.log('\n--- Testando Geração de Imagem (Replicate) ---');
    const res = await fetch(`${BASE_URL}/api/ai/generate-image`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: 'a simple blue square' })
    });
    const data = await res.json();
    console.log('✅ Image Generation:', data.output ? 'SUCESSO (URL recebida)' : 'FALHA', data.output || data);
  } catch (e) {
    console.log('❌ Image Generation: ERRO', e.message);
  }

  // 4. Testar Feature Extraction (Embeddings)
  try {
    console.log('\n--- Testando Embeddings ---');
    const res = await fetch(`${BASE_URL}/api/ai/feature-extraction`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ inputs: 'teste de embedding' })
    });
    const data = await res.json();
    console.log('✅ Embeddings:', Array.isArray(data[0]) ? `SUCESSO (Dimensão: ${data[0].length})` : 'FALHA');
  } catch (e) {
    console.log('❌ Embeddings: ERRO', e.message);
  }

  console.log('\n--- FIM DOS TESTES ---');
}

runTests();