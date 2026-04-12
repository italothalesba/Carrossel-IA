import { useState, useEffect } from 'react';
import { googleProvider, signInWithPopup, onAuthStateChanged, User, signOut } from '../firebase';
import { auth } from '../firebase';
import { LogIn, LogOut, User as UserIcon, Loader2, FileDown } from 'lucide-react';
import { cn } from '../lib/utils';
import { generateMasterPromptPDF } from '../lib/pdfGenerator';

export default function AuthButton() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [signingIn, setSigningIn] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleSignIn = async () => {
    try {
      setSigningIn(true);
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error('Error signing in:', error);
      alert('Erro ao fazer login. Verifique se o Google Auth está habilitado no Firebase Console.');
    } finally {
      setSigningIn(false);
    }
  };

  const handleSignOut = async () => {
    try {
      setSigningOut(true);
      await signOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
    } finally {
      setSigningOut(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4 border-t border-gray-800">
        <div className="flex items-center space-x-3 px-4 py-3">
          <Loader2 size={20} className="animate-spin text-gray-400" />
          <span className="text-sm text-gray-400">Carregando...</span>
        </div>
      </div>
    );
  }

  if (user) {
    return (
      <div className="p-4 border-t border-gray-800 space-y-3">
        {/* User Info */}
        <div className="flex items-center space-x-3 px-2">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
            {user.photoURL ? (
              <img src={user.photoURL} alt={user.displayName || 'User'} className="w-full h-full rounded-full object-cover" />
            ) : (
              <UserIcon size={20} />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">
              {user.displayName || 'Usuário'}
            </p>
            <p className="text-xs text-gray-400 truncate">
              {user.email}
            </p>
          </div>
        </div>

        {/* Sign Out Button */}
        <button
          onClick={handleSignOut}
          disabled={signingOut}
          className={cn(
            "w-full flex items-center justify-center space-x-2 px-4 py-2 rounded-lg transition-colors",
            "bg-red-600/20 text-red-400 hover:bg-red-600/30 hover:text-red-300",
            "disabled:opacity-50 disabled:cursor-not-allowed"
          )}
        >
          {signingOut ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <LogOut size={18} />
          )}
          <span className="font-medium text-sm">Sair</span>
        </button>

        {/* Export PDF Button */}
        <button
          onClick={() => generateMasterPromptPDF()}
          className="w-full flex items-center justify-center space-x-2 px-4 py-2 rounded-lg transition-colors bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 hover:text-blue-300"
        >
          <FileDown size={18} />
          <span className="font-medium text-sm">Exportar Prompt</span>
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 border-t border-gray-800">
      <button
        onClick={handleSignIn}
        disabled={signingIn}
        className={cn(
          "w-full flex items-center justify-center space-x-2 px-4 py-3 rounded-lg transition-colors",
          "bg-gradient-to-r from-purple-600 to-pink-600 text-white",
          "hover:from-purple-700 hover:to-pink-700",
          "disabled:opacity-50 disabled:cursor-not-allowed"
        )}
      >
        {signingIn ? (
          <Loader2 size={20} className="animate-spin" />
        ) : (
          <LogIn size={20} />
        )}
        <span className="font-medium">Entrar com Google</span>
      </button>
    </div>
  );
}
