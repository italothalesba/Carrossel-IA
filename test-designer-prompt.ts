/**
 * Testa o prompt exato do Designer para ver por que está caindo no fallback genérico
 */

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const testDesignerPrompt = `Você é um Diretor de Arte Sênior.
O usuário relatou problemas com "cores de background embaralhadas".
Sua tarefa é escrever um 'imagePrompt' detalhado para este slide.
Regra 1: Defina UMA cor de background principal e clara baseada no Style Context. NÃO misture cores no fundo.
Regra 2: Siga rigorosamente o Style Context.
Regra 3: O prompt deve ser em inglês para o gerador de imagens.

Style Context:
  Audience: Profissionais de tecnologia
  Tone: Profissional, moderno, limpo
  Brand Colors: #FFFFFF, #F3F4F6, #6366F1
  Extra Instructions: None
  Cover Style: Design limpo com espaço em branco
  Content Style: Elementos geométricos simples
  CTA Style: Gradientes sutis em azul e roxo

Slide 1 Content:
Title: Título 1
Text: Conteúdo do slide 1

Retorne APENAS um JSON válido com apenas o 'imagePrompt' atualizado. Não inclua nenhum outro texto.`;

const promptLower = testDesignerPrompt.toLowerCase();

console.log('\n🔍 ANÁLISE DO PROMPT DO DESIGNER:\n');
console.log('Prompt length:', promptLower.length);
console.log('Contains "diretor de arte":', promptLower.includes('diretor de arte'));
console.log('Contains "imageprompt":', promptLower.includes('imageprompt'));
console.log('Contains "slides" (plural):', promptLower.includes('slides'));
console.log('Contains "managerfeedback":', promptLower.includes('managerfeedback'));

const matchesDesigner = (promptLower.includes('diretor de arte') || promptLower.includes('imageprompt')) && !promptLower.includes('slides') && !promptLower.includes('managerfeedback');

console.log('\n✅ Matches Designer fallback?', matchesDesigner);

if (!matchesDesigner) {
  console.log('\n❌ NÃO MATCH! Razão:');
  if (promptLower.includes('slides')) {
    console.log('   → Contém "slides" (verifique o prompt)');
    const slideIndices = [];
    let idx = promptLower.indexOf('slides');
    while (idx !== -1) {
      slideIndices.push(idx);
      idx = promptLower.indexOf('slides', idx + 1);
    }
    console.log('   → "slides" aparece nos índices:', slideIndices);
    
    // Mostra o contexto ao redor de cada ocorrência
    for (const i of slideIndices) {
      const start = Math.max(0, i - 50);
      const end = Math.min(promptLower.length, i + 50);
      console.log('   → Contexto:', '...' + promptLower.substring(start, end) + '...');
    }
  }
  if (promptLower.includes('managerfeedback')) {
    console.log('   → Contém "managerfeedback"');
  }
  if (!promptLower.includes('diretor de arte') && !promptLower.includes('imageprompt')) {
    console.log('   → NÃO contém "diretor de arte" nem "imageprompt"');
  }
}
