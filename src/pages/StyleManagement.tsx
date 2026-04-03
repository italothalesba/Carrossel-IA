import React, { useState, useEffect } from 'react';
import { Upload, Plus, Loader2, Trash2 } from 'lucide-react';
import { extractStyleFromImages, StyleData } from '../services/gemini';

export default function StyleManagement() {
  const [styles, setStyles] = useState<StyleData[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [newStyleName, setNewStyleName] = useState('');
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('carousel_styles');
    if (saved) {
      setStyles(JSON.parse(saved));
    }
  }, []);

  const saveStyles = (newStyles: StyleData[]) => {
    setStyles(newStyles);
    localStorage.setItem('carousel_styles', JSON.stringify(newStyles));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []) as File[];
    if (files.length === 0) return;

    const readers = files.map(file => {
      return new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });
    });

    Promise.all(readers).then(results => {
      setSelectedImages(prev => [...prev, ...results]);
    });
  };

  const handleAnalyze = async () => {
    if (!newStyleName.trim()) {
      setError('Por favor, insira um nome para o estilo.');
      return;
    }
    if (selectedImages.length === 0) {
      setError('Por favor, selecione pelo menos uma imagem.');
      return;
    }

    setIsAnalyzing(true);
    setError('');
    try {
      const styleData = await extractStyleFromImages(selectedImages, newStyleName);
      saveStyles([...styles, styleData]);
      setIsAdding(false);
      setNewStyleName('');
      setSelectedImages([]);
    } catch (err: any) {
      setError(err.message || 'Erro ao analisar imagens.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const deleteStyle = (id: string) => {
    saveStyles(styles.filter(s => s.id !== id));
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestão de Estilos</h1>
          <p className="text-gray-500 mt-2">Gerencie as identidades visuais para seus carrosséis.</p>
        </div>
        {!isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center space-x-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors shadow-sm"
          >
            <Plus size={20} />
            <span>Adicionar Novo Estilo</span>
          </button>
        )}
      </div>

      {isAdding && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-8">
          <h2 className="text-xl font-semibold mb-4">Novo Estilo</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Estilo</label>
              <input
                type="text"
                value={newStyleName}
                onChange={(e) => setNewStyleName(e.target.value)}
                placeholder="Ex: Estilo Alfa Contabilidade"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Imagens de Referência</label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:bg-gray-50 transition-colors">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="image-upload"
                />
                <label htmlFor="image-upload" className="cursor-pointer flex flex-col items-center">
                  <Upload className="text-gray-400 mb-3" size={32} />
                  <span className="text-sm text-gray-600">Clique para selecionar imagens ou arraste para cá</span>
                  <span className="text-xs text-gray-400 mt-1">JPG, PNG</span>
                </label>
              </div>
            </div>

            {selectedImages.length > 0 && (
              <div className="grid grid-cols-4 gap-4 mt-4">
                {selectedImages.map((img, idx) => (
                  <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border border-gray-200">
                    <img src={img} alt={`Preview ${idx}`} className="w-full h-full object-cover" />
                    <button
                      onClick={() => setSelectedImages(selectedImages.filter((_, i) => i !== idx))}
                      className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {error && <p className="text-red-500 text-sm">{error}</p>}

            <div className="flex justify-end space-x-3 pt-4 border-t">
              <button
                onClick={() => {
                  setIsAdding(false);
                  setSelectedImages([]);
                  setNewStyleName('');
                  setError('');
                }}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                disabled={isAnalyzing}
              >
                Cancelar
              </button>
              <button
                onClick={handleAnalyze}
                disabled={isAnalyzing || selectedImages.length === 0 || !newStyleName}
                className="flex items-center space-x-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-300 text-white px-6 py-2 rounded-lg transition-colors"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    <span>Analisando Estilo...</span>
                  </>
                ) : (
                  <span>Iniciar Aprendizado</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {styles.map((style) => (
          <div key={style.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-semibold text-gray-900">{style.name}</h3>
              <button onClick={() => deleteStyle(style.id)} className="text-gray-400 hover:text-red-500 transition-colors">
                <Trash2 size={18} />
              </button>
            </div>
            
            <div className="space-y-4 flex-1">
              <div>
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Imagens de Referência</span>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {style.imagesBase64?.slice(0, 3).map((img, idx) => (
                    <div key={idx} className="aspect-square rounded-md overflow-hidden border border-gray-200">
                      <img src={img} alt={`Ref ${idx}`} className="w-full h-full object-cover" />
                    </div>
                  ))}
                  {style.imagesBase64 && style.imagesBase64.length > 3 && (
                    <div className="aspect-square rounded-md border border-gray-200 flex items-center justify-center bg-gray-50 text-gray-500 text-sm">
                      +{style.imagesBase64.length - 3}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="bg-purple-50 p-3 rounded-lg border border-purple-100">
                <p className="text-xs text-purple-700 flex items-center">
                  <span className="w-2 h-2 rounded-full bg-purple-500 mr-2"></span>
                  Estilo aprendido via Embeddings 2
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {style.embeddings ? `${style.embeddings.length} vetores gerados` : 'Vetores prontos'}
                </p>
              </div>
            </div>
          </div>
        ))}
        {styles.length === 0 && !isAdding && (
          <div className="col-span-full text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
            <p className="text-gray-500">Nenhum estilo cadastrado ainda. Adicione um novo estilo para começar.</p>
          </div>
        )}
      </div>
    </div>
  );
}
