/**
 * Verificação detalhada do Pinecone - Investiga embeddings e registros existentes
 */

import { Pinecone } from '@pinecone-database/pinecone';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const INDEX_NAME = 'carousel-styles';

async function deepPineconeCheck() {
  console.log('\n🔍 === VERIFICAÇÃO PROFUNDA DO PINECONE ===\n');
  
  const apiKey = process.env.PINECONE_API_KEY;
  if (!apiKey) {
    console.error('❌ PINECONE_API_KEY não encontrada');
    return;
  }
  
  const pc = new Pinecone({ apiKey });
  
  try {
    // 1. Lista indexes
    const indexes = await pc.listIndexes();
    console.log('📂 Indexes disponíveis:');
    indexes.indexes?.forEach(idx => {
      console.log(`   • ${idx.name} (${idx.dimension}d, ${idx.metric})`);
    });
    
    // 2. Stats do index
    const index = pc.index(INDEX_NAME);
    const stats = await index.describeIndexStats();
    
    console.log(`\n📊 Estatísticas do index '${INDEX_NAME}':`);
    console.log(`   Total de registros: ${stats.totalRecordCount || 0}`);
    console.log(`   Namespaces: ${JSON.stringify(stats.namespaces || {})}`);
    
    // 3. Tenta buscar registros específicos
    console.log('\n🔎 Buscando registros existentes:');
    const styleIds = [
      'minimalista-tech',
      'corporate-bold', 
      'criativo-colorido',
      'elegante-luxo',
      'educacional-clean',
      'motivacional-dark'
    ];
    
    for (const id of styleIds) {
      try {
        const record = await index.fetch([id]);
        const rec = record.records[id];
        
        if (rec) {
          const vectorLength = rec.values ? rec.values.length : 0;
          const hasMetadata = rec.metadata ? Object.keys(rec.metadata).length : 0;
          
          console.log(`\n   ✅ ${id}:`);
          console.log(`      • Vetor: ${vectorLength} dimensões`);
          console.log(`      • Metadata: ${hasMetadata} campos`);
          console.log(`      • Nome: ${rec.metadata?.name || 'N/A'}`);
          
          if (vectorLength === 0) {
            console.log(`      ⚠️  ALERTA: Vetor vazio!`);
          }
        } else {
          console.log(`   ❌ ${id}: Não encontrado`);
        }
      } catch (e: any) {
        console.log(`   ❌ ${id}: Erro - ${e.message}`);
      }
    }
    
    // 4. Query de teste
    console.log('\n\n🎯 Teste de Query (busca semântica):');
    const testEmbedding = Array(768).fill(0).map(() => Math.random() - 0.5);
    
    try {
      const queryResult = await index.query({
        vector: testEmbedding,
        topK: 3,
        includeMetadata: true,
        includeValues: true
      });
      
      if (queryResult.matches && queryResult.matches.length > 0) {
        console.log(`   ${queryResult.matches.length} resultado(s):`);
        queryResult.matches.forEach((match, i) => {
          console.log(`   ${i + 1}. ${match.id} (score: ${match.score?.toFixed(4)})`);
        });
      } else {
        console.log('   ⚠️  Nenhum resultado encontrado');
      }
    } catch (e: any) {
      console.log(`   ❌ Erro na query: ${e.message}`);
    }
    
    // 5. Verifica se há OUTROS registros além dos nossos
    console.log('\n\n📋 Verificando TODOS os registros:');
    try {
      const allRecords = await index.query({
        vector: Array(768).fill(0),
        topK: 100,
        includeMetadata: true,
        includeValues: false
      });
      
      if (allRecords.matches && allRecords.matches.length > 0) {
        console.log(`\n   Total encontrado: ${allRecords.matches.length}`);
        allRecords.matches.forEach((m, i) => {
          console.log(`   ${i + 1}. ${m.id} - ${m.metadata?.name || 'Sem nome'}`);
        });
      } else {
        console.log('   ⚠️  Index vazio');
      }
    } catch (e: any) {
      console.log(`   ❌ Erro: ${e.message}`);
    }
    
  } catch (error: any) {
    console.error('\n❌ Erro geral:', error.message);
  }
}

deepPineconeCheck();
