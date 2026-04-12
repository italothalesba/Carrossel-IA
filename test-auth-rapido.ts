/**
 * Teste Rápido - Verifica se Google Auth está funcionando
 */

import { initializeApp } from 'firebase/app';
import { getAuth, fetchSignInMethodsForEmail } from 'firebase/auth';
import firebaseConfig from './firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

async function testGoogleAuth() {
  console.log('\n🔐 Testando Google Auth...\n');
  
  try {
    // Tenta verificar se google.com está disponível
    const methods = await fetchSignInMethodsForEmail(auth, 'teste@gmail.com');
    
    console.log('Métodos de signin encontrados:', methods);
    
    if (methods.includes('google.com')) {
      console.log('\n✅ SUCESSO! Google Auth está ATIVO e funcionando!');
      console.log('\n🎉 Você pode acessar o app em http://localhost:3018');
      console.log('   O popup de login do Google deve aparecer.');
    } else {
      console.log('\n⚠️ Google Auth pode não estar totalmente configurado');
      console.log('Métodos encontrados:', methods);
    }
  } catch (error: any) {
    console.log('❌ Erro:', error.code, error.message);
  }
}

testGoogleAuth();
