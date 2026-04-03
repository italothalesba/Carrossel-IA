import React, { useState, useEffect } from 'react';
import { Upload, Plus, Loader2, Trash2, GripVertical } from 'lucide-react';
import { extractStyleFromImages, StyleData, CategorizedImages } from '../services/gemini';
import { get, set } from 'idb-keyval';

interface UploadedImage {
  id: string;
  base64: string;
  name: string;
  project: string;
  category: 'cover' | 'content' | 'cta';
}

export default function StyleManagement() {
  const [styles, setStyles] = useState<StyleData[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [newStyleName, setNewStyleName] = useState('');
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadStyles = async () => {
      try {
        const saved = await get('carousel_styles');
        if (saved) {
          setStyles(saved);
        }
      } catch (err) {
        console.error('Failed to load styles from IndexedDB', err);
      }
    };
    loadStyles();
  }, []);

  const saveStyles = async (newStyles: StyleData[]) => {
    setStyles(newStyles);
    try {
      await set('carousel_styles', newStyles);
    } catch (err) {
      console.error('Failed to save styles to IndexedDB', err);
      setError('Erro ao salvar estilos. O armazenamento pode estar cheio.');
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []) as File[];
    if (files.length === 0) return;

    const newImages: UploadedImage[] = await Promise.all(files.map(async (file) => {
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });

      const lowerName = file.name.toLowerCase();
      let category: 'cover' | 'content' | 'cta' = 'content';
      if (lowerName.includes('capa') || lowerName.includes('cover') || lowerName.includes('01') || lowerName.includes('1')) category = 'cover';
      if (lowerName.includes('cta') || lowerName.includes('fim') || lowerName.includes('last')) category = 'cta';
      
      const projectMatch = file.name.match(/^([a-zA-Z0-9]+)[-_]/);
      const project = projectMatch ? projectMatch[1] : 'Projeto Padrão';

      return {
        id: Math.random().toString(36).substring(7),
        base64,
        name: file.name,
        project,
        category
      };
    }));

    setUploadedImages(prev => [...prev, ...newImages]);
  };

  const updateImageCategory = (id: string, category: 'cover' | 'content' | 'cta') => {
    setUploadedImages(prev => prev.map(img => img.id === id ? { ...img, category } : img));
  };

  const updateImageProject = (id: string, project: string) => {
    setUploadedImages(prev => prev.map(img => img.id === id ? { ...img, project } : img));
  };

  const removeImage = (id: string) => {
    setUploadedImages(prev => prev.filter(img => img.id !== id));
  };

  const handleAnalyze = async () => {
    if (!newStyleName.trim()) {
      setError('Por favor, insira um nome para o estilo.');
      return;
    }
    if (uploadedImages.length === 0) {
      setError('Por favor, selecione pelo menos uma imagem.');
      return;
    }

    setIsAnalyzing(true);
    setError('');
    try {
      const categorized: CategorizedImages = {
        cover: uploadedImages.filter(i => i.category === 'cover').map(i => i.base64),
        content: uploadedImages.filter(i => i.category === 'content').map(i => i.base64),
        cta: uploadedImages.filter(i => i.category === 'cta').map(i => i.base64),
      };

      const styleData = await extractStyleFromImages(categorized, newStyleName);
      await saveStyles([...styles, styleData]);
      setIsAdding(false);
      setNewStyleName('');
      setUploadedImages([]);
    } catch (err: any) {
      setError(err.message || 'Erro ao analisar imagens.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const deleteStyle = async (id: string) => {
    await saveStyles(styles.filter(s => s.id !== id));
  };

  const projects = Array.from(new Set(uploadedImages.map(img => img.project)));

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestão de Estilos</h1>
          <p className="text-gray-500 mt-2">Agrupe e categorize imagens para um aprendizado preciso.</p>
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
          <h2 className="text-xl font-semibold mb-4">Novo Estilo Avançado</h2>
          
          <div className="space-y-6">
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Imagens de Referência (Capa, Meio, CTA)</label>
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
                  <span className="text-sm text-gray-600">Selecione as imagens dos seus projetos anteriores</span>
                  <span className="text-xs text-gray-400 mt-1">O sistema tentará agrupar pelo nome do arquivo</span>
                </label>
              </div>
            </div>

            {projects.length > 0 && (
              <div className="space-y-6 mt-6">
                <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Imagens Agrupadas por Projeto</h3>
                {projects.map(project => (
                  <div key={project} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <div className="flex items-center mb-4">
                      <GripVertical className="text-gray-400 mr-2" size={20} />
                      <input 
                        type="text" 
                        value={project}
                        onChange={(e) => {
                          const newProject = e.target.value;
                          uploadedImages.filter(img => img.project === project).forEach(img => updateImageProject(img.id, newProject));
                        }}
                        className="font-semibold text-gray-800 bg-transparent border-b border-dashed border-gray-400 focus:border-purple-500 outline-none px-1"
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {uploadedImages.filter(img => img.project === project).map(img => (
                        <div key={img.id} className="flex items-center bg-white p-3 rounded border border-gray-200 shadow-sm">
                          <img src={img.base64} alt={img.name} className="w-16 h-20 object-cover rounded mr-3 border border-gray-100" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-gray-500 truncate mb-2" title={img.name}>{img.name}</p>
                            <select 
                              value={img.category}
                              onChange={(e) => updateImageCategory(img.id, e.target.value as any)}
                              className="w-full text-sm border-gray-300 rounded focus:ring-purple-500 focus:border-purple-500"
                            >
                              <option value="cover">Capa</option>
                              <option value="content">Meio (Conteúdo)</option>
                              <option value="cta">CTA (Final)</option>
                            </select>
                          </div>
                          <button onClick={() => removeImage(img.id)} className="ml-2 text-gray-400 hover:text-red-500">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {error && <p className="text-red-500 text-sm">{error}</p>}

            <div className="flex justify-end space-x-3 pt-4 border-t">
              <button
                onClick={() => {
                  setIsAdding(false);
                  setUploadedImages([]);
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
                disabled={isAnalyzing || uploadedImages.length === 0 || !newStyleName}
                className="flex items-center space-x-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-300 text-white px-6 py-2 rounded-lg transition-colors"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    <span>Analisando Estilos (Capa, Meio, CTA)...</span>
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
              <div className="grid grid-cols-3 gap-2 text-center text-xs font-medium text-gray-500">
                <div>Capa ({style.cover?.imagesBase64?.length || 0})</div>
                <div>Meio ({style.content?.imagesBase64?.length || 0})</div>
                <div>CTA ({style.cta?.imagesBase64?.length || 0})</div>
              </div>
              
              <div className="bg-purple-50 p-3 rounded-lg border border-purple-100">
                <p className="text-xs text-purple-700 flex items-center mb-2 font-semibold">
                  <span className="w-2 h-2 rounded-full bg-purple-500 mr-2"></span>
                  Estilos Aprendidos
                </p>
                <div className="space-y-2">
                  {style.cover?.styleDescription && <p className="text-xs text-gray-600 line-clamp-2" title={style.cover.styleDescription}><strong>Capa:</strong> {style.cover.styleDescription}</p>}
                  {style.content?.styleDescription && <p className="text-xs text-gray-600 line-clamp-2" title={style.content.styleDescription}><strong>Meio:</strong> {style.content.styleDescription}</p>}
                  {style.cta?.styleDescription && <p className="text-xs text-gray-600 line-clamp-2" title={style.cta.styleDescription}><strong>CTA:</strong> {style.cta.styleDescription}</p>}
                </div>
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
