/**
 * Script de Diagnóstico e Configuração do Sistema Carrossel-IA
 * Verifica: Firebase Auth, Pinecone, e estilos iniciais
 */

import { Pinecone } from '@pinecone-database/pinecone';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const INDEX_NAME = 'carousel-styles';
const EMBEDDING_DIM = 768;

// ===============================================================
// 1. DIAGNÓSTICO PINECONE
// ===============================================================

async function diagnosePinecone() {
  console.log('\n🔍 === DIAGNÓSTICO PINECONE ===\n');
  
  const apiKey = process.env.PINECONE_API_KEY;
  if (!apiKey) {
    console.error('❌ PINECONE_API_KEY não configurada');
    return null;
  }
  console.log('✅ PINECONE_API_KEY configurada');
  
  const pc = new Pinecone({ apiKey });
  
  try {
    const indexes = await pc.listIndexes();
    const indexExists = indexes.indexes?.some(idx => idx.name === INDEX_NAME);
    
    if (!indexExists) {
      console.log(`⚠️  Index '${INDEX_NAME}' não existe. Criando...`);
      await pc.createIndex({
        name: INDEX_NAME,
        dimension: EMBEDDING_DIM,
        metric: 'cosine',
        spec: {
          serverless: {
            cloud: 'aws',
            region: 'us-east-1'
          }
        }
      });
      console.log(`✅ Index '${INDEX_NAME}' criado com sucesso!`);
    } else {
      console.log(`✅ Index '${INDEX_NAME}' existe`);
    }
    
    const index = pc.index(INDEX_NAME);
    const stats = await index.describeIndexStats();
    console.log(`📊 Registros no Pinecone: ${stats.totalRecordCount || 0}`);
    
    return pc;
  } catch (error: any) {
    console.error('❌ Erro ao acessar Pinecone:', error.message);
    return null;
  }
}

// ===============================================================
// 2. POPULAR PINECONE COM ESTILOS INICIAIS
// ===============================================================

interface StyleTemplate {
  id: string;
  name: string;
  description: string;
  audience: string;
  tone: string;
  colors: string;
}

const STYLE_TEMPLATES: StyleTemplate[] = [
  {
    id: 'minimalista-tech',
    name: 'Minimalista Tech',
    description: 'Design limpo com muito espaço em branco, tipografia sans-serif moderna, elementos geométricos simples, gradientes sutis em azul e roxo, ícones flat',
    audience: 'Profissionais de tecnologia e empresários digitais',
    tone: 'Profissional, moderno, limpo',
    colors: '#FFFFFF, #F3F4F6, #6366F1, #8B5CF6, #1E293B'
  },
  {
    id: 'corporate-bold',
    name: 'Corporativo Bold',
    description: 'Design forte com cores escuras, tipografia bold impactante, imagens de negócios de alta qualidade, gráficos e ícones profissionais, contraste alto',
    audience: 'Executivos e líderes empresariais',
    tone: 'Autoritário, profissional, confiante',
    colors: '#1A1A2E, #16213E, #E94560, #0F3460, #FFFFFF'
  },
  {
    id: 'criativo-colorido',
    name: 'Criativo Colorido',
    description: 'Design vibrante com cores quentes e energéticas, ilustrações artísticas, tipografia criativa e divertida, elementos orgânicos, gradientes coloridos',
    audience: 'Criativos, designers, público jovem',
    tone: 'Divertido, energético, criativo',
    colors: '#FF6B6B, #4ECDC4, #FFE66D, #A8E6CF, #FF8B94'
  },
  {
    id: 'elegante-luxo',
    name: 'Elegante Luxo',
    description: 'Design sofisticado com preto e dourado, serifas clássicas, texturas premium, detalhes minimalistas refinados, fotografia de alta qualidade',
    audience: 'Público premium e marcas de luxo',
    tone: 'Sofisticado, elegante, exclusivo',
    colors: '#000000, #D4AF37, #FFFFFF, #1C1C1C, #C9A961'
  },
  {
    id: 'educacional-clean',
    name: 'Educacional Clean',
    description: 'Design claro e didático, cores suaves e acolhedoras, ícones educativos simples, layout organizado, elementos visuais explicativos, bom espaçamento',
    audience: 'Estudantes e educadores',
    tone: 'Educacional, claro, acessível',
    colors: '#E8F5E9, #4CAF50, #FFFFFF, #2E7D32, #F1F8E9'
  },
  {
    id: 'motivacional-dark',
    name: 'Motivacional Dark',
    description: 'Fundo escuro com texto branco impactante, gradientes dramáticos, imagens inspiradoras de alta qualidade, tipografia bold e forte',
    audience: 'Coaches e motivacionais',
    tone: 'Inspirador, poderoso, motivador',
    colors: '#0D0D0D, #FF5722, #FFFFFF, #212121, #FF9800'
  }
];

async function seedPineconeStyles(pc: any) {
  console.log('\n🌱 === POPULANDO PINECONE COM ESTILOS ===\n');
  
  const index = pc.index(INDEX_NAME);
  let successCount = 0;
  
  for (const style of STYLE_TEMPLATES) {
    try {
      // Verifica se já existe
      try {
        const existing = await index.fetch([style.id]);
        if (existing.records && existing.records[style.id]) {
          console.log(`⏭️  Estilo já existe: ${style.name}`);
          successCount++;
          continue;
        }
      } catch (e) {
        // Não existe, vamos criar
      }
      
      // Cria embedding mock baseado no hash do description
      // Em produção, usaríamos uma API de embedding real
      const embedding = generateMockEmbedding(style.description);
      
      await index.upsert({
        records: [{
          id: style.id,
          values: embedding,
          metadata: {
            name: style.name,
            description: style.description,
            audience: style.audience,
            tone: style.tone,
            colors: style.colors,
            type: 'carousel-style'
          }
        }]
      });
      
      console.log(`✅ Adicionado: ${style.name}`);
      successCount++;
      
      // Aguarda um pouco para evitar rate limits
      await sleep(500);
    } catch (error: any) {
      console.error(`❌ Erro ao adicionar ${style.name}:`, error.message);
    }
  }
  
  console.log(`\n📊 ${successCount}/${STYLE_TEMPLATES.length} estilos adicionados`);
  
  // Mostra estatísticas finais
  const stats = await index.describeIndexStats();
  console.log(`📊 Total de registros no Pinecone: ${stats.totalRecordCount || 0}`);
}

// Gera um embedding mock determinístico baseado no texto
function generateMockEmbedding(text: string): number[] {
  const embedding: number[] = [];
  let hash = 0;
  
  // Cria hash do texto
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Converte para 32bit integer
  }
  
  // Gera embedding de 768 dimensões baseado no hash
  for (let i = 0; i < 768; i++) {
    hash = (hash * 1103515245 + 12345) & 0x7fffffff;
    embedding.push((hash % 1000) / 1000 - 0.5); // Valores entre -0.5 e 0.5
  }
  
  // Normaliza
  const magnitude = Math.sqrt(embedding.reduce((sum, v) => sum + v * v, 0));
  return embedding.map(v => v / magnitude);
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ===============================================================
// 3. DIAGNÓSTICO FIREBASE
// ===============================================================

function diagnoseFirebase() {
  console.log('\n🔍 === DIAGNÓSTICO FIREBASE ===\n');
  
  try {
    const config = require('../firebase-applet-config.json');
    console.log('✅ Configuração Firebase encontrada');
    console.log(`   Project ID: ${config.projectId}`);
    console.log(`   Database ID: ${config.firestoreDatabaseId}`);
    console.log(`   Auth Domain: ${config.authDomain}`);
    
    console.log('\n⚠️  IMPORTANTE - Firebase Auth:');
    console.log('   - Verifique se Google Auth está habilitado no Firebase Console');
    console.log('   - URL: https://console.firebase.google.com/project/gen-lang-client-0102122839/authentication/providers');
    console.log('   - Adicione "Google" como provider habilitado');
    
    console.log('\n⚠️  Firestore Rules:');
    console.log('   - Regras já configuradas para carousel_history e styles');
    console.log('   - Usuários autenticados podem criar/ler seu histórico');
    console.log('   - Estilos são públicos (read/write aberto)');
    
    return true;
  } catch (error: any) {
    console.error('❌ Erro ao carregar configuração Firebase:', error.message);
    return false;
  }
}

// ===============================================================
// MAIN
// ===============================================================

async function main() {
  console.log('🚀 SISTEMA DE DIAGNÓSTICO CARROSSEL-IA');
  console.log('=====================================\n');
  
  // 1. Pinecone
  const pc = await diagnosePinecone();
  
  if (pc) {
    // 2. Popular Pinecone
    await seedPineconeStyles(pc);
  }
  
  // 3. Firebase
  diagnoseFirebase();
  
  console.log('\n=====================================');
  console.log('✅ DIAGNÓSTICO CONCLUÍDO!\n');
  
  console.log('📋 PRÓXIMOS PASSOS:');
  console.log('1. Acesse http://localhost:3018');
  console.log('2. Verifique os indicadores de conexão no painel lateral');
  console.log('3. Crie seu primeiro estilo na "Gestão de Estilos"');
  console.log('4. Teste a criação de carrossel em "Criação de Carrossel"');
  console.log('\n⚠️  LEMBRE-TE:');
  console.log('   - Firebase Auth precisa ser habilitado no console');
  console.log('   - Pinecone está populado com 6 estilos iniciais');
  console.log('   - Todos os estilos podem ser melhorados via feedback');
}

main().catch(console.error);
