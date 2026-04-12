/**
 * Similarity Tracker - Termômetro de Similaridade de Estilo
 */
import { get, set } from 'idb-keyval';

export interface SlideScore {
  carouselId: string;
  slideIndex: number;
  slideType: 'cover' | 'content' | 'cta';
  score: number;
  timestamp: number;
  styleId: string;
  styleName: string;
  modelName: string;
  imagePromptUsed: string;
  usedStyleDNA: boolean;
  feedbackComments: string[];
}

export interface CarouselScore {
  carouselId: string;
  content: string;
  styleId: string;
  styleName: string;
  timestamp: number;
  slides: SlideScore[];
  averageScore: number;
}

export interface StyleAverage { average: number; count: number; styleName: string; trend: 'improving' | 'stable' | 'declining'; }
export interface ModelAverage { average: number; count: number; modelName: string; }

export interface ThermometerState {
  allSlideScores: SlideScore[];
  allCarouselScores: CarouselScore[];
  globalAverage: number;
  perStyleAverage: Record<string, StyleAverage>;
  perModelAverage: Record<string, ModelAverage>;
  perSlideTypeAverage: Record<string, { average: number; count: number; type: string }>;
  recentCarousels: CarouselScore[];
  recentSlides: SlideScore[];
}

class SimilarityTracker {
  private static instance: SimilarityTracker;
  private state: ThermometerState | null = null;

  static getInstance() { return this.instance || (this.instance = new SimilarityTracker()); }

  async load(): Promise<ThermometerState> {
    if (this.state) return this.state;
    try {
      const slides: SlideScore[] = (await get('sim_slides')) || [];
      const cars: CarouselScore[] = (await get('sim_carousels')) || [];
      this.state = {
        allSlideScores: slides, allCarouselScores: cars,
        globalAverage: slides.length ? slides.reduce((s, x) => s + x.score, 0) / slides.length : 0,
        perStyleAverage: this.calcStyleAvg(slides),
        perModelAverage: this.calcModelAvg(slides),
        perSlideTypeAverage: this.calcTypeAvg(slides),
        recentCarousels: cars.slice(0, 10),
        recentSlides: slides.slice(-20),
      };
    } catch (e) { this.state = this.emptyState(); }
    return this.state;
  }

  async save() {
    if (!this.state) return;
    await set('sim_slides', this.state.allSlideScores);
    await set('sim_carousels', this.state.allCarouselScores);
  }

  async addSlideScore(score: SlideScore) {
    const s = await this.load();
    s.allSlideScores.push(score);
    s.recentSlides = s.allSlideScores.slice(-20);
    s.globalAverage = this.calcGlobal(s.allSlideScores);
    s.perStyleAverage = this.calcStyleAvg(s.allSlideScores);
    s.perModelAverage = this.calcModelAvg(s.allSlideScores);
    s.perSlideTypeAverage = this.calcTypeAvg(s.allSlideScores);
    await this.save();
  }

  async addCarousel(score: CarouselScore) {
    const s = await this.load();
    s.allCarouselScores.push(score);
    s.recentCarousels = s.allCarouselScores.slice(0, 10);
    for (const slide of score.slides) await this.addSlideScore(slide);
  }

  async getInsights(): Promise<string[]> {
    const st = await this.load();
    const ins: string[] = [];
    for (const [, avg] of Object.entries(st.perStyleAverage)) {
      if (avg.average < 70 && avg.count >= 3) ins.push(`⚠️ "${avg.styleName}" similaridade baixa (${avg.average.toFixed(1)}). Adicione mais imagens de referência.`);
    }
    const best = Object.values(st.perModelAverage).filter(m => m.count >= 3).sort((a, b) => b.average - a.average)[0];
    if (best) ins.push(`✅ "${best.modelName}" melhor modelo (${best.average.toFixed(1)} média).`);
    for (const [type, avg] of Object.entries(st.perSlideTypeAverage)) {
      if (avg.average < 72 && avg.count >= 3) ins.push(`📊 ${type} abaixo da média (${avg.average.toFixed(1)}).`);
    }
    return ins;
  }

  private calcGlobal(scores: SlideScore[]) { return scores.length ? scores.reduce((s, x) => s + x.score, 0) / scores.length : 0; }
  private calcStyleAvg(scores: SlideScore[]): Record<string, StyleAverage> {
    const g: Record<string, number[]> = {}; const n: Record<string, string> = {};
    scores.forEach(s => { if (!g[s.styleId]) g[s.styleId] = []; g[s.styleId].push(s.score); n[s.styleId] = s.styleName; });
    const r: Record<string, StyleAverage> = {};
    for (const [id, sc] of Object.entries(g)) {
      const avg = sc.reduce((a, b) => a + b, 0) / sc.length;
      r[id] = { average: avg, count: sc.length, styleName: n[id], trend: sc.length >= 5 ? (sc.slice(-2).reduce((a, b) => a + b, 0) / 2 - sc.slice(0, 3).reduce((a, b) => a + b, 0) / 3 > 3 ? 'improving' : sc.slice(-2).reduce((a, b) => a + b, 0) / 2 - sc.slice(0, 3).reduce((a, b) => a + b, 0) / 3 < -3 ? 'declining' : 'stable') : 'stable' };
    }
    return r;
  }
  private calcModelAvg(scores: SlideScore[]): Record<string, ModelAverage> {
    const g: Record<string, number[]> = {};
    scores.forEach(s => { if (!g[s.modelName]) g[s.modelName] = []; g[s.modelName].push(s.score); });
    const r: Record<string, ModelAverage> = {};
    for (const [name, sc] of Object.entries(g)) r[name] = { average: sc.reduce((a, b) => a + b, 0) / sc.length, count: sc.length, modelName: name };
    return r;
  }
  private calcTypeAvg(scores: SlideScore[]): Record<string, { average: number; count: number; type: string }> {
    const g: Record<string, number[]> = {};
    scores.forEach(s => { if (!g[s.slideType]) g[s.slideType] = []; g[s.slideType].push(s.score); });
    const r: Record<string, { average: number; count: number; type: string }> = {};
    for (const [type, sc] of Object.entries(g)) r[type] = { average: sc.reduce((a, b) => a + b, 0) / sc.length, count: sc.length, type };
    return r;
  }
  private emptyState(): ThermometerState {
    return { allSlideScores: [], allCarouselScores: [], globalAverage: 0, perStyleAverage: {}, perModelAverage: {}, perSlideTypeAverage: {}, recentCarousels: [], recentSlides: [] };
  }
}

export const similarityTracker = SimilarityTracker.getInstance();
