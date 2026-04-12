import React from 'react';
import { Cpu, Image, Zap, Clock, Gauge, Check } from 'lucide-react';
import { TEXT_MODELS, IMAGE_MODELS, loadSelectedModels, saveSelectedModels, SelectedModels } from '../config/ai-models';
import { cn } from '../lib/utils';

interface ModelSelectorProps {
  onModelChange?: (models: SelectedModels) => void;
}

export default function ModelSelector({ onModelChange }: ModelSelectorProps) {
  const [selectedModels, setSelectedModels] = React.useState<SelectedModels>(loadSelectedModels);
  const [isOpen, setIsOpen] = React.useState(false);

  const handleSelectTextModel = (modelId: string) => {
    const newModels = { ...selectedModels, textModel: modelId };
    setSelectedModels(newModels);
    saveSelectedModels(newModels);
    onModelChange?.(newModels);
  };

  const handleSelectImageModel = (modelId: string) => {
    const newModels = { ...selectedModels, imageModel: modelId };
    setSelectedModels(newModels);
    saveSelectedModels(newModels);
    onModelChange?.(newModels);
  };

  const getSpeedIcon = (speed: 'fast' | 'medium' | 'slow') => {
    switch (speed) {
      case 'fast': return <Zap size={14} className="text-green-500" />;
      case 'medium': return <Clock size={14} className="text-yellow-500" />;
      case 'slow': return <Gauge size={14} className="text-red-500" />;
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 md:px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <Cpu size={20} className="text-purple-600" />
          <div className="text-left">
            <h3 className="text-sm font-semibold text-gray-900">Modelos de IA</h3>
            <p className="text-xs text-gray-500">Escolha quais modelos usar</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
              {TEXT_MODELS.find(m => m.id === selectedModels.textModel)?.name || 'Auto'}
            </span>
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
              {IMAGE_MODELS.find(m => m.id === selectedModels.imageModel)?.name || 'Auto'}
            </span>
          </div>
          <svg
            className={cn("w-5 h-5 transition-transform", isOpen && "rotate-180")}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* Content */}
      {isOpen && (
        <div className="px-4 md:px-6 pb-6 space-y-6 border-t border-gray-200">
          {/* Text Models */}
          <div className="pt-4">
            <label className="block text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
              <Cpu size={16} className="text-purple-600" />
              Modelo de TEXTO (Geração de Conteúdo)
            </label>
            <div className="grid gap-2 max-h-80 overflow-y-auto">
              {TEXT_MODELS.map(model => {
                const isSelected = selectedModels.textModel === model.id;
                return (
                  <button
                    key={model.id}
                    onClick={() => handleSelectTextModel(model.id)}
                    className={cn(
                      "p-3 rounded-lg border-2 transition-all text-left",
                      isSelected
                        ? "border-purple-500 bg-purple-50 shadow-sm"
                        : "border-gray-200 hover:border-purple-300 hover:bg-gray-50"
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {isSelected && <Check size={16} className="text-purple-600" />}
                          <span className="font-medium text-sm text-gray-900">{model.name}</span>
                        </div>
                        <p className="text-xs text-gray-600">{model.description}</p>
                      </div>
                      <div className="flex gap-1 flex-shrink-0">
                        {getSpeedIcon(model.speed)}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Image Models */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
              <Image size={16} className="text-blue-600" />
              Modelo de IMAGEM (Geração de Slides)
            </label>
            <div className="grid gap-2 max-h-60 overflow-y-auto">
              {IMAGE_MODELS.map(model => {
                const isSelected = selectedModels.imageModel === model.id;
                return (
                  <button
                    key={model.id}
                    onClick={() => handleSelectImageModel(model.id)}
                    className={cn(
                      "p-3 rounded-lg border-2 transition-all text-left",
                      isSelected
                        ? "border-blue-500 bg-blue-50 shadow-sm"
                        : "border-gray-200 hover:border-blue-300 hover:bg-gray-50"
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {isSelected && <Check size={16} className="text-blue-600" />}
                          <span className="font-medium text-sm text-gray-900">{model.name}</span>
                        </div>
                        <p className="text-xs text-gray-600">{model.description}</p>
                      </div>
                      <div className="flex gap-1 flex-shrink-0">
                        {getSpeedIcon(model.speed)}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Info Box */}
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-4 rounded-lg border border-purple-200">
            <p className="text-xs text-gray-700">
              <strong className="text-purple-900">💡 Dica:</strong> O modo "Rotação Automática" escolhe o melhor provider disponível. 
              Se quiser forçar um modelo específico, selecione acima. As escolhas são salvas automaticamente.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
