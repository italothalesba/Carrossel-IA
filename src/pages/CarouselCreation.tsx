import React, { useState, useEffect } from 'react';
import { Loader2, Download, Image as ImageIcon, Type, Link as LinkIcon, FileText, Mic, Clock, Trash2, RefreshCw, ThumbsUp, ThumbsDown, ImagePlus, UserCheck, Check, Plus } from 'lucide-react';
import { draftCarouselContent, refineCarouselContent, generateSlideImage, StyleData, SlideContent, queryStyleFromPinecone, learnFromFeedback, upsertStyleToPinecone, DraftResponse } from '../services/gemini';
import { cn } from '../lib/utils';
import { db, auth, collection, query, onSnapshot, doc, setDoc, updateDoc, deleteDoc, OperationType, handleFirestoreError } from '../firebase';
import { orderBy, limit } from 'firebase/firestore';

interface SlideFeedback {
  status: 'approved' | 'rejected';
  comment: string;
}

interface CarouselHistoryItem {
  id: string;
  timestamp: number;
  content: string;
  styleId: string;
  slides: (SlideContent & { imageUrl?: string; feedback?: SlideFeedback })[];
}

export default function CarouselCreation() {
  const [styles, setStyles] = useState<StyleData[]>([]);
  const [selectedStyleId, setSelectedStyleId] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'text' | 'url'>('text');
  const [content, setContent] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [slides, setSlides] = useState<(SlideContent & { imageUrl?: string; feedback?: SlideFeedback })[]>([]);
  const [error, setError] = useState('');
  const [history, setHistory] = useState<CarouselHistoryItem[]>([]);
  const [regeneratingSlideIndex, setRegeneratingSlideIndex] = useState<number | null>(null);
  const [currentHistoryId, setCurrentHistoryId] = useState<string | null>(null);
  const [feedbackState, setFeedbackState] = useState<{
    index: number;
    status: 'approved' | 'rejected';
    comment: string;
  } | null>(null);
  const [isLearning, setIsLearning] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [generationStatus, setGenerationStatus] = useState<string | null>(null);

  // New state for multi-agent workflow
  const [step, setStep] = useState<'input' | 'draft' | 'generating_images' | 'done'>('input');
  const [draftData, setDraftData] = useState<DraftResponse | null>(null);
  const [userConsiderations, setUserConsiderations] = useState('');

  useEffect(() => {
    // Listen to Firestore for styles
    const q = query(collection(db, 'styles'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const stylesList: StyleData[] = [];
      snapshot.forEach((doc) => {
        stylesList.push(doc.data() as StyleData);
      });
      setStyles(stylesList);
      if (stylesList.length > 0 && !selectedStyleId) {
        setSelectedStyleId(stylesList[0].id);
      }
    });

    let unsubscribeHistory: () => void;

    const loadHistory = () => {
      if (!auth.currentUser) return;
      
      const historyQuery = query(
        collection(db, 'carousel_history'),
        orderBy('timestamp', 'desc'),
        limit(20)
      );

      unsubscribeHistory = onSnapshot(historyQuery, (snapshot) => {
        const historyList: CarouselHistoryItem[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          if (data.userId === auth.currentUser?.uid) {
            historyList.push(data as CarouselHistoryItem);
          }
        });
        setHistory(historyList);
      }, (err) => {
        console.error('Failed to load history from Firestore', err);
      });
    };

    // Wait for auth to be ready
    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      if (user) {
        loadHistory();
      } else {
        setHistory([]);
      }
    });

    return () => {
      unsubscribe();
      if (unsubscribeHistory) unsubscribeHistory();
      unsubscribeAuth();
    };
  }, []);

  const handleAutoSelectStyle = async () => {
    if (!content.trim()) {
      setError('Por favor, insira o conteúdo primeiro para a IA encontrar o melhor estilo.');
      return;
    }
    
    setIsGenerating(true);
    setError('');
    try {
      const bestStyleId = await queryStyleFromPinecone(content);
      if (bestStyleId) {
        const styleExists = styles.find(s => s.id === bestStyleId);
        if (styleExists) {
          setSelectedStyleId(bestStyleId);
          await generateDraftWithStyle(styleExists);
        } else {
          setError('Estilo encontrado no Pinecone, mas não está disponível localmente.');
          setIsGenerating(false);
        }
      } else {
        setError('Nenhum estilo compatível encontrado no Pinecone.');
        setIsGenerating(false);
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao consultar Pinecone.');
      setIsGenerating(false);
    }
  };

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
    await generateDraftWithStyle(style);
  };

  const generateDraftWithStyle = async (style: StyleData) => {
    setGenerationStatus("Iniciando pipeline de agentes...");
    try {
      const draft = await draftCarouselContent(content, style, setGenerationStatus);
      setDraftData(draft);
      setStep('draft');
    } catch (err: any) {
      setError(err.message || 'Erro ao gerar rascunho.');
    } finally {
      setIsGenerating(false);
      setGenerationStatus(null);
    }
  };

  const handleRefine = async () => {
    if (!userConsiderations.trim()) return;
    const style = styles.find(s => s.id === selectedStyleId);
    if (!style || !draftData) return;

    setIsGenerating(true);
    setError('');
    try {
      const refined = await refineCarouselContent(draftData.slides, draftData.managerFeedback, userConsiderations, style, setGenerationStatus);
      setDraftData(refined);
      setUserConsiderations('');
    } catch (err: any) {
      setError(err.message || 'Erro ao refinar rascunho.');
    } finally {
      setIsGenerating(false);
      setGenerationStatus(null);
    }
  };

  const handleApprove = async () => {
    const style = styles.find(s => s.id === selectedStyleId);
    if (!style || !draftData) return;

    setStep('generating_images');
    setGenerationStatus("Gerando imagens finais...");
    setSlides([]);

    try {
      const slidesWithImages = await Promise.all(
        draftData.slides.map(async (slide, index) => {
          try {
            let slideType: 'cover' | 'content' | 'cta' = 'content';
            if (index === 0) slideType = 'cover';
            else if (index === draftData.slides.length - 1) slideType = 'cta';

            const imageUrl = await generateSlideImage(slide.imagePrompt, style, slideType);
            return { ...slide, imageUrl };
          } catch (err) {
            console.error("Failed to generate image for slide", slide.title, err);
            return slide;
          }
        })
      );

      setSlides(slidesWithImages);
      
      const newId = Date.now().toString();
      setCurrentHistoryId(newId);
      
      const historyItem = {
        id: newId,
        timestamp: Date.now(),
        content,
        styleId: style.id,
        slides: slidesWithImages,
        userId: auth.currentUser?.uid || 'anonymous'
      };
      
      if (auth.currentUser) {
        try {
          await setDoc(doc(db, 'carousel_history', newId), historyItem);
        } catch (err) {
          handleFirestoreError(err, OperationType.CREATE, `carousel_history/${newId}`);
        }
      } else {
        // Fallback for anonymous if needed, though rules require auth
        const newHistory = [historyItem as CarouselHistoryItem, ...history].slice(0, 20);
        setHistory(newHistory);
      }
      
      setStep('done');

    } catch (err: any) {
      setError(err.message || 'Erro ao gerar imagens.');
      setStep('draft');
    } finally {
      setGenerationStatus(null);
    }
  };

  const loadFromHistory = (item: CarouselHistoryItem) => {
    setContent(item.content);
    setSelectedStyleId(item.styleId);
    setSlides(item.slides);
    setCurrentHistoryId(item.id);
    setFeedbackState(null);
    setStep('done');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleRegenerateSlideImage = async (slideIndex: number) => {
    const style = styles.find(s => s.id === selectedStyleId);
    if (!style) {
      setError('Por favor, selecione um estilo.');
      return;
    }

    setRegeneratingSlideIndex(slideIndex);
    setError('');

    try {
      const slide = slides[slideIndex];
      let slideType: 'cover' | 'content' | 'cta' = 'content';
      if (slideIndex === 0) slideType = 'cover';
      else if (slideIndex === slides.length - 1) slideType = 'cta';

      const imageUrl = await generateSlideImage(slide.imagePrompt, style, slideType);
      
      const newSlides = [...slides];
      const { feedback, ...slideWithoutFeedback } = slide;
      newSlides[slideIndex] = { ...slideWithoutFeedback, imageUrl };
      setSlides(newSlides);

      if (currentHistoryId) {
        const newHistory = history.map(h => h.id === currentHistoryId ? { ...h, slides: newSlides } : h);
        setHistory(newHistory);
        if (auth.currentUser) {
          try {
            await updateDoc(doc(db, 'carousel_history', currentHistoryId), { slides: newSlides });
          } catch (err) {
            handleFirestoreError(err, OperationType.UPDATE, `carousel_history/${currentHistoryId}`);
          }
        }
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao regenerar imagem do slide.');
    } finally {
      setRegeneratingSlideIndex(null);
    }
  };

  const submitFeedback = async () => {
    if (!feedbackState || !selectedStyleId) return;
    setIsLearning(true);
    try {
      const style = styles.find(s => s.id === selectedStyleId);
      if (!style) throw new Error("Estilo não encontrado");

      let slideType: 'cover' | 'content' | 'cta' = 'content';
      if (feedbackState.index === 0) slideType = 'cover';
      else if (feedbackState.index === slides.length - 1) slideType = 'cta';

      const updatedStyle = await learnFromFeedback(style, slideType, feedbackState.status, feedbackState.comment);
      
      // Update Firestore
      try {
        await updateDoc(doc(db, 'styles', style.id), {
          [slideType]: updatedStyle[slideType],
          metadata: updatedStyle.metadata
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `styles/${style.id}`);
      }
      
      try {
        await upsertStyleToPinecone(updatedStyle);
      } catch (e) {
        console.error("Failed to sync learned style to Pinecone", e);
      }

      const newSlides = [...slides];
      newSlides[feedbackState.index] = {
        ...newSlides[feedbackState.index],
        feedback: { status: feedbackState.status, comment: feedbackState.comment }
      };
      setSlides(newSlides);

      if (currentHistoryId) {
        const newHistory = history.map(h => h.id === currentHistoryId ? { ...h, slides: newSlides } : h);
        setHistory(newHistory);
        if (auth.currentUser) {
          try {
            await updateDoc(doc(db, 'carousel_history', currentHistoryId), { slides: newSlides });
          } catch (err) {
            handleFirestoreError(err, OperationType.UPDATE, `carousel_history/${currentHistoryId}`);
          }
        }
      }

      setFeedbackState(null);
      setSuccessMessage('Estilo atualizado com sucesso! O aprendizado foi concluído.');
      setTimeout(() => setSuccessMessage(''), 4000);
    } catch (err: any) {
      const errorMessage = err.message || "";
      if (errorMessage.toLowerCase().includes("quota") || errorMessage.includes("429")) {
        setError("Limite de uso da API atingido (Muitas requisições). Por favor, aguarde cerca de 1 minuto e tente novamente.");
      } else {
        setError(errorMessage || "Erro ao processar feedback");
      }
    } finally {
      setIsLearning(false);
    }
  };

  const deleteHistoryItem = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const newHistory = history.filter(h => h.id !== id);
    setHistory(newHistory);
    if (auth.currentUser) {
      try {
        await deleteDoc(doc(db, 'carousel_history', id));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `carousel_history/${id}`);
      }
    }
  };

  const handleDownload = (slideIndex: number) => {
    const slide = slides[slideIndex];
    if (slide.imageUrl) {
      const a = document.createElement('a');
      a.href = slide.imageUrl;
      a.download = `carrossel_${slideIndex + 1}.png`;
      a.click();
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto relative">
      {successMessage && (
        <div className="fixed top-6 right-6 bg-green-600 text-white px-5 py-3 rounded-lg shadow-xl flex items-center gap-3 z-50 animate-in fade-in slide-in-from-top-4">
          <ThumbsUp size={20} />
          <span className="font-medium">{successMessage}</span>
        </div>
      )}

      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Criação de Carrossel</h1>
        <p className="text-gray-500 mt-2 text-sm md:text-base">Gere um carrossel de 4 slides a partir do seu conteúdo (Formato 1080x1440).</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          {step === 'input' && (
            <>
              <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-gray-200">
                <label className="block text-sm font-medium text-gray-700 mb-2">Estilo Visual</label>
                <select
                  value={selectedStyleId}
                  onChange={(e) => setSelectedStyleId(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-sm"
                >
                  {styles.length === 0 && <option value="">Nenhum estilo disponível</option>}
                  {styles.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-gray-200">
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
                    className="w-full h-48 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none resize-none text-sm"
                  />
                ) : (
                  <input
                    type="url"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="https://exemplo.com/artigo"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-sm"
                  />
                )}

                {error && <p className="text-red-500 text-xs mt-2">{error}</p>}

                <div className="flex flex-col space-y-3 mt-4">
                  <button
                    onClick={handleGenerate}
                    disabled={isGenerating || !content || !selectedStyleId}
                    className="w-full flex items-center justify-center space-x-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-300 text-white px-6 py-3 rounded-lg transition-colors font-medium text-sm"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 size={20} className="animate-spin" />
                        <span>Processando...</span>
                      </>
                    ) : (
                      <span>GERAR CARROSSEL</span>
                    )}
                  </button>
                  
                  <button
                    onClick={handleAutoSelectStyle}
                    disabled={isGenerating || !content}
                    className="w-full flex items-center justify-center space-x-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 disabled:opacity-50 px-6 py-3 rounded-lg transition-colors font-medium border border-indigo-200 text-xs"
                  >
                    <span>✨ Auto-Selecionar Estilo</span>
                  </button>
                </div>
                
                {generationStatus && (
                  <div className="mt-4 p-3 bg-purple-50 border border-purple-100 rounded-lg flex items-start space-x-3 animate-in fade-in">
                    <Loader2 size={16} className="text-purple-600 animate-spin mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-purple-800 font-medium">{generationStatus}</p>
                  </div>
                )}
              </div>
            </>
          )}

          {step === 'draft' && (
            <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <UserCheck className="text-purple-600" /> Revisão do Gerente
              </h3>
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6 text-sm text-purple-900 italic">
                "{draftData?.managerFeedback}"
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Suas Considerações</label>
                <textarea
                  value={userConsiderations}
                  onChange={(e) => setUserConsiderations(e.target.value)}
                  placeholder="Ex: Mude o título do slide 2 para algo mais chamativo..."
                  className="w-full h-32 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none resize-none text-sm"
                />
              </div>

              <div className="flex flex-col gap-3">
                <button
                  onClick={handleRefine}
                  disabled={isGenerating || !userConsiderations.trim()}
                  className="w-full flex items-center justify-center space-x-2 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 disabled:opacity-50 px-6 py-3 rounded-lg transition-colors font-medium text-sm"
                >
                  {isGenerating ? <Loader2 size={18} className="animate-spin" /> : <RefreshCw size={18} />}
                  <span>Refazer com Considerações</span>
                </button>
                
                <button
                  onClick={handleApprove}
                  disabled={isGenerating}
                  className="w-full flex items-center justify-center space-x-2 bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white px-6 py-3 rounded-lg transition-colors font-medium text-sm"
                >
                  {isGenerating ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
                  <span>Aprovar e Gerar Imagens</span>
                </button>
              </div>

              {generationStatus && (
                <div className="mt-4 p-3 bg-purple-50 border border-purple-100 rounded-lg flex items-start space-x-3 animate-in fade-in">
                  <Loader2 size={16} className="text-purple-600 animate-spin mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-purple-800 font-medium">{generationStatus}</p>
                </div>
              )}
            </div>
          )}

          {(step === 'generating_images' || step === 'done') && (
            <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Status</h3>
              
              {step === 'generating_images' ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Loader2 size={40} className="text-purple-600 animate-spin mb-4" />
                  <p className="text-sm text-gray-600 font-medium">{generationStatus}</p>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  <div className="bg-green-50 text-green-800 p-4 rounded-lg text-sm font-medium flex items-center gap-2">
                    <Check size={18} /> Carrossel gerado com sucesso!
                  </div>
                  <button
                    onClick={() => {
                      setStep('input');
                      setSlides([]);
                      setDraftData(null);
                      setUserConsiderations('');
                    }}
                    className="w-full flex items-center justify-center space-x-2 bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg transition-colors font-medium text-sm"
                  >
                    <Plus size={18} />
                    <span>Criar Novo Carrossel</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="lg:col-span-2">
          <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-gray-200 min-h-[400px]">
            <h2 className="text-xl font-semibold mb-6">
              {step === 'draft' ? 'Rascunho dos Slides' : 'Pré-visualização (3:4)'}
            </h2>
            
            {step === 'draft' && draftData && (
              <div className="flex flex-col gap-6">
                {draftData.slides.map((slide, idx) => (
                  <div key={idx} className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm flex flex-col md:flex-row">
                    <div className="bg-purple-50 p-4 md:w-1/3 border-b md:border-b-0 md:border-r border-gray-200 flex flex-col justify-center items-center text-center">
                      <div className="bg-purple-200 text-purple-800 text-sm font-bold px-3 py-1 rounded-full mb-3">
                        Slide {idx + 1}
                      </div>
                      <ImageIcon className="text-purple-300 mb-2" size={32} />
                      <p className="text-xs text-purple-600 italic px-2">{slide.imagePrompt}</p>
                    </div>
                    <div className="p-5 md:w-2/3 flex flex-col justify-center">
                      <h4 className="font-bold text-gray-900 text-lg mb-2">{slide.title}</h4>
                      <p className="text-sm text-gray-700 leading-relaxed">{slide.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {(step === 'done' || step === 'generating_images') && (
              slides.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                  {slides.map((slide, idx) => {
                    return (
                      <div key={idx} className="flex flex-col gap-3">
                      <div className="relative aspect-[3/4] rounded-xl overflow-hidden border border-gray-200 group shadow-sm">
                        {slide.imageUrl ? (
                          <img src={slide.imageUrl} alt={`Slide ${idx + 1}`} className="absolute inset-0 w-full h-full object-cover" />
                        ) : (
                          <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
                            <ImageIcon className="text-gray-300" size={48} />
                          </div>
                        )}
                        
                        {/* Overlay text */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent p-6 flex flex-col justify-end text-white">
                          <h3 className="text-xl font-bold mb-2 drop-shadow-md">{slide.title}</h3>
                          <p className="text-sm opacity-90 drop-shadow-md">{slide.text}</p>
                        </div>

                        <div className={cn("absolute top-4 right-4 transition-opacity flex flex-col gap-2", regeneratingSlideIndex === idx ? "opacity-100" : "opacity-0 group-hover:opacity-100")}>
                          <button
                            onClick={() => handleRegenerateSlideImage(idx)}
                            disabled={regeneratingSlideIndex === idx}
                            className="bg-white text-gray-900 p-2 rounded-full shadow-lg hover:bg-gray-100 disabled:opacity-50"
                            title="Regerar Imagem"
                          >
                            <RefreshCw size={16} className={regeneratingSlideIndex === idx ? "animate-spin text-purple-600" : ""} />
                          </button>
                          <button
                            onClick={() => handleDownload(idx)}
                            className="bg-white text-gray-900 p-2 rounded-full shadow-lg hover:bg-gray-100"
                            title="Baixar Slide"
                          >
                            <Download size={16} />
                          </button>
                        </div>
                        
                        <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-sm text-white text-xs px-2 py-1 rounded font-medium">
                          {idx === 0 ? 'Capa' : idx === slides.length - 1 ? 'CTA' : `Meio (${idx + 1})`}
                        </div>
                      </div>

                      {/* Feedback Section */}
                      <div className="bg-gray-50 p-3 rounded-xl border border-gray-200 shadow-sm">
                        {slide.feedback ? (
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                              {slide.feedback.status === 'approved' ? <ThumbsUp size={16} className="text-green-600" /> : <ThumbsDown size={16} className="text-red-600" />}
                              <span className="text-sm font-medium text-gray-900">
                                {slide.feedback.status === 'approved' ? 'Aprovado' : 'Reprovado'}
                              </span>
                            </div>
                            {slide.feedback.comment && (
                              <p className="text-xs text-gray-600 mt-1 italic">"{slide.feedback.comment}"</p>
                            )}
                          </div>
                        ) : feedbackState?.index === idx ? (
                          <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-2 mb-1">
                              <button 
                                onClick={() => setFeedbackState({ ...feedbackState, status: 'approved' })}
                                className={cn("p-1.5 rounded transition-colors", feedbackState.status === 'approved' ? "bg-green-100 text-green-700" : "text-gray-400 hover:bg-gray-200")}
                              >
                                <ThumbsUp size={16} />
                              </button>
                              <button 
                                onClick={() => setFeedbackState({ ...feedbackState, status: 'rejected' })}
                                className={cn("p-1.5 rounded transition-colors", feedbackState.status === 'rejected' ? "bg-red-100 text-red-700" : "text-gray-400 hover:bg-gray-200")}
                              >
                                <ThumbsDown size={16} />
                              </button>
                              <span className="text-xs font-medium text-gray-600 ml-1">
                                {feedbackState.status === 'approved' ? 'O que ficou bom?' : 'O que precisa melhorar?'}
                              </span>
                            </div>
                            <textarea
                              value={feedbackState.comment}
                              onChange={(e) => setFeedbackState({ ...feedbackState, comment: e.target.value })}
                              placeholder="Ex: A fonte está muito pequena..."
                              className="w-full text-xs p-2 border border-gray-300 rounded resize-none focus:ring-1 focus:ring-purple-500 outline-none"
                              rows={2}
                            />
                            <div className="flex justify-end gap-2 mt-1">
                              <button 
                                onClick={() => setFeedbackState(null)}
                                className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1"
                              >
                                Cancelar
                              </button>
                              <button 
                                onClick={submitFeedback}
                                disabled={isLearning || !feedbackState.comment.trim()}
                                className="text-xs bg-purple-600 text-white px-3 py-1 rounded hover:bg-purple-700 disabled:opacity-50 flex items-center gap-1 transition-colors"
                              >
                                {isLearning && <Loader2 size={12} className="animate-spin" />}
                                Aprender
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-500 font-medium">Avaliar slide:</span>
                            <div className="flex gap-1">
                              <button 
                                onClick={() => setFeedbackState({ index: idx, status: 'approved', comment: '' })}
                                className="flex items-center gap-1 text-xs text-gray-600 hover:text-green-700 hover:bg-green-50 px-2 py-1.5 rounded transition-colors"
                              >
                                <ThumbsUp size={14} /> Gostei
                              </button>
                              <button 
                                onClick={() => setFeedbackState({ index: idx, status: 'rejected', comment: '' })}
                                className="flex items-center gap-1 text-xs text-gray-600 hover:text-red-700 hover:bg-red-50 px-2 py-1.5 rounded transition-colors"
                              >
                                <ThumbsDown size={14} /> Não Gostei
                              </button>
                            </div>
                          </div>
                        )}
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
            )
          )}
          </div>
        </div>
      </div>

      {/* History Section */}
      {history.length > 0 && (
        <div className="mt-12">
          <div className="flex items-center space-x-2 mb-6">
            <Clock className="text-gray-500" size={24} />
            <h2 className="text-2xl font-bold text-gray-900">Histórico de Gerações</h2>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {history.map(item => {
              const styleName = styles.find(s => s.id === item.styleId)?.name || 'Estilo Desconhecido';
              
              return (
                <div 
                  key={item.id} 
                  onClick={() => loadFromHistory(item)}
                  className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 cursor-pointer hover:border-purple-500 hover:shadow-md transition-all group relative"
                >
                  <div className="aspect-[3/4] bg-gray-100 rounded-lg mb-4 overflow-hidden relative border border-gray-100">
                    {item.slides[0]?.imageUrl ? (
                      <img src={item.slides[0].imageUrl} alt="Capa" className="w-full h-full object-cover" />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <ImageIcon className="text-gray-300" size={32} />
                      </div>
                    )}
                    
                    <button 
                      onClick={(e) => deleteHistoryItem(e, item.id)}
                      className="absolute top-2 right-2 bg-white/90 text-gray-500 hover:text-red-500 p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                      title="Excluir do histórico"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-purple-600">{styleName}</p>
                    <p className="text-sm font-medium text-gray-900 line-clamp-2" title={item.content}>
                      {item.content}
                    </p>
                    <p className="text-xs text-gray-500 pt-1">
                      {new Date(item.timestamp).toLocaleString('pt-BR', { 
                        day: '2-digit', month: '2-digit', year: '2-digit', 
                        hour: '2-digit', minute: '2-digit' 
                      })}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
