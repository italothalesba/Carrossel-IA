/**
 * ============================================================================
 * INTEGRATION: Prompt Templates + Prompt Expansion System
 * ============================================================================
 * 
 * Este arquivo conecta os novos templates de Diretor de Arte Sênior com o
 * sistema existente de prompt-expansion.ts, permitindo:
 * 
 * 1. Usar templates de criação de capas como base
 * 2. Expandir com Style DNA existente
 * 3. Gerar prompts ultra-detalhados combinando ambos os sistemas
 * 
 * USO: Importe as funções deste arquivo para usar o sistema integrado.
 */

import { expandPrompt } from './prompt-expansion';
import { 
  promptTemplatesCapas, 
  TemplateCapaKey, 
  preencherTemplateCapa,
  getVariaveisNecessarias 
} from '../config/prompt-templates-capas';
import {
  promptTemplatesAprendizado,
  TemplateAprendizadoKey,
  preencherTemplateAprendizado,
  getVariaveisNecessariasAprendizado
} from '../config/prompt-templates-aprendizado';

// ============================================================================
// TIPO DE SLIDE PARA EXPANSÃO
// ============================================================================

export type SlideTypeExpanded = 'cover' | 'content' | 'cta' | 'alerta' | 'educativo' | 'comunicado' | 'lista' | 'comparacao' | 'humano';

// ============================================================================
// INTEGRAÇÃO: TEMPLATE + EXPANSÃO
// ============================================================================

/**
 * Gera um prompt completo combinando template de Diretor de Arte com expansão de Style DNA
 * 
 * @param templateKey - Qual template de capa usar (ex: 'alertaUrgente', 'educativo')
 * @param variaveis - Variáveis para preencher o template
 * @param styleDNA - Style DNA existente do sistema
 * @param slideTitle - Título do slide
 * @param slideText - Texto do slide
 * @param slideType - Tipo do slide (cover, content, cta)
 * @param slideNumber - Número do slide (1-4)
 * @returns Prompt completo e expandido
 */
export function gerarPromptCompleto(
  templateKey: TemplateCapaKey,
  variaveis: Record<string, string>,
  styleDNA: any,
  slideTitle: string,
  slideText: string,
  slideType: 'cover' | 'content' | 'cta',
  slideNumber: number
): string {
  // Passo 1: Preencher o template de Diretor de Arte
  const promptBase = preencherTemplateCapa(templateKey, variaveis);
  
  // Passo 2: Expandir com Style DNA usando sistema existente
  const promptExpandido = expandPrompt(
    promptBase,
    styleDNA,
    slideTitle,
    slideText,
    slideType,
    slideNumber
  );
  
  // Passo 3: Combinar ambos em um prompt mestre
  const promptMestre = montarPromptMestre(promptBase, promptExpandido.expandedPrompt, slideType, slideNumber);
  
  return promptMestre;
}

/**
 * Monta o prompt mestre combinando template base com expansão técnica
 */
function montarPromptMestre(
  promptBase: string,
  promptExpandido: string,
  slideType: string,
  slideNumber: number
): string {
  return `══════════════════════════════════════════════════════════════
PROMPT MESTRE DE GERAÇÃO DE IMAGEM - SLIDE ${slideNumber} (${slideType.toUpperCase()})
SISTEMA INTEGRADO: DIRETOR DE ARTE SÊNIOR + PROMPT EXPANSION
══════════════════════════════════════════════════════════════

PARTE 1 - ESPECIFICAÇÃO DO DIRETOR DE ARTE:
${promptBase}

══════════════════════════════════════════════════════════════

PARTE 2 - ESPECIFICAÇÕES TÉCNICAS EXPANDIDAS:
${promptExpandido}

══════════════════════════════════════════════════════════════
INSTRUÇÕES FINAIS PARA O MODELO DE IA:
1. Siga TODAS as especificações da PARTE 1 (Diretor de Arte) como prioridade máxima
2. Use as especificações técnicas da PARTE 2 para garantir precisão de cores, tipografia e composição
3. Em caso de conflito entre as partes, priorize a PARTE 1 (intenção criativa)
4. Mantenha consistência visual com slides anteriores se este for parte de um carrossel
5. Gere a imagem em máxima qualidade (8k equivalente, nitidez extrema)
6. Garanta que TODO texto esteja em PORTUGUÊS DO BRASIL (PT-BR)
7. Não inclua elementos em inglês na imagem final
8. Use os parâmetros: --ar 9:16 --v 6.0 --style raw --q 2
══════════════════════════════════════════════════════════════`;
}

// ============================================================================
// INTEGRAÇÃO: APRENDIZADO + EXPANSÃO
// ============================================================================

/**
 * Analisa um design e gera prompt de replicação expandido
 * 
 * @param analiseJSON - Resultado da análise de DNA visual (JSON)
 * @param styleDNA - Style DNA existente do sistema
 * @returns Prompt de replicação expandido
 */
export function gerarPromptReplicacao(
  analiseJSON: any,
  styleDNA: any
): string {
  // Extrair informações clave da análise
  const estilo = analiseJSON.analiseDNAVisual?.[10]?.dnaEmUmaFrase || 'Estilo não identificado';
  const cores = analiseJSON.analiseDNAVisual?.[2]?.coresDominantes || [];
  const tipografia = analiseJSON.analiseDNAVisual?.[3]?.familiaPrincipal || 'Sans-serif';
  
  // Criar prompt base da análise
  const promptBase = `
REPLICAR ESTE ESTILO: ${estilo}

PALETA DE CORES IDENTIFICADA:
${cores.map((c: any) => `- ${c.cor}: ${c.funcao} (${c.percentualEstimado} do canvas)`).join('\n')}

TIPOGRAFIA: ${tipografia}

HIERARQUIA VISUAL:
- Nível 1 (Mais importante): ${analiseJSON.analiseDNAVisual?.[6]?.nivel1MaisImportante?.elemento || 'Não identificado'}
- Nível 2: ${analiseJSON.analiseDNAVisual?.[6]?.nivel2Importante?.elemento || 'Não identificado'}
- Nível 3: ${analiseJSON.analiseDNAVisual?.[6]?.nivel3Moderado?.elemento || 'Não identificado'}

ESTILO GERAL: ${analiseJSON.analiseDNAVisual?.[1]?.tipoDeDesign || 'Não identificado'}
TOM: ${analiseJSON.analiseDNAVisual?.[1]?.tomDeVoz || 'Não identificado'}
`;

  // Expandir com Style DNA
  const promptExpandido = expandPrompt(
    promptBase,
    styleDNA,
    'Título do Slide',
    'Texto de conteúdo do slide para expansão',
    'cover',
    1
  );
  
  return montarPromptReplicacao(promptBase, promptExpandido.expandedPrompt);
}

/**
 * Monta prompt de replicação completo
 */
function montarPromptReplicacao(promptBase: string, promptExpandido: string): string {
  return `══════════════════════════════════════════════════════════════
PROMPT DE REPLICAÇÃO DE ESTILO
SISTEMA INTEGRADO: ANÁLISE DE DNA + PROMPT EXPANSION
══════════════════════════════════════════════════════════════

PARTE 1 - DNA DO ESTYLE IDENTIFICADO:
${promptBase}

══════════════════════════════════════════════════════════════

PARTE 2 - ESPECIFICAÇÕES TÉCNICAS PARA REPLICAÇÃO:
${promptExpandido}

══════════════════════════════════════════════════════════════
INSTRUÇÕES:
1. Replique o estilo descrito na PARTE 1 com precisão
2. Use as especificações técnicas da PARTE 2 para garantir fidelidade
3. Mantenha TODAS as características do estilo original
4. Adapte o conteúdo mantendo a identidade visual
5. Parâmetros: --ar 9:16 --v 6.0 --style raw --q 2
══════════════════════════════════════════════════════════════`;
}

// ============================================================================
// HELPERS DE VARIÁVEIS
// ============================================================================

/**
 * Gera valores default para todas as variáveis de um template
 * Útil para ter um ponto de partida rápido
 */
export function gerarVariaveisDefault(templateKey: TemplateCapaKey): Record<string, string> {
  const variaveis: Record<string, string> = {};
  const necessarias = getVariaveisNecessarias(templateKey);
  
  // Mapa de valores default por tipo de variável
  const defaults: Record<string, string> = {
    // Cores
    COR_FUNDO_PRIMARIA: 'branco puro #FFFFFF',
    COR_TEXTO_FUNDO: 'cinza claro #E5E7EB',
    COR_MARCA_AGUA: 'cinza',
    COR_PLACA_ALERTA: 'amarela',
    COR_TEXTO_PLACA: 'preta sólida #000000',
    COR_TARJAS: 'Amarelo-Ocre #D49A00',
    COR_TEXTO_TARJAS: 'branco puro #FFFFFF',
    COR_BORDA: 'dourada #D97706',
    COR_ICONE: 'dourado #D97706',
    COR_CABECALHO: 'azul marinho #1E3A8A',
    COR_TEXTO_CABECALHO: 'branco #FFFFFF',
    COR_SUBTITULO: 'cinza escuro #6B7280',
    COR_ICONES: 'azul médio #3B82F6',
    COR_PILULA: 'azul escuro #1E40AF',
    COR_TEXTO_INDICADOR: 'branco #FFFFFF',
    COR_FAIXA_RODAPE: 'cinza claro #F3F4F6',
    COR_TEXTO_RODAPE: 'cinza escuro #374151',
    COR_GRADIENTE_1: '#1E3A8A',
    COR_GRADIENTE_2: '#3B82F6',
    COR_FUNDO_BADGE: 'vermelho vivo #EF4444',
    COR_NUMERO: 'branco #FFFFFF',
    COR_ITEM: 'cinza escuro #374151',
    COR_CTA: 'azul #3B82F6',
    COR_LADO_A: 'vermelho claro #FEE2E2',
    COR_LADO_B: 'verde claro #D1FAE5',
    COR_PREDOMINANTE_A: 'vermelho #DC2626',
    COR_PREDOMINANTE_B: 'verde #10B981',
    COR_VERSUS: 'amarelo #F59E0B',
    COR_TEXTO_VERSUS: 'preto #000000',
    COR_SELLO: 'dourado #D97706',
    COR_FAIXA_CABECALHO: 'azul marinho #1E3A8A',
    COR_TEXTO_FAIXA: 'branco #FFFFFF',
    COR_LINHA_DIVISAO: 'cinza médio #9CA3AF',
    COR_FUNDO_LADO_A: 'vermelho claro #FEE2E2',
    COR_FUNDO_LADO_B: 'verde claro #D1FAE5',
    COR_APOIO_A: 'vermelho #DC2626',
    COR_APOIO_B: 'verde #059669',
    COR_RELEVO: 'dourado',
    COR_LINHA_RODAPE: 'cinza claro #E5E7EB',
    COR_INDICADOR: 'azul #3B82F6',
    COR_TEXTO_INDICADOR: 'branco #FFFFFF',
    
    // Textos
    TEXTO_MARCA_AGUA: 'ALFA',
    TEXTO_PLACA_ALERTA: 'ALERTA MÁXIMO',
    TEXTO_CABECALHO: 'GUIA COMPLETO',
    TEXTO_SUBTITULO: 'Tudo que você precisa saber',
    TEXTO_INDICADOR: 'Arraste para o lado →',
    TEXTO_CTA: 'Saiba mais →',
    TEXTO_RODAPE: 'Alfa Contabilidade',
    TEXTO_SELLO: 'Conteúdo Premium',
    TEXTO_VERSUS: 'VS',
    TEXTO_ROTULO_A: 'ERRADO',
    TEXTO_ROTULO_B: 'CERTO',
    TEXTO_FAIXA_CABECALHO: 'COMUNICADO OFICIAL',
    NOME_MARCA: 'Alfa Contabilidade',
    NOME_INSTITUICAO: 'Alfa Contabilidade',
    URL_WEBSITE: 'AlfaContabilidadeCariri.com.br',
    ANO_REFERENCIA: '2026',
    NUMERO_DESTAQUE: '7',
    TEXTO_SECUNDARIO_BADGE: 'DICAS',
    TEXTO_ITEM_1: 'Não declarar corretamente',
    TEXTO_ITEM_2: 'Esquecer prazos',
    NUMERO_RESTANTE: '5',
    SIMBOLO_MARCA: 'α',
    
    // Fontes
    FONTE_PLACA: 'Sans-Serif Bold como Impact',
    FONTE_TARJAS: 'Roboto Heavy',
    FONTE_MARCA_AGUA: 'Extra Bold',
    FONTE_CABECALHO: 'Sans-serif semi-bold',
    FONTE_SUBTITULO: 'Inter Regular',
    FONTE_INDICADOR: 'Sans-serif medium',
    FONTE_RODAPE: 'Sans-serif regular',
    FONTE_ITEM: 'Inter Medium',
    FONTE_CTA: 'Sans-serif bold',
    FONTE_TITULO: 'Inter ExtraBold',
    FONTE_SELLO: 'Sans-serif bold',
    FONTE_NUMERO: 'Inter Black',
    FONTE_TEXTO_BADGE: 'Sans-serif bold',
    FONTE_ROTULO_A: 'Sans-serif bold',
    FONTE_ROTULO_B: 'Sans-serif bold',
    FONTE_VERSUS: 'Extra Bold',
    FONTE_APOIO_A: 'Sans-serif regular',
    FONTE_APOIO_B: 'Sans-serif regular',
    FONTE_FAIXA: 'Sans-serif semi-bold',
    FONTE_NOME: 'Sans-serif medium',
    
    // Tamanhos
    TAMANHO_CABECALHO: '14pt',
    TAMANHO_SUBTITULO: '40% do título',
    TAMANHO_ICONES: '32px',
    TAMANHO_LOGO: '8% da largura',
    TAMANHO_TITULO: '48-60px',
    TAMANHO_NUMERO: '60% do badge',
    TAMANHO_TEXTO_BADGE: '30% do badge',
    TAMANHO_ITEM: '60% do título',
    TAMANHO_CTA: '18pt',
    TAMANHO_RODAPE: '12pt',
    TAMANHO_SELLO: '15% da largura total',
    TAMANHO_VERSUS: '36px',
    TAMANHO_INDICADOR: '14pt',
    
    // Posições
    POSICAO_MARCA_AGUA: 'topo superior',
    POSICAO_RODAPE: 'No canto inferior esquerdo',
    POSICAO_TITULO: 'central superior',
    POSICAO_ICONES: 'inferior-direita',
    POSICAO_CTA: 'centralizado na base',
    POSICAO_SELLO: 'superior-direito',
    POSICAO_INDICADOR: 'inferior-esquerdo',
    POSICAO_BADGE: 'topo-central',
    POSICAO_ELEMENTO: 'direita',
    POSICAO_LOGO: 'canto inferior esquerdo',
    POSICAO_ELEMENTO_HUMANO: 'central',
    
    // Descrições genéricas
    PADRAO_TEXTO_FUNDO: 'motherboard traces',
    ESTILO_PLACA: 'uma placa de trânsito antiga e desgastada',
    TEXTURA_PLACA: 'metálica com sinais de ferrugem pesada nas bordas',
    ALINHAMENTO_TARJAS: 'à esquerda',
    ALINHAMENTO_TITULO: 'centralizado',
    DESCRICAO_ILUSTRACAO_CENTRAL: 'Elemento visual principal relacionado ao tema',
    DESCRICAO_ICONES_APOIO: 'Ícones decorativos flutuantes ao redor do elemento central',
    DESCRICAO_ILUSTRACAO_SUPORTE: 'Ícones vetoriais de suporte ao tema',
    DESCRICAO_CABECALHO: 'Cabeçalho com selo de autoridade',
    DESCRICAO_RODAPE: 'Rodapé com assinatura da marca',
    DESCRICAO_BADGE_NUMERICO: 'Badge numérico quantificador no topo',
    DESCRICAO_PREVIEW_ITENS: 'Preview dos primeiros itens da lista',
    DESCRICAO_ICONES_TEMATICOS: 'Ícones relacionados ao tema',
    DESCRICAO_CTA_SCROLL: 'Indicador de scroll/continuidade',
    DESCRICAO_SELLO: 'Selo de destaque',
    DESCRICAO_SUBTITULO: 'Subtítulo contextual',
    DESCRICAO_ELEMENTO_VISUAL: 'Elemento visual de apoio',
    DESCRICAO_INDICADOR: 'Indicador de conteúdo',
    DESCRICAO_SELLO_CREDIBILIDADE: 'Selo de credibilidade social',
    DESCRICAO_INDICADOR_SCROLL: 'Indicador de continuidade',
    DESCRICAO_ELEMENTO_HUMANO: 'Elemento humano principal',
    DESCRICAO_CENARIO: 'Cenário de contexto',
    DESCRICAO_VISUAL_LADO_A: 'Lado negativo da comparação',
    DESCRICAO_VISUAL_LADO_B: 'Lado positivo da comparação',
    DESCRICAO_ELEMENTO_LADO_A: 'Elemento visual do lado A',
    DESCRICAO_ELEMENTO_LADO_B: 'Elemento visual do lado B',
    DESCRICAO_VERSUS: 'Elemento central VS',
    DESCRICAO_TEXTO_APOIO: 'Texto de apoio contextual',
    DESCRICAO_CTA_COMPARACAO: 'CTA de comparação',
    DESCRICAO_ROTULOS: 'Rótulos dos lados',
    DESCRICAO_CENARIO: 'Cenário de trabalho',
    TIPO_DIVISAO: 'Linha vertical central',
    NOME_LADO_A: 'ERRADO',
    NOME_LADO_B: 'CERTO',
    TIPO_ENFASE: 'cor diferente',
    ESTILO_BULLET: 'checkbox vazio ☐',
    EFEITO_MISTERIO: '"..." e mais itens',
    FORMATO_SELLO: 'círculo',
    FORMATO_VERSUS: 'círculo',
    FORMATO_INDICADOR: 'texto com seta',
    FORMATO_RODAPE: 'Linha horizontal fina',
    FORMATO_BADGE: 'círculo',
    FORMATO_CTA: 'texto simples',
    ESTILO_GERAL: 'Profissional, moderno, alta qualidade visual',
    ESTILO_ICONES: 'flat design',
    ESTILO_INDICADOR: 'discreto',
    ESTILO_CTA: 'texto com seta',
    ESTILO_SUBTITULO: 'regular',
    ESTILO_VERSUS: 'centralizado',
    ESTILO_ICONE: 'flat monocromático',
    ESTILO_SETA: 'bold',
    ESTILO_FAIXA: 'horizontal',
    NOME_ICONE: 'ícone temático',
    NOME_ICONE_1: 'ícone 1',
    NOME_ICONE_2: 'ícone 2',
    
    // Números
    NUMERO_TARJAS: 'Quatro',
    NUMERO_LINHAS_TITULO: 'Duas',
    NUMERO_LINHAS_SUBTITULO: 'Uma',
    NUMERO_ITENS_PREVIEW: '2',
    QUANTIDADE_ICONES: '3',
    QUANTIDADE: '3',
    ESPESSURA_LINHA: '2px',
    ALTURA_FAIXA: '60px',
    ALTURA_FAIXA_RODAPE: '40px',
    PORCENTAGEM_FUNDO: '100',
    PORCENTAGEM_ILUSTRACAO: '80',
    
    // Espaçamentos
    ESPACAMENTO_SUBTITULO: '1.5x',
    ESPACAMENTO_ITENS: '12px',
    ESPACAMENTO_ICONES: '16px',
    
    // Opacidades
    OPACIDADE_ICONES: '70%',
    OPACIDADE_ELEMENTO: '100%',
    OPACIDADE_LOGO: '100%',
    OPACIDADE_MARCA_AGUA: '8-12%',
    
    // Efeitos
    EFEITO_BADGE: 'drop shadow forte',
    EFEITO_SELLO: 'flat com gradiente',
    EFEITO_VERSUS: 'centralizado na divisão',
    EFEITO_TITULO: 'drop shadow para legibilidade',
    EFEITO_MISTERIO: '"..." e mais itens',
    TIPO_TEXTURA: 'papel',
    TRATAMENTO_FOTO: 'cores quentes e acolhedoras',
    TRATAMENTO_PESSOA: 'fotografia natural',
    EMOCOA: 'confiança e profissionalismo',
    ENQUADRAMENTO: 'meio corpo',
    PROFUNDIDADE: 'fundo desfocado (bokeh)',
    PADRAO_DISPOSICAO: 'grid organizado',
    PADRAO_ICONES: 'espaçados uniformemente',
    ALINHAMENTO_LOGO: 'esquerda',
    
    // Linhas de título genéricas
    LINHAS_TARJA: `Linha 1: 'Primeira linha de texto'
Linha 2: 'SEGUNDA LINHA EM DESTAQUE' (palavra principal é massiva)
Linha 3: 'Terceira linha com ênfase' (ênfase em negrito extra)
Linha 4: 'QUARTA LINHA COLOSSAL' (ocupando toda extensão)`,
    LINHAS_TITULO: `Linha 1: 'TÍTULO PRINCIPAL EM CAIXA ALTA'
Linha 2: 'Subtítulo complementar'`,
  };
  
  // Preencher variáveis com defaults
  for (const variavel of necessarias) {
    variaveis[variavel] = defaults[variavel] || `[${variavel} - INFORMAR]`;
  }
  
  return variaveis;
}

// ============================================================================
// EXPORTS
// ============================================================================

export const promptIntegrationService = {
  gerarPromptCompleto,
  gerarPromptReplicacao,
  gerarVariaveisDefault,
  getVariaveisNecessarias,
  getVariaveisNecessariasAprendizado,
  preencherTemplateCapa,
  preencherTemplateAprendizado,
  templatesCapas: promptTemplatesCapas,
  templatesAprendizado: promptTemplatesAprendizado,
};

export default promptIntegrationService;
