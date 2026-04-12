/**
 * ============================================================================
 * TEMPLATES DE PROMPTS DE APRENDIZADO - ANÁLISE E COMPREENSÃO DE DESIGNS
 * ============================================================================
 * 
 * Estes prompts são projetados para:
 * - Analisar designs existentes e extrair seu DNA visual
 * - Compreender hierarquia visual, padrões e intenções de design
 * - Identificar elementos de sucesso em designs virais/eficazes
 * - Aprender estilos de marcas e consistencyas visuais
 * - Gerar relatórios detalhados de análise de design
 * 
 * USO: Estes prompts podem ser usados para treinar IA, analisar referências,
 * ou criar guias de estilo automáticos a partir de exemplos.
 */

// ============================================================================
// TEMPLATE 1: ANÁLISE DE DNA VISUAL DE UM DESIGN EXISTENTE
// ============================================================================

export const templateAnaliseDNAVisual = `AJA COMO UM DIRETOR DE ARTE SÊNIOR, ESPECIALISTA EM DESIGN VISUAL E PSICOLOGIA DA PERCEPÇÃO. Sua tarefa é realizar uma ANÁLISE CIRÚRGICA e EXAUSTIVA do design fornecido, desconstruindo cada elemento visual e compreendendo as intenções estratégicas por trás de cada escolha.

══════════════════════════════════════════════════════════════
FORMATO DA ANÁLISE:
Você deve retornar um JSON estruturado com as seguintes seções:
══════════════════════════════════════════════════════════════

{
  "analiseDNAVisual": {
    
    "1_IDENTIFICACAO_GERAL": {
      "tipoDeDesign": "Descreva o tipo (ex: capa de carrossel Instagram, post único, banner, etc.)",
      "objetivoPrincipal": "Qual é o objetivo comunicativo principal? (ex: alertar, educar, vender, entreter, informar)",
      "publicoAlvo": "Quem é o público-alvo provável? (ex: empresários, jovens, profissionais de saúde, público geral)",
      "tomDeVoz": "Qual é o tom emocional? (ex: urgente, educativo, institucional, amigável, provocativo, sério)",
      "plataformaProvavel": "Onde este design provavelmente seria usado? (ex: Instagram feed, Instagram stories, LinkedIn, Twitter)"
    },

    "2_PALETA_DE_CORES": {
      "coresDominantes": [
        {
          "cor": "Descreva a cor (ex: Vermelho vivo #DC2626)",
          "percentualEstimado": "Qual % do canvas esta cor ocupa? (ex: 45%, 20%, 5%)",
          "funcao": "Para que esta cor está sendo usada? (ex: fundo, texto, accent, CTA, alerta)",
          "psicologia": "O que esta cor comunica psychologicalmente? (ex: urgência, paixão, perigo, energia, ação)"
        }
      ],
      "coresSecundarias": [
        {
          "cor": "Descreva a cor",
          "percentualEstimado": "% do canvas",
          "funcao": "Para que está sendo usada?",
          "relacaoComDominante": "Como se relaciona com a cor dominante? (ex: complementar, análoga, contraste, neutro de apoio)"
        }
      ],
      "coresDeAcento": [
        {
          "cor": "Descreva a cor de destaque",
          "elementosOndeAparece": "Em quais elementos específicos esta cor aparece? (ex: apenas no botão CTA, apenas em ícones)",
          "propositoEstrategico": "Por que esta cor de acento foi escolhida? O que ela achieve?"
        }
      ],
      "harmoniaCromatica": "Descreva o esquema de cores geral (ex: complementar, análoga, triádica, monocromática, high-contrast). Justifique sua análise.",
      "acessibilidadeDeCores": "O contraste entre texto e fundo atende WCAG AA (4.5:1 mínimo)? Há problemas de acessibilidade?"
    },

    "3_TIPOGRAFIA": {
      "familiaPrincipal": "Qual é a família tipográfica dominante? (ex: Sans-serif geométrica como Montserrat / Serif clássica como Playfair / Sans humanista como Inter). Se não puder identificar exatamente, descreva as características.",
      "pesosUtilizados": [
        {
          "peso": "Qual peso? (ex: Black 900, ExtraBold 800, Bold 700, Regular 400, Light 300)",
          "ondeUsado": "Em quais elementos? (ex: título principal, subtítulo, corpo, rodapé)",
          "tamanhoRelativo": "Qual o tamanho relativo? (ex: maior elemento visual, 60% do título, pequeno)"
        }
      ],
      "hierarquiaTipografica": "Descreva a hierarquia completa do maior para o menor elemento de texto, com tamanhos relativos estimados.",
      "alinhamento": "Qual é o alinhamento predominante? (ex: centralizado, alinhado à esquerda, justificado). Por que esta escolha?",
      "espacamento": "Comment sobre letter-spacing, line-height e espaçamento entre elementos de texto. É apertado? Generoso? Moderado?",
      "legibilidade": "Avalie a legibilidade geral (0-10). O texto é fácil de ler? Há problemas de contraste, tamanho ou escolha tipográfica?",
      "personalidadeTipografica": "O que a tipografia comunica? (ex: modernidade, autoridade, acessibilidade, sofisticação, urgência, informalidade)"
    },

    "4_COMPOSICAO_E_LAYOUT": {
      "gridEstrutural": "Descreva o grid subjacente. (ex: 1 coluna centralizada / 2 colunas assimétricas / grid modular 3x3 / layout livre sem grid óbvio)",
      "regraDosTercos": "Os elementos principais seguem a regra dos terços? Onde estão os pontos de interseção utilizados?",
      "balancoVisual": "O design é simétrico ou assimétrico? Se assimétrico, como o balanceamento visual é achieved? (ex: elemento grande à esquerda balanceado por vários elementos pequenos à direita)",
      "espacoEmBranco": "Como o espaço em branco (negative space) é utilizado? (ex: generoso e sofisticado / mínimo e denso / bem distribuído / insuficiente e apertado)",
      "profundidade": "Há sensação de profundidade? (ex: flat design sem profundidade / camadas com sobreposição / drop shadows criando elevação / perspectiva 3D)",
      "fluxoDeLeitura": "Descreva o caminho que o olho do espectador segue. (ex: topo → centro → inferior / esquerda → direita em Z / espiral do centro para bordas)",
      "pontoFocal": "Qual é o PONTO FOCAL principal do design? (o elemento que primeiro chama atenção). Por que é o ponto focal?",
      "pontosFocaisSecundarios": "Quais são os pontos focais secundários que guiam o olhar após o ponto principal?",
      "proporcaoElementos": "Os elementos estão em boa proporção relativa? Algum elemento parece grande demais ou pequeno demais?"
    },

    "5_ELEMENTOS_VISUAIS": {
      "icones": {
        "quantidade": "Quantos ícones há?",
        "estilo": "Qual é o estilo? (ex: line art / filled flat / 3D / hand-drawn / minimalista / detalhado)",
        "consistencia": "Os ícones são consistentes entre si? (mesmo estilo, mesma família visual)",
        "funcao": "Qual é a função dos ícones? (ex: decorar / comunicar rapidamente / guiar o olhar / criar identidade)"
      },
      "formas": {
        "tiposDeFormas": "Quais formas geométricas estão presentes? (ex: retângulos arredondados / círculos / triângulos / formas orgânicas / linhas)",
        "funcaoDasFormas": "Para que as formas estão sendo usadas? (ex: conter texto / criar divisões / decorar / guiar olhar / enfatizar)"
      },
      "imagens": {
        "haFotografia": "Há fotografia real? (sim/não). Se sim, descreva.",
        "tratamentoDeImagem": "Qual é o tratamento? (ex: natural / com filtro / P&B / duotone / alto contraste / surreal)",
        "integracaoComDesign": "A fotografia integra bem com os outros elementos ou parece desconectada?"
      },
      "texturas": {
        "haTexturas": "Há texturas visíveis? (sim/não). Se sim, descreva.",
        "tiposDeTextura": "Quais tipos? (ex: granulada / metálica / papel / tecido / digital / grão de filme)",
        "funcaoDaTextura": "Para que a textura está sendo usada? (ex: adicionar profundidade / criar mood / dar realismo / quebrar flatness)"
      },
      "efeitos": {
        "haEfeitos": "Há efeitos visuais? (sim/não). Se sim, liste:",
        "listaDeEfeitos": [
          {
            "efeito": "Qual efeito? (ex: drop shadow / glow / blur / gradient / glassmorphism / outline)",
            "ondeAplicado": "Em qual elemento?",
            "intensidade": "Qual intensidade? (sutil / moderado / forte / exagerado)",
            "efetividade": "O efeito melhora ou piora o design?"
          }
        ]
      }
    },

    "6_HIERARQUIA_VISUAL": {
      "nivel1MaisImportante": {
        "elemento": "Qual é o elemento MAIS importante visualmente?",
        "porque": "Por que é o mais importante? (tamanho / cor / posição / contraste)",
        "percentualAtencao": "Quanto % da atenção visual este elemento recebe? (estimativa)"
      },
      "nivel2Importante": {
        "elemento": "Qual é o segundo elemento mais importante?",
        "percentualAtencao": "% de atenção estimada"
      },
      "nivel3Moderado": {
        "elemento": "Qual é o terceiro nível de importância?",
        "percentualAtencao": "% de atenção estimada"
      },
      "nivel4Suporte": {
        "elemento": "Quais são os elementos de suporte/background?",
        "percentualAtencao": "% de atenção estimada"
      },
      "hierarquiaEstaClara": "A hierarquia visual está clara e intencional? Ou há confusão sobre o que é mais importante?",
      "haCompeticaoVisual": "Há elementos competindo por atenção indevidamente? Quais?"
    },

    "7_PSICOLOGIA_E_MESSAGEM": {
      "emocaoPrimaria": "Qual é a emoção PRIMÁRIA que este design busca evocar? (ex: urgência, curiosidade, confiança, medo de perder, aspiration, alegria)",
      "emocaoSecundaria": "Qual é a emoção secundária? (ex: após a urgência inicial, transmite alívio/solução)",
      "messagemImplicita": "Além do texto explícito, qual mensagem é comunicada visualmente? (ex: 'somos autoridade', 'isto é urgente', 'confie em nós')",
      "gatilhosMentais": "Quais gatilhos mentais visuais são utilizados? (ex: escassez / autoridade / prova social / curiosidade / contraste / urgência)",
      "viésesCognitivos": "Quais viéses cognitivos o design explora? (ex: aversão à perda / efeito de mera exposição / viés de autoridade / anchoring)",
      "respostaDesejada": "Qual é a resposta/comportamento que o designer deseja do espectador? (ex: parar de scrollar / clicar / sentir curiosidade / confiar / agir)"
    },

    "8_AVALIACAO_CRITICA": {
      "pontosFortes": [
        "Liste 3-5 pontos fortes específicos do design com justificativa detalhada"
      ],
      "pontosFracos": [
        "Liste 2-4 pontos fracos ou áreas de melhoria com justificativa detalhada"
      ],
      "notaOverall": "Dê uma nota de 0-10 para o design como um todo",
      "notaLegibilidade": "Nota 0-10 para legibilidade",
      "notaImpacto": "Nota 0-10 para impacto visual e capacidade de parar o scroll",
      "notaCoerencia": "Nota 0-10 para coerência e consistência visual",
      "notaAcessibilidade": "Nota 0-10 para acessibilidade e inclusão",
      "paraQueFunciona": "Para quais contextos/objetivos este design funciona BEM?",
      "paraQueNaoFunciona": "Para quais contextos/objetivos este design NÃO funciona bem?",
      "comoMelhorar": "3-5 recomendações específicas e acionáveis para melhorar o design, priorizadas por impacto"
    },

    "9_PADROES_E_TENDENCIAS": {
      "padroesIdentificados": [
        "Liste padrões de design identificados (ex: uso de badge numérico / tarjas coloridas / hierarquia em 3 níveis / ícones como suporte visual)"
      ],
      "trendenciasAtuais": "Quais tendências de design atuais este design segue? (ex: flat design 2.0 / corporate Memphis / brutalismo digital / maximalismo / minimalismo funcional)",
      "referenciasEstilo": "A quais estilos ou marcas conhecidos este design se assemelha? (ex: estilo Apple / estilo startup moderna / estilo institucional brasileiro / estilo Dribbble trending)",
      "atemporalOuDatabound": "Este design parece atemporal ou datado? Por quê?"
    },

    "10_DNA_ESTILO_RESUMO": {
      "dnaEmUmaFrase": "Resuma o DNA deste design em UMA frase concisa e precisa",
      "dnaEmPalavrasChave": ["Liste 8-12 palavras-chave que capturam a essência do estilo"],
      "dnaCores": "Descreva a identidade de cores em uma frase",
      "dnaTipografia": "Descreva a identidade tipográfica em uma frase",
      "dnaComposicao": "Descreva a identidade composicional em uma frase",
      "dnaEmocao": "Descreva a identidade emocional em uma frase",
      "replicabilidade": "Quão replicável é este estilo? (0-10). Seria fácil criar variações mantendo consistência?",
      "escalabilidade": "Quão escalável é este estilo para diferentes formatos e contextos? (0-10)"
    }
  }
}

══════════════════════════════════════════════════════════════
REGRAS CRÍTICAS PARA ANÁLISE:
1. Seja ESPECÍFICO: nunca diga "cor forte", diga "vermelho vivo #DC2626 que ocupa ~35% do canvas"
2. Seja OBJETIVO: baseie-se em princípios de design, não preferências pessoais
3. Seja EXAUSTIVO: cubra todos os campos do JSON, mesmo que brevemente
4. Seja CONSTRUTIVO: pontos fracos devem vir com sugestões de melhoria
5. Seja CONTEXTUAL: considere o público-alvo e objetivo ao avaliar eficácia
6. Use terminologia profissional de design quando aplicável
7. Justifique CADA avaliação com raciocínio lógico
8. Não assuma intenções que não são evidentes no design
══════════════════════════════════════════════════════════════

Retorne APENAS o JSON estruturado, sem texto adicional.`;


// ============================================================================
// TEMPLATE 2: EXTRAÇÃO DE STYLE GUIDE DE UM DESIGN
// ============================================================================

export const templateExtrairStyleGuide = `AJA COMO UM DIRETOR DE ARTE E BRAND DESIGNER SÊNIOR. Sua tarefa é EXTRAIR O STYLE GUIDE COMPLETO do design fornecido, criando um documento que permita replicar consistentemente este estilo em designs futuros.

══════════════════════════════════════════════════════════════
FORMATO DO STYLE GUIDE:
Retorne um JSON estruturado com as seguintes seções:
══════════════════════════════════════════════════════════════

{
  "styleGuide": {
    
    "NOME_DO_ESTILO": "Dê um nome memorável a este estilo (ex: 'Corporate Alert', 'Institucional Moderno', 'Startup Vibrante')",

    "DESCRICAO_GERAL": "Descreva o estilo geral em 2-3 frases. Qual é a vibe? Para quem é? Quando usar?",

    "CORES": {
      "primaria": {
        "nome": "Nome da cor (ex: Azul Institucional)",
        "hex": "Código hex exato se possível (ex: #1E3A8A)",
        "rgb": "RGB (ex: rgb(30, 58, 138))",
        "uso": "Onde usar esta cor? (ex: fundos principais, títulos, botões)",
        "percentualNoDesign": "% estimado de uso"
      },
      "secundaria": {
        "nome": "Nome da cor",
        "hex": "Código hex",
        "rgb": "RGB",
        "uso": "Onde usar?",
        "percentualNoDesign": "% estimado"
      },
      "acento": {
        "nome": "Nome da cor de destaque",
        "hex": "Código hex",
        "rgb": "RGB",
        "uso": "Onde usar? (ex: CTAs, ícones, alertas, elementos de destaque)",
        "percentualNoDesign": "% estimado",
        "regraDeUso": "Regra para uso (ex: 'Usar apenas em elementos que precisam de atenção imediata', 'Máximo 10% do canvas')"
      },
      "neutraClara": {
        "nome": "Nome",
        "hex": "Código hex",
        "uso": "Onde usar?"
      },
      "neutraEscura": {
        "nome": "Nome",
        "hex": "Código hex",
        "uso": "Onde usar?"
      },
      "regrasDeCores": [
        "Liste 3-5 regras específicas de uso de cores (ex: 'Nunca usar cor de acento para texto de corpo', 'Sempre manter contraste mínimo de 4.5:1 entre texto e fundo')"
      ]
    },

    "TIPOGRAFIA": {
      "familiaPrincipal": {
        "nome": "Nome da família se identificável (ex: 'Inter', 'Montserrat', 'Roboto')",
        "classificacao": "Classificação (ex: Sans-serif geométrica, Serif de alto contraste, Display condensada)",
        "caracteristicas": "Características visuais (ex: 'altos x-height, aberturas amplas, cantos suavemente arredondados')",
        "personalidade": "O que comunica? (ex: 'moderna, acessível, profissional, confiável')"
      },
      "hierarquia": {
        "titulo": {
          "fonte": "Família",
          "peso": "Peso (ex: Black 900, ExtraBold 800)",
          "tamanho": "Tamanho relativo (ex: 48-60px em canvas 720x960, ou 8-10% da altura)",
          "cor": "Cor",
          "alinhamento": "Alinhamento",
          "efeitos": "Efeitos (ex: sem efeito, drop shadow sutil, outline)",
          "regras": "Regras específicas (ex: 'Sempre em caixa alta', 'Máximo 8 palavras')"
        },
        "subtitulo": {
          "fonte": "Família",
          "peso": "Peso",
          "tamanho": "Tamanho relativo (ex: 40-50% do tamanho do título)",
          "cor": "Cor",
          "alinhamento": "Alinhamento",
          "efeitos": "Efeitos",
          "regras": "Regras específicas"
        },
        "corpo": {
          "fonte": "Família",
          "peso": "Peso",
          "tamanho": "Tamanho relativo (ex: 24-32px, ou 35-40% do título)",
          "cor": "Cor",
          "espacamentoEntreLinhas": "Line-height (ex: 1.5x, 1.6x)",
          "regras": "Regras específicas"
        },
        "rodape": {
          "fonte": "Família",
          "peso": "Peso",
          "tamanho": "Tamanho relativo (ex: 16-20px, ou 20-25% do título)",
          "cor": "Cor",
          "regras": "Regras específicas"
        }
      },
      "regrasTipograficas": [
        "Liste 3-5 regras tipográficas (ex: 'Máximo 2 famílias por design', 'Sempre usar caixa alta em títulos', 'Nunca usar itálico para texto de corpo')"
      ]
    },

    "ELEMENTOS_VISUAIS": {
      "icones": {
        "estilo": "Estilo (ex: line art 2px stroke / filled flat / 3D isométrico)",
        "tamanho": "Tamanho relativo (ex: 24-32px, ou 5-8% da largura do canvas)",
        "cor": "Cor padrão",
        "variantes": "Há variantes de cor? Quando usar cada uma?",
        "regras": [
          "Liste regras de uso de ícones (ex: 'Todos os ícones devem ser do mesmo estilo', 'Usar apenas ícones da biblioteca aprovada')"
        ]
      },
      "formas": {
        "formasPrimarias": "Quais formas são mais usadas? (ex: retângulos com border-radius 12px)",
        "formasSecundarias": "Quais formas secundárias? (ex: círculos para badges)",
        "borderRadius": "Padrão de arredondamento (ex: 8px para pequenos, 16px para grandes, full para círculos)",
        "regras": [
          "Liste regras de uso de formas"
        ]
      },
      "sombras": {
        "haSombras": "Sim/não",
        "estiloDaSombra": "Descrição (ex: 'drop shadow suave, blur 12px, offset Y 4px, opacidade 10%')",
        "ondeUsar": "Em quais elementos aplicar sombras?",
        "regras": [
          "Liste regras de uso de sombras"
        ]
      },
      "bordas": {
        "haBordas": "Sim/não",
        "estiloDaBorda": "Descrição (ex: 'stroke 1px sólido na cor neutra escura')",
        "ondeUsar": "Em quais elementos aplicar bordas?",
        "regras": [
          "Liste regras de uso de bordas"
        ]
      },
      "gradientes": {
        "haGradientes": "Sim/não",
        "estiloDoGradiente": "Descrição (ex: 'gradiente linear vertical de #1E3A8A (topo) para #3B82F6 (base)')",
        "ondeUsar": "Em quais elementos aplicar gradientes?",
        "regras": [
          "Liste regras de uso de gradientes"
        ]
      }
    },

    "COMPOSICAO": {
      "grid": {
        "tipoDeGrid": "Descrição (ex: '1 coluna central com margens de 40px', 'Grid 12 colunas com gutter de 20px')",
        "margens": "Margens (ex: '40px em todos os lados')",
        "gutter": "Espaçamento entre colunas se aplicável"
      },
      "espacamento": {
        "entreSecoes": "Espaço entre seções principais (ex: 48px)",
        "entreElementos": "Espaço entre elementos relacionados (ex: 16px)",
        "entreLinhasDeTexto": "Line-height padrão (ex: 1.5x para corpo, 1.2x para títulos)"
      },
      "alinhamento": "Alinhamento padrão (ex: 'centralizado para títulos, esquerda para corpo')",
      "regrasDeComposicao": [
        "Liste 5-8 regras de composição (ex: 'Sempre manter 20-30% de espaço em branco', 'Nunca colocar mais de 3 elementos no mesmo nível de importância')"
      ]
    },

    "PADROES_RECORRENTES": {
      "padroes": [
        {
          "nome": "Nome do padrão (ex: 'Badge Numérico no Topo', 'Tarjas Coloridas para Hierarquia')",
          "descricao": "Descrição detalhada do padrão",
          "quandoUsar": "Em que situações este padrão deve ser usado?",
          "especificacoes": "Especificações técnicas para replicar"
        }
      ]
    },

    "DOs_E_DONTs": {
      "faca": [
        "Liste 8-12 coisas que SEMPRE devem ser feitas neste estilo"
      ],
      "nuncaFaca": [
        "Liste 8-12 coisas que NUNCA devem ser feitas neste estilo"
      ]
    },

    "CONTEXTOS_DE_USO": {
      "funcionaPara": [
        "Liste contextos onde este estilo funciona bem (ex: 'Alertas urgentes', 'Conteúdo educativo', 'Comunicados institucionais')"
      ],
      "naoFuncionaPara": [
        "Liste contextos onde este estilo NÃO funciona (ex: 'Conteúdo humorístico', 'Promoções de varejo')"
      ],
      "variacoesRecomendadas": [
        "Liste variações possíveis deste estilo para diferentes contextos"
      ]
    },

    "EXEMPLO_DE_REPLICACAO": {
      "descricao": "Descreva como seria um NOVO design neste estilo para um tema diferente. Seja específico o suficiente para que outro designer possa replicar.",
      "tituloExemplo": "Exemplo de título neste estilo",
      "coresAplicadas": "Como as cores seriam aplicadas neste exemplo",
      "layoutExemplo": "Como seria o layout"
    }
  }
}

══════════════════════════════════════════════════════════════
REGRAS CRÍTICAS:
1. Seja EXTREMAMENTE específico com valores hex, pixels e porcentagens
2. Inclua REGRAS claras, não apenas descrições
3. Pense em como outro designer usaria este guia para REPLICAR o estilo
4. Identifique tanto o que FAZER quanto o que NÃO FAZER
5. Inclua exemplos práticos de aplicação
6. Mantenha o foco em CONSISTÊNCIA e REPLICABILIDADE
══════════════════════════════════════════════════════════════

Retorne APENAS o JSON estruturado, sem texto adicional.`;


// ============================================================================
// TEMPLATE 3: ANÁLISE COMPARATIVA ENTRE MÚLTIPLOS DESIGNS
// ============================================================================

export const templateAnaliseComparativa = `AJA COMO UM DIRETOR DE ARTE E ESTRATEGISTA DE DESIGN SÊNIOR. Sua tarefa é comparar ANALITICAMENTE {{QUANTIDADE_DESIGNS}} designs fornecidos, identificando padrões, diferenças, pontos fortes de cada um e recomendações para convergência de estilo.

══════════════════════════════════════════════════════════════
FORMATO DA ANÁLISE COMPARATIVA:
Retorne um JSON estruturado:
══════════════════════════════════════════════════════════════

{
  "analiseComparativa": {
    
    "RESUMO_EXECUTIVO": {
      "totalDeDesignsAnalisados": "{{QUANTIDADE_DESIGNS}}",
      "objetivoDaComparacao": "Por que estamos comparando estes designs?",
      "findingsPrincipais": [
        "Liste 3-5 descobertas principais da análise comparativa"
      ],
      "recomendacaoGeral": "Recomendação estratégica geral baseada na comparação"
    },

    "DESIGNS_INDIVIDUAIS": [
      {
        "design": 1,
        "identificacao": {
          "nome": "Nome ou descrição do design",
          "tipo": "Tipo de design",
          "objetivo": "Objetivo principal"
        },
        "pontosFortes": [
          "Liste 3-5 pontos fortes específicos"
        ],
        "pontosFracos": [
          "Liste 2-3 pontos fracos específicos"
        ],
        "notaOverall": "Nota 0-10",
        "dnaEmUmaFrase": "DNA do design em uma frase"
      }
    ],

    "COMPARACAO_DIRETA": {
      "cores": {
        "similaridades": "O que os designs têm em comum em termos de cores?",
        "diferencas": "Onde diferem em cores?",
        "melhorAbordagem": "Qual abordagem de cor é mais eficaz? Por quê?",
        "consistenciaEntreDesigns": "Os designs são consistentes entre si em cores? (0-10)"
      },
      "tipografia": {
        "similaridades": "O que têm em comum em tipografia?",
        "diferencas": "Onde diferem?",
        "melhorAbordagem": "Qual abordagem tipográfica é mais eficaz? Por quê?",
        "consistenciaEntreDesigns": "Consistência tipográfica entre designs (0-10)"
      },
      "composicao": {
        "similaridades": "O que têm em comum em composição?",
        "diferencas": "Onde diferem?",
        "melhorAbordagem": "Qual abordagem composicional é mais eficaz? Por quê?",
        "consistenciaEntreDesigns": "Consistência composicional (0-10)"
      },
      "elementosVisuais": {
        "similaridades": "Elementos visuais compartilhados?",
        "diferencas": "Elementos únicos a cada design?",
        "melhorAbordagem": "Qual abordagem visual é mais eficaz? Por quê?",
        "consistenciaEntreDesigns": "Consistência visual (0-10)"
      },
      "impacto": {
        "maisImpactante": "Qual design tem mais impacto visual? Por quê?",
        "menosImpactante": "Qual tem menos impacto? Por quê?",
        "rankingDeImpacto": "Ordene os designs por impacto (1º, 2º, 3º...)"
      },
      "legibilidade": {
        "maisLegivel": "Qual é mais legível? Por quê?",
        "menosLegivel": "Qual é menos legível? Por quê?",
        "rankingDeLegibilidade": "Ordene por legibilidade"
      },
      "coerencia": {
        "maisCoerente": "Qual é mais coerente internamente? Por quê?",
        "menosCoerente": "Qual é menos coerente? Por quê?",
        "rankingDeCoerencia": "Ordene por coerência"
      }
    },

    "PADROES_TRANSVERSAIS": {
      "padroesComuns": [
        {
          "padrao": "Descreva o padrão",
          "designsOndeAparece": "Em quais designs aparece? (ex: Design 1, 3, 4)",
          "efetividade": "Quão efetivo é este padrão? (0-10)",
          "deveSerMantido": "Este padrão deve ser mantido em todos os designs futuros? Por quê?"
        }
      ],
      "elementosUnicos": [
        {
          "elemento": "Descreva o elemento único",
          "designOndeAparece": "Em qual design aparece?",
          "deveSerReplicado": "Este elemento deve ser replicado em outros designs? Por quê?"
        }
      ]
    },

    "RECOMENDACOES_DE_CONVERGENCIA": {
      "contexto": "Se o objetivo é criar consistência de marca entre todos os designs:",
      "elementosQueDevemSerConsistentes": [
        {
          "elemento": "Qual elemento deve ser consistente? (ex: paleta de cores, família tipográfica, tratamento de fotos)",
          "porque": "Por que deve ser consistente?",
          "comoImplementar": "Como garantir esta consistência?",
          "prioridade": "Alta/Média/Baixa"
        }
      ],
      "elementosQuePodemVariar": [
        {
          "elemento": "Qual elemento pode variar entre designs?",
          "porque": "Por que pode variar sem prejudicar a marca?",
          "limitesDaVariacao": "Quais são os limites aceitáveis de variação?",
          "prioridade": "Alta/Média/Baixa"
        }
      ],
      "styleGuideUnificado": "Recomendações para criar um style guide unificado que abranja todos os designs"
    },

    "RANKING_FINAL": {
      "criterios": "Descreva os critérios usados para o ranking final",
      "ranking": [
        {
          "posicao": "1º lugar",
          "design": "Qual design",
          "nota": "Nota final 0-10",
          "porque": "Justificativa"
        }
      ],
      "melhorPara": "O melhor design para qual objetivo específico?",
      "maisVersatil": "Qual design é mais versátil/adaptável?"
    }
  }
}

══════════════════════════════════════════════════════════════
REGRAS CRÍTICAS:
1. Compare DESIGN A DESIGN em cada categoria
2. Justifique CADA avaliação com evidência visual específica
3. Seja IMPARCIAL: avalie por mérito, não preferência pessoal
4. Considere o OBJETIVO de cada design ao avaliar
5. Identifique tanto similaridades QUANTO diferenças
6. Forneça recomendações ACIONÁVEIS para convergência
7. Priorize recomendações por impacto e facilidade de implementação
══════════════════════════════════════════════════════════════

Retorne APENAS o JSON estruturado, sem texto adicional.`;


// ============================================================================
// TEMPLATE 4: APRENDIZADO DE ESTILO PARA TREINAMENTO DE IA
// ============================================================================

export const templateAprendizadoEstiloIA = `AJA COMO UM ESPECIALISTA EM TREINAMENTO DE IA PARA GERAÇÃO DE IMAGENS E DESIGN COMPUTACIONAL. Sua tarefa é criar um "manual de estilo" extremamente estruturado e técnico que possa ser usado para TREINAR ou INSTRUIR uma IA a gerar designs consistentes neste estilo específico.

══════════════════════════════════════════════════════════════
FORMATO DO MANUAL DE ESTILO PARA IA:
Retorne um JSON estruturado otimizado para consumo por IA:
══════════════════════════════════════════════════════════════

{
  "styleGuideParaIA": {
    
    "METADADOS": {
      "nomeDoEstilo": "Nome memorável e descritivo",
      "versao": "1.0",
      "dataCriacao": "Data atual",
      "categoriasAplicaveis": ["Liste categorias onde este estilo se aplica (ex: 'capa-carrossel', 'post-instagram', 'banner-web')"],
      "nivelDeDificuldade": "Fácil/Médio/Difícil para replicar",
      "tempoEstimadoDeGeracao": "Tempo estimado para gerar um design neste estilo"
    },

    "CANVAS": {
      "dimensoes": {
        "largura": "Largura em pixels (ex: 720)",
        "altura": "Altura em pixels (ex: 960)",
        "aspectRatio": "Proporção (ex: 3:4, 9:16)",
        "dpi": "DPI recomendado (ex: 72 para web, 300 para print)"
      },
      "background": {
        "tipo": "Tipo de fundo (ex: cor sólida, gradiente, imagem, textura)",
        "corHex": "Código hex exato",
        "gradienteSeAplicavel": {
          "tipo": "Tipo de gradiente (ex: linear, radial)",
          "direcao": "Direção (ex: vertical, horizontal, diagonal)",
          "cores": [
            {"posicao": "0%", "cor": "#HEX"},
            {"posicao": "100%", "cor": "#HEX"}
          ]
        }
      },
      "margensEPadding": {
        "margemSuperior": "Em pixels",
        "margemInferior": "Em pixels",
        "margemEsquerda": "Em pixels",
        "margemDireita": "Em pixels",
        "paddingInterno": "Padding padrão entre elementos"
      }
    },

    "SISTEMA_DE_CORES": {
      "coresPermitidas": [
        {
          "nome": "Nome da cor",
          "hex": "#HEX",
          "rgb": "rgb(R, G, B)",
          "hsl": "hsl(H, S%, L%)",
          "papel": "Papel desta cor no design (ex: background, primary-text, accent, secondary, border)",
          "percentualMaximo": "% máxima do canvas que esta cor deve ocupar",
          "percentualMinimo": "% mínima (se aplicável)",
          "combinacoesPermitidas": ["Com quais outras cores pode aparecer adjacente"],
          "combinacoesProibidas": ["Com quais cores NÃO deve aparecer adjacente"],
          "regrasEspecificas": ["Regras específicas para esta cor"]
        }
      ],
      "regrasGeraisDeCores": [
        "Regras gerais que governam o uso de todas as cores"
      ]
    },

    "SISTEMA_TIPOGRAFICO": {
      "fontesPermitidas": [
        {
          "nome": "Nome da fonte",
          "categoria": "Categoria (ex: sans-serif, serif, display)",
          "pesosPermitidos": [300, 400, 500, 600, 700, 800, 900],
          "fallback": "Font fallback (ex: 'Inter, Arial, sans-serif')",
          "licenca": "Tipo de licença (ex: Google Fonts free, Adobe Fonts, comercial)"
        }
      ],
      "escalaTipografica": {
        "titulo": {
          "fonte": "Nome da fonte",
          "peso": "Peso numérico",
          "tamanhoPx": "Tamanho em pixels para canvas de referência",
          "lineHeight": "Line-height numérico (ex: 1.1)",
          "letterSpacing": "Letter-spacing (ex: 0px, -0.5px, 2px)",
          "cor": "#HEX",
          "transformacao": "text-transform (ex: uppercase, none, capitalize)",
          "minSize": "Tamanho mínimo absoluto",
          "maxSize": "Tamanho máximo absoluto",
          "regras": ["Regras específicas para este nível"]
        },
        "subtitulo": {
          "mesma estrutura que titulo"
        },
        "corpo": {
          "mesma estrutura que titulo"
        },
        "legenda": {
          "mesma estrutura que titulo"
        }
      },
      "regrasTipograficasGerais": [
        "Regras que governam toda a tipografia"
      ]
    },

    "BIBLIOTECA_DE_ELEMENTOS": {
      "icones": {
        "estilo": "Descrição técnica do estilo de ícone",
        "tamanhoPadrao": {"width": "px", "height": "px"},
        "strokeWidth": "Se line art, espessura do stroke em px",
        "corPadrao": "#HEX",
        "variantesDeCor": [
          {"nome": "Nome da variante", "cor": "#HEX", "quandoUsar": "Contexto de uso"}
        ],
        "formatos": ["Liste formatos permitidos (ex: SVG, PNG)"],
        "regras": ["Regras de uso de ícones"]
      },
      "botoes": {
        "estilo": "Descrição do estilo de botão",
        "padding": {"horizontal": "px", "vertical": "px"},
        "borderRadius": "px",
        "corFundo": "#HEX",
        "corTexto": "#HEX",
        "fonte": "Nome da fonte",
        "fontSize": "px",
        "fontWeight": "peso",
        "shadow": "Descrição da sombra se houver",
        "variantes": [
          {"nome": "Variante", "corFundo": "#HEX", "quandoUsar": "Contexto"}
        ],
        "regras": ["Regras de uso de botões"]
      },
      "badges": {
        "estilo": "Descrição do estilo de badge",
        "formatos": ["Liste formatos (ex: circular, retangular, pill)"],
        "tamanhos": [
          {"nome": "Pequeno", "dimensoes": "px", "fontSize": "px"},
          {"nome": "Médio", "dimensoes": "px", "fontSize": "px"},
          {"nome": "Grande", "dimensoes": "px", "fontSize": "px"}
        ],
        "cores": [
          {"nome": "Cor padrão", "background": "#HEX", "texto": "#HEX"}
        ],
        "regras": ["Regras de uso de badges"]
      },
      "containers": {
        "estilo": "Descrição do estilo de containers/cards",
        "background": "#HEX ou 'transparente'",
        "border": "Descrição da borda (ex: '1px solid #E5E7EB')",
        "borderRadius": "px",
        "padding": "px",
        "shadow": "Descrição da sombra",
        "regras": ["Regras de uso de containers"]
      }
    },

    "REGRAS_DE_COMPOSICAO": {
      "grid": {
        "tipo": "Descrição do grid",
        "colunas": "Número de colunas",
        "gutter": "Espaço entre colunas em px",
        "margens": "Margens externas em px"
      },
      "espacamento": {
        "escala": [4, 8, 12, 16, 24, 32, 48, 64],
        "unidade": "px",
        "regra": "Todo espaçamento deve usar valores desta escala"
      },
      "alinhamento": "Regras de alinhamento",
      "hierarquia": "Regras de hierarquia visual",
      "regrasEspecificas": [
        "Liste todas as regras específicas de composição"
      ]
    },

    "PARAMETROS_DE_GERACAO_PARA_IA": {
      "promptTemplate": "Template de prompt otimizado para IA generativa neste estilo. Use placeholders como {titulo}, {subtitulo}, {corPrimaria}.",
      "negativePrompt": "O que a IA deve EVITAR gerar neste estilo",
      "parametrosRecomendados": {
        "model": "Modelo de IA recomendado (ex: 'DALL-E 3', 'Midjourney v6', 'Stable Diffusion XL')",
        "aspectRatio": "--ar X:Y",
        "version": "--v X.X",
        "quality": "--q X",
        "style": "--style raw/creative/etc",
        "chaos": "--chaos X se aplicável",
        "seed": "Recomendações sobre seed"
      },
      "dicasDePrompt": [
        "Dicas específicas para obter melhores resultados com IA neste estilo"
      ],
      "posProcessamento": [
        "Etapas de pós-processamento recomendadas após geração pela IA"
      ]
    },

    "EXEMPLOS_DE_PROMPT_PARA_IA": [
      {
        "cenario": "Descrição do cenário de uso",
        "prompt": "Exemplo de prompt completo para IA",
        "resultadoEsperado": "Descrição do resultado esperado"
      }
    ],

    "VALIDACAO": {
      "checklistDeQualidade": [
        "Critérios de checklist para validar se um design gerado está no estilo correto"
      ],
      "errosComuns": [
        {
          "erro": "Descrição do erro comum",
          "comoEvitar": "Como evitar este erro",
          "comoCorrigir": "Como corrigir se ocorrer"
        }
      ],
      "testesDeValidacao": [
        "Testes que podem ser automatizados para validar aderência ao estilo"
      ]
    }
  }
}

══════════════════════════════════════════════════════════════
REGRAS CRÍTICAS:
1. Este guia será usado por IA: seja EXTREMAMENTE preciso e técnico
2. Use valores numéricos sempre que possível (px, %, #HEX)
3. Inclua REGRAS explícitas, não implícitas
4. Pense em como uma IA interpretaria cada instrução
5. Evite ambiguidade: "grande" não é útil, "48px" é útil
6. Inclua exemplos concretos de prompts para IA
7. Forneça critérios de validação automatizáveis
8. Este manual deve permitir REPRODUÇÃO CONSISTENTE do estilo
══════════════════════════════════════════════════════════════

Retorne APENAS o JSON estruturado, sem texto adicional.`;


// ============================================================================
// TEMPLATE 5: PROMPT DE APRENDIZADO ITERATIVO (REFINAMENTO DE ESTILO)
// ============================================================================

export const templateAprendizadoIterativo = `AJA COMO UM DIRETOR DE ARTE EM PROCESSO DE ITERAÇÃO CRIATIVA. Você receberá um design inicial e feedback sobre ele. Sua tarefa é ANALISAR O GAP entre o resultado atual e o resultado desejado, e gerar INSTRUÇÕES PRECAS DE REFINAMENTO.

══════════════════════════════════════════════════════════════
FORMATO DA ANÁLISE ITERATIVA:
Retorne um JSON estruturado:
══════════════════════════════════════════════════════════════

{
  "analiseIterativa": {
    
    "ESTADO_ATUAL": {
      "descricao": "Descreva objetivamente o estado atual do design",
      "pontosFortesAtuais": [
        "O que já está funcionando bem?"
      ],
      "pontosFracosAtuais": [
        "O que NÃO está funcionando?"
      ],
      "notaAtual": "Nota 0-10 do estado atual"
    },

    "ESTADO_DESEJADO": {
      "descricao": "Descreva objetivamente o estado desejado (baseado no feedback)",
      "referenciaVisual": "Se há uma referência, descreva o que ela tem que o atual não tem",
      "caracteristicasChave": [
        "Quais são as características essenciais do estado desejado?"
      ]
    },

    "GAP_ANALYSIS": {
      "cores": {
        "estadoAtual": "Como estão as cores atualmente",
        "estadoDesejado": "Como deveriam estar",
        "gap": "Qual é a diferença específica?",
        "severidade": "Alta/Média/Baixa",
        "acaoNecessaria": "O que exatamente precisa mudar?"
      },
      "tipografia": {
        "estadoAtual": "Como está a tipografia",
        "estadoDesejado": "Como deveria estar",
        "gap": "Qual é a diferença?",
        "severidade": "Alta/Média/Baixa",
        "acaoNecessaria": "O que mudar?"
      },
      "composicao": {
        "estadoAtual": "Como está a composição",
        "estadoDesejado": "Como deveria estar",
        "gap": "Qual é a diferença?",
        "severidade": "Alta/Média/Baixa",
        "acaoNecessaria": "O que mudar?"
      },
      "elementosVisuais": {
        "estadoAtual": "Como estão os elementos visuais",
        "estadoDesejado": "Como deveriam estar",
        "gap": "Qual é a diferença?",
        "severidade": "Alta/Média/Baixa",
        "acaoNecessaria": "O que mudar?"
      },
      "hierarquia": {
        "estadoAtual": "Como está a hierarquia",
        "estadoDesejado": "Como deveria estar",
        "gap": "Qual é a diferença?",
        "severidade": "Alta/Média/Baixa",
        "acaoNecessaria": "O que mudar?"
      }
    },

    "PLANO_DE_REFINAMENTO": {
      "prioridadeAlta": [
        {
          "mudanca": "O que mudar",
          "onde": "Onde no design",
          "como": "Como mudar (instruções específicas)",
          "de": "Estado atual (valor específico)",
          "para": "Estado desejado (valor específico)",
          "impactoEsperado": "Qual melhoria esta mudança trará?",
          "risco": "Há risco de piorar algo? Qual?"
        }
      ],
      "prioridadeMedia": [
        "Mesma estrutura que prioridade alta"
      ],
      "prioridadeBaixa": [
        "Mesma estrutura que prioridade alta"
      ],
      "mudancasParaEVITAR": [
        {
          "mudanca": "O que NÃO mudar",
          "porque": "Por que não mudar?",
          "riscoSeMudar": "O que aconteceria se mudar?"
        }
      ]
    },

    "PROMPT_DE_REFINAMENTO": {
      "promptParaGeracao": "Gere um NOVO prompt de geração que incorpore TODAS as mudanças de prioridade alta e média. Este deve ser um prompt completo e autocontidente.",
      "instrucoesEspecificas": "Liste instruções adicionais específicas que complementam o prompt",
      "parametrosAlterados": "Se há mudança de parâmetros (--ar, --v, etc), liste"
    },

    "CRITERIOS_DE_SUCESSO": {
      "comoSaberSeMelhorou": [
        "Critérios objetivos para determinar se o refinamento funcionou"
      ],
      "notaMinimaDesejada": "Qual nota mínima esperamos após refinamento?",
      "fallback": "Se o refinamento piorar o design, qual é o plano B?"
    }
  }
}

══════════════════════════════════════════════════════════════
REGRAS CRÍTICAS:
1. Seja ESPECÍFICO sobre o que mudar, onde, e como
2. Priorize mudanças por IMPACTO/ESFORÇO
3. Identifique explicitamente o que NÃO mudar
4. Para cada mudança, defina critérios de sucesso
5. Sempre tenha um plano B se o refinamento falhar
6. O prompt de refinamento deve ser COMPLETO e autocontidente
7. Mude MENOS para obter MAIS (refinamento cirúrgico, não recriação)
══════════════════════════════════════════════════════════════

Retorne APENAS o JSON estruturado, sem texto adicional.`;


// ============================================================================
// EXPORT DE TODOS OS TEMPLATES DE APRENDIZADO
// ============================================================================

export const promptTemplatesAprendizado = {
  analiseDNAVisual: templateAnaliseDNAVisual,
  extrairStyleGuide: templateExtrairStyleGuide,
  analiseComparativa: templateAnaliseComparativa,
  aprendizadoEstiloIA: templateAprendizadoEstiloIA,
  aprendizadoIterativo: templateAprendizadoIterativo,
} as const;

export type TemplateAprendizadoKey = keyof typeof promptTemplatesAprendizado;

/**
 * Preenche um template de aprendizado com valores específicos
 */
export function preencherTemplateAprendizado(
  templateKey: TemplateAprendizadoKey,
  variaveis: Record<string, string>
): string {
  let template = promptTemplatesAprendizado[templateKey];
  
  // Substituir todas as variáveis no formato {{CHAVE}}
  for (const [chave, valor] of Object.entries(variaveis)) {
    const regex = new RegExp(`\\{\\{${chave}\\}\\}`, 'g');
    template = template.replace(regex, valor);
  }
  
  return template;
}

/**
 * Retorna lista de todas as variáveis necessárias para um template
 */
export function getVariaveisNecessariasAprendizado(templateKey: TemplateAprendizadoKey): string[] {
  const template = promptTemplatesAprendizado[templateKey];
  const matches = template.match(/\{\{(\w+)\}\}/g) || [];
  return [...new Set(matches.map(m => m.replace(/\{\{|\}\}/g, '')))];
}

export default promptTemplatesAprendizado;
