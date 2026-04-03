import React, { useState, useEffect } from 'react';

export default function ApiKeyGate({ children }: { children: React.ReactNode }) {
  const [hasKey, setHasKey] = useState<boolean | null>(null);

  useEffect(() => {
    const checkKey = async () => {
      // @ts-ignore
      if (window.aistudio && window.aistudio.hasSelectedApiKey) {
        // @ts-ignore
        const selected = await window.aistudio.hasSelectedApiKey();
        setHasKey(selected);
      } else {
        // Se não estiver no ambiente do AI Studio com essa funcionalidade, assume que tem a chave
        setHasKey(true);
      }
    };
    checkKey();
  }, []);

  const handleSelectKey = async () => {
    // @ts-ignore
    if (window.aistudio && window.aistudio.openSelectKey) {
      // @ts-ignore
      await window.aistudio.openSelectKey();
      setHasKey(true); // Assume sucesso para mitigar race condition
    }
  };

  if (hasKey === null) {
    return <div className="flex h-screen items-center justify-center bg-gray-50 text-gray-500">Verificando permissões...</div>;
  }

  if (!hasKey) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 p-4">
        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 max-w-md text-center">
          <h2 className="text-2xl font-bold mb-4 text-gray-900">Chave de API Necessária</h2>
          <p className="text-gray-600 mb-6">
            Para gerar imagens de alta qualidade para os carrosséis, este aplicativo requer uma chave de API do Gemini de um projeto pago do Google Cloud.
          </p>
          <button
            onClick={handleSelectKey}
            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-medium transition-colors w-full mb-4 shadow-sm"
          >
            Selecionar Chave de API
          </button>
          <a
            href="https://ai.google.dev/gemini-api/docs/billing"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-purple-600 hover:text-purple-800 hover:underline transition-colors"
          >
            Saiba mais sobre faturamento e cotas
          </a>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
