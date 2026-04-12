/**
 * Deleta os 6 registros que criamos e verifica se havia dados anteriores
 */

import { Pinecone } from '@pinecone-database/pinecone';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const INDEX_NAME = 'carousel-styles';

async function checkOriginalData() {
  console.log('\n⚠️  === VERIFICANDO SE HAVIA DADOS ANTERIORES ===\n');
  
  const apiKey = process.env.PINECONE_API_KEY;
  const pc = new Pinecone({ apiKey });
  const index = pc.index(INDEX_NAME);
  
  // Primeiro, vê o que tem agora
  console.log('📊 Estado ATUAL do Pinecone:');
  const beforeQuery = await index.query({
    vector: Array(768).fill(0),
    topK: 100,
    includeMetadata: true,
    includeValues: true
  });
  
  console.log(`   Total de registros: ${beforeQuery.matches?.length || 0}`);
  
  if (beforeQuery.matches && beforeQuery.matches.length > 0) {
    beforeQuery.matches.forEach((m, i) => {
      const vectorLength = m.values ? m.values.length : 0;
      console.log(`   ${i + 1}. ${m.id}`);
      console.log(`      • Vetor: ${vectorLength} dimensões ${vectorLength === 0 ? '⚠️  VAZIO!' : '✅'}`);
      console.log(`      • Nome: ${m.metadata?.name || 'N/A'}`);
    });
  }
  
  // Pergunta ao usuário
  console.log('\n\n❓ Os 6 registros acima foram criados pelo nosso script diagnose-system.ts');
  console.log('   Se você tinha dados ANTERIORES de outros editores, eles podem estar em:');
  console.log('   1. Outro index do Pinecone');
  console.log('   2. Outro namespace');
  console.log('   3. Outra conta/chave API');
  
  console.log('\n🔍 Verificando se há outros indexes:');
  const indexes = await pc.listIndexes();
  console.log(`   Total de indexes: ${indexes.indexes?.length || 0}`);
  indexes.indexes?.forEach(idx => {
    console.log(`   • ${idx.name} (${idx.dimension}d)`);
  });
  
  // Mostra detalhe de um registro para ver se tem vetor
  console.log('\n\n🔬 Análise detalhada de um registro:');
  const firstRecord = beforeQuery.matches?.[0];
  if (firstRecord) {
    console.log(`   ID: ${firstRecord.id}`);
    console.log(`   Score: ${firstRecord.score}`);
    console.log(`   Valores do vetor (primeiros 10): ${firstRecord.values?.slice(0, 10).join(', ')}`);
    console.log(`   Dimensões do vetor: ${firstRecord.values?.length}`);
    console.log(`   Metadata completa:`, firstRecord.metadata);
  }
}

checkOriginalData();
