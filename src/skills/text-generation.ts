/**
 * Utilitário para geração de texto via IA
 * Centraliza a chamada de geração de texto para as Skills
 */

async function postAi(path: string, body: any): Promise<any> {
  const AI_API_BASE = '/api/ai';
  const response = await fetch(`${AI_API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`AI proxy error: ${response.status} ${errorText}`);
  }

  return response.json();
}

export async function textGeneration(model: string, inputs: string, parameters: any, preferredModel?: string): Promise<any> {
  return postAi('/text-generation', { model, inputs, parameters, preferredModel });
}

export function parseJsonOrThrow<T>(text: string, context: string): T {
  try {
    let cleanedText = text;

    // 1. Remove markdown code blocks
    const jsonBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonBlockMatch) {
      cleanedText = jsonBlockMatch[1].trim();
    }

    // 2. Estratégia agressiva: encontrar o PRIMEIRO { e o ÚLTIMO } para extrair JSON
    const firstBrace = cleanedText.indexOf('{');
    const lastBrace = cleanedText.lastIndexOf('}');
    
    if (firstBrace !== -1 && lastBrace > firstBrace) {
      cleanedText = cleanedText.substring(firstBrace, lastBrace + 1);
    } else {
      // Fallback: procurar por [ se não encontrar {
      const firstBracket = cleanedText.indexOf('[');
      const lastBracket = cleanedText.lastIndexOf(']');
      if (firstBracket !== -1 && lastBracket > firstBracket) {
        cleanedText = cleanedText.substring(firstBracket, lastBracket + 1);
      }
    }

    // 3. Tentar parse direto
    try {
      return JSON.parse(cleanedText) as T;
    } catch {
      // 4. JSON inválido - tentar reparar erros comuns
      let fixedText = cleanedText;
      
      // Remove trailing commas
      fixedText = fixedText.replace(/,\s*}/g, '}').replace(/,\s*]/g, ']');
      
      // Tenta fechar chaves abertas
      const openBraces = (fixedText.match(/{/g) || []).length;
      const closeBraces = (fixedText.match(/}/g) || []).length;
      if (openBraces > closeBraces) {
        fixedText += '}'.repeat(openBraces - closeBraces);
      }
      
      // Corrige aspas não-escapadas dentro de strings (ex: text": "... "titulo": "..." -> "titulo")
      fixedText = fixedText.replace(/"\s*:\s*"([^"]*)"\s*"/g, '": "$1"');
      
      try {
        return JSON.parse(fixedText) as T;
      } catch {
        // 5. Último recurso: tentar extrair campos específicos do Reviewer
        const titleMatch = cleanedText.match(/"title"\s*:\s*"([^"]*)"/);
        const textMatch = cleanedText.match(/"text"\s*:\s*"([^"]*)"/);
        
        if (titleMatch || textMatch) {
          return {
            title: titleMatch?.[1] || '',
            text: textMatch?.[1] || ''
          } as T;
        }
        
        throw new Error(`JSON parsing failed after multiple repair attempts`);
      }
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    // Não incluir o texto completo no erro para evitar poluição do log
    const snippet = text.length > 200 ? text.substring(0, 200) + '...' : text;
    throw new Error(`${context} failed to parse JSON. Error: ${message}. Response snippet: "${snippet}"`);
  }
}
