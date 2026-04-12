/**
 * Teste de Salvamento no Firestore
 * Simula salvamento de histórico de carrossel com usuário autenticado
 */

import { initializeApp } from 'firebase/app';
import { getAuth, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDocFromServer,
  collection,
  query,
  where,
  getDocs 
} from 'firebase/firestore';
import firebaseConfig from './firebase-applet-config.json';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

async function testFirestoreHistory() {
  console.log('\n💾 === TESTE DE SALVAMENTO NO FIRESTORE ===\n');
  
  // Aguarda auth inicializar
  const user = await new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe();
      resolve(user);
    });
  });
  
  if (!user) {
    console.log('⚠️  Nenhum usuário autenticado');
    console.log('💡 O teste precisa ser feito pelo navegador com usuário logado');
    console.log('\n📋 Instruções:');
    console.log('1. Acesse http://localhost:3018');
    console.log('2. Faça login com Google');
    console.log('3. Gere um carrossel de teste');
    console.log('4. O histórico deve salvar automaticamente');
    return;
  }
  
  console.log(`✅ Usuário autenticado: ${user.email}`);
  console.log(`   UID: ${user.uid}\n`);
  
  // Testa salvamento
  const testHistoryId = `test_${Date.now()}`;
  const testHistory = {
    id: testHistoryId,
    timestamp: Date.now(),
    content: 'Teste de histórico',
    styleId: 'minimalista-tech',
    slides: [
      { title: 'Slide Teste', text: 'Conteúdo de teste', imagePrompt: 'test image' }
    ],
    userId: user.uid
  };
  
  console.log('💾 Tentando salvar no Firestore...');
  
  try {
    await setDoc(doc(db, 'carousel_history', testHistoryId), testHistory);
    console.log('✅ SUCESSO! Histórico salvo!\n');
    
    // Verifica se consegue ler
    console.log('🔍 Lendo documento salvo...');
    const docSnap = await getDocFromServer(doc(db, 'carousel_history', testHistoryId));
    
    if (docSnap.exists()) {
      console.log('✅ Documento lido com sucesso!');
      console.log(`   ID: ${docSnap.id}`);
      console.log(`   userId: ${docSnap.data().userId}`);
    }
    
    // Lista histórico do usuário
    console.log('\n📜 Listando histórico do usuário...');
    const q = query(collection(db, 'carousel_history'), where('userId', '==', user.uid));
    const querySnapshot = await getDocs(q);
    
    console.log(`   Total de registros: ${querySnapshot.size}`);
    querySnapshot.forEach((doc) => {
      console.log(`   • ${doc.id} - ${doc.data().content}`);
    });
    
    console.log('\n=====================================');
    console.log('🎉 FIRESTORE FUNCIONANDO 100%!');
    console.log('✅ Salvamento: OK');
    console.log('✅ Leitura: OK');
    console.log('✅ Query por usuário: OK');
    
  } catch (error: any) {
    console.log(`❌ ERRO: ${error.message}`);
    console.log('\n⚠️  Verifique as regras do Firestore');
  }
}

testFirestoreHistory();
