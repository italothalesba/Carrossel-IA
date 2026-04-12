/**
 * Diagnóstico completo da conexão com Pinecone
 */

import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

import { Pinecone } from '@pinecone-database/pinecone';

async function checkPinecone() {
  console.log('\n' + '='.repeat(80));
  console.log('🔍 DIAGNÓSTICO DE CONEXÃO PINECONE');
  console.log('='.repeat(80));
  console.log(`🕐 ${new Date().toLocaleString('pt-BR')}\n`);

  // 1. Verificar se API key está configurada
  const apiKey = process.env.PINECONE_API_KEY?.trim();
  
  console.log('1️⃣  CONFIGURAÇÃO DA API KEY');
  console.log('─'.repeat(80));
  
  if (!apiKey) {
    console.log('❌ PINECONE_API_KEY não está configurada');
    console.log('\n📋 Para obter sua API key:');
    console.log('   1. Acesse: https://app.pinecone.io');
    console.log('   2. Faça login ou crie uma conta grátis');
    console.log('   3. Vá em "API Keys" no menu lateral');
    console.log('   4. Copie sua API key');
    console.log('   5. Adicione ao arquivo .env.local:');
    console.log('      PINECONE_API_KEY=sua-chave-aqui\n');
    console.log('💡 Plano gratuito:');
    console.log('   • 1 projeto');
    console.log('   • 1 índice serverless');
    console.log('   • Até 2GB de armazenamento');
    console.log('   • Sem custo financeiro\n');
    return;
  }

  const maskedKey = apiKey.length > 20 
    ? apiKey.substring(0, 10) + '...' + apiKey.substring(apiKey.length - 5)
    : '***' + apiKey.substring(apiKey.length - 5);
  
  console.log(`✅ API Key configurada: ${maskedKey}`);
  console.log(`   Tamanho: ${apiKey.length} caracteres`);
  
  // Verificar formato
  if (apiKey.startsWith('pcsk_')) {
    console.log('   Formato: ✅ v2 (pcsk_)');
  } else if (apiKey.startsWith('pc-')) {
    console.log('   Formato: ⚠️ v1 (pc-) - pode estar desatualizado');
  } else {
    console.log('   Formato: ❓ desconhecido');
  }

  // 2. Testar conexão
  console.log('\n2️⃣  TESTE DE CONEXÃO');
  console.log('─'.repeat(80));

  try {
    const pinecone = new Pinecone({ apiKey });
    
    console.log('⏳ Conectando ao Pinecone...');
    const startTime = Date.now();
    
    // Listar índices
    const indexList = await pinecone.listIndexes();
    const latency = Date.now() - startTime;
    
    console.log(`✅ Conexão estabelecida em ${latency}ms`);
    console.log(`   Endpoint: ${pinecone['config'].basePath || 'api.pinecone.io'}`);
    
    // 3. Verificar índices
    console.log('\n3️⃣  ÍNDICES DISPONÍVEIS');
    console.log('─'.repeat(80));
    
    const indexes = indexList.indexes || [];
    
    if (indexes.length === 0) {
      console.log('⚠️  Nenhum índice encontrado');
      console.log('\n📋 Para criar um índice:');
      console.log('   1. Acesse: https://app.pinecone.io');
      console.log('   2. Clique em "Create Index"');
      console.log('   3. Configure:');
      console.log('      - Nome: carousel-styles');
      console.log('      - Dimensões: 1024 (para embeddings de texto)');
      console.log('      - Métrica: cosine');
      console.log('      - Tipo: Serverless');
      console.log('      - Cloud: AWS ou GCP');
      console.log('      - Region: us-east-1 ou similar');
      console.log('   4. Aguarde 1-2 minutos para ficar pronto\n');
    } else {
      console.log(`✅ ${indexes.length} índice(s) encontrado(s):\n`);
      
      for (const index of indexes) {
        console.log(`📊 ${index.name}`);
        console.log(`   Status: ${index.status?.ready ? '✅ Pronto' : '⏳ Criando'}`);
        console.log(`   Dimensões: ${index.dimension || 'N/A'}`);
        console.log(`   Métrica: ${index.metric || 'N/A'}`);
        console.log(`   Tipo: ${index.spec?.serverless ? 'Serverless' : 'Pod'}`);
        
        if (index.spec?.serverless) {
          console.log(`   Cloud: ${index.spec.serverless.cloud}`);
          console.log(`   Region: ${index.spec.serverless.region}`);
        }
        console.log('');
      }
    }
    
    // 4. Verificar estatísticas de índices
    if (indexes.length > 0) {
      console.log('4️⃣  ESTATÍSTICAS DOS ÍNDICES');
      console.log('─'.repeat(80));
      
      for (const index of indexes) {
        try {
          const indexObj = pinecone.index(index.name);
          const stats = await indexObj.describeIndexStats();
          
          console.log(`📊 ${index.name}`);
          console.log(`   Total de vetores: ${stats.totalRecordCount || 0}`);
          console.log(`   Namespaces: ${Object.keys(stats.namespaces || {}).length || 0}`);
          console.log(`   Dimensões: ${stats.dimension || 'N/A'}`);
          console.log('');
        } catch (err: any) {
          console.log(`⚠️  ${index.name}: Não foi possível obter estatísticas`);
          console.log(`   Erro: ${err.message}\n`);
        }
      }
    }
    
    // 5. Testar operação de escrita/leitura
    if (indexes.length > 0) {
      console.log('5️⃣  TESTE DE OPERAÇÕES');
      console.log('─'.repeat(80));
      
      const indexName = indexes[0].name;
      const indexObj = pinecone.index(indexName);
      
      // Testar upsert simples
      try {
        console.log(`⏳ Testando upsert em ${indexName}...`);
        await indexObj.upsert([{
          id: 'test-connection',
          values: Array(1024).fill(0.001), // vetor de teste
          metadata: { test: true, timestamp: Date.now() }
        }]);
        console.log('✅ Upsert bem-sucedido');
        
        // Testar query
        console.log('⏳ Testando query...');
        const queryResult = await indexObj.query({
          vector: Array(1024).fill(0.001),
          topK: 1,
          includeMetadata: true
        });
        console.log(`✅ Query bem-sucedida - ${queryResult.matches.length} resultado(s)`);
        
        // Limpar vetor de teste
        console.log('⏳ Limpando vetor de teste...');
        await indexObj.deleteOne('test-connection');
        console.log('✅ Limpeza concluída');
        
      } catch (err: any) {
        console.log(`⚠️  Teste de operações falhou: ${err.message}`);
      }
    }
    
    // 6. Verificar configuração no sistema
    console.log('\n6️⃣  CONFIGURAÇÃO NO SISTEMA');
    console.log('─'.repeat(80));
    
    const serverRunning = true; // Assumir que servidor pode estar rodando
    console.log('📡 Endpoints disponíveis (quando servidor estiver rodando):');
    console.log('   GET  /api/pinecone/health     - Verificar saúde do índice');
    console.log('   GET  /api/pinecone/styles     - Listar estilos salvos');
    console.log('   POST /api/pinecone/upsert     - Salvar estilo');
    console.log('   POST /api/pinecone/query      - Buscar estilo');
    
    console.log('\n' + '='.repeat(80));
    console.log('✅ DIAGNÓSTICO CONCLUÍDO');
    console.log('='.repeat(80) + '\n');
    
  } catch (error: any) {
    console.log(`❌ Falha na conexão: ${error.message}\n`);
    
    // Diagnóstico do erro
    if (error.message?.includes('API key')) {
      console.log('🔑 Problema com API Key:');
      console.log('   - Verifique se a chave está correta');
      console.log('   - Verifique se a chave não expirou');
      console.log('   - Tente gerar uma nova chave em https://app.pinecone.io\n');
    } else if (error.message?.includes('network') || error.message?.includes('fetch')) {
      console.log('🌐 Problema de Rede:');
      console.log('   - Verifique sua conexão com internet');
      console.log('   - Verifique se não há firewall bloqueando');
      console.log('   - Tente acessar https://api.pinecone.io no navegador\n');
    } else if (error.message?.includes('quota') || error.message?.includes('limit')) {
      console.log('📊 Problema de Cota:');
      console.log('   - Plano gratuito pode ter limites atingidos');
      console.log('   - Verifique uso em https://app.pinecone.io');
      console.log('   - Considere fazer upgrade de plano\n');
    }
    
    console.log('📋 Debug Info:');
    console.log(`   Error Type: ${error.name || 'Unknown'}`);
    console.log(`   Status Code: ${error.statusCode || error.status || 'N/A'}`);
    console.log(`   Request ID: ${error.requestId || 'N/A'}`);
    console.log('');
    
    console.log('='.repeat(80));
    console.log('❌ DIAGNÓSTICO FALHOU');
    console.log('='.repeat(80) + '\n');
  }
}

checkPinecone().catch(console.error);
