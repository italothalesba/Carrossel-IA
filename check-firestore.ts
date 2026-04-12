/**
 * Verifica estilos existentes no Firestore
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import firebaseConfig from './firebase-applet-config.json';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

async function checkFirestoreStyles() {
  console.log('\n🔍 === VERIFICANDO FIRESTORE STYLES ===\n');
  
  try {
    const querySnapshot = await getDocs(collection(db, 'styles'));
    
    if (querySnapshot.empty) {
      console.log('⚠️  Nenhum estilo encontrado no Firestore');
      console.log('💡 Você pode criar estilos pela interface "Gestão de Estilos"');
    } else {
      console.log(`✅ ${querySnapshot.size} estilo(s) encontrado(s) no Firestore:\n`);
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        console.log(`📌 ${data.name || 'Sem nome'}`);
        console.log(`   ID: ${doc.id}`);
        console.log(`   Criado por: ${data.createdBy || 'N/A'}`);
        console.log('');
      });
    }
    
    // Verifica histórico
    console.log('\n📜 === VERIFICANDO CAROUSEL HISTORY ===\n');
    const historySnapshot = await getDocs(collection(db, 'carousel_history'));
    
    if (historySnapshot.empty) {
      console.log('📭 Nenhum histórico encontrado (normal para novo sistema)');
    } else {
      console.log(`📜 ${historySnapshot.size} carrossel(éis) no histórico`);
    }
    
  } catch (error: any) {
    console.error('❌ Erro ao acessar Firestore:', error.message);
    console.log('\n⚠️  Possíveis causas:');
    console.log('   1. Regras de segurança bloqueando acesso');
    console.log('   2. Firebase Auth não configurado');
    console.log('   3. Database ID incorreto');
  }
}

checkFirestoreStyles();
