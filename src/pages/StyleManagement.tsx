import React, { useState, useEffect } from 'react';
import { Upload, Plus, Loader2, Trash2, GripVertical, Pencil } from 'lucide-react';
import { extractStyleFromImages, StyleData, CategorizedImages, upsertStyleToPinecone } from '../services/gemini';
import { set } from 'idb-keyval';
import { db, collection, query, onSnapshot, doc, setDoc, deleteDoc, OperationType, handleFirestoreError } from '../firebase';
import { serverTimestamp } from 'firebase/firestore';

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
  const [audience, setAudience] = useState('');
  const [tone, setTone] = useState('');
  const [colors, setColors] = useState('');
  const [extraInstructions, setExtraInstructions] = useState('');
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState('');
  const [editingStyleId, setEditingStyleId] = useState<string | null>(null);
  const [logoImage, setLogoImage] = useState<string | null>(null);
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null);
  const [imagesChanged, setImagesChanged] = useState(false);

  useEffect(() => {
    // Listen to Firestore for styles
    const q = query(collection(db, 'styles'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const stylesList: StyleData[] = [];
      snapshot.forEach((doc) => {
        stylesList.push(doc.data() as StyleData);
      });
      setStyles(stylesList);
      set('carousel_styles', stylesList);
    }, (err) => {
      console.error("Firestore listen error", err);
    });

    return () => unsubscribe();
  }, []);

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
    setImagesChanged(true);
  };

  const handleAssetUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'background') => {
    const file = e.target.files?.[0];
    if (!file) return;
    const base64 = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(file);
    });
    if (type === 'logo') setLogoImage(base64);
    if (type === 'background') setBackgroundImage(base64);
  };

  const updateImageCategory = (id: string, category: 'cover' | 'content' | 'cta') => {
    setUploadedImages(prev => prev.map(img => img.id === id ? { ...img, category } : img));
    setImagesChanged(true);
  };

  const updateImageProject = (id: string, project: string) => {
    setUploadedImages(prev => prev.map(img => img.id === id ? { ...img, project } : img));
  };

  const removeImage = (id: string) => {
    setUploadedImages(prev => prev.filter(img => img.id !== id));
    setImagesChanged(true);
  };

  const handleAnalyze = async () => {
    if (!newStyleName.trim()) {
      setError('Por favor, insira um nome para o estilo.');
      return;
    }
    if (!editingStyleId && uploadedImages.length === 0) {
      setError('Por favor, selecione pelo menos uma imagem.');
      return;
    }

    setIsAnalyzing(true);
    setError('');
    try {
      let existingStyle = editingStyleId ? styles.find(s => s.id === editingStyleId) : null;
      let styleData: StyleData;

      if (!existingStyle || imagesChanged) {
        const categorized: CategorizedImages = {
          cover: uploadedImages.filter(i => i.category === 'cover').map(i => i.base64),
          content: uploadedImages.filter(i => i.category === 'content').map(i => i.base64),
          cta: uploadedImages.filter(i => i.category === 'cta').map(i => i.base64),
        };

        const metadata = {
          audience: audience.trim(),
          tone: tone.trim(),
          colors: colors.trim(),
          extraInstructions: extraInstructions.trim(),
        };

        styleData = await extractStyleFromImages(categorized, newStyleName, metadata);
        if (existingStyle) {
          styleData.id = existingStyle.id;
        }
      } else {
        styleData = {
          ...existingStyle,
          name: newStyleName,
          metadata: {
            audience: audience.trim(),
            tone: tone.trim(),
            colors: colors.trim(),
            extraInstructions: extraInstructions.trim(),
          }
        };
      }

      styleData.assets = {
        logo: logoImage || undefined,
        background: backgroundImage || undefined,
      };

      // Save to Firestore
      const styleDoc = {
        ...styleData,
        createdBy: existingStyle?.createdBy || 'anonymous',
        createdAt: existingStyle?.createdAt || serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      try {
        await setDoc(doc(db, 'styles', styleData.id), styleDoc);
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `styles/${styleData.id}`);
      }
      
      try {
        await upsertStyleToPinecone(styleData);
      } catch (pineconeErr) {
        console.error("Failed to sync to Pinecone:", pineconeErr);
      }

      resetForm();
    } catch (err: any) {
      setError(err.message || 'Erro ao analisar imagens.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const resetForm = () => {
    setIsAdding(false);
    setEditingStyleId(null);
    setNewStyleName('');
    setAudience('');
    setTone('');
    setColors('');
    setExtraInstructions('');
    setLogoImage(null);
    setBackgroundImage(null);
    setUploadedImages([]);
    setImagesChanged(false);
    setError('');
  };

  const handleEditStyle = (style: StyleData) => {
    setEditingStyleId(style.id);
    setNewStyleName(style.name);
    setAudience(style.metadata?.audience || '');
    setTone(style.metadata?.tone || '');
    setColors(style.metadata?.colors || '');
    setExtraInstructions(style.metadata?.extraInstructions || '');
    setLogoImage(style.assets?.logo || null);
    setBackgroundImage(style.assets?.background || null);
    
    const existingImages: UploadedImage[] = [];
    const addImagesFromCategory = (base64Array: string[] | undefined, category: 'cover' | 'content' | 'cta') => {
      if (!base64Array) return;
      base64Array.forEach((base64, index) => {
        existingImages.push({
          id: `existing-${category}-${index}-${Math.random().toString(36).substring(7)}`,
          base64,
          name: `Imagem de ${category === 'cover' ? 'Capa' : category === 'content' ? 'Meio' : 'CTA'} ${index + 1}`,
          project: 'Imagens Atuais',
          category
        });
      });
    };

    addImagesFromCategory(style.cover?.imagesBase64, 'cover');
    addImagesFromCategory(style.content?.imagesBase64, 'content');
    addImagesFromCategory(style.cta?.imagesBase64, 'cta');

    setUploadedImages(existingImages);
    setImagesChanged(false);
    setIsAdding(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const deleteStyle = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'styles', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `styles/${id}`);
    }
  };

  const projects = Array.from(new Set(uploadedImages.map(img => img.project)));

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Gestão de Estilos</h1>
          <p className="text-gray-500 mt-1 text-sm md:text-base">Agrupe e categorize imagens para um aprendizado preciso.</p>
        </div>
        {!isAdding && (
          <button
            onClick={() => { resetForm(); setIsAdding(true); }}
            className="flex items-center justify-center space-x-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors shadow-sm w-full md:w-auto"
          >
            <Plus size={20} />
            <span>Adicionar Novo Estilo</span>
          </button>
        )}
      </div>

      {isAdding && (
        <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-gray-200 mb-8">
          <h2 className="text-xl font-semibold mb-4">{editingStyleId ? "Editar Estilo / Adicionar Aprendizados" : "Novo Estilo Avançado"}</h2>
          
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

            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Informações da Marca (Opcional)</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Público-alvo</label>
                  <input
                    type="text"
                    value={audience}
                    onChange={(e) => setAudience(e.target.value)}
                    placeholder="Ex: Jovens empreendedores"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Tom de Voz</label>
                  <input
                    type="text"
                    value={tone}
                    onChange={(e) => setTone(e.target.value)}
                    placeholder="Ex: Descontraído e direto"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Cores da Marca</label>
                  <input
                    type="text"
                    value={colors}
                    onChange={(e) => setColors(e.target.value)}
                    placeholder="Ex: #FF0000, #000000"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Instruções Extras</label>
                  <input
                    type="text"
                    value={extraInstructions}
                    onChange={(e) => setExtraInstructions(e.target.value)}
                    placeholder="Ex: Sempre usar fontes em negrito"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Ativos Padrão (Opcional)</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Logo da Marca</label>
                  <div className="flex items-center space-x-3">
                    {logoImage && <img src={logoImage} alt="Logo" className="w-10 h-10 object-contain bg-white border rounded" />}
                    <input type="file" accept="image/*" onChange={(e) => handleAssetUpload(e, 'logo')} className="text-xs" />
                    {logoImage && <button onClick={() => setLogoImage(null)} className="text-red-500"><Trash2 size={14}/></button>}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Background Padrão</label>
                  <div className="flex items-center space-x-3">
                    {backgroundImage && <img src={backgroundImage} alt="Background" className="w-10 h-10 object-cover border rounded" />}
                    <input type="file" accept="image/*" onChange={(e) => handleAssetUpload(e, 'background')} className="text-xs" />
                    {backgroundImage && <button onClick={() => setBackgroundImage(null)} className="text-red-500"><Trash2 size={14}/></button>}
                  </div>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Imagens de Referência (Capa, Meio, CTA)</label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 md:p-8 text-center hover:bg-gray-50 transition-colors">
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
                        className="font-semibold text-gray-800 bg-transparent border-b border-dashed border-gray-400 focus:border-purple-500 outline-none px-1 w-full"
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {uploadedImages.filter(img => img.project === project).map(img => (
                        <div key={img.id} className="flex items-center bg-white p-3 rounded border border-gray-200 shadow-sm">
                          <img src={img.base64} alt={img.name} className="w-12 h-16 md:w-16 md:h-20 object-cover rounded mr-3 border border-gray-100" />
                          <div className="flex-1 min-w-0">
                            <p className="text-[10px] md:text-xs text-gray-500 truncate mb-2" title={img.name}>{img.name}</p>
                            <select 
                              value={img.category}
                              onChange={(e) => updateImageCategory(img.id, e.target.value as any)}
                              className="w-full text-xs md:text-sm border-gray-300 rounded focus:ring-purple-500 focus:border-purple-500"
                            >
                              <option value="cover">Capa</option>
                              <option value="content">Meio</option>
                              <option value="cta">CTA</option>
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

            <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t">
              <button
                onClick={resetForm}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors order-2 sm:order-1"
                disabled={isAnalyzing}
              >
                Cancelar
              </button>
              <button
                onClick={handleAnalyze}
                disabled={isAnalyzing || (!editingStyleId && uploadedImages.length === 0) || !newStyleName}
                className="flex items-center justify-center space-x-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-300 text-white px-6 py-2 rounded-lg transition-colors order-1 sm:order-2"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    <span className="text-sm">Salvando...</span>
                  </>
                ) : (
                  <span>{editingStyleId ? "Salvar Alterações" : "Iniciar Aprendizado"}</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {styles.map((style) => (
          <div key={style.id} className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-semibold text-gray-900 truncate pr-2">{style.name}</h3>
              <div className="flex space-x-1">
                <button onClick={() => handleEditStyle(style)} className="text-gray-400 hover:text-purple-500 transition-colors flex-shrink-0 p-1" title="Editar / Adicionar Aprendizados">
                  <Pencil size={18} />
                </button>
                <button onClick={() => deleteStyle(style.id)} className="text-gray-400 hover:text-red-500 transition-colors flex-shrink-0 p-1">
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
            
            <div className="space-y-4 flex-1">
              <div className="grid grid-cols-3 gap-2 text-center text-[10px] md:text-xs font-medium text-gray-500">
                <div>Capa ({style.cover?.imagesBase64?.length || 0})</div>
                <div>Meio ({style.content?.imagesBase64?.length || 0})</div>
                <div>CTA ({style.cta?.imagesBase64?.length || 0})</div>
              </div>
              
              <div className="bg-purple-50 p-3 rounded-lg border border-purple-100">
                <p className="text-[10px] md:text-xs text-purple-700 flex items-center mb-2 font-semibold">
                  <span className="w-2 h-2 rounded-full bg-purple-500 mr-2"></span>
                  Estilos Aprendidos
                </p>
                <div className="space-y-2">
                  {style.metadata && (style.metadata.audience || style.metadata.tone || style.metadata.colors || style.metadata.extraInstructions) && (
                    <div className="mb-3 pb-2 border-b border-purple-200">
                      {style.metadata.audience && <p className="text-[10px] md:text-xs text-gray-600"><strong>Público:</strong> {style.metadata.audience}</p>}
                      {style.metadata.tone && <p className="text-[10px] md:text-xs text-gray-600"><strong>Tom:</strong> {style.metadata.tone}</p>}
                      {style.metadata.colors && <p className="text-[10px] md:text-xs text-gray-600"><strong>Cores:</strong> {style.metadata.colors}</p>}
                      {style.metadata.extraInstructions && <p className="text-[10px] md:text-xs text-gray-600"><strong>Extras:</strong> {style.metadata.extraInstructions}</p>}
                    </div>
                  )}
                  {style.cover?.styleDescription && <p className="text-[10px] md:text-xs text-gray-600 line-clamp-2" title={style.cover.styleDescription}><strong>Capa:</strong> {style.cover.styleDescription}</p>}
                  {style.content?.styleDescription && <p className="text-[10px] md:text-xs text-gray-600 line-clamp-2" title={style.content.styleDescription}><strong>Meio:</strong> {style.content.styleDescription}</p>}
                  {style.cta?.styleDescription && <p className="text-[10px] md:text-xs text-gray-600 line-clamp-2" title={style.cta.styleDescription}><strong>CTA:</strong> {style.cta.styleDescription}</p>}
                </div>
              </div>
            </div>
          </div>
        ))}
        {styles.length === 0 && !isAdding && (
          <div className="col-span-full text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
            <p className="text-gray-500 px-4">Nenhum estilo cadastrado ainda. Adicione um novo estilo para começar.</p>
          </div>
        )}
      </div>
    </div>
  );
}
