/**
 * Skill Diagramador
 * Converte conteúdo bruto em estrutura de 4 slides para carrossel
 */

import { BaseSkill } from './base';
import { SkillContext, SkillResult, DiagrammerInput, DiagrammerOutput } from './types';
import { textGeneration, parseJsonOrThrow } from './text-generation';
import { SlideContent } from '../services/ai';
import { createDiagrammerPrompt } from '../config/optimized-prompts';
import { modelContext } from '../services/model-context';

export class DiagrammerSkill extends BaseSkill<DiagrammerInput, DiagrammerOutput> {
  constructor() {
    super({
      name: 'Diagramador',
      description: 'Estrutura conteúdo bruto em 4 slides para carrossel Instagram',
      model: 'Qwen/Qwen2.5-Coder-7B-Instruct',
      provider: 'openrouter',
      temperature: 0.7,
      maxTokens: 4096,
    });
  }

  validateInput(input: DiagrammerInput): boolean {
    return super.validateInput(input) &&
           typeof input.content === 'string' &&
           input.content.length > 0 &&
           typeof input.styleContext === 'string';
  }

  validateOutput(output: DiagrammerOutput): boolean {
    return super.validateOutput(output) &&
           Array.isArray(output.slides) &&
           output.slides.length === 4;
  }

  async execute(input: DiagrammerInput, context?: SkillContext): Promise<SkillResult<DiagrammerOutput>> {
    try {
      if (!this.validateInput(input)) {
        return this.createErrorResult('Invalid input for DiagrammerSkill');
      }

      const mood = (input as any).mood || 'estrategico';
      const prompt = createDiagrammerPrompt(input.content, input.styleContext, mood);

      // Obter modelo de texto selecionado pelo usuário
      const selectedTextModel = modelContext.getTextModel();
      const useModel = selectedTextModel !== 'auto-rotate' ? selectedTextModel : this.config.model;

      const startTime = Date.now();
      const response = await textGeneration(useModel, prompt, {
        max_new_tokens: this.config.maxTokens,
        temperature: this.config.temperature,
        return_full_text: false
      }, selectedTextModel !== 'auto-rotate' ? selectedTextModel : undefined);

      console.log('[DiagrammerSkill] Raw response:', response.generated_text?.substring(0, 500));

      let slides: any;

      // TENTATIVA 0: Verificar se é objeto com propriedade de slides (suporte múltiplos formatos)
      try {
        const parsed = JSON.parse(response.generated_text);
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
          // Suporte para múltiplos nomes de chave que a IA pode retornar
          const slidesArray = parsed.slides || parsed.carrossel || parsed.carousel || parsed.data || parsed.slides_data || parsed.content || null;
          if (slidesArray && Array.isArray(slidesArray)) {
            const key = parsed.slides ? 'slides' : parsed.carrossel ? 'carrossel' : parsed.carousel ? 'carousel' : parsed.data ? 'data' : 'unknown';
            console.log(`[DiagrammerSkill] Detected object with "${key}" property (${slidesArray.length} items), extracting array`);
            slides = slidesArray;
          }
        }
      } catch {
        // Não é JSON válido ou não tem propriedade esperada, continua para próxima tentativa
      }

      // TENTATIVA 1: Extrair JSON do texto ignorando "thinking" em inglês
      if (!slides) {
        try {
          slides = parseJsonOrThrow<SlideContent[]>(
            response.generated_text,
            'DiagrammerSkill'
          );

          // Se parseJsonOrThrow retornou um objeto com chave de slides, extrair
          if (slides && typeof slides === 'object' && !Array.isArray(slides)) {
            const extracted = (slides as any).slides || (slides as any).carrossel || (slides as any).carousel || (slides as any).data || null;
            if (extracted && Array.isArray(extracted)) {
              console.log(`[DiagrammerSkill] parseJsonOrThrow returned object, extracted slides from nested key`);
              slides = extracted;
            }
          }
        } catch (parseError: any) {
          console.log('[DiagrammerSkill] Normal parse failed, trying fallback...');

          // TENTATIVA 2: Extrair array de texto com markdown
          const arrayMatch = response.generated_text?.match(/```(?:json)?\s*([\s\S]*?)```/);
          if (arrayMatch) {
            try {
              let parsed = JSON.parse(arrayMatch[1].trim());
              // Se é um objeto, extrair o array de slides
              if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
                parsed = parsed.slides || parsed.carrossel || parsed.carousel || parsed.data || parsed;
              }
              if (Array.isArray(parsed)) {
                slides = parsed;
                console.log('[DiagrammerSkill] Extracted from markdown block');
              }
            } catch {
              // Continua para próxima tentativa
            }
          }

          // TENTATIVA 3: Encontrar PRIMEIRO [ e ÚLTIMO ] para ignorar texto de "thinking"
          if (!slides || !Array.isArray(slides)) {
            console.log('[DiagrammerSkill] Trying to extract array from text with thinking...');
            const rawText = response.generated_text;

            // Estratégia: encontrar primeiro [ e último ] para ignorar texto antes/depois
            const firstBracket = rawText.indexOf('[');
            const lastBracket = rawText.lastIndexOf(']');

            if (firstBracket !== -1 && lastBracket > firstBracket) {
              const extractedArray = rawText.substring(firstBracket, lastBracket + 1);
              console.log('[DiagrammerSkill] Extracted array from text, length:', extractedArray.length);

              try {
                let parsed = JSON.parse(extractedArray);
                // Se é um objeto, extrair o array de slides
                if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
                  parsed = parsed.slides || parsed.carrossel || parsed.carousel || parsed.data || parsed;
                }
                if (Array.isArray(parsed)) {
                  slides = parsed;
                  console.log('[DiagrammerSkill] Successfully parsed extracted array');
                } else {
                  slides = null;
                }
              } catch (e) {
                // Tenta reparar JSON
                console.log('[DiagrammerSkill] Extracted array parse failed, trying repair...');
                let fixedArray = extractedArray;

                // Remove trailing commas
                fixedArray = fixedArray.replace(/,\s*]/g, ']').replace(/,\s*}/g, '}');

                // Fecha chaves abertas
                const openBraces = (fixedArray.match(/{/g) || []).length;
                const closeBraces = (fixedArray.match(/}/g) || []).length;
                if (openBraces > closeBraces) {
                  fixedArray += '}'.repeat(openBraces - closeBraces);
                }

                const openBrackets = (fixedArray.match(/\[/g) || []).length;
                const closeBrackets = (fixedArray.match(/\]/g) || []).length;
                if (openBrackets > closeBrackets) {
                  fixedArray += ']'.repeat(openBrackets - closeBrackets);
                }

                try {
                  slides = JSON.parse(fixedArray);
                  if (Array.isArray(slides)) {
                    console.log('[DiagrammerSkill] Successfully repaired and parsed array');
                  } else {
                    slides = null;
                  }
                } catch {
                  slides = null;
                }
              }
            } else if (firstBracket !== -1 && lastBracket === -1) {
              // CASO CRÍTICO: JSON foi cortado (tem [ mas não tem ])
              console.log('[DiagrammerSkill] ⚠️ TRUNCATED JSON detected! Has [ but no closing ]');
              const truncatedText = rawText.substring(firstBracket);
              
              // Estratégia 1: Tentar encontrar o último objeto JSON completo e fechar o array
              let repaired = truncatedText;
              
              // Remove trailing commas
              repaired = repaired.replace(/,\s*$/gm, '');
              
              // Conta chaves abertas/fechadas
              const openBraces = (repaired.match(/{/g) || []).length;
              const closeBraces = (repaired.match(/}/g) || []).length;
              if (openBraces > closeBraces) {
                repaired += '}'.repeat(openBraces - closeBraces);
              }
              
              // Fecha o array
              repaired += ']';
              
              // Remove trailing commas antes de fechar
              repaired = repaired.replace(/,\s*]/g, ']');
              
              console.log('[DiagrammerSkill] Attempting to repair truncated JSON...');
              try {
                slides = JSON.parse(repaired);
                if (Array.isArray(slides)) {
                  console.log(`[DiagrammerSkill] ✅ Successfully repaired truncated JSON: ${slides.length} slides`);
                } else {
                  slides = null;
                }
              } catch {
                console.log('[DiagrammerSkill] Repair attempt failed, trying object extraction...');
                slides = null;
              }
            }
          }

          // TENTATIVA 4: Extrair objetos JSON individuais (funciona mesmo com JSON truncado)
          if (!slides || !Array.isArray(slides)) {
            console.log('[DiagrammerSkill] Trying to parse multiple objects...');
            const rawText = response.generated_text;

            // Remove markdown code blocks
            let cleaned = rawText.replace(/```(?:json)?/g, '').trim();

            // Encontra todos os objetos JSON (inclusive incompletos)
            const objects: any[] = [];
            let depth = 0;
            let startIdx = -1;
            let lastCompleteIdx = -1;

            for (let i = 0; i < cleaned.length; i++) {
              if (cleaned[i] === '{') {
                if (depth === 0) startIdx = i;
                depth++;
              } else if (cleaned[i] === '}') {
                depth--;
                if (depth === 0 && startIdx !== -1) {
                  try {
                    const obj = JSON.parse(cleaned.substring(startIdx, i + 1));
                    // Aceita objetos com title/titulo e text/texto
                    if ((obj.title || obj.titulo) && (obj.text || obj.texto)) {
                      // Normaliza propriedades
                      const normalized = {
                        title: obj.title || obj.titulo,
                        text: obj.text || obj.texto,
                        imagePrompt: obj.imagePrompt || obj.imageprompt || `Slide ${objects.length + 1} design`
                      };
                      objects.push(normalized);
                      lastCompleteIdx = i;
                    }
                  } catch {
                    // Ignora objeto inválido
                  }
                  startIdx = -1;
                }
              }
            }

            // Se encontrou objetos completos, usa-os
            if (objects.length > 0) {
              console.log(`[DiagrammerSkill] Extracted ${objects.length} complete objects`);
              slides = objects;
            } else {
              // TENTATIVA 4.5: Tenta reparar objeto truncado
              if (startIdx !== -1 && lastCompleteIdx === -1) {
                console.log('[DiagrammerSkill] Found incomplete object, attempting to repair...');
                const partialObj = cleaned.substring(startIdx);
                
                // Fecha chaves abertas
                const openBraces = (partialObj.match(/{/g) || []).length;
                const closeBraces = (partialObj.match(/}/g) || []).length;
                if (openBraces > closeBraces) {
                  const repaired = partialObj + '}'.repeat(openBraces - closeBraces);
                  
                  // Remove trailing commas
                  const fixed = repaired.replace(/,\s*$/gm, '').replace(/,\s*}/g, '}');
                  
                  try {
                    const obj = JSON.parse(fixed);
                    if ((obj.title || obj.titulo) && (obj.text || obj.texto)) {
                      const normalized = {
                        title: obj.title || obj.titulo,
                        text: obj.text || obj.texto,
                        imagePrompt: obj.imagePrompt || obj.imageprompt || `Slide ${objects.length + 1} design`
                      };
                      objects.push(normalized);
                      console.log('[DiagrammerSkill] ✅ Successfully repaired truncated object');
                      slides = objects;
                    }
                  } catch {
                    console.log('[DiagrammerSkill] Object repair failed');
                  }
                }
              }
            }

            if (!slides || !Array.isArray(slides)) {
              // TENTATIVA 5: Se é array de strings, converter para slides genéricos
              console.log('[DiagrammerSkill] Trying to parse as array of strings...');
              try {
                const stringArray = JSON.parse(
                  cleaned.substring(cleaned.indexOf('['), cleaned.lastIndexOf(']') + 1)
                );
                if (Array.isArray(stringArray) && typeof stringArray[0] === 'string') {
                  console.log(`[DiagrammerSkill] Got array of ${stringArray.length} strings, converting to slides`);
                  const slideTypes = ['Hook/Title', 'Development', 'Development', 'Conclusion/CTA'];
                  slides = stringArray.map((text: string, idx: number) => ({
                    title: `Slide ${idx + 1}`,
                    text: text.substring(0, 200),
                    imagePrompt: `Instagram ${slideTypes[idx] || 'content'} slide design`
                  }));
                }
              } catch {
                // Não é array de strings
              }
            }

            if (!slides || !Array.isArray(slides)) {
              throw new Error('Failed to parse slides from AI response');
            }
          }
        }
      }

      // Verificar se é array
      if (!Array.isArray(slides)) {
        console.error('[DiagrammerSkill] Response is not an array:', typeof slides, slides);
        throw new Error('AI response is not an array');
      }

      const latency = Date.now() - startTime;
      console.log('[DiagrammerSkill] Parsed slides:', slides.length);

      // Normalizar para exatamente 4 slides
      let normalizedSlides: SlideContent[] = [];
      
      if (slides.length < 4) {
        // Se tem menos de 4 slides, preencher com slides genéricos
        const slideTypes = ['Hook/Title', 'Development', 'Development', 'Conclusion/CTA'];
        normalizedSlides = [...slides];
        
        for (let i = normalizedSlides.length; i < 4; i++) {
          normalizedSlides.push({
            title: `Slide ${i + 1}`,
            text: `Conteúdo do slide ${i + 1}`,
            imagePrompt: `Generic ${slideTypes[i]} slide design`
          });
        }
        console.log('[DiagrammerSkill] Padded to 4 slides (was', slides.length, ')');
      } else if (slides.length > 4) {
        // Se tem mais de 4 slides, truncar para 4
        normalizedSlides = slides.slice(0, 4);
        console.log('[DiagrammerSkill] Truncated to 4 slides (was', slides.length, ')');
      } else {
        normalizedSlides = slides;
      }

      // Garantir que cada slide tenha as propriedades necessárias
      normalizedSlides = normalizedSlides.map((slide, idx) => ({
        title: (slide as any)?.title || (slide as any)?.titulo || `Slide ${idx + 1}`,
        text: (slide as any)?.text || (slide as any)?.texto || `Conteúdo do slide ${idx + 1}`,
        imagePrompt: (slide as any)?.imagePrompt || (slide as any)?.imageprompt || `Slide ${idx + 1} design`
      }));

      const result: DiagrammerOutput = { slides: normalizedSlides };

      return this.createSuccessResult(result, {
        model: this.config.model,
        provider: this.config.provider,
        latency
      });
    } catch (error) {
      return this.createErrorResult(
        error instanceof Error ? error.message : String(error)
      );
    }
  }
}
