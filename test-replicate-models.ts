#!/usr/bin/env node
/**
 * Teste de Modelos Replicate - FLUX Schnell vs Dev vs Pro
 */

import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const repKey = process.env.REPLICATE_API_KEY;

if (!repKey) {
  console.log('ERRO: REPLICATE_API_KEY não configurada');
  process.exit(1);
}

console.log('\n============================================================');
console.log('TESTE: Replicate - Modelos FLUX');
console.log('============================================================');
console.log(`Chave: ${repKey.substring(0, 15)}...`);

const models = [
  {
    name: 'FLUX.1 Schnell (mais barato)',
    model: 'black-forest-labs/flux-schnell',
    price: '$0.003/imagem'
  },
  {
    name: 'FLUX.1 Dev (intermediário)',
    model: 'black-forest-labs/flux-dev',
    price: '$0.025/imagem'
  },
  {
    name: 'FLUX.1.1 Pro (premium)',
    model: 'black-forest-labs/flux-1.1-pro',
    price: '$0.04/imagem'
  }
];

async function testReplicateModel(modelInfo) {
  console.log(`\n------------------------------------------------------------`);
  console.log(`Testando: ${modelInfo.name}`);
  console.log(`Modelo: ${modelInfo.model}`);
  console.log(`Preço: ${modelInfo.price}`);
  console.log(`------------------------------------------------------------`);

  try {
    // Tentar criar prediction
    const res = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${repKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        version: modelInfo.model,
        input: {
          prompt: 'A simple test image, blue background',
          width: 512,
          height: 512
        }
      })
    });

    if (res.ok) {
      const data = await res.json();
      console.log(`   SUCESSO! Prediction criada: ${data.id}`);
      console.log(`   Status: ${data.status}`);
      console.log(`   URL para verificar: ${data.urls?.get}`);

      // Aguardar e verificar resultado
      await new Promise(r => setTimeout(r, 5000));
      const checkRes = await fetch(data.urls?.get, {
        headers: { 'Authorization': `Bearer ${repKey}` }
      });

      if (checkRes.ok) {
        const checkData = await checkRes.json();
        console.log(`   Status final: ${checkData.status}`);
        if (checkData.output) {
          console.log(`   Imagem gerada: ${checkData.output[0] || checkData.output}`);
        }
        if (checkData.error) {
          console.log(`   Erro: ${checkData.error}`);
        }
      }
    } else {
      const err = await res.json();
      console.log(`   Erro ${res.status}: ${JSON.stringify(err).substring(0, 300)}`);

      if (res.status === 402) {
        console.log(`   ❌ Sem créditos na conta`);
        console.log(`   💡 Comprar créditos em: https://replicate.com/account/billing`);
      } else if (res.status === 422) {
        console.log(`   ❌ Versão do modelo inválida ou não permitida`);
        console.log(`   💡 Verificar modelo em: https://replicate.com/${modelInfo.model}`);
      }
    }
  } catch (e) {
    console.log(`   Exceção: ${e.message}`);
  }
}

(async () => {
  for (const model of models) {
    await testReplicateModel(model);
  }

  console.log('\n============================================================');
  console.log('RESUMO DE PREÇOS REPLICATE');
  console.log('============================================================');
  console.log('1. FLUX.1 Schnell:   $0.003/imagem (mais barato, rápido)');
  console.log('2. FLUX.1 Dev:       $0.025/imagem (qualidade intermediária)');
  console.log('3. FLUX.1.1 Pro:     $0.04/imagem (máxima qualidade)');
  console.log('\nRecomendação para fallback: FLUX.1 Schnell ($0.003/imagem)');
  console.log('============================================================\n');
})();
