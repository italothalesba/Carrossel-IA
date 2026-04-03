import React, { useState, useEffect } from 'react';
import { Loader2, Download, Image as ImageIcon, Type, Link as LinkIcon, FileText, Mic } from 'lucide-react';
import { generateCarouselContent, generateSlideImage, StyleData, SlideContent } from '../services/gemini';
import { cn } from '../lib/utils';
import { get } from 'idb-keyval';

export default function CarouselCreation() {
  const [styles, setStyles] = useState<StyleData[]>([]);
  const [selectedStyleId, setSelectedStyleId] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'text' | 'url'>('text');
  const [content, setContent] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [slides, setSlides] = useState<(SlideContent & { imageUrl?: string })[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadStyles = async () => {
      try {
        const saved = await get('carousel_styles');
        if (saved) {
          setStyles(saved);
          if (saved.length > 0) {
            setSelectedStyleId(saved[0].id);
          }
        }
      } catch (err) {
        console.error('Failed to load styles from IndexedDB', err);
      }
    };
    loadStyles();
  }, []);

  const handleGenerate = async () => {
    if (!content.trim()) {
      setError('Por favor, insira o conteúdo.');
      return;
    }
    const style = styles.find(s => s.id === selectedStyleId);
    if (!style) {
      setError('Por favor, selecione um estilo.');
      return;
    }

    setIsGenerating(true);
    setError('');
    setSlides([]);

    try {
      // 1. Generate text content and image prompts
      const generatedSlides = await generateCarouselContent(content, style);
      setSlides(generatedSlides);

      // 2. Generate images for each slide
      const slidesWithImages = await Promise.all(
        generatedSlides.map(async (slide) => {
          try {
            const imageUrl = await generateSlideImage(slide.imagePrompt, style);
            return { ...slide, imageUrl };
          } catch (err) {
            console.error("Failed to generate image for slide", slide.title, err);
            return slide;
          }
        })
      );

      setSlides(slidesWithImages);
    } catch (err: any) {
      setError(err.message || 'Erro ao gerar carrossel.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = (slideIndex: number) => {
    // In a real app, we would draw the text over the image on a canvas and download it.
    // For this prototype, we'll just download the background image if available.
    const slide = slides[slideIndex];
    if (slide.imageUrl) {
      const a = document.createElement('a');
      a.href = slide.imageUrl;
      a.download = `carrossel_${slideIndex + 1}.png`;
      a.click();
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Criação de Carrossel</h1>
        <p className="text-gray-500 mt-2">Gere um carrossel de 4 slides a partir do seu conteúdo.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <label className="block text-sm font-medium text-gray-700 mb-2">Estilo Visual</label>
            <select
              value={selectedStyleId}
              onChange={(e) => setSelectedStyleId(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
            >
              {styles.length === 0 && <option value="">Nenhum estilo disponível</option>}
              {styles.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex space-x-2 mb-4 border-b border-gray-200 pb-2">
              <button
                onClick={() => setActiveTab('text')}
                className={cn("flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors", activeTab === 'text' ? "bg-purple-100 text-purple-700" : "text-gray-600 hover:bg-gray-100")}
              >
                <Type size={16} />
                <span>Texto</span>
              </button>
              <button
                onClick={() => setActiveTab('url')}
                className={cn("flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors", activeTab === 'url' ? "bg-purple-100 text-purple-700" : "text-gray-600 hover:bg-gray-100")}
              >
                <LinkIcon size={16} />
                <span>URL</span>
              </button>
            </div>

            {activeTab === 'text' ? (
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Cole seu texto aqui..."
                className="w-full h-48 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none resize-none"
              />
            ) : (
              <input
                type="url"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="https://exemplo.com/artigo"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
              />
            )}

            {error && <p className="text-red-500 text-sm mt-2">{error}</p>}

            <button
              onClick={handleGenerate}
              disabled={isGenerating || !content || !selectedStyleId}
              className="w-full mt-4 flex items-center justify-center space-x-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-300 text-white px-6 py-3 rounded-lg transition-colors font-medium"
            >
              {isGenerating ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  <span>Gerando Carrossel...</span>
                </>
              ) : (
                <span>GERAR CARROSSEL</span>
              )}
            </button>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 min-h-[600px]">
            <h2 className="text-xl font-semibold mb-6">Pré-visualização</h2>
            
            {slides.length > 0 ? (
              <div className="grid grid-cols-2 gap-6">
                {slides.map((slide, idx) => {
                  const style = styles.find(s => s.id === selectedStyleId);
                  return (
                    <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-gray-200 group">
                      {slide.imageUrl ? (
                        <img src={slide.imageUrl} alt={`Slide ${idx + 1}`} className="absolute inset-0 w-full h-full object-cover" />
                      ) : (
                        <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
                          <ImageIcon className="text-gray-300" size={48} />
                        </div>
                      )}
                      
                      {/* Overlay text */}
                      <div className="absolute inset-0 bg-black/40 p-6 flex flex-col justify-center text-white">
                        <h3 className="text-xl font-bold mb-2">{slide.title}</h3>
                        <p className="text-sm opacity-90">{slide.text}</p>
                      </div>

                      <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleDownload(idx)}
                          className="bg-white text-gray-900 p-2 rounded-full shadow-lg hover:bg-gray-100"
                          title="Baixar Slide"
                        >
                          <Download size={16} />
                        </button>
                      </div>
                      
                      <div className="absolute bottom-4 right-4 bg-black/50 text-white text-xs px-2 py-1 rounded">
                        {idx + 1} / 4
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-4 py-20">
                <ImageIcon size={64} className="opacity-20" />
                <p>Seus slides aparecerão aqui.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
