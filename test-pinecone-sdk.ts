import dotenv from 'dotenv';
import path from 'path';

// Forçar carregamento do .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { Pinecone } from '@pinecone-database/pinecone';

async function test() {
  console.log('\n🔍 Testando Pinecone SDK v7.1.0\n');
  
  const apiKey = process.env.PINECONE_API_KEY;
  console.log('1. API Key do ambiente:');
  console.log('   Length:', apiKey?.length);
  console.log('   Start:', apiKey?.substring(0, 15));
  console.log('   End:', apiKey?.substring(apiKey!.length - 10));
  
  console.log('\n2. Inicializando SDK...');
  const pc = new Pinecone({ apiKey: apiKey! });
  console.log('   ✅ Instância criada');
  
  console.log('\n3. Listando índices...');
  try {
    const indexes = await pc.listIndexes();
    console.log('   ✅ Sucesso!');
    console.log('\n4. Índices encontrados:');
    console.log(JSON.stringify(indexes, null, 2));
  } catch (error: any) {
    console.log('   ❌ Falhou:', error.message);
    console.log('\n   Tentando com API key direta...');
    
    const directKey = "pcsk_2Vwh5P_6p4HtCLe6rvhtGW8AFpA9urkATi8bjopqU4365BdaYJiiW6wUdiMdwNKZRFdRAq";
    const pc2 = new Pinecone({ apiKey: directKey });
    
    try {
      const indexes = await pc2.listIndexes();
      console.log('   ✅ Sucesso com key direta!');
      console.log('\n4. Índices encontrados:');
      console.log(JSON.stringify(indexes, null, 2));
    } catch (error2: any) {
      console.log('   ❌ Também falhou:', error2.message);
    }
  }
}

test().catch(console.error);
