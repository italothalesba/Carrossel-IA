import React from 'react';
import { Star, MessageSquare } from 'lucide-react';
import { cn } from '../lib/utils';
import { similarityTracker, SlideScore } from '../services/similarity-tracker';

interface SlideRatingProps {
  slideIndex: number;
  slideType: 'cover' | 'content' | 'cta';
  carouselId: string;
  styleId: string;
  styleName: string;
  modelName: string;
  imagePrompt: string;
  usedStyleDNA: boolean;
  onRated?: (score: number) => void;
}

export default function SlideRating({ slideIndex, slideType, carouselId, styleId, styleName, modelName, imagePrompt, usedStyleDNA, onRated }: SlideRatingProps) {
  const [score, setScore] = React.useState<number | null>(null);
  const [comment, setComment] = React.useState('');
  const [saved, setSaved] = React.useState(false);

  const handleSubmit = async () => {
    if (score === null) return;
    const slideScore: SlideScore = {
      carouselId, slideIndex, slideType, score,
      timestamp: Date.now(), styleId, styleName, modelName,
      imagePromptUsed: imagePrompt, usedStyleDNA,
      feedbackComments: comment ? [comment] : [],
    };
    await similarityTracker.addSlideScore(slideScore);
    setSaved(true);
    onRated?.(score);
  };

  if (saved) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
        <p className="text-sm font-medium text-green-700">✅ Avaliado: {score}/100</p>
        {comment && <p className="text-xs text-green-600 mt-1">💬 "{comment}"</p>}
      </div>
    );
  }

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-gray-700">Similaridade com o estilo:</span>
        <span className="text-sm font-bold text-gray-900">{score !== null ? `${score}/100` : '?'}</span>
      </div>

      {/* Stars */}
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map(star => (
          <button key={star} onClick={() => { setScore(star * 20); setSaved(false); }}
            className="transition-colors">
            <Star size={20} className={cn('transition-colors', score !== null && star * 20 <= score ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300')} />
          </button>
        ))}
      </div>

      {/* Comment */}
      <div className="flex gap-2 items-start">
        <MessageSquare size={14} className="text-gray-400 mt-1 flex-shrink-0" />
        <textarea value={comment} onChange={e => setComment(e.target.value)}
          placeholder="Comentário (opcional, acumula no aprendizado)..."
          className="flex-1 text-xs p-2 border border-gray-300 rounded resize-none focus:ring-1 focus:ring-purple-500 outline-none"
          rows={2} />
      </div>

      <button onClick={handleSubmit} disabled={score === null}
        className="w-full text-xs bg-purple-600 text-white px-3 py-1.5 rounded hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
        Salvar Avaliação
      </button>
    </div>
  );
}
