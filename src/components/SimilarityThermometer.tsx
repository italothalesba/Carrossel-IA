import React from 'react';
import { Thermometer, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { similarityTracker, ThermometerState } from '../services/similarity-tracker';
import { cn } from '../lib/utils';

export default function SimilarityThermometer() {
  const [state, setState] = React.useState<ThermometerState | null>(null);
  const [insights, setInsights] = React.useState<string[]>([]);
  const [isOpen, setIsOpen] = React.useState(false);

  React.useEffect(() => {
    if (isOpen) {
      similarityTracker.load().then(setState);
      similarityTracker.getInsights().then(setInsights);
    }
  }, [isOpen]);

  if (!state) return null;

  const trendIcon = (trend: string) => {
    if (trend === 'improving') return <TrendingUp size={14} className="text-green-500" />;
    if (trend === 'declining') return <TrendingDown size={14} className="text-red-500" />;
    return <Minus size={14} className="text-gray-400" />;
  };

  const barColor = (score: number) => score >= 80 ? 'bg-green-500' : score >= 70 ? 'bg-yellow-500' : 'bg-red-500';

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <button onClick={() => setIsOpen(!isOpen)} className="w-full px-4 md:px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
        <div className="flex items-center gap-3">
          <Thermometer size={20} className="text-purple-600" />
          <div className="text-left">
            <h3 className="text-sm font-semibold text-gray-900">🌡️ Termômetro de Similaridade</h3>
            <p className="text-xs text-gray-500">{state.allSlideScores.length} slides avaliados</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-gray-900">{state.globalAverage.toFixed(1)}/100</span>
          <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div className={cn('h-full', barColor(state.globalAverage))} style={{ width: `${state.globalAverage}%` }} />
          </div>
        </div>
      </button>

      {isOpen && (
        <div className="px-4 md:px-6 pb-6 space-y-4 border-t border-gray-200">
          {/* Global */}
          <div>
            <h4 className="text-xs font-semibold text-gray-700 mb-2">🎯 MÉDIA GLOBAL</h4>
            <div className="flex items-center gap-3">
              <div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden">
                <div className={cn('h-full rounded-full transition-all', barColor(state.globalAverage))} style={{ width: `${state.globalAverage}%` }} />
              </div>
              <span className="text-sm font-bold">{state.globalAverage.toFixed(1)}</span>
            </div>
          </div>

          {/* Por Estilo */}
          {Object.keys(state.perStyleAverage).length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-gray-700 mb-2">📊 POR ESTILO</h4>
              <div className="space-y-1">
                {Object.entries(state.perStyleAverage).map(([id, avg]) => (
                  <div key={id} className="flex items-center gap-2 text-xs">
                    <span className="w-32 truncate">{avg.styleName}</span>
                    <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div className={cn('h-full rounded-full', barColor(avg.average))} style={{ width: `${avg.average}%` }} />
                    </div>
                    <span className="font-bold w-10 text-right">{avg.average.toFixed(1)}</span>
                    {trendIcon(avg.trend)}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Por Modelo */}
          {Object.keys(state.perModelAverage).length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-gray-700 mb-2">🤖 POR MODELO</h4>
              <div className="space-y-1">
                {Object.entries(state.perModelAverage).map(([name, avg]) => (
                  <div key={name} className="flex items-center gap-2 text-xs">
                    <span className="w-36 truncate">{avg.modelName}</span>
                    <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div className={cn('h-full rounded-full', barColor(avg.average))} style={{ width: `${avg.average}%` }} />
                    </div>
                    <span className="font-bold w-10 text-right">{avg.average.toFixed(1)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Insights */}
          {insights.length > 0 && (
            <div className="bg-purple-50 p-3 rounded-lg border border-purple-200">
              <h4 className="text-xs font-semibold text-purple-700 mb-2">💡 INSIGHTS</h4>
              <div className="space-y-1">
                {insights.map((ins, i) => (
                  <p key={i} className="text-xs text-purple-900">{ins}</p>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
