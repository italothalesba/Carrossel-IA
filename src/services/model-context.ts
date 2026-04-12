/**
 * Contexto Global de Modelos de IA
 * Armazena os modelos selecionados pelo usuário para uso em todo o pipeline
 */

import { SelectedModels, loadSelectedModels } from '../config/ai-models';

class ModelContext {
  private static instance: ModelContext;
  private selectedModels: SelectedModels;

  private constructor() {
    this.selectedModels = loadSelectedModels();
  }

  static getInstance(): ModelContext {
    if (!ModelContext.instance) {
      ModelContext.instance = new ModelContext();
    }
    return ModelContext.instance;
  }

  getSelectedModels(): SelectedModels {
    return this.selectedModels;
  }

  updateModels(models: SelectedModels) {
    this.selectedModels = models;
  }

  getTextModel(): string {
    return this.selectedModels.textModel;
  }

  getImageModel(): string {
    return this.selectedModels.imageModel;
  }
}

export const modelContext = ModelContext.getInstance();
