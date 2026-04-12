import { useState } from 'react';
import { Play, Loader2, CheckCircle, XCircle, Copy, Plus, Zap, AlertTriangle } from 'lucide-react';
import { cn } from '../lib/utils';

interface TestResult {
  provider: string;
  success: boolean;
  latency?: number;
  error?: string;
  response?: string;
}

const PROVIDER_TEMPLATES = [
  {
    type: 'groq',
    name: 'Groq (RECOMENDADO)',
    baseUrl: 'https://api.groq.com/openai/v1',
    model: 'llama-3.3-70b-versatile',
    placeholder: 'gsk_...',
    docsUrl: 'https://console.groq.com/keys',
    badge: '✅ GRÁTIS'
  },
  {
    type: 'gemini',
    name: 'Google Gemini',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta/models',
    model: 'gemini-2.0-flash',
    placeholder: 'AIza...',
    docsUrl: 'https://aistudio.google.com/app/apikey',
    badge: '✅ GRÁTIS'
  },
  {
    type: 'openrouter',
    name: 'OpenRouter (Modelos Grátis)',
    baseUrl: 'https://openrouter.ai/api/v1',
    model: 'meta-llama/llama-3.3-70b-instruct:free',
    placeholder: 'sk-or-v1...',
    docsUrl: 'https://openrouter.ai/keys',
    badge: '✅ GRÁTIS'
  },
  {
    type: 'together',
    name: 'Together AI',
    baseUrl: 'https://api.together.xyz/v1',
    model: 'meta-llama/Llama-3.3-70B-Instruct-Turbo',
    placeholder: 'key_...',
    docsUrl: 'https://api.together.xyz/settings/api-keys'
  },
  {
    type: 'deepseek',
    name: 'DeepSeek',
    baseUrl: 'https://api.deepseek.com/v1',
    model: 'deepseek-chat',
    placeholder: 'sk-...',
    docsUrl: 'https://platform.deepseek.com'
  },
  {
    type: 'groq',
    name: 'Groq',
    baseUrl: 'https://api.groq.com/openai/v1',
    model: 'llama-3.3-70b-versatile',
    placeholder: 'gsk_...',
    docsUrl: 'https://console.groq.com/keys'
  },
  {
    type: 'openai',
    name: 'OpenAI',
    baseUrl: 'https://api.openai.com/v1',
    model: 'gpt-4o-mini',
    placeholder: 'sk-proj-...',
    docsUrl: 'https://platform.openai.com/api-keys'
  }
];

export default function ApiTester() {
  const [selectedProvider, setSelectedProvider] = useState(PROVIDER_TEMPLATES[0]);
  const [apiKey, setApiKey] = useState('');
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState<TestResult[]>([]);
  const [customName, setCustomName] = useState('');
  const [customModel, setCustomModel] = useState('');
  const [customBaseUrl, setCustomBaseUrl] = useState('');

  const testKey = async () => {
    if (!apiKey.trim()) return;

    setTesting(true);
    const startTime = Date.now();

    try {
      let response: Response;
      let generatedText = '';

      if (selectedProvider.type === 'gemini') {
        response = await fetch(`${selectedProvider.baseUrl}/${selectedProvider.model}:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: 'Responda apenas OK se estiver funcionando' }] }],
            generationConfig: { maxOutputTokens: 10, temperature: 0.1 }
          })
        });

        if (response.ok) {
          const data = await response.json();
          generatedText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
        }
      } else {
        // APIs compatíveis com OpenAI (OpenRouter, Together, DeepSeek, AIMLAPI, etc)
        response = await fetch(`${selectedProvider.baseUrl}/chat/completions`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'http://localhost:3018',
            'X-Title': 'Carrossel-IA'
          },
          body: JSON.stringify({
            model: customModel || selectedProvider.model,
            messages: [{ role: 'user', content: 'Responda apenas OK se estiver funcionando' }],
            max_tokens: 10,
            temperature: 0.1
          })
        });

        if (response.ok) {
          const data = await response.json();
          generatedText = data?.choices?.[0]?.message?.content || '';
        }
      }

      const latency = Date.now() - startTime;
      const success = response!.ok && generatedText.trim().length > 0;

      const result: TestResult = {
        provider: `${selectedProvider.name} (${apiKey.substring(0, 20)}...)`,
        success,
        latency,
        error: success ? undefined : `HTTP ${response!.status}`,
        response: generatedText.substring(0, 100)
      };

      setResults([result, ...results]);

      // Se funcionou, oferecer adicionar ao sistema
      if (success) {
        const name = customName || `${selectedProvider.name} ${results.length + 1}`;
        const model = customModel || selectedProvider.model;
        const baseUrl = customBaseUrl || selectedProvider.baseUrl;

        const addResponse = await fetch('/api/ai/providers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name,
            type: selectedProvider.type,
            baseUrl,
            model,
            apiKey
          })
        });

        if (addResponse.ok) {
          alert('✅ API adicionada ao sistema de rotação!');
        }
      }
    } catch (error: any) {
      const result: TestResult = {
        provider: `${selectedProvider.name}`,
        success: false,
        latency: Date.now() - startTime,
        error: error.message
      };
      setResults([result, ...results]);
    } finally {
      setTesting(false);
    }
  };

  const testAllExisting = async () => {
    setTesting(true);
    try {
      const response = await fetch('/api/ai/status');
      const data = await response.json();

      const newResults: TestResult[] = [];

      for (const provider of data.providers) {
        try {
          const testResponse = await fetch(`/api/ai/providers/${provider.id}/test`, {
            method: 'POST'
          });
          const testData = await testResponse.json();

          newResults.push({
            provider: provider.name,
            success: testData.success,
            latency: testData.latency,
            error: testData.success ? undefined : testData.error,
            response: testData.response
          });
        } catch (error: any) {
          newResults.push({
            provider: provider.name,
            success: false,
            error: error.message
          });
        }
      }

      setResults(newResults);
    } catch (error) {
      console.error('Failed to test all:', error);
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 mb-2">
            🔑 Testador de APIs
          </h1>
          <p className="text-gray-600">
            Cole sua chave de API e teste instantaneamente. Se funcionar, adicionamos automaticamente ao sistema!
          </p>
        </div>

        {/* Seleção de Provider */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">1. Escolha o provedor</h2>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
            {PROVIDER_TEMPLATES.map((template) => (
              <button
                key={template.type}
                onClick={() => setSelectedProvider(template)}
                className={cn(
                  "p-4 rounded-lg border-2 transition-all text-left relative",
                  selectedProvider.type === template.type
                    ? "border-purple-500 bg-purple-50"
                    : "border-gray-200 hover:border-purple-300"
                )}
              >
                {(template as any).badge && (
                  <span className="absolute top-2 right-2 px-2 py-1 bg-green-200 text-green-800 text-xs font-bold rounded">
                    {(template as any).badge}
                  </span>
                )}
                <Zap size={20} className={cn(
                  "mb-2",
                  selectedProvider.type === template.type ? "text-purple-600" : "text-gray-400"
                )} />
                <h3 className="font-semibold text-sm pr-12">{template.name}</h3>
                <p className="text-xs text-gray-500 mt-1">{template.model}</p>
              </button>
            ))}
          </div>

          {/* Link para docs */}
          <a
            href={selectedProvider.docsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center space-x-2 text-sm text-purple-600 hover:text-purple-700 mb-6"
          >
            <AlertTriangle size={16} />
            <span>Obter chave em {selectedProvider.docsUrl}</span>
          </a>

          {/* Campos de entrada */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                API Key
              </label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder={selectedProvider.placeholder}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent font-mono"
                onKeyDown={(e) => e.key === 'Enter' && testKey()}
              />
            </div>

            {/* Opções avançadas */}
            <details className="border border-gray-200 rounded-lg p-4">
              <summary className="cursor-pointer text-sm font-semibold text-gray-700">
                ⚙️ Opções avançadas (opcional)
              </summary>
              <div className="mt-4 space-y-3">
                <input
                  type="text"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="Nome personalizado (ex: Gemini Premium)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
                <input
                  type="text"
                  value={customModel}
                  onChange={(e) => setCustomModel(e.target.value)}
                  placeholder={`Model (padrão: ${selectedProvider.model})`}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
                <input
                  type="text"
                  value={customBaseUrl}
                  onChange={(e) => setCustomBaseUrl(e.target.value)}
                  placeholder={`Base URL (padrão: ${selectedProvider.baseUrl})`}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            </details>

            {/* Botões de ação */}
            <div className="flex space-x-3">
              <button
                onClick={testKey}
                disabled={testing || !apiKey.trim()}
                className="flex-1 flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
              >
                {testing ? (
                  <Loader2 size={20} className="animate-spin" />
                ) : (
                  <Play size={20} />
                )}
                <span>Testar Chave</span>
              </button>

              <button
                onClick={testAllExisting}
                disabled={testing}
                className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 font-semibold"
              >
                Testar Todas (8)
              </button>
            </div>
          </div>
        </div>

        {/* Resultados */}
        {results.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center space-x-2">
              <CheckCircle size={24} className="text-green-500" />
              <span>Resultados</span>
            </h2>

            <div className="space-y-3">
              {results.map((result, index) => (
                <div
                  key={index}
                  className={cn(
                    "p-4 rounded-lg border-2",
                    result.success ? "border-green-300 bg-green-50" : "border-red-300 bg-red-50"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {result.success ? (
                        <CheckCircle size={24} className="text-green-500" />
                      ) : (
                        <XCircle size={24} className="text-red-500" />
                      )}
                      <div>
                        <h3 className="font-semibold text-gray-900">{result.provider}</h3>
                        {result.latency && (
                          <p className="text-sm text-gray-600">
                            Latência: <strong className="text-blue-600">{result.latency}ms</strong>
                          </p>
                        )}
                      </div>
                    </div>

                    {result.success && (
                      <span className="px-3 py-1 bg-green-200 text-green-800 rounded-full text-xs font-bold">
                        ✅ FUNCIONANDO
                      </span>
                    )}
                  </div>

                  {result.response && (
                    <div className="mt-3 p-3 bg-white rounded text-sm">
                      <strong>Resposta:</strong> {result.response}
                    </div>
                  )}

                  {result.error && (
                    <div className="mt-3 p-3 bg-red-100 rounded text-sm text-red-700">
                      <strong>Erro:</strong> {result.error}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
