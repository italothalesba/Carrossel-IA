import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Copy, ExternalLink, Download, Image, Wand2, Check, Eye, Code } from 'lucide-react';
import { cn } from '../lib/utils';

interface SavedCarousel {
  id: string;
  timestamp: number;
  content: string;
  styleId: string;
  slides: {
    title: string;
    text: string;
    imagePrompt?: string;
    imageUrl?: string | null;
  }[];
  userId: string;
}

const IMAGE_GENERATORS = [
  {
    name: 'Cloudflare AI',
    url: 'https://developers.cloudflare.com/workers-ai/playground/',
    free: '10.000 neurons/dia (~10-20 imgs)',
    color: 'from-orange-500 to-yellow-500'
  },
  {
    name: 'Leonardo.AI',
    url: 'https://leonardo.ai',
    free: '$150 créditos/mês grátis',
    color: 'from-purple-500 to-pink-500'
  },
  {
    name: 'Playground AI',
    url: 'https://playgroundai.com',
    free: '500 imagens/dia grátis',
    color: 'from-blue-500 to-cyan-500'
  },
  {
    name: 'Bing Image Creator',
    url: 'https://www.bing.com/images/create',
    free: '15 boost/dia grátis',
    color: 'from-green-500 to-emerald-500'
  },
  {
    name: 'Ideogram',
    url: 'https://ideogram.ai',
    free: '100 imagens/dia grátis',
    color: 'from-orange-500 to-red-500'
  },
  {
    name: 'ModelsLab',
    url: 'https://modelslab.com',
    free: '20 créditos iniciais grátis',
    color: 'from-indigo-500 to-blue-600'
  }
];

export default function ImagePromptExporter() {
  const navigate = useNavigate();
  const [carousels, setCarousels] = useState<SavedCarousel[]>([]);
  const [selectedCarousel, setSelectedCarousel] = useState<string | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  useEffect(() => {
    loadCarousels();
  }, []);

  const loadCarousels = async () => {
    try {
      const response = await fetch('/api/carousel-history');
      if (response.ok) {
        const data = await response.json();
        setCarousels(data);
      }
    } catch (error) {
      console.error('Failed to load carousels:', error);
    }
  };

  const copyPrompt = async (prompt: string, index: number) => {
    await navigator.clipboard.writeText(prompt);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const openGenerator = (prompt: string, generatorUrl: string) => {
    // Abre o gerador de imagens com o prompt
    window.open(generatorUrl, '_blank');
    // Copia o prompt automaticamente
    navigator.clipboard.writeText(prompt);
  };

  const downloadPrompts = (carousel: SavedCarousel) => {
    const content = carousel.slides.map((slide, i) => 
      `Slide ${i + 1}: ${slide.title}\nPrompt: ${slide.imagePrompt || 'N/A'}\n`
    ).join('\n---\n\n');

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `carrossel-${carousel.id}-prompts.txt`;
    a.click();
  };

  const carousel = carousels.find(c => c.id === selectedCarousel);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft size={24} className="text-gray-600" />
              </button>
              <div>
                <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">
                  🖼️ Exportar Prompts de Imagem
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                  Copie prompts e gere imagens em serviços gratuitos
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Seleção de Carrossel */}
        {!carousel ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Selecione um carrossel</h2>
            {carousels.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Image size={48} className="mx-auto mb-4 text-gray-300" />
                <p>Nenhum carrossel gerado ainda</p>
                <button
                  onClick={() => navigate('/create')}
                  className="mt-4 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  Criar primeiro carrossel
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {carousels.map(c => (
                  <button
                    key={c.id}
                    onClick={() => setSelectedCarousel(c.id)}
                    className="p-4 border-2 border-gray-200 rounded-lg hover:border-purple-500 transition-colors text-left"
                  >
                    <h3 className="font-semibold text-gray-900 truncate">
                      {c.content.substring(0, 50)}...
                    </h3>
                    <p className="text-xs text-gray-500 mt-2">
                      {new Date(c.timestamp).toLocaleString('pt-BR')} • {c.slides.length} slides
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <>
            {/* Geradores Gratuitos */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center space-x-2">
                <Wand2 size={24} className="text-purple-600" />
                <span>Geradores de Imagem Gratuit</span>
              </h2>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {IMAGE_GENERATORS.map((gen, i) => (
                  <a
                    key={i}
                    href={gen.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                      "p-4 rounded-lg bg-gradient-to-br text-white hover:opacity-90 transition-opacity block",
                      gen.color
                    )}
                  >
                    <h3 className="font-bold text-sm">{gen.name}</h3>
                    <p className="text-xs opacity-90 mt-1">{gen.free}</p>
                    <ExternalLink size={14} className="mt-2" />
                  </a>
                ))}
              </div>
            </div>

            {/* Prompts do Carrossel */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">
                  Prompts do Carrossel ({carousel.slides.length} slides)
                </h2>
                <button
                  onClick={() => downloadPrompts(carousel)}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Download size={18} />
                  <span>Baixar Todos</span>
                </button>
              </div>

              <div className="space-y-6">
                {carousel.slides.map((slide, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-bold text-lg text-gray-900">
                        Slide {index + 1}: {slide.title}
                      </h3>
                      {slide.imageUrl && (
                        <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs">
                          ✅ Com imagem
                        </span>
                      )}
                    </div>

                    <p className="text-sm text-gray-700 mb-4">{slide.text}</p>

                    {slide.imagePrompt ? (
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-semibold text-gray-600 uppercase">
                            Prompt de Imagem
                          </span>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => copyPrompt(slide.imagePrompt!, index)}
                              className="flex items-center space-x-1 px-3 py-1 bg-purple-600 text-white rounded hover:bg-purple-700 text-xs"
                            >
                              {copiedIndex === index ? <Check size={14} /> : <Copy size={14} />}
                              <span>{copiedIndex === index ? 'Copiado!' : 'Copiar'}</span>
                            </button>
                          </div>
                        </div>
                        <p className="text-sm text-gray-800 font-mono bg-white p-3 rounded border">
                          {slide.imagePrompt}
                        </p>

                        {/* Botões para abrir em geradores */}
                        <div className="mt-3 flex flex-wrap gap-2">
                          {IMAGE_GENERATORS.map((gen, i) => (
                            <button
                              key={i}
                              onClick={() => openGenerator(slide.imagePrompt!, gen.url)}
                              className={cn(
                                "px-3 py-2 rounded text-white text-xs hover:opacity-90",
                                "bg-gradient-to-r",
                                gen.color
                              )}
                            >
                              Gerar em {gen.name}
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 italic">
                        ⚠️ Prompt de imagem não disponível
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
