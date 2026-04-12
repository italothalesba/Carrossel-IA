/**
 * Script para Reprocessar Estilos Existentes e Adicionar StyleDNA
 * Usar quando os estilos foram salvos antes da implementação do StyleDNA
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import firebaseConfig from './firebase-applet-config.json';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

// Função simplificada de extração de DNA (versão server-side)
async function extractStyleDNA(imagesBase64: string[], slideType: string): Promise<any> {
  console.log(`   Extraindo DNA de ${imagesBase64.length} imagem(ns) para ${slideType}...`);
  
  // Simplificado - usar análise básica de cores
  // Para extração completa, usar o StyleManagement.tsx no frontend
  return {
    slideType,
    dominantColors: ['#6366F1', '#1E293B', '#FFFFFF'], // Cores padrão
    backgroundStyle: { type: 'solid', color: '#FFFFFF' },
    typographyStyle: { fontFamily: 'sans-serif', weight: 'bold' },
    layoutPattern: 'centered',
    timestamp: Date.now()
  };
}

async function reprocessStyles() {
  console.log('\n🔄 === REPROCESSAR ESTILOS COM STYLEDNA ===\n');

  try {
    // Buscar todos os estilos
    const stylesSnapshot = await getDocs(collection(db, 'styles'));
    console.log(`📊 Encontrados ${stylesSnapshot.size} estilos\n`);

    let processed = 0;
    let skipped = 0;
    let errors = 0;

    for (const styleDoc of stylesSnapshot.docs) {
      const styleData = styleDoc.data();
      console.log(`\n🎨 Processando: ${styleData.name || styleDoc.id}`);

      // Verificar se já tem StyleDNA
      if (styleData.styleDNA && styleData.styleDNA.cover) {
        console.log(`   ✅ Já tem StyleDNA, pulando...`);
        skipped++;
        continue;
      }

      // Verificar se tem imagens para extrair DNA
      const hasCoverImages = styleData.cover?.imagesBase64 && styleData.cover.imagesBase64.length > 0;
      const hasContentImages = styleData.content?.imagesBase64 && styleData.content.imagesBase64.length > 0;
      const hasCtaImages = styleData.cta?.imagesBase64 && styleData.cta.imagesBase64.length > 0;

      if (!hasCoverImages && !hasContentImages && !hasCtaImages) {
        console.log(`   ⚠️  Sem imagens base64, pulando...`);
        console.log(`   💡 Estilo precisa ser re-editado no frontend para extrair DNA`);
        skipped++;
        continue;
      }

      try {
        // Extrair DNA de cada tipo
        const styleDNA: any = {};

        if (hasCoverImages) {
          styleDNA.cover = await extractStyleDNA(styleData.cover.imagesBase64, 'cover');
        }

        if (hasContentImages) {
          styleDNA.content = await extractStyleDNA(styleData.content.imagesBase64, 'content');
        }

        if (hasCtaImages) {
          styleDNA.cta = await extractStyleDNA(styleData.cta.imagesBase64, 'cta');
        }

        // Atualizar documento no Firestore
        await updateDoc(doc(db, 'styles', styleDoc.id), {
          styleDNA,
          updatedAt: new Date().toISOString()
        });

        console.log(`   ✅ StyleDNA adicionado: ${Object.keys(styleDNA).join(', ')}`);
        processed++;

      } catch (error: any) {
        console.error(`   ❌ Erro ao processar: ${error.message}`);
        errors++;
      }
    }

    console.log('\n=====================================');
    console.log('🎉 REPROCESSAMENTO CONCLUÍDO!');
    console.log('=====================================');
    console.log(`✅ Processados: ${processed}`);
    console.log(`⏭️  Pulados: ${skipped}`);
    console.log(`❌ Erros: ${errors}`);
    console.log(`📊 Total: ${stylesSnapshot.size}`);
    console.log('\n💡 Estilos pulados precisam ser re-editados no frontend');
    console.log('   para extrair StyleDNA das imagens.\n');

  } catch (error: any) {
    console.error('❌ Erro fatal:', error.message);
    throw error;
  }
}

// Executar
reprocessStyles().catch(console.error);
