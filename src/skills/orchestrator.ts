/**
 * Orquestrador de Skills
 * Gerencia o pipeline de criação de carrossel usando Skills
 */

import { StyleData, SlideContent, DraftResponse } from '../services/ai';
import { StyleDNA } from '../services/styleDNA';
import { DiagrammerSkill } from './diagrammer';
import { ReviewerSkill } from './reviewer';
import { DesignerSkill } from './designer';
import { ManagerSkill } from './manager';
import { RefinerSkill } from './refiner';
import { DiagrammerInput, ReviewerInput, DesignerInput, ManagerInput, RefinerInput } from './types';

export class SkillOrchestrator {
  private diagrammer: DiagrammerSkill;
  private reviewer: ReviewerSkill;
  private designer: DesignerSkill;
  private manager: ManagerSkill;
  private refiner: RefinerSkill;

  constructor() {
    this.diagrammer = new DiagrammerSkill();
    this.reviewer = new ReviewerSkill();
    this.designer = new DesignerSkill();
    this.manager = new ManagerSkill();
    this.refiner = new RefinerSkill();
  }

  async draftCarouselContent(
    content: string,
    style: StyleData,
    onProgress?: (status: string) => void
  ): Promise<DraftResponse> {
    const styleContext = `
    Audience: ${style.metadata?.audience || 'General'}
    Tone: ${style.metadata?.tone || 'Neutral'}
    Brand Colors: ${style.metadata?.colors || 'Not specified'}
    Extra Instructions: ${style.metadata?.extraInstructions || 'None'}
    Cover Style: ${style.cover.styleDescription}
    Content Style: ${style.content.styleDescription}
    CTA Style: ${style.cta.styleDescription}
    `;

    // Skill 1: Diagramador
    if (onProgress) onProgress("Skill Diagramador: Estruturando o conteúdo em 4 slides...");
    
    const diagrammerInput: DiagrammerInput = {
      content,
      styleContext
    };

    const diagrammerResult = await this.diagrammer.execute(diagrammerInput);
    
    if (!diagrammerResult.success || !diagrammerResult.data) {
      throw new Error(`Diagramador falhou: ${diagrammerResult.error}`);
    }

    let slides = diagrammerResult.data.slides;

    // Skill 2: Revisor (Slide por Slide - SEQUENCIAL)
    // CORREÇÃO: Tolerante a falhas - se o reviewer falhar, usa o slide original
    if (onProgress) onProgress("Skill Revisor: Analisando ortografia rigorosamente slide por slide...");

    const reviewedSlides: SlideContent[] = [];

    for (let index = 0; index < slides.length; index++) {
      const slide = slides[index];

      if (onProgress) onProgress(`Skill Revisor: Slide ${index + 1}/${slides.length}...`);

      const reviewerInput: ReviewerInput = {
        slide,
        slideNumber: index + 1
      };

      const reviewerResult = await this.reviewer.execute(reviewerInput);

      if (!reviewerResult.success || !reviewerResult.data) {
        // CORREÇÃO: Não falhar o pipeline inteiro - usar slide original como fallback
        console.warn(`[ORCHESTRATOR] ⚠️ Revisor falhou no slide ${index + 1}: ${reviewerResult.error}`);
        console.warn(`[ORCHESTRATOR] Usando slide original como fallback (sem revisão)`);
        reviewedSlides.push(slide); // Usa slide original sem revisão
      } else {
        reviewedSlides.push(reviewerResult.data.correctedSlide);
      }

      // Delay entre slides para evitar rate limit
      if (index < slides.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 10000));
      }
    }

    // Skill 3: Designer (Slide por Slide - SEQUENCIAL)
    if (onProgress) onProgress("Skill Designer: Definindo visual de cada slide (foco em cores sólidas)...");

    const designedSlides: SlideContent[] = [];

    for (let index = 0; index < reviewedSlides.length; index++) {
      const slide = reviewedSlides[index];

      if (onProgress) onProgress(`Skill Designer: Slide ${index + 1}/${reviewedSlides.length}...`);

      const designerInput: DesignerInput = {
        slide,
        slideNumber: index + 1,
        styleContext,
        styleAssets: {
          logo: style.assets?.logo,
          background: style.assets?.background
        },
        styleDNA: (style as any).styleDNA || undefined,
        styleMetadata: {
          colors: style.metadata?.colors,
          extraInstructions: style.metadata?.extraInstructions,
          audience: style.metadata?.audience,
          tone: style.metadata?.tone
        }
      };

      const designerResult = await this.designer.execute(designerInput);

      if (!designerResult.success || !designerResult.data) {
        // Fallback: mantém o slide sem imagePrompt
        designedSlides.push(slide);
        console.warn(`[SkillOrchestrator] Designer falhou no slide ${index + 1}, usando fallback`);
      } else {
        designedSlides.push(designerResult.data.slide);
      }

      // Delay entre slides para evitar rate limit
      if (index < reviewedSlides.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 10000));
      }
    }

    // Skill 4: Gerente
    if (onProgress) onProgress("Skill Gerente: Fazendo a revisão geral final...");

    const managerInput: ManagerInput = {
      slides: designedSlides,
      styleContext
    };

    const managerResult = await this.manager.execute(managerInput);

    if (!managerResult.success || !managerResult.data) {
      throw new Error(`Gerente falhou: ${managerResult.error}`);
    }

    return managerResult.data.draftResponse;
  }

  async refineCarouselContent(
    draftSlides: SlideContent[],
    managerFeedback: string,
    userConsiderations: string,
    style: StyleData,
    onProgress?: (status: string) => void
  ): Promise<DraftResponse> {
    if (onProgress) onProgress("Skill Refinador: Aplicando suas considerações...");

    const refinerInput: RefinerInput = {
      slides: draftSlides,
      managerFeedback,
      userConsiderations,
      style
    };

    const refinerResult = await this.refiner.execute(refinerInput);

    if (!refinerResult.success || !refinerResult.data) {
      throw new Error(`Refinador falhou: ${refinerResult.error}`);
    }

    return refinerResult.data.draftResponse;
  }
}
