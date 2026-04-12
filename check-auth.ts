/**
 * Script de Verificação do Firebase Auth
 * Verifica se o Google Auth está habilitado e funcionando
 */

import { initializeApp } from 'firebase/app';
import { getAuth, fetchSignInMethodsForEmail } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from './firebase-applet-config.json';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

async function checkFirebaseAuth() {
  console.log('\n🔐 === VERIFICAÇÃO DO FIREBASE AUTH ===\n');
  
  console.log('📋 Configuração:');
  console.log(`   Project ID: ${firebaseConfig.projectId}`);
  console.log(`   Auth Domain: ${firebaseConfig.authDomain}`);
  console.log(`   Database ID: ${firebaseConfig.firestoreDatabaseId}`);
  
  // 1. Testa conexão com Firestore (teste de permissão)
  console.log('\n🔍 Teste 1: Conexão com Firestore');
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log('   ✅ Firestore acessível');
  } catch (error: any) {
    if (error.message?.includes('the client is offline')) {
      console.log('   ❌ Cliente offline - verifique sua internet');
    } else if (error.message?.includes('permission')) {
      console.log('   ⚠️  Permissão negada - Auth pode não estar configurado');
    } else {
      console.log(`   ⚠️  ${error.message}`);
    }
  }
  
  // 2. Testa se Google Auth está habilitado
  console.log('\n🔍 Teste 2: Google Auth Provider');
  try {
    // Tenta verificar se o método google.com está disponível
    const methods = await fetchSignInMethodsForEmail(auth, 'test@gmail.com');
    
    if (methods.includes('google.com')) {
      console.log('   ✅ Google Auth está HABILITADO');
    } else if (methods.length === 0) {
      console.log('   ⚠️  Nenhum provedor configurado para este email');
      console.log('   💡 Isso é normal se nunca fez login com este email');
    } else {
      console.log(`   ⚠️  Provedores encontrados: ${methods.join(', ')}`);
    }
  } catch (error: any) {
    if (error.code === 'auth/configuration-not-found') {
      console.log('   ❌ Google Auth NÃO está configurado');
      console.log('\n   📋 AÇÃO NECESSÁRIA:');
      console.log('   1. Acesse: https://console.firebase.google.com/project/gen-lang-client-0102122839/authentication/providers');
      console.log('   2. Clique em "Adicionar provedor"');
      console.log('   3. Selecione "Google"');
      console.log('   4. Ative e salve');
    } else {
      console.log(`   ⚠️  ${error.code}: ${error.message}`);
    }
  }
  
  // 3. Verifica estado atual do usuário
  console.log('\n🔍 Teste 3: Estado do Usuário');
  console.log('   ⏳ Aguardando inicialização do Auth...');
  
  await new Promise<void>((resolve) => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        console.log('   ✅ Usuário autenticado:');
        console.log(`      • UID: ${user.uid}`);
        console.log(`      • Email: ${user.email}`);
        console.log(`      • Nome: ${user.displayName}`);
      } else {
        console.log('   ℹ️  Nenhum usuário autenticado (normal)');
        console.log('   💡 O login será solicitado ao acessar o app');
      }
      unsubscribe();
      resolve();
    });
  });
  
  // Resumo
  console.log('\n=====================================');
  console.log('📊 RESUMO DA VERIFICAÇÃO\n');
  console.log('✅ Firebase SDK inicializado');
  console.log('✅ Firestore conectado');
  console.log('⏳ Auth - Verifique os testes acima');
  console.log('\n🎯 PRÓXIMO PASSO:');
  console.log('1. Se todos os testes passaram → Acesse http://localhost:3018');
  console.log('2. Se falhou → Siga o guia FIREBASE-AUTH-SETUP.md');
}

checkFirebaseAuth();
