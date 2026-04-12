import { useState, useEffect, useRef } from 'react';
import { X, Send, Sparkles, Lightbulb, CheckCircle } from 'lucide-react';
import { StyleData } from '../services/ai';
import { ChatMessage, sendChatMessage } from '../services/chat';
import { cn } from '../lib/utils';

interface StyleChatPanelProps {
  style: StyleData;
  onClose: () => void;
  onStyleUpdate?: (updates: {
    coverStyle?: string;
    contentStyle?: string;
    ctaStyle?: string;
    extraInstructions?: string;
    colors?: string;
    audience?: string;
    tone?: string;
  }) => void;
  recentGenerations?: Array<{
    slideType: string;
    title: string;
    text: string;
    imagePrompt: string;
    timestamp: number;
  }>;
  previousFeedback?: Array<{
    status: 'approved' | 'rejected';
    comment: string;
    timestamp: number;
  }>;
}

export function StyleChatPanel({ 
  style, 
  onClose, 
  onStyleUpdate,
  recentGenerations = [],
  previousFeedback = []
}: StyleChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [slideType, setSlideType] = useState<'cover' | 'content' | 'cta' | 'all'>('all');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Mensagem inicial da IA
  useEffect(() => {
    const welcomeMessage: ChatMessage = {
      id: 'welcome',
      role: 'assistant',
      content: `Olá! 👋 Sou seu consultor de estilo para "${style.name}". 

Posso te ajudar a:
• Aprimorar a descrição do estilo baseado no seu feedback
• Sugerir melhorias para capas, conteúdo ou CTAs
• Aprender padrões das suas gerações anteriores
• Ajustar cores, tipografia e layout

Me conta o que você gostaria de melhorar ou ajustar no seu estilo!`,
      timestamp: Date.now(),
      suggestions: [
        'Melhorar a descrição do estilo de capa',
        'Ajustar as cores da marca',
        'Sugerir melhorias baseadas no histórico',
        'Refinar o tom e público-alvo'
      ]
    };
    setMessages([welcomeMessage]);
  }, [style.name]);

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    try {
      const conversationHistory = messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      const { response, styleUpdates } = await sendChatMessage({
        message: userMessage.content,
        style,
        slideType,
        conversationHistory,
        context: {
          recentGenerations,
          previousFeedback
        }
      });

      setMessages(prev => [...prev, response]);

      // Aplicar atualizações de estilo se houver
      if (styleUpdates && onStyleUpdate) {
        const hasUpdates = Object.values(styleUpdates).some(val => val !== null && val !== undefined);
        if (hasUpdates) {
          onStyleUpdate(styleUpdates);
        }
      }
    } catch (error) {
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Desculpe, ocorreu um erro ao processar sua mensagem. Tente novamente em alguns segundos.',
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, errorMessage]);
      console.error('Chat error:', error);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSuggestionClick = async (suggestion: string) => {
    setInput(suggestion);
    // Auto-enviar após pequeno delay
    setTimeout(() => {
      setInput(suggestion);
    }, 100);
  };

  const lastMessage = messages[messages.length - 1];
  const hasSuggestions = lastMessage?.role === 'assistant' && 
                         lastMessage?.suggestions && 
                         lastMessage.suggestions.length > 0;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full flex items-center justify-center">
              <Sparkles size={20} className="text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Chat de Aprendizado</h2>
              <p className="text-sm text-gray-500">Estilo: {style.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Slide Type Selector */}
        <div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-600 font-medium">Foco:</span>
            <div className="flex gap-1">
              {(['all', 'cover', 'content', 'cta'] as const).map(type => (
                <button
                  key={type}
                  onClick={() => setSlideType(type)}
                  className={cn(
                    "px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
                    slideType === type
                      ? "bg-purple-600 text-white"
                      : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-300"
                  )}
                >
                  {type === 'all' ? 'Todos' : type === 'cover' ? 'Capa' : type === 'content' ? 'Conteúdo' : 'CTA'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "flex",
                message.role === 'user' ? "justify-end" : "justify-start"
              )}
            >
              <div
                className={cn(
                  "max-w-[80%] rounded-2xl px-4 py-3",
                  message.role === 'user'
                    ? "bg-purple-600 text-white"
                    : "bg-gray-100 text-gray-900"
                )}
              >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                
                {/* Applied Changes Indicator */}
                {message.appliedChanges && (
                  <div className="mt-2 flex items-center gap-1 text-xs text-green-600">
                    <CheckCircle size={12} />
                    <span>Alterações aplicadas ao estilo</span>
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Suggestions */}
          {hasSuggestions && lastMessage.suggestions && (
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Lightbulb size={16} />
                <span>Sugestões:</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {lastMessage.suggestions.map((suggestion, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="px-3 py-2 bg-white border border-purple-200 text-purple-700 rounded-lg text-sm hover:bg-purple-50 hover:border-purple-400 transition-all"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Typing Indicator */}
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-gray-100 rounded-2xl px-4 py-3">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Digite sua mensagem..."
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent"
              disabled={isTyping}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isTyping}
              className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
