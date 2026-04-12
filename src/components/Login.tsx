import React from 'react';
import { auth, googleProvider, signInWithPopup } from '../firebase';
import { LogIn } from 'lucide-react';

export default function Login() {
  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Login failed", error);
    }
  };

  return (
    <div className="flex h-screen items-center justify-center bg-gray-900 p-4">
      <div className="bg-white p-8 rounded-2xl shadow-2xl border border-gray-200 max-w-md w-full text-center">
        <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <LogIn className="text-purple-600" size={40} />
        </div>
        <h2 className="text-3xl font-bold mb-2 text-gray-900">Bem-vindo ao CarouselAI</h2>
        <p className="text-gray-600 mb-8">
          Sincronize seus estilos e histórico de carrosséis na nuvem para acessar de qualquer lugar.
        </p>
        <button
          onClick={handleLogin}
          className="flex items-center justify-center space-x-3 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 px-6 py-4 rounded-xl font-semibold transition-all w-full shadow-sm hover:shadow-md"
        >
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-6 h-6" />
          <span>Entrar com Google</span>
        </button>
        <p className="text-xs text-gray-400 mt-6">
          Ao entrar, você concorda com nossos termos de uso e política de privacidade.
        </p>
      </div>
    </div>
  );
}
