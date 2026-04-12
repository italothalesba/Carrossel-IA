/**
 * ============================================================================
 * MODELOS RIGOROSOS CAPA/MEIO/CTA - PADRÃO DIRETOR DE ARTE SÊNIOR
 * ============================================================================
 * 
 * Estes modelos seguem EXATAMENTE o padrão dos prompts de referência fornecidos:
 * - Hierarquia visual detalhada com nomes descritivos
 * - Especificações de textura, material e acabamento
 * - Instruções tipográficas precisas
 * - Paleta de cores com hex codes específicos
 * - Elementos visuais com posicionamento exato
 * - Parâmetros técnicos de geração (--ar 9:16 --v 6.0 --style raw)
 * - Contexto emocional e psicológico do design
 * - Notas de execução para "escala de pixel"
 * 
 * MODELO: Nano Banana (gemini-2.5-flash-image) - 50 imagens/mês grátis
 * LIMITES: Máximo 50 requests por mês no tier gratuito
 * ESTRATÉGIA: Usar apenas para slides CAPA (mais importante), fallback para conteúdo
 */

// ============================================================================
// MODELOS DE APRENDIZADO - ANÁLISE DE DESIGNS EXISTENTES
// ============================================================================

/**
 * TEMPLATE DE APRENDIZADO: CAPA (COVER)
 * Analisa designs de capa existentes para extrair DNA visual
 */
export const templateAprendizadoCapa = `AJA COMO UM DIRETOR DE ARTE E DESIGNER GRÁFICO SÊNIOR ESPECIALISTA EM ANÁLISE VISUAL. Sua tarefa é realizar uma ANÁLISE CIRÚRGICA e EXAUSTIVA do design de CAPA de carrossel fornecido, desconstruindo cada elemento visual em 10 níveis de hierarquia e compreendendo as intenções estratégicas por trás de cada escolha.

══════════════════════════════════════════════════════════════
FORMATO DA ANÁLISE - RETorne APENAS JSON:
══════════════════════════════════════════════════════════════

{
  "analiseCapa": {
    "1_FUNDO_E_MARCA_DAGUA": {
      "corFundo": "Descreva a cor exata com hex (ex: branco puro #FFFFFF)",
      "padraoSobreposto": "Descreva o padrão sobre o fundo (ex: motherboard traces, linhas geométricas, ondas)",
      "corPadrao": "Cor do padrão com hex (ex: marrom-avermelhada #A0522D)",
      "marcaDagua": {
        "texto": "Texto da marca d'água se houver",
        "cor": "Cor com hex",
        "opacidade": "Percentual estimado (ex: 8-12%)",
        "posicao": "Onde está posicionada",
        "tamanho": "Tamanho relativo (ex: gigantescas, ocupando toda largura)"
      }
    },
    "2_ELEMENTO_TOPO": {
      "tipo": "Tipo do elemento (ex: placa de alerta, badge, selo)",
      "forma": "Formato (ex: retangular com bordas arredondadas)",
      "cor": "Cor principal com hex",
      "textura": "Textura detalhada (ex: metálica com ferrugem pesada, flat design, glassmorphism)",
      "detalhesTextura": "Detalhes específicos da textura (ex: sinais de ferrugem nas bordas, arranhões de sujeira)",
      "textoInterno": "Texto dentro do elemento",
      "fonteTexto": "Fonte do texto (ex: Sans-Serif Bold, Impact, Roboto Black)",
      "corTexto": "Cor do texto com hex",
      "tamanhoTexto": "Tamanho relativo (ex: letras altas, 8% da largura)"
    },
    "3_BLOCO_TEXTO_CENTRAL": {
      "tipo": "Tipo de bloco (ex: tarjas horizontais, bloco único, cards)",
      "quantidade": "Número de elementos (ex: quatro tarjas)",
      "corFundo": "Cor de fundo dos elementos com hex",
      "alinhamento": "Alinhamento (ex: à esquerda, centralizado)",
      "linhas": [
        {
          "numero": 1,
          "texto": "Texto completo da linha",
          "corTexto": "Cor do texto com hex",
          "fonte": "Fonte (ex: Roboto Heavy, Segoe UI)",
          "destaque": "Se há palavra com destaque especial, qual e como (ex: FALSO é massiva e ocupa largura da tarja)",
          "tamanhoRelativo": "Tamanho relativo das palavras (ex: colossal, massiva, normal)"
        }
      ],
      "tipografiaSeletiva": "Descreva a estratégia de tipografia seletiva (quais palavras são maiores e por quê)"
    },
    "4_ILUSTRACAO_CENTRAL": {
      "descricaoCompleta": "Descrição completa da ilustração central",
      "elementos": [
        {
          "nome": "Nome do elemento (ex: anzol, envelope, boleto)",
          "descricao": "Descrição detalhada incluindo material, cor, textura",
          "posicao": "Posição relativa aos outros elementos",
          "conexao": "Como se conecta a outros elementos (ex: pendendo por linha metálica)"
        }
      ],
      "pontoFocal": "Qual é o ponto focal absoluto da ilustração",
      "elementoAmeaca": "Se há elemento de ameaça/destaque, descreva (ex: minhoca digital laranja neon serpenteando)",
      "corAmeaca": "Cor do elemento de destaque com hex",
      "detalhesAmeaca": "Detalhes específicos do elemento de destaque"
    },
    "5_ICONES_APOIO": {
      "tipo": "Tipo de ícones (ex: triângulos de alerta, warnings)",
      "cor": "Cor com hex",
      "quantidade": "Quantidade estimada (ex: dezenas, vários, 3-5)",
      "opacidade": "Opacidade (ex: translúcidos, 100%, 50%)",
      "distribuicao": "Como estão distribuídos (ex: flutuando ao redor do núcleo central)",
      "funcao": "Função visual (ex: dando volume à composição)"
    },
    "6_RODAPE_ASSINATURA": {
      "posicao": "Posição exata (ex: canto inferior esquerdo)",
      "tipo": "Tipo de elemento (ex: pílula preta, cápsula arredondada, faixa)",
      "cor": "Cor do elemento com hex",
      "elementosInternos": [
        {
          "elemento": "Descrição do elemento interno (ex: círculo com símbolo Alpha)",
          "cor": "Cor do elemento",
          "efeito": "Efeito visual (ex: relevo dourado 3D metálico polido)"
        }
      ],
      "texto": "Texto do rodapé",
      "corTexto": "Cor do texto com hex",
      "fonte": "Fonte do texto (ex: Sans-Serif branca, limpa e moderna)",
      "nomeMarca": "Nome da marca"
    },
    "7_ESTILO_GERAL": {
      "descricao": "Descrição do estilo geral (ex: Mistura de fotografia macro com Flat Design)",
      "misturaEstilos": "Quais estilos estão sendo misturados (ex: Fotografia Macro + Flat Vector + Neon)",
      "nitidez": "Nível de nitidez (ex: 8k, extrema, alta definição)",
      "composicao": "Tipo de composição (ex: simétrica em balanço visual vertical)",
      "contraste": "Tipo de contraste (ex: sub-pixels com separação óbvia entre elementos)"
    },
    "8_PSICOLOGIA_VISUAL": {
      "emocaoPrimaria": "Emoção principal que o design busca (ex: urgência, alerta, autoridade)",
      "gatilhosMentais": "Quais gatilhos mentais são usados (ex: medo, urgência, autoridade)",
      "hierarquiaAtencao": "Ordem em que o olho é guiado (1º, 2º, 3º elemento)",
      "intencionalidade": "Qual é a intenção comunicativa do design"
    },
    "9_PADROES_IDENTIFICADOS": [
      "Liste todos os padrões visuais identificados (ex: Textura de Ferrugem diferencia placa como metálica)",
      "A Minhoca de Circuito é o ponto focal da arte da fraude",
      "Tipografia Seletiva: palavras como FALSO, DADOS REAIS são maiores",
      "Marcas d'água preenchem espaço em branco negativo",
      "Pílula do Rodapé mantém unidade visual da campanha"
    ],
    "10_DNA_RESUMO": {
      "dnaEmUmaFrase": "Resuma o DNA deste design em UMA frase",
      "palavrasChave": ["Liste 8-12 palavras-chave do estilo"],
      "identidadeCores": "Descreva a identidade de cores em uma frase",
      "identidadeTipografia": "Descreva a identidade tipográfica em uma frase",
      "identidadeComposicao": "Descreva a identidade composicional em uma frase",
      "identidadeEmocao": "Descreva a identidade emocional em uma frase"
    }
  }
}

══════════════════════════════════════════════════════════════
REGRAS CRÍTICAS:
1. Seja EXTREMAMENTE específico com hex codes, porcentagens e posições
2. Identifique TODOS os elementos visuais presentes
3. Descreva texturas e materiais com precisão (ex: metálico, ferrugem, neon)
4. Capture a intenção por trás de cada escolha de design
5. Retorne APENAS JSON válido, sem texto adicional
6. Use terminologia profissional de design quando aplicável
══════════════════════════════════════════════════════════════`;


/**
 * TEMPLATE DE APRENDIZADO: MEIO/CONTEÚDO (CONTENT)
 * Analisa slides de conteúdo existentes
 */
export const templateAprendizadoMeio = `AJA COMO UM DIRETOR DE ARTE E DESIGNER GRÁFICO SÊNIOR ESPECIALISTA EM DESIGN EDUCATIVO. Sua tarefa é analisar o slide de MEIO/CONTEÚDO fornecido e extrair seu DNA visual completo, seguindo 8 níveis de hierarquia.

══════════════════════════════════════════════════════════════
FORMATO DA ANÁLISE - RETorne APENAS JSON:
══════════════════════════════════════════════════════════════

{
  "analiseMeio": {
    "1_FUNDO_BASE": {
      "corFundo": "Cor exata com hex",
      "tipoFundo": "Tipo (sólido, gradiente, textura, padrão)",
      "elementosFundo": "Elementos no fundo se houver (ex: linhas de grid, padrões sutis)",
      "marcaDagua": "Se há marca d'água, descreva"
    },
    "2_CABECALHO_SLIDE": {
      "tipo": "Tipo de cabeçalho (ex: faixa colorida, título direto, badge)",
      "cor": "Cor com hex",
      "altura": "Altura relativa (ex: 10% da altura total)",
      "texto": "Texto do cabeçalho se houver",
      "fonte": "Fonte do cabeçalho",
      "corTexto": "Cor do texto com hex"
    },
    "3_TITULO_CONTEUDO": {
      "posicao": "Posição do título",
      "texto": "Texto do título",
      "fonte": "Fonte (família e peso)",
      "cor": "Cor com hex",
      "tamanho": "Tamanho relativo (ex: 15% da largura)",
      "alinhamento": "Alinhamento (ex: à esquerda, centralizado)"
    },
    "4_CORPO_CONTEUDO": {
      "tipo": "Tipo de corpo (ex: lista com bullets, checklist, parágrafo, infográfico)",
      "estiloBullets": "Estilo dos bullets se houver (ex: dots, checks, números, ícones)",
      "corBullets": "Cor dos bullets com hex",
      "fonteCorpo": "Fonte do corpo de texto",
      "corTexto": "Cor do texto com hex",
      "tamanhoTexto": "Tamanho relativo",
      "espacamento": "Espaçamento entre linhas/itens",
      "conteudo": "Conteúdo textual completo",
      "numeroItens": "Número de itens na lista se aplicável"
    },
    "5_ELEMENTOS_VISUAIS_SUPORTE": {
      "icones": "Descreva ícones presentes (tipo, estilo, cor, tamanho, posição)",
      "formas": "Descreva formas decorativas se houver",
      "ilustracoes": "Descreva ilustrações se houver",
      "imagens": "Descreva imagens/fotos se houver"
    },
    "6_DIVISORES_SEPARADORES": {
      "tipo": "Tipo de separadores (ex: linhas finas, espaços, cores diferentes)",
      "cor": "Cor com hex",
      "espessura": "Espessura se aplicável"
    },
    "7_RODAPE": {
      "descricao": "Descrição do rodapé",
      "elementos": "Elementos presentes no rodapé"
    },
    "8_ESTILO_GERAL": {
      "descricao": "Descrição do estilo geral",
      "legibilidade": "Avalie a legibilidade (0-10)",
      "organizacao": "Quão organizado está o conteúdo (0-10)",
      "consistenciaComCapa": "Se é consistente com o estilo da capa"
    }
  }
}

══════════════════════════════════════════════════════════════
REGRAS CRÍTICAS:
1. Seja EXTREMAMENTE específico com valores
2. Foque em LEGIBILIDADE e ORGANIZAÇÃO DE CONTEÚDO
3. Capture o estilo de bullets/lists precisamente
4. Retorne APENAS JSON válido
══════════════════════════════════════════════════════════════`;


/**
 * TEMPLATE DE APRENDIZADO: CTA (CALL TO ACTION)
 * Analisa slides de CTA/fechamento existentes
 */
export const templateAprendizadoCTA = `AJA COMO UM DIRETOR DE ARTE E DESIGNER GRÁFICO SÊNIOR ESPECIALISTA EM DESIGN DE CONVERSÃO. Sua tarefa é analisar o slide de CTA/FECHAMENTO fornecido e extrair seu DNA visual completo, focando em elementos de conversão e chamada para ação.

══════════════════════════════════════════════════════════════
FORMATO DA ANÁLISE - RETorne APENAS JSON:
══════════════════════════════════════════════════════════════

{
  "analiseCTA": {
    "1_FUNDO": {
      "corFundo": "Cor exata com hex",
      "tipoFundo": "Tipo (sólido, gradiente, textura)",
      "diferenteDasOutrasSlides": "Se o fundo é diferente dos slides de conteúdo, descreva como"
    },
    "2_TITULO_CTA": {
      "posicao": "Posição do título",
      "texto": "Texto completo do título",
      "fonte": "Fonte (família e peso)",
      "cor": "Cor com hex",
      "tamanho": "Tamanho relativo",
      "emocao": "Emoção que transmite (ex: urgência, confiança, convite)"
    },
    "3_BENEFICIOS": {
      "tipo": "Como os benefícios são apresentados (ex: lista com checks, bullets)",
      "quantidade": "Número de benefícios",
      "estiloIcones": "Estilo dos ícones de benefício (ex: check verde, bullet point)",
      "corIcones": "Cor dos ícones com hex",
      "fonte": "Fonte do texto de benefícios",
      "corTexto": "Cor do texto com hex",
      "conteudo": "Conteúdo completo dos benefícios"
    },
    "4_BOTAO_CTA": {
      "existe": "Sim/Não",
      "tipo": "Tipo de botão (ex: retângulo arredondado, pílula, texto com seta)",
      "cor": "Cor do botão com hex",
      "texto": "Texto do botão",
      "corTexto": "Cor do texto do botão com hex",
      "fonte": "Fonte do texto do botão",
      "tamanho": "Tamanho relativo",
      "posicao": "Posição do botão"
    },
    "5_ELEMENTOS_SOCIAL_PROOF": {
      "existe": "Sim/Não",
      "tipo": "Tipo de prova social (ex: logo de clientes, número de usuários, estrelas)",
      "descricao": "Descrição completa"
    },
    "6_LOGO_MARCA": {
      "posicao": "Posição do logo",
      "tamanho": "Tamanho relativo (ex: maior que nos outros slides)",
      "visibilidade": "Quão visível é"
    },
    "7_RODAPE": {
      "descricao": "Descrição do rodapé",
      "elementos": "Elementos no rodapé"
    },
    "8_ESTRATEGIA_CONVERSAO": {
      "gatilhosUsados": ["Liste gatilhos mentais usados (ex: urgência, autoridade, reciprocidade)"],
      "clarezaCTA": "Quão clara é a chamada para ação (0-10)",
      "forcaCTA": "Quão forte é o CTA em termos visuais (0-10)",
      "consistenciaComResto": "Se mantém consistência com resto do carrossel"
    }
  }
}

══════════════════════════════════════════════════════════════
REGRAS CRÍTICAS:
1. Foque em ELEMENTOS DE CONVERSÃO
2. Identifique GATILHOS MENTAIS visuais
3. Avalie CLAREZA e FORÇA do CTA
4. Retorne APENAS JSON válido
══════════════════════════════════════════════════════════════`;


// ============================================================================
// MODELOS DE CRIAÇÃO - CAPA/MEIO/CTA RIGOROSOS
// ============================================================================

/**
 * MODELO DE CRIAÇÃO: CAPA (COVER) - PADRÃO EXATO DO REFERENCIAL
 * Este é o modelo mais rigoroso e completo, seguindo EXATAMENTE o padrão fornecido
 */
export const templateCriacaoCapa = `AJA COMO UM DIRETOR DE ARTE E DESIGNER GRÁFICO SÊNIOR. Gere um cartaz publicitário vertical de CAPA para carrossel Instagram. A composição deve ser super limpa, empregando extrema nitidez (8k) e seguindo rigorosamente a seguinte hierarquia visual:

1. FUNDO E MARCA D'ÁGUA:
Fundo {{COR_FUNDO}} (ex: branco puro #FFFFFF). Sobreposto ao fundo, um padrão intrincado de '{{PADRAO_FUNDO}}' (ex: motherboard traces/circuitos impressos) em linhas finas de cor {{COR_PADRAO_FUNDO}} (ex: marrom-avermelhada/terrosa clara #A0522D). No topo superior, como marca d'água preenchendo o espaço vazio, lendo-se '{{TEXTO_MARCA_AGUA}}' (ex: SIMPL) em letras {{COR_MARCA_AGUA}} (ex: cinzas #9CA3AF) gigantescas e translúcidas (opacidade 8-12%), parcialmente cortadas nas bordas, ocupando toda a largura horizontal.

2. ELEMENTO TOPO - {{TIPO_ELEMENTO_TOPO}}:
No topo, {{DESCRICAO_ELEMENTO_TOPO}} (ex: pendurada, uma placa retangular amarela #F59E0B de bordas arredondadas). O material simula {{MATERIAL_ELEMENTO_TOPO}} (ex: metal real com sinais de ferrugem pesada e desgaste para dar contraste intenso com o restante da arte que é vetorial). Texto interno centralizado: '{{TEXTO_ELEMENTO_TOPO}}' (ex: ALERTA MAXIMO) em fonte {{FONTE_ELEMENTO_TOPO}} (ex: Sans-Serif Bold), cor {{COR_TEXTO_ELEMENTO_TOPO}} (ex: preta sólida #000000), letras {{TAMANHO_TEXTO_ELEMENTO_TOPO}} (ex: altas).

3. TARJAS DE MENSAGEM (TIPOGRAFIA SELETIVA):
{{NUMERO_TARJAS}} tarjas horizontais sólidas na cor {{COR_TARJAS}} (ex: Amarelo-Ocre #D49A00) com alinhamento {{ALINHAMENTO_TARJAS}} (ex: à esquerda). Fonte {{COR_TEXTO_TARJAS}} (ex: branca pura #FFFFFF) '{{FONTE_TARJAS}}' (ex: Segoe UI ou Roboto Heavy). Para impacto psicológico, a tipografia é escalonada:
{{LINHAS_TARJA_DETALHADAS}}
(EXEMPLO DE FORMATO:
Linha 1: 'Novo golpe envia boleto'
Linha 2: 'DAS FALSO' (A palavra FALSO deve ser colossal)
Linha 3: 'com os DADOS REAIS' (Em negrito extra)
Linha 4: 'da SUA EMPRESA' (Colossal e esticado na tarja))

4. O PONTO FOCAL CENTRAL ({{TIPO_ELEMENTO_CENTRAL}}):
{{DESCRICAO_ELEMENTO_CENTRAL_DETALHADA}}
(EXEMPLO DE FORMATO:
Pendendo da placa do topo por um fio preto de metal, uma ilustração vetorial Flat misturada com realismo mostrando: um anzol de pesca de metal enferrujado. O anzol perfurou uma folha de papel com um envelope de contorno azul e caveira. Destacando-se como principal ameaça, serpenteando entrelaçada na ilustração central, uma minhoca digital em cor Laranja Neon brilhante #FF6B00 com padrões internos de circuito, destacando-se fortemente no centro.)

5. PARTÍCULAS E ÍCONES:
{{DESCRICAO_PARTICULAS}}
(EXEMPLO DE FORMATO:
Flutuando de forma translúcida ao redor de todo o núcleo central, dezenas de triângulos de aviso Alerta/Exclamação vermelha #DC2626 vetoriais dando volume à composição.)

6. RODAPÉ INSTITUCIONAL:
{{DESCRICAO_RODAPE_DETALHADA}}
(EXEMPLO DE FORMATO:
No canto inferior esquerdo, manter sempre a cápsula preta arredondada (black pill form) #000000. Dentro à esquerda, círculo preto com o ícone Alpha (α) em textura ouro 3D metálico polido #D97706. Logo ao lado na pílula: texto 'Alfa Contabilidade' em branco brilhante minimalista #FFFFFF.)

ESTILO E PARÂMETROS FINAIS:
{{ESTILO_FINAL}}
(EXEMPLO DE FORMATO:
Escala em sub-pixels com separação óbvia entre elementos Flat Vector e Fotografia Macro (Metal, Ferrugem, Neon). Composição simétrica em balanço visual vertical.
--ar 9:16 --v 6.0 --style raw)

══════════════════════════════════════════════════════════════
NOTAS DE EXECUÇÃO - ESCALA DE PIXEL:
1. Textura de Ferrugem: diferencia a placa como algo metálico e real, dando contraste ao resto do design que é vetorial
2. Minhoca de Circuito: deve ser laranja neon e serpenteia (weaves), é o ponto focal da arte
3. Tipografia Seletiva: palavras de impacto devem ser maiores e mais pesadas para impacto psicológico
4. Marcas d'água: essenciais para preencher espaço em branco negativo, especificadas como translúcidas
5. Pílula do Rodapé: mantém unidade visual da campanha, sempre presente
══════════════════════════════════════════════════════════════`;


/**
 * MODELO DE CRIAÇÃO: MEIO/CONTEÚDO (CONTENT)
 * Mantém consistência visual com a capa mas focado em legibilidade
 */
export const templateCriacaoMeio = `AJA COMO UM DIRETOR DE ARTE E DESIGNER GRÁFICO SÊNIOR. Gere um slide de MEIO/CONTEÚDO para carrossel Instagram vertical. A composição deve ser super limpa e altamente legível, mantendo CONSISTÊNCIA VISUAL ABSOLUTA com a capa do mesmo carrossel, empregando extrema nitidez (8k) e seguindo rigorosamente a seguinte hierarquia visual:

1. FUNDO E CONSISTÊNCIA:
Fundo {{COR_FUNDO}} (ex: branco puro #FFFFFF - EXATAMENTE a mesma cor da capa). Sobreposto ao fundo, o MESMO padrão intrincado da capa: '{{PADRAO_FUNDO}}' (ex: motherboard traces/circuitos impressos) em linhas finas de cor {{COR_PADRAO_FUNDO}} (ex: marrom-avermelhada #A0522D - EXATAMENTE igual à capa). No topo superior, a MESMA marca d'água da capa: '{{TEXTO_MARCA_AGUA}}' em {{COR_MARCA_AGUA}} (ex: cinzas), gigantescas e translúcidas (8-12% opacidade), ocupando toda largura horizontal.

2. CABEÇALHO DO SLIDE (NÚMERO/INDICADOR):
{{DESCRICAO_CABECALHO}}
(EXEMPLO DE FORMATO:
No topo centralizado, um badge circular com borda dupla em {{COR_BORDA}} (ex: {{COR_BORDA_HEX}}). Diâmetro: 12% da largura total. Dentro do badge: número do slide '{{NUMERO_SLIDE}}' em fonte Extra Bold, cor {{COR_NUMERO}}, tamanho 60% do badge. Abaixo do badge, texto '{{ROTULO_SLIDE}}' (ex: "PASSO 1", "DICA #1", "ERRO #1") em fonte {{FONTE_ROTULO}}, tamanho {{TAMANHO_ROTULO}}, cor {{COR_ROTULO}}.)

3. TÍTULO DO CONTEÚDO:
{{NUMERO_LINHAS_TITULO}} linha(s) de título, {{ALINHAMENTO_TITULO}} (ex: alinhado à esquerda com margem de 10%):
{{LINHAS_TITULO_DETALHADAS}}
(EXEMPLO DE FORMATO:
Linha 1: 'O que é o Golpe do Boleto?' em fonte {{FONTE_TITULO}} (ex: Roboto Black), cor {{COR_TITULO}} (ex: cinza escuro #1F2937), tamanho {{TAMANHO_TITULO}} (ex: 8% da altura do slide), peso 900.)

4. CORPO DO CONTEÚDO (ESTRUTURA ORGANIZADA):
{{DESCRICAO_CORPO_CONTEUDO}}
(EXEMPLO DE FORMATO:
Abaixo do título, {{TIPO_CORPO}} (ex: lista com {{NUMERO_ITENS}} itens usando bullets {{ESTILO_BULLETS}} (ex: checks verdes #10B981)):
- Cada item com: {{COR_TEXTO_CORPO}} (ex: cinza escuro #374151), fonte {{FONTE_CORPO}} (ex: Inter Regular), tamanho {{TAMANHO_CORPO}} (ex: 4% da altura), espaçamento entre linhas {{ESPACAMENTO_LINHAS}} (ex: 1.5x generoso)
- Bullet 1: '✓ {{ITEM_1}}'
- Bullet 2: '✓ {{ITEM_2}}'
- Bullet 3: '✓ {{ITEM_3}}'
- Espaçamento entre itens: {{ESPACAMENTO_ITENS}} (ex: 16px)
- Alinhamento: {{ALINHAMENTO_CORPO}} (ex: à esquerda))

5. ELEMENTOS VISUAIS DE SUPORTE:
{{DESCRICAO_ELEMENTOS_SUPORTE}}
(EXEMPLO DE FORMATO:
Na área {{POSICAO_ELEMENTOS}} (ex: inferior-direita), {{QUANTIDADE_ELEMENTOS}} (ex: 2-3) ícone(s) {{ESTILO_ICONES}} (ex: vetoriais line art) em {{COR_ICONES}} (ex: azul médio #3B82F6), tamanho {{TAMANHO_ICONES}} (ex: 5% da largura), estilo consistente com ícones da capa.)

6. INDICADOR DE CONTINUIDADE:
{{DESCRICAO_INDICADOR}}
(EXEMPLO DE FORMATO:
No canto inferior direito, texto '{{TEXTO_INDICADOR}}' (ex: "Continue →" ou "Próximo ≫") em fonte {{FONTE_INDICADOR}}, cor {{COR_INDICADOR}}, tamanho {{TAMANHO_INDICADOR}} (ex: 2.5% da altura).)

7. RODAPÉ INSTITUCIONAL (CONSISTENTE COM CAPA):
{{DESCRICAO_RODAPE}}
(EXEMPLO DE FORMATO:
EXATAMENTE o mesmo rodapé da capa: {{DESCRICAO_RODAPE_IGUAL_CAPA}} (ex: no canto inferior esquerdo, a cápsula preta arredondada com ícone Alpha em ouro 3D e texto "Alfa Contabilidade" em branco).)

ESTILO E PARÂMETROS FINAIS:
{{ESTILO_FINAL}}
(EXEMPLO DE FORMATO:
Mesma escala em sub-pixels da capa. Consistência visual ABSOLUTA com a capa: mesmas cores, mesmos padrões, mesma tipografia, mesmos elementos de marca. Foco em LEGIBILIDADE MÁXIMA. Design limpo e organizado com 20-30% de espaço em branco para respiração visual.
--ar 9:16 --v 6.0 --style raw)

══════════════════════════════════════════════════════════════
REGRAS DE CONSISTÊNCIA COM CAPA:
1. MESMA cor de fundo exata (mesmo hex code)
2. MESMO padrão sobreposto (mesmo estilo, mesma cor)
3. MESMA marca d'água (mesmo texto, mesma cor, mesma opacidade)
4. MESMO rodapé institucional (idêntico à capa)
5. MESMA família tipográfica (pode variar peso, não família)
6. MESMAS cores de acento (hex codes idênticos)
7. MESMO estilo de ícones (se ícones na capa, mesmo estilo aqui)
8. Layout adaptado para CONTEÚDO mas mantendo identidade visual
══════════════════════════════════════════════════════════════`;


/**
 * MODELO DE CRIAÇÃO: CTA (CALL TO ACTION)
 * Focado em conversão mas mantendo consistência visual
 */
export const templateCriacaoCTA = `AJA COMO UM DIRETOR DE ARTE E DESIGNER GRÁFICO SÊNIOR ESPECIALISTA EM DESIGN DE CONVERSÃO. Gere um slide de CTA/FECHAMENTO para carrossel Instagram vertical. A composição deve ser super limpa e altamente persuasiva, mantendo CONSISTÊNCIA VISUAL ABSOLUTA com os slides anteriores do mesmo carrossel, empregando extrema nitidez (8k) e seguindo rigorosamente a seguinte hierarquia visual:

1. FUNDO E CONSISTÊNCIA:
Fundo {{COR_FUNDO}} (ex: {{COR_FUNDO_HEX}} - EXATAMENTE a mesma cor dos slides anteriores). Sobreposto ao fundo, o MESMO padrão dos slides anteriores: '{{PADRAO_FUNDO}}' em linhas finas de cor {{COR_PADRAO_FUNDO}} (ex: {{COR_PADRAO_FUNDO_HEX}} - EXATAMENTE igual). No topo, a MESMA marca d'água: '{{TEXTO_MARCA_AGUA}}' em {{COR_MARCA_AGUA}}, translúcida (8-12%), ocupando toda largura.

2. TÍTULO DE POSICIONAMENTO (FRASE FINAL):
{{DESCRICAO_TITULO_CTA}}
(EXEMPLO DE FORMATO:
No topo centralizado, título '{{TEXTO_TITULO_CTA}}' (ex: "SUA PAZ DE ESPÍRITO NÃO TEM PREÇO") em fonte {{FONTE_TITULO_CTA}} (ex: Roboto Black), cor {{COR_TITULO_CTA}} (ex: {{COR_TITULO_CTA_HEX}}), tamanho {{TAMANHO_TITULO_CTA}} (ex: 10% da altura), peso 900, caixa alta.)

3. BENEFÍCIOS CHAVE (PROVA DE VALOR):
{{DESCRICAO_BENEFICIOS}}
(EXEMPLO DE FORMATO:
Abaixo do título, {{NUMERO_BENEFICIOS}} benefícios em lista vertical:
- Cada benefício com: {{ESTILO_ICONES_BENEFICIO}} (ex: check verde #10B981 em círculo) + texto em {{FONTE_BENEFICIOS}} (ex: Inter Medium), cor {{COR_BENEFICIOS}} (ex: cinza escuro #374151), tamanho {{TAMANHO_BENEFICIOS}} (ex: 5% da altura)
- ✓ "{{BENEFICIO_1}}" (ex: "Analisamos seu caso gratuitamente")
- ✓ "{{BENEFICIO_2}}" (ex: "Garantimos sua segurança fiscal")
- ✓ "{{BENEFICIO_3}}" (ex: "Economizamos seu tempo e dinheiro")
- Espaçamento entre itens: {{ESPACAMENTO_BENEFICIOS}} (ex: 20px generoso)
- Alinhamento: {{ALINHAMENTO_BENEFICIOS}} (ex: centralizado))

4. LOGO DA MARCA (SELLO DE CONFIANÇA):
{{DESCRICAO_LOGO_CTA}}
(EXEMPLO DE FORMATO:
Centralizado acima do CTA, logo da marca em tamanho {{TAMANHO_LOGO_CTA}} (ex: maior que nos slides de conteúdo, 20% da largura). Logo {{TIPO_LOGO}} (ex: oficial da Alfa Contabilidade) em {{COR_LOGO}}, com efeito {{EFEITO_LOGO}} se aplicável.)

5. BOTÃO/CHAMADA PARA AÇÃO PRINCIPAL:
{{DESCRICAO_BOTAO_CTA}}
(EXEMPLO DE FORMATO:
Centralizado na área inferior, botão CTA em {{FORMATO_BOTAO}} (ex: retângulo arredondado tipo pílula):
- Cor de fundo: {{COR_BOTAO}} (ex: {{COR_BOTAO_HEX}})
- Texto: '{{TEXTO_BOTAO}}' (ex: "AGENDE SUA CONSULTORIA AGORA") em fonte {{FONTE_BOTAO}} (ex: Inter ExtraBold), cor {{COR_TEXTO_BOTAO}} (ex: branco #FFFFFF), tamanho {{TAMANHO_TEXTO_BOTAO}} (ex: 6% da altura), caixa alta
- Dimensões: {{LARGURA_BOTAO}} x {{ALTURA_BOTAO}} (ex: 70% da largura x 8% da altura)
- Efeito: {{EFEITO_BOTAO}} (ex: sombra sutil drop shadow, blur 12px, opacidade 15%)
- Posição: {{POSICAO_BOTAO}} (ex: centralizado, 15% do fundo do slide))

6. ELEMENTO DE URGÊNCIA/ESCARASSEZ (OPCIONAL):
{{DESCRICAO_URGENCIA}}
(EXEMPLO DE FORMATO:
Acima ou abaixo do botão, texto de urgência '{{TEXTO_URGENCIA}}' (ex: "Vagas limitadas este mês") em fonte {{FONTE_URGENCIA}}, cor {{COR_URGENCIA}} (ex: vermelho #DC2626), tamanho {{TAMANHO_URGENCIA}}, peso {{PESO_URGENCIA}}.)

7. RODAPÉ INSTITUCIONAL (CONSISTENTE COM RESTO):
{{DESCRICAO_RODAPE}}
(EXEMPLO DE FORMATO:
EXATAMENTE o mesmo rodapé dos slides anteriores: {{DESCRICAO_RODAPE_IGUAL}} (ex: cápsula preta no canto inferior esquerdo com ícone Alpha em ouro 3D e "Alfa Contabilidade" em branco).)

ESTILO E PARÂMETROS FINAIS:
{{ESTILO_FINAL}}
(EXEMPLO DE FORMATO:
Mesma escala em sub-pixels dos slides anteriores. Consistência visual ABSOLUTA com todo o carrossel. Botão CTA como elemento de MAIOR destaque visual após o título. Hierarquia clara: Título > CTA > Benefícios > Logo > Rodapé. Design focado em CONVERSÃO mas mantendo elegância profissional.
--ar 9:16 --v 6.0 --style raw)

══════════════════════════════════════════════════════════════
REGRAS DE CONSISTÊNCIA COM RESTO DO CARROSSEL:
1. MESMA cor de fundo (mesmo hex code exato)
2. MESMO padrão sobreposto (mesmo estilo, mesma cor)
3. MESMA marca d'água (mesmo texto, cor, opacidade)
4. MESMO rodapé institucional (idêntico)
5. MESMA família tipográfica (peso pode variar para ênfase)
6. MESMAS cores de acento (hex codes idênticos)
7. MESMO estilo visual geral (flat, macro, etc)
8. Botão CTA deve usar COR DE ACENTO da paleta existente
9. Hierarquia visual deve guiar olho: Título → Benefícios → CTA
10. Design deve transmitir CONFIANÇA + AÇÃO + VALOR
══════════════════════════════════════════════════════════════`;


// ============================================================================
// EXPORTAÇÕES
// ============================================================================

export const modelosAprendizadoRigorosos = {
  capa: templateAprendizadoCapa,
  meio: templateAprendizadoMeio,
  cta: templateAprendizadoCTA,
};

export const modelosCriacaoRigorosos = {
  capa: templateCriacaoCapa,
  meio: templateCriacaoMeio,
  cta: templateCriacaoCTA,
};

export type TipoSlide = 'capa' | 'meio' | 'cta';

/**
 * Preenche um modelo de criação com valores específicos
 */
export function preencherModeloCriacao(
  tipo: TipoSlide,
  variaveis: Record<string, string>
): string {
  let template = modelosCriacaoRigorosos[tipo];
  
  for (const [chave, valor] of Object.entries(variaveis)) {
    const regex = new RegExp(`\\{\\{${chave}\\}\\}`, 'g');
    template = template.replace(regex, valor);
  }
  
  // Remove indicações de exemplo não preenchidas
  template = template.replace(/\(ex: [^)]+\)/g, '');
  template = template.replace(/EXEMPLO DE FORMATO:[\s\S]*?\)/g, '');
  
  return template;
}

/**
 * Preenche um modelo de aprendizado com valores específicos
 */
export function preencherModeloAprendizado(
  tipo: TipoSlide,
  contexto?: string
): string {
  const template = modelosAprendizadoRigorosos[tipo];
  return contexto ? `${contexto}\n\n${template}` : template;
}

/**
 * Gera variáveis default para um modelo de criação
 */
export function gerarVariaveisDefaultCriacao(tipo: TipoSlide): Record<string, string> {
  const variaveisBase = {
    // Fundo e marca d'água (consistentes em todos os slides)
    COR_FUNDO: 'branco puro #FFFFFF',
    COR_FUNDO_HEX: '#FFFFFF',
    PADRAO_FUNDO: 'motherboard traces',
    COR_PADRAO_FUNDO: 'marrom-avermelhada/terrosa clara #A0522D',
    COR_PADRAO_FUNDO_HEX: '#A0522D',
    TEXTO_MARCA_AGUA: 'SIMPL',
    COR_MARCA_AGUA: 'cinzas #9CA3AF',
    
    // Rodapé consistente
    DESCRICAO_RODAPE: 'No canto inferior esquerdo, uma pílula (capsule) preta sólida #000000 com bordas arredondadas. À esquerda dentro da pílula, um círculo com símbolo Alpha (α) em relevo dourado 3D metálico polido #D97706. Texto ao lado: "Alfa Contabilidade" em fonte Sans-Serif branca #FFFFFF, limpa e moderna.',
    DESCRICAO_RODAPE_IGUAL_CAPA: 'No canto inferior esquerdo, a pílula preta #000000 com ícone Alpha (α) em ouro 3D #D97706 e texto "Alfa Contabilidade" em branco #FFFFFF',
    DESCRICAO_RODAPE_IGUAL: 'No canto inferior esquerdo, a pílula preta #000000 com ícone Alpha (α) em ouro 3D #D97706 e texto "Alfa Contabilidade" em branco #FFFFFF',
    
    ESTILO_FINAL: 'Mistura de fotografia macro com Flat Design e Gráficos Vetoriais. Nitidez extrema, 8k, proporção 9:16. Escala em sub-pixels com separação óbvia entre elementos. Composição simétrica em balanço visual vertical.',
  };
  
  const variaveisPorTipo: Record<TipoSlide, Record<string, string>> = {
    capa: {
      ...variaveisBase,
      TIPO_ELEMENTO_TOPO: 'PLACA DE ALERTA',
      DESCRICAO_ELEMENTO_TOPO: 'uma placa retangular amarela #F59E0B de bordas arredondadas',
      MATERIAL_ELEMENTO_TOPO: 'metal real com sinais de ferrugem pesada nas bordas e arranhões de sujeira',
      TEXTO_ELEMENTO_TOPO: 'ALERTA MAXIMO',
      FONTE_ELEMENTO_TOPO: 'Sans-Serif Bold',
      COR_TEXTO_ELEMENTO_TOPO: 'preta sólida #000000',
      TAMANHO_TEXTO_ELEMENTO_TOPO: 'altas',
      NUMERO_TARJAS: 'Quatro',
      COR_TARJAS: 'Amarelo-Ocre #D49A00',
      ALINHAMENTO_TARJAS: 'à esquerda',
      COR_TEXTO_TARJAS: 'branca pura #FFFFFF',
      FONTE_TARJAS: 'Segoe UI ou Roboto Heavy',
      LINHAS_TARJA_DETALHADAS: `Linha 1: 'Primeira linha de texto' (texto normal)
Linha 2: 'SEGUNDA PALAVRA' (A palavra PALAVRA deve ser colossal e ocupar largura da tarja)
Linha 3: 'texto normal TERCEIRA FRASE' (TERCEIRA FRASE em negrito extra)
Linha 4: 'da QUARTA LINHA' (QUARTA LINHA colossal e esticada na tarja)`,
      TIPO_ELEMENTO_CENTRAL: 'A AMEAÇA',
      DESCRICAO_ELEMENTO_CENTRAL_DETALHADA: 'Pendendo do elemento do topo por um fio preto de metal, uma ilustração vetorial Flat misturada com realismo mostrando o elemento principal da mensagem. Destacando-se como ponto focal, serpenteando entrelaçado na ilustração central, o elemento de destaque em cor vibrante com padrões internos.',
      DESCRICAO_PARTICULAS: 'Flutuando de forma translúcida ao redor de todo o núcleo central, elementos vetoriais de apoio dando volume à composição.',
    },
    meio: {
      ...variaveisBase,
      NUMERO_SLIDE: '2',
      ROTULO_SLIDE: 'CONTEÚDO',
      DESCRICAO_CABECALHO: 'No topo centralizado, badge circular com número do slide',
      COR_BORDA: 'dourada',
      COR_BORDA_HEX: '#D97706',
      COR_NUMERO: 'branco #FFFFFF',
      FONTE_ROTULO: 'Sans-Serif Bold',
      COR_ROTULO: 'cinza escuro #374151',
      TAMANHO_ROTULO: '3% da altura',
      NUMERO_LINHAS_TITULO: 'Uma',
      ALINHAMENTO_TITULO: 'alinhado à esquerda com margem de 10%',
      LINHAS_TITULO_DETALHADAS: 'Linha 1: "Título do Conteúdo" em fonte Roboto Black, cor cinza escuro #1F2937, tamanho 8% da altura, peso 900',
      FONTE_TITULO: 'Roboto Black',
      COR_TITULO: 'cinza escuro #1F2937',
      TAMANHO_TITULO: '8% da altura',
      DESCRICAO_CORPO_CONTEUDO: 'Lista com 3 itens usando bullets check verde #10B981',
      TIPO_CORPO: 'lista com 3 itens',
      NUMERO_ITENS: '3',
      ESTILO_BULLETS: 'checks verdes',
      COR_TEXTO_CORPO: 'cinza escuro #374151',
      FONTE_CORPO: 'Inter Regular',
      TAMANHO_CORPO: '4% da altura',
      ESPACAMENTO_LINHAS: '1.5x generoso',
      ESPACAMENTO_ITENS: '16px',
      ALINHAMENTO_CORPO: 'à esquerda',
      ITEM_1: 'Primeiro ponto importante',
      ITEM_2: 'Segundo ponto relevante',
      ITEM_3: 'Terceira informação crucial',
      DESCRICAO_ELEMENTOS_SUPORTE: 'Na área inferior-direita, 2-3 ícones vetoriais line art em azul médio',
      POSICAO_ELEMENTOS: 'inferior-direita',
      QUANTIDADE_ELEMENTOS: '2-3',
      ESTILO_ICONES: 'vetoriais line art',
      COR_ICONES: 'azul médio #3B82F6',
      TAMANHO_ICONES: '5% da largura',
      DESCRICAO_INDICADOR: 'No canto inferior direito, texto "Continue →" em fonte medium',
      TEXTO_INDICADOR: 'Continue →',
      FONTE_INDICADOR: 'Sans-Serif Medium',
      COR_INDICADOR: 'cinza médio #6B7280',
      TAMANHO_INDICADOR: '2.5% da altura',
    },
    cta: {
      ...variaveisBase,
      DESCRICAO_TITULO_CTA: 'No topo centralizado, título de posicionamento em fonte Extra Bold',
      TEXTO_TITULO_CTA: 'SUA PAZ DE ESPÍRITO NÃO TEM PREÇO',
      FONTE_TITULO_CTA: 'Roboto Black',
      COR_TITULO_CTA: 'cinza escuro #1F2937',
      COR_TITULO_CTA_HEX: '#1F2937',
      TAMANHO_TITULO_CTA: '10% da altura',
      DESCRICAO_BENEFICIOS: 'Abaixo do título, 3 benefícios em lista vertical com checks',
      NUMERO_BENEFICIOS: '3',
      ESTILO_ICONES_BENEFICIO: 'check verde #10B981 em círculo',
      FONTE_BENEFICIOS: 'Inter Medium',
      COR_BENEFICIOS: 'cinza escuro #374151',
      TAMANHO_BENEFICIOS: '5% da altura',
      BENEFICIO_1: 'Analisamos seu caso gratuitamente',
      BENEFICIO_2: 'Garantimos sua segurança fiscal',
      BENEFICIO_3: 'Economizamos seu tempo e dinheiro',
      ESPACAMENTO_BENEFICIOS: '20px generoso',
      ALINHAMENTO_BENEFICIOS: 'centralizado',
      DESCRICAO_LOGO_CTA: 'Centralizado acima do CTA, logo da marca em tamanho maior que nos slides de conteúdo',
      TAMANHO_LOGO_CTA: 'maior que nos slides de conteúdo, 20% da largura',
      TIPO_LOGO: 'oficial da marca',
      COR_LOGO: 'cores da marca',
      EFEITO_LOGO: 'nenhum',
      DESCRICAO_BOTAO_CTA: 'Centralizado na área inferior, botão CTA em formato de pílula',
      FORMATO_BOTAO: 'retângulo arredondado tipo pílula',
      COR_BOTAO: 'azul escuro',
      COR_BOTAO_HEX: '#1E40AF',
      TEXTO_BOTAO: 'AGENDE SUA CONSULTORIA AGORA',
      FONTE_BOTAO: 'Inter ExtraBold',
      COR_TEXTO_BOTAO: 'branco #FFFFFF',
      TAMANHO_TEXTO_BOTAO: '6% da altura',
      LARGURA_BOTAO: '70% da largura',
      ALTURA_BOTAO: '8% da altura',
      EFEITO_BOTAO: 'sombra sutil drop shadow, blur 12px, opacidade 15%',
      POSICAO_BOTAO: 'centralizado, 15% do fundo do slide',
      DESCRICAO_URGENCIA: '',
      TEXTO_URGENCIA: '',
      FONTE_URGENCIA: 'Sans-Serif Bold',
      COR_URGENCIA: 'vermelho #DC2626',
      TAMANHO_URGENCIA: '3% da altura',
      PESO_URGENCIA: '700',
    },
  };
  
  return { ...variaveisBase, ...variaveisPorTipo[tipo] };
}

export default {
  modelosAprendizadoRigorosos,
  modelosCriacaoRigorosos,
  preencherModeloCriacao,
  preencherModeloAprendizado,
  gerarVariaveisDefaultCriacao,
};
