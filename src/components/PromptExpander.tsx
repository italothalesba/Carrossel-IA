import React, { useState } from 'react';
import { Copy, Download, Sparkles, Loader2, Check, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '../lib/utils';
import { expandPrompt } from '../services/prompt-expansion';

interface PromptExpanderProps {
  originalPrompt: string;
  styleDNA: any;
  slideTitle: string;
  slideText: string;
  slideType: 'cover' | 'content' | 'cta';
  slideNumber: number;
  onReviewed?: (prompt: string) => void;
}

export default function PromptExpander({ originalPrompt, styleDNA, slideTitle, slideText, slideType, slideNumber, onReviewed }: PromptExpanderProps) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [expanding, setExpanding] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showFull, setShowFull] = useState(false);

  const handleExpand = () => {
    setExpanding(true);
    setTimeout(() => {
      const result = expandPrompt(originalPrompt, styleDNA, slideTitle, slideText, slideType, slideNumber);
      setExpanded(result.expandedPrompt);
      setExpanding(false);
      onReviewed?.(result.expandedPrompt);
    }, 500);
  };

  const handleCopy = async () => {
    const text = expanded || originalPrompt;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const text = expanded || originalPrompt;
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `prompt-slide-${slideNumber}-${slideType}-${Date.now()}.txt`;
    a.click();
  };

  if (!originalPrompt) return null;

  const displayText = expanded || originalPrompt;
  const charCount = displayText.length;
  const isExpanded = !!expanded;

  return (
    <div className="bg-gray-50 rounded-lg p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-gray-600 uppercase">
            {isExpanded ? '✨ Prompt Expandido' : 'Prompt Original'}
          </span>
          <span className={cn(
            "text-xs px-2 py-0.5 rounded-full font-medium",
            charCount >= 50000 ? "bg-green-100 text-green-700" :
            charCount >= 10000 ? "bg-blue-100 text-blue-700" :
            "bg-gray-100 text-gray-600"
          )}>
            {charCount.toLocaleString()} chars
          </span>
        </div>

        <div className="flex gap-2">
          {/* Expand button */}
          {!isExpanded && (
            <button
              onClick={handleExpand}
              disabled={expanding}
              className="flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded hover:opacity-90 text-xs disabled:opacity-50"
            >
              {expanding ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
              {expanding ? 'Expandindo...' : '✨ Expandir 100K+'}
            </button>
          )}

          {/* Toggle full text */}
          {isExpanded && (
            <button
              onClick={() => setShowFull(!showFull)}
              className="flex items-center gap-1 px-3 py-1.5 bg-gray-600 text-white rounded hover:bg-gray-700 text-xs"
            >
              {showFull ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              {showFull ? 'Resumir' : 'Ver completo'}
            </button>
          )}

          {/* Copy */}
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 px-3 py-1.5 bg-purple-600 text-white rounded hover:bg-purple-700 text-xs"
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? 'Copiado!' : 'Copiar'}
          </button>

          {/* Download */}
          <button
            onClick={handleDownload}
            className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 text-xs"
          >
            <Download size={14} />
            Baixar
          </button>
        </div>
      </div>

      {/* Prompt content */}
      <div className="bg-white rounded border max-h-96 overflow-y-auto">
        <pre className="text-xs text-gray-800 p-3 whitespace-pre-wrap break-all font-mono">
          {showFull || !isExpanded ? displayText : displayText.substring(0, 2000) + '...'}
        </pre>
      </div>

      {isExpanded && !showFull && (
        <p className="text-xs text-gray-500 text-center">
          Mostrando 2.000 de {charCount.toLocaleString()} caracteres. Clique "Ver completo" para ver tudo.
        </p>
      )}
    </div>
  );
}
