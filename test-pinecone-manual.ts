import fs from 'fs';
import { Pinecone } from '@pinecone-database/pinecone';

// Ler arquivo manualmente
const envContent = fs.readFileSync('.env.local', 'utf-8');
const lines = envContent.split('\n');
const pineconeLine = lines.find(l => l.startsWith('PINECONE_API_KEY=') && !l.startsWith('#'));

if (!pineconeLine) {
  console.log('❌ Pinecone API key not found in .env.local');
  process.exit(1);
}

const apiKey = pineconeLine.split('=')[1]?.trim();
console.log('API Key extraída manualmente:');
console.log('  Length:', apiKey.length);
console.log('  Value:', apiKey.substring(0, 20) + '...' + apiKey.substring(apiKey.length - 10));

// Testar com esta key
console.log('\nTestando com key extraída...');
const pc = new Pinecone({ apiKey });

try {
  const indexes = await pc.listIndexes();
  console.log('✅ SUCESSO!');
  console.log('Índices:', indexes.indexes?.map(i => i.name).join(', '));
} catch (error: any) {
  console.log('❌ Falhou:', error.message);
}
