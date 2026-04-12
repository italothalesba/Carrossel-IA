/**
 * ============================================================================
 * TEMPLATES DE PROMPTS PARA CRIAÇÃO DE CAPAS - NÍVEL DIRETOR DE ARTE SÊNIOR
 * ============================================================================
 * 
 * Estes prompts seguem o modelo de complexidade de Diretor de Arte, com:
 * - Hierarquia visual detalhada (6+ níveis de composição)
 * - Especificações de textura, material e acabamento
 * - Instruções tipográficas precisas (família, peso, tamanho relativo)
 * - Paleta de cores com hex codes específicos
 * - Elementos visuais com posicionamento exato
 * - Parâmetros técnicos de geração (--ar, --v, --style)
 * - Contexto emocional e psicológico do design
 * 
 * USO: Cada template pode ser adaptado dinamicamente substituindo as variáveis
 * entre {{CHAVES}} pelos valores específicos do projeto.
 */

// ============================================================================
// TIPO DE CAPA: ALERTA URGENTE (Estoque: Golpes, Alertas, Prazos)
// ============================================================================

export const templateCapaAlertaUrgente = `AJA COMO UM DIRETOR DE ARTE E DESIGNER GRÁFICO SÊNIOR. Gere uma capa de carrossel Instagram vertical de ALTO IMPACTO VISUAL para alerta urgente. A composição deve ser limpa, seguindo rigorosamente a seguinte hierarquia visual:

1. FUNDO E MARCA D'ÁGUA:
Fundo {{COR_FUNDO_PRIMARIA}} (ex: branco puro #FFFFFF ou cinza muito claro #F5F5F5). Sobreposto ao fundo, um padrão intrincado de '{{PADRAO_TEXTO_FUNDO}}' (ex: motherboard traces/circuitos impressos, linhas geométricas, ondas sonoras) em linhas finas de cor {{COR_TEXTO_FUNDO}} (ex: marrom-avermelhada/terrosa clara #A0522D ou cinza médio #9CA3AF). No topo superior, lendo-se '{{TEXTO_MARCA_AGUA}}' (parcialmente cortado) em letras {{COR_MARCA_AGUA}} gigantescas e translúcidas (opacidade 8-12%), ocupando toda a largura horizontal como marca d'água de fundo.

2. ELEMENTO TOPO (PLACA DE ALERTA):
No topo, uma placa retangular {{COR_PLACA_ALERTA}} com bordas arredondadas (raio 8-12px), simulando {{ESTILO_PLACA}} (ex: uma placa de trânsito antiga e desgastada / um selo oficial moderno / um badge de notificação digital). Textura {{TEXTURA_PLACA}} (ex: metálica com sinais de ferrugem pesada nas bordas e arranhões de sujeira / flat design limpo com sombra sutil / efeito glassmorphism com blur). Texto interno: '{{TEXTO_PLACA_ALERTA}}' em fonte {{FONTE_PLACA}} (ex: Sans-Serif Bold como 'Impact', 'Arial Black', ou 'Roboto Black'), cor {{COR_TEXTO_PLACA}} (ex: preta sólida #000000), letras altas (altura mínima 8% da largura da placa).

3. BLOCO DE TEXTO CENTRAL (TARJAS):
{{NUMERO_TARJAS}} tarjas horizontais sólidas em cor {{COR_TARJAS}} (ex: Amarelo-Ocre #D49A00 / Vermelho Vivo #DC2626 / Azul Royal #1E40AF) com alinhamento {{ALINHAMENTO_TARJAS}} (ex: à esquerda / centralizado / justificando), sobrepondo o fundo. Texto em {{COR_TEXTO_TARJAS}} (ex: branco puro #FFFFFF), fonte '{{FONTE_TARJAS}}' (ex: 'Segoe UI' ou 'Roboto' Heavy / 'Montserrat' Black / 'Inter' ExtraBold):
{{LINHAS_TARJA}}
(Especificar para cada linha qual palavra/frase deve ter destaque massivo, ocupando largura maior da tarja)

4. ILUSTRAÇÃO CENTRAL (ELEMENTO VISUAL PRINCIPAL):
{{DESCRICAO_ILUSTRACAO_CENTRAL}}
(Especificação detalhada incluindo:)
- Objeto principal: descrição física completa (material, textura, cor, dimensões relativas)
- Elementos secundários: interação entre objetos (ex: pendendo por linha metálica, emergindo de envelope, surgindo de fumaça)
- Detalhes de contexto: texto em etiquetas, selos, ícones pequenos (especificar conteúdo textual exato se houver)
- Elemento surpresa: detalhe que conta a história principal da imagem (ex: minhoca digital, caveira, cadeado quebrado, gráfico em queda)

5. ÍCONES DE APOIO (ELEMENTOS DECORATIVOS):
{{DESCRICAO_ICONES_APOIO}}
(Especificação de elementos flutuantes ao redor da ilustração central: forma, cor, opacidade, quantidade, padrão de distribuição)

6. RODAPÉ (ASSINATURA DA MARCA):
{{POSICAO_RODAPE}} (ex: No canto inferior esquerdo / centralizado / canto inferior direito), {{DESCRICAO_RODAPE}}
(ex: uma pílula (capsule) preta sólida com bordas arredondadas. À esquerda dentro da pílula, um círculo com um símbolo '{{SIMBOLO_MARCA}}' em relevo {{COR_RELEVO}} 3D. Texto ao lado: '{{NOME_MARCA}}' em fonte Sans-Serif branca, limpa e moderna, tamanho 14-16pt equivalente)

ESTILO: {{ESTILO_GERAL}}
(ex: Mistura de fotografia macro (placa e anzol) com Flat Design e Gráficos Vetoriais. Nitidez extrema, 8k, proporção 9:16)
(ex: Design 100% vetorial com elementos 3D isométricos. Estilo corporate Memphis modernizado com profundidade e sombras realistas)
(ex: Colagem digital misturando elementos fotográficos realistas com ilustrações vetoriais planas. Contraste entre realismo e abstração)

PROPORÇÃO E PARÂMETROS: --ar 9:16 --v 6.0 --style raw --q 2

══════════════════════════════════════════════════════════════
NOTAS DE EXECUÇÃO PARA O DIRETOR DE ARTE:
- Texturas devem ser visíveis mas não dominantes (máximo 15% da atenção visual)
- Hierarquia tipográfica: palavra mais importante = 3x tamanho da menor
- Espaço negativo: manter 20-30% da área limpa para respiração visual
- Contraste mínimo entre texto e fundo: ratio 4.5:1 (WCAG AA)
- Elemento focal deve ocupar 35-45% da área central da composição
- Todas as bordas e sombras devem seguir consistência de iluminação (especificar direção da luz se relevante)
══════════════════════════════════════════════════════════════`;


// ============================================================================
// TIPO DE CAPA: EDUCATIVO/ESTRATÉGICO (Como fazer, Guias, Estratégias)
// ============================================================================

export const templateCapaEducativo = `AJA COMO UM DIRETOR DE ARTE E DESIGNER GRÁFICO SÊNIOR. Gere uma capa de carrossel Instagram vertical de AUTORIDADE EDUCACIONAL para conteúdo estratégico. A composição deve ser limpa, moderna e altamente legível, seguindo rigorosamente a seguinte hierarquia visual:

1. FUNDO E AMBIENTE:
Fundo {{COR_FUNDO_PRIMARIA}} (ex: gradiente suave de azul escuro #1E3A8A para azul médio #3B82F6 / fundo sólido creme #FEF3C7 / geometric pattern com formas triangulares em tom sobre tom). Textura de fundo: {{TEXTURA_FUNDO}} (ex: sutil granulada tipo papel craft / linhas de grid invisíveis (5% opacidade) / ondas concêntricas suaves partindo do centro). No canto {{POSICAO_MARCA_AGUA}}, marca d'água '{{TEXTO_MARCA_AGUA}}' em {{COR_MARCA_AGUA}} com opacidade 5-8%, fonte {{FONTE_MARCA_AGUA}} (ex: extra bold, 200% do tamanho do título principal).

2. CABEÇALHO (SELLO DE AUTORIDADE):
{{DESCRICAO_CABECALHO}}
(ex: No topo centralizado, um badge circular com borda dupla em {{COR_BORDA}}. Diâmetro: 12% da largura total. Dentro do badge: ícone {{NOME_ICONE}} (ex: lâmpada, alvo, escudo, gráfico ascendente) em {{COR_ICONE}} estilizado com efeito {{ESTILO_ICONE}} (ex: gradient dourado / flat monocromático / 3D com sombra). Abaixo do badge, texto '{{TEXTO_CABECALHO}}' em fonte {{FONTE_CABECALHO}}, tamanho {{TAMANHO_CABECALHO}}, cor {{COR_TEXTO_CABECALHO}})

3. TÍTULO PRINCIPAL (GANCHO VISUAL):
{{NUMERO_LINHAS_TITULO}} linhas de título centralizado na área {{POSICAO_TITULO}} (ex: superior-central, ocupando 40-50% da largura):
{{LINHAS_TITULO}}
(Especificar para cada linha: fonte, peso, cor, tamanho relativo, se tem efeito como sombra/outline/gradiente)

4. SUBTÍTULO CONTEXTUAL:
Abaixo do título, {{NUMERO_LINHAS_SUBTITULO}} linha(s) de subtítulo:
{{TEXTO_SUBTITULO}}
Fonte: {{FONTE_SUBTITULO}} (ex: 'Inter' Regular / 'Open Sans' Light), tamanho {{TAMANHO_SUBTITULO}} (ex: 40% do tamanho do título), cor {{COR_SUBTITULO}} (ex: cinza escuro #6B7280 / branco com opacidade 85%), espaçamento entre linhas {{ESPACAMENTO_SUBTITULO}} (ex: 1.5x / generoso / compacto).

5. ILUSTRAÇÃO/ÍCONES DE SUPORTE:
{{DESCRICAO_ILUSTRACAO_SUPORTE}}
(ex: Na área inferior-direita, composição de {{QUANTIDADE}} ícones vetoriais relacionados ao tema. Cada ícone com tamanho {{TAMANHO_ICONES}}, cor {{COR_ICONES}}, estilo {{ESTILO_ICONES}} (ex: line art com stroke 2px / filled flat design / isométrico 3D). Disposição: {{PADRAO_DISPOSICAO}} (ex: em arco / grid 2x2 / cascata diagonal / aleatório organizado). Espaço entre ícones: {{ESPACAMENTO_ICONES}})

6. INDICADOR DE CONTEÚDO (SLIDE COUNTER):
{{DESCRICAO_INDICADOR}}
(ex: No canto inferior-esquerdo, pílula horizontal {{COR_PILULA}} com texto '{{TEXTO_INDICADOR}}' (ex: "Arraste para o lado →" / "5 slides →" / "Guia completo ≫"). Fonte: {{FONTE_INDICADOR}}, cor {{COR_TEXTO_INDICADOR}}, ícone de seta {{ESTILO_SETA}} (ex: animada sutilmente / bold / gradiente))

7. RODAPÉ (ASSINATURA DA MARCA):
{{DESCRICAO_RODAPE}}
(ex: Faixa horizontal na base com {{ALTURA_FAIXA}} de altura, cor {{COR_FAIXA_RODAPE}}. Logo da marca centralizado ou alinhado à {{ALINHAMENTO_LOGO}}, tamanho {{TAMANHO_LOGO}}. Ao lado ou abaixo do logo, texto '{{TEXTO_RODAPE}}' em {{FONTE_RODAPE}}, {{COR_TEXTO_RODAPE}})

ESTILO: {{ESTILO_GERAL}}
(ex: Modern Corporate Memphis com elementos 3D sutis. Profundidade através de drop shadows suaves (blur 20px, opacidade 10%). Paleta limitada a 4 cores principais + neutros. Tipografia bold e legível. Estilo compatível com LinkedIn e Instagram profissional)
(ex: Minimalista editorial inspirado em revistas como Exame e Forbes. Uso generoso de espaço em branco. Tipografia serif para títulos combinada com sans-serif para corpo. Fotografia realista como elemento principal. Sofisticado e premium)
(ex: Tech startup vibe. Gradientes vibrantes, glassmorphism, elementos flutuantes com profundidade. Ícones 3D renderizados. Tipografia geométrica bold. Estilo Dribbble/Behance trending. Jovem mas profissional)

PROPORÇÃO E PARÂMETROS: --ar 9:16 --v 6.0 --style raw --q 2

══════════════════════════════════════════════════════════════
NOTAS DE EXECUÇÃO PARA O DIRETOR DE ARTE:
- Legibilidade é prioridade #1: testar mentalmente se título é legível em thumbnail
- Hierarquia de tamanho: Título (100%) > Subtítulo (40-50%) > Rodapé (20-25%)
- Máximo 3 famílias tipográficas diferentes (ideal: 2 famílias)
- Elementos decorativos não devem competir com texto (regra 80/20: 80% texto, 20% decoração)
- Usar regra dos terços para posicionamento de elementos principais
- Garantir que capa funcione em 3 escalas: full screen, grid do feed, thumbnail pequena
- Cores devem ter contraste mínimo de 30% em luminosidade entre texto e fundo
══════════════════════════════════════════════════════════════`;


// ============================================================================
// TIPO DE CAPA: COMUNICADO INSTITUCIONAL (Novidades, Atualizações, Leis)
// ============================================================================

export const templateCapaComunicado = `AJA COMO UM DIRETOR DE ARTE E DESIGNER GRÁFICO SÊNIOR. Gere uma capa de carrossel Instagram vertical de COMUNICAÇÃO INSTITUCIONAL elegante e authoritative. A composição deve ser sóbria, profissional e transmitir credibilidade, seguindo rigorosamente a seguinte hierarquia visual:

1. FUNDO E BASE:
Fundo {{COR_FUNDO_PRIMARIA}} (ex: branco puro #FFFFFF / off-white #FAFAF9 / azul acinzentado muito claro #F1F5F9). Sobre o fundo, {{ELEMENTOS_FUNDO}} (ex: linhas horizontais muito sutis (2% opacidade) simulando linhas de documento oficial / marcas d'água de brasão ou selo institucional / grid de pontos espaçados (dot grid) em cinza claro). No {{POSICAO_MARCA_AGUA}}, texto '{{TEXTO_MARCA_AGUA}}' em {{COR_MARCA_AGUA}}, opacidade 6-10%, fonte {{FONTE_MARCA_AGUA}} (ex: serif clássica como 'Times New Roman' ou 'Playfair Display' em tamanho monumental).

2. CABEÇALHO INSTITUCIONAL:
{{DESCRICAO_CABECALHO}}
(ex: Faixa horizontal no topo com {{ALTURA_FAIXA}} de altura, cor {{COR_FAIXA_CABECALHO}} (ex: azul marinho #1E3A8A / verde institucional #065F46). Dentro da faixa, centralizado: texto '{{TEXTO_FAIXA_CABECALHO}}' em {{COR_TEXTO_FAIXA}} (ex: branco #FFFFFF), fonte {{FONTE_FAIXA}} (ex: Sans-serif semi-bold, letter-spacing 0.1em / uppercase). Abaixo da faixa ou integrado a ela, {{ELEMENTO_ADICIONAL_CABECALHO}} (ex: brasão estilizado / ano de referência "2026" / ícone de documento oficial))

3. SELLO/ÍCONE DE DESTAQUE:
{{DESCRICAO_SELLO}}
(ex: Centralizado abaixo do cabeçalho, um {{FORMATO_SELLO}} (ex: círculo / escudo / losango / estrela) com {{DESCRIÇÃO_VISUAL_SELLO}} (ex: borda tripla em dourado #D97706, fundo interno branco, ícone central de {{NOME_ICONE}} em {{COR_ICONE}}). Tamanho: {{TAMANHO_SELLO}} (ex: 15% da largura total). Efeito: {{EFEITO_SELLO}} (ex: drop shadow sutil / relevo 3D / flat com gradiente / selo de lacre texturizado))

4. TÍTULO DO COMUNICADO:
{{NUMERO_LINHAS_TITULO}} linha(s) de título, {{ALINHAMENTO_TITULO}} (ex: centralizado / alinhado à esquerda com margem generosa):
{{LINHAS_TITULO}}
(Especificar para cada linha: fonte (ex: 'Merriweather' Bold / 'Georgia' / 'Inter' ExtraBold), cor (ex: cinza carvão #1F2937 / azul institucional #1E40AF), tamanho relativo, peso, e se há palavras com destaque extra (cor diferente / tamanho 150% / negrito extra))

5. SUBTÍTULO OU EMENTA:
{{DESCRICAO_SUBTITULO}}
(ex: 1-2 linhas abaixo do título, fonte {{FONTE_SUBTITULO}} (ex: 'Source Sans Pro' Regular / 'Lato' Light), tamanho {{TAMANHO_SUBTITULO}} (ex: 35% do título), cor {{COR_SUBTITULO}} (ex: cinza médio #6B7280), estilo {{ESTILO_SUBTITULO}} (ex: itálico / normal / com linha decorativa acima e abaixo / entre aspas tipográficas)). Texto: "{{TEXTO_SUBTITULO}}"

6. ELEMENTO VISUAL DE APOIO:
{{DESCRICAO_ELEMENTO_VISUAL}}
(ex: Na área inferior-{{POSICAO_ELEMENTO}}, {{TIPO_ELEMENTO}} (ex: ilustração vetorial isométrica / fotografia com tratamento duotone / infográfico minimalista / documento estilizado). Descrição detalhada: {{DETALHES_ELEMENTO}} (ex: pilha de documentos com carimbo "APROVADO" em vermelho / balança da justiça estilizada em line art / gráfico de barras ascendente com seta verde / mão segurando documento com selo de autenticidade). Tamanho relativo: {{TAMANHO_ELEMENTO}} (ex: 25% da altura total). Opacidade: {{OPACIDADE_ELEMENTO}} (ex: 100% sólido / 80% para integrar com fundo))

7. INDICADOR DE AÇÃO:
{{DESCRICAO_INDICADOR_ACAO}}
(ex: No canto inferior-{{POSICAO_INDICADOR}}, {{FORMATO_INDICADOR}} (ex: retângulo arredondado / pílula / badge circular) com cor {{COR_INDICADOR}}, contendo texto '{{TEXTO_INDICADOR}}' (ex: "Saiba mais →" / "Confira as mudanças ≫" / "O que muda para você?") em {{COR_TEXTO_INDICADOR}}, fonte {{FONTE_INDICADOR}}. Estilo: {{ESTILO_INDICADOR}} (ex: flat / com sombra / com gradiente / com ícone animado sutil))

8. RODAPÉ (ASSINATURA INSTITUCIONAL):
{{DESCRICAO_RODAPE}}
(ex: Linha horizontal fina em {{COR_LINHA_RODAPE}} separando o rodapé do conteúdo. Abaixo da linha: {{ELEMENTOS_RODAPE}} (ex: Logo da instituição à esquerda, tamanho {{TAMANHO_LOGO}} / Texto '{{NOME_INSTITUICAO}}' em fonte {{FONTE_NOME}} / Website '{{URL_WEBSITE}}' em tamanho menor / Ano "{{ANO_REFERÊNCIA}}" à direita). Cores: {{COR_TEXTO_RODAPE}} (ex: cinza escuro #374151 para texto principal, cinza médio #9CA3AF para texto secundário))

ESTILO: {{ESTILO_GERAL}}
(ex: Institucional brasileiro moderno. Inspirado em comunicação de órgãos oficiais como Receita Federal e Ministério da Economia. Sério mas acessível. Tipografia serif para autoridade combinada com sans-serif para modernidade. Cores institucionais (azul marinho, verde, dourado) com neutros sofisticados. Design que transmite confiança e oficialidade)
(ex: Editorial premium tipo revista Harvard Business Review Brasil. Layout assimétrico elegante. Fotografia em preto e branco com toque de cor. Tipografia editorial com serif de alto contraste. Uso dramático de espaço em branco. Sofisticado, exclusivo, para público de alto nível)
(ex: Clean corporate design. Flat design com toques sutis de profundidade. Grid modular organizado. Cores corporativas consistentes. Ícones lineares统一dos. Acessível e profissional. Funciona bem em contextos B2B e LinkedIn)

PROPORÇÃO E PARÂMETROS: --ar 9:16 --v 6.0 --style raw --q 2

══════════════════════════════════════════════════════════════
NOTAS DE EXECUÇÃO PARA O DIRETOR DE ARTE:
- Tom institucional exige sobriedade: evitar cores neon, fontes decorativas, elementos infantis
- Hierarquia de autoridade: Selo/Badge > Título > Subtítulo > Elemento visual > Indicador
- Tipografia serif transmite tradição e confiança; sans-serif transmite modernidade e acessibilidade
- Para público geral: preferir sans-serif; para público especializado: serif é aceitável
- Espaço em branco é sinal de sofisticação, não de vazio: usar generosamente
- Elementos oficiais (selos, brasões, carimbos) devem ser estilizados, não copiados de órgãos reais
- Testar design em escala de cinza para garantir contraste adequado
- Logo da marca nunca deve competir com título principal (máximo 30% do tamanho do título)
══════════════════════════════════════════════════════════════`;


// ============================================================================
// TIPO DE CAPA: LISTA/CHECKLIST (Top erros, Dicas, Passos)
// ============================================================================

export const templateCapaLista = `AJA COMO UM DIRETOR DE ARTE E DESIGNER GRÁFICO SÊNIOR. Gere uma capa de carrossel Instagram vertical de LISTA/CHECKLIST altamente escaneável e visual. A composição deve ser organizada, informativa e criar desejo de consumir o conteúdo completo, seguindo rigorosamente a seguinte hierarquia visual:

1. FUNDO E CANVAS:
Fundo {{COR_FUNDO_PRIMARIA}} (ex: branco gelo #FAFAFA / cinza muito claro #F3F4F6 / gradiente vertical sutil de {{COR_GRADIENTE_1}} para {{COR_GRADIENTE_2}}). Textura: {{TEXTURA_FUNDO}} (ex: nenhuma (limpo total) / padrão de checkboxes em 3% opacidade / linhas de caderno universitário em azul claro / grid de pontos espaçados). Marca d'água opcional: '{{TEXTO_MARCA_AGUA}}' em {{POSICAO_MARCA_AGUA}}, {{COR_MARCA_AGUA}}, 5% opacidade.

2. BADGE NUMÉRICO (QUANTIFICADOR):
{{DESCRICAO_BADGE_NUMERICO}}
(ex: No topo-{{POSICAO_BADGE}}, um {{FORMATO_BADGE}} (ex: círculo / hexágono / quadrado com cantos arredondados / estrela) com as seguintes especificações:
- Cor de fundo: {{COR_FUNDO_BADGE}} (ex: vermelho vivo #EF4444 / verde #10B981 / amarelo #F59E0B / azul #3B82F6)
- Texto principal: '{{NUMERO_DESTAQUE}}' (ex: "7", "10", "5") em fonte {{FONTE_NUMERO}} (ex: 'Inter' Black / 'Roboto' Black / 'Bebas Neue'), cor {{COR_NUMERO}} (ex: branco #FFFFFF), tamanho {{TAMANHO_NUMERO}} (ex: 60% do tamanho do badge)
- Texto secundário: '{{TEXTO_SECUNDARIO_BADGE}}' (ex: "ERROS", "DICAS", "PASSOS") em fonte {{FONTE_TEXTO_BADGE}}, tamanho {{TAMANHO_TEXTO_BADGE}}, cor {{COR_TEXTO_BADGE}}
- Efeito: {{EFEITO_BADGE}} (ex: drop shadow forte / flat / com gradiente / com borda dupla / com ícone decorativo no topo))

3. TÍTULO DA LISTA:
{{NUMERO_LINHAS_TITULO}} linha(s) de título, {{ALINHAMENTO_TITULO}} (ex: centralizado abaixo do badge / alinhado à esquerda com margem de 10%):
{{LINHAS_TITULO}}
(Especificar: fonte (ex: 'Montserrat' ExtraBold / 'Poppins' Bold), cor (ex: cinza escuro #111827), tamanho relativo, e palavras com ênfase visual através de {{TIPO_ENFASE}} (ex: cor diferente / sublinhado / highlight com marca-texto / tamanho 140%)

4. PREVIEW DOS ITENS (ANTENA DE CONTEÚDO):
{{DESCRICAO_PREVIEW_ITENS}}
(ex: Abaixo do título, preview dos {{NUMERO_ITENS_PREVIEW}} primeiro(s) item(ns) da lista para criar curiosidade:
Cada item com:
- Número ou bullet: {{ESTILO_BULLET}} (ex: checkbox vazio ☐ / número em círculo / ícone temático / ponto bold)
- Texto do item: fonte {{FONTE_ITEM}}, tamanho {{TAMANHO_ITEM}} (ex: 60% do título), cor {{COR_ITEM}}
- Espaçamento entre itens: {{ESPACAMENTO_ITENS}} (ex: 12px / generoso / compacto)
- Efeito nos itens não revelados: {{EFEITO_MISTERIO}} (ex: "..." / blur progressivo / "e mais X itens" / linha pontilhada descendente)
Exemplo visual:
☐ Erro #1: {{TEXTO_ITEM_1}}
☐ Erro #2: {{TEXTO_ITEM_2}}
☐ ... e mais {{NUMERO_RESTANTE}} erros

OU (alternativo)
(ex: Mini-cards empilhados com efeito 3D perspectivo, mostrando parcialmente os cards de trás. Cada card com número do item e título. Card da frente 100% visível, cards de trás 70%, 50%, 30% visíveis respectivamente))

5. ÍCONES TEMÁTICOS (CONTEXTO VISUAL):
{{DESCRICAO_ICONES_TEMATICOS}}
(ex: Na área {{POSICAO_ICONES}}, {{QUANTIDADE_ICONES}} ícone(s) relacionado(s) ao tema da lista:
- Ícone 1: {{NOME_ICONE_1}} (ex: sinal de proibido 🚫 / lâmpada 💡 / alvo 🎯) em {{TAMANHO_ICONE_1}}, cor {{COR_ICONE_1}}, estilo {{ESTILO_ICONE_1}}
- Ícone 2: {{NOME_ICONE_2}} em {{TAMANHO_ICONE_2}}, cor {{COR_ICONE_2}}
- Disposição: {{PADRAO_ICONES}} (ex: em linha horizontal / diagonal ascendente / agrupados / espalhados nos cantos)
- Opacidade: {{OPACIDADE_ICONES}} (ex: 100% / 70% para não competir / 40% como textura))

6. CTA/INDICADOR DE SCROLL:
{{DESCRICAO_CTA_SCROLL}}
(ex: Na base da imagem, {{FORMATO_CTA}} (ex: texto simples / pílula / seta animada) com:
- Texto: '{{TEXTO_CTA}}' (ex: "Arraste para ver todos →" / "Confira a lista completa ≫" / "Qual desses você já cometeu?")
- Fonte: {{FONTE_CTA}}, cor {{COR_CTA}}, tamanho {{TAMANHO_CTA}}
- Elemento visual: {{ELEMENTO_VISUAL_CTA}} (ex: seta para direita com animação implícita / mão apontando / ícone de swipe / três pontos indicando continuidade)
- Posição: {{POSICAO_CTA}} (ex: centralizado / canto inferior direito))

7. RODAPÉ (BRANDING):
{{DESCRICAO_RODAPE}}
(ex: {{FORMATO_RODAPE}} (ex: Linha fina horizontal / faixa de 5% da altura / sem rodapé definido, apenas logo flutuante)
- Logo: {{POSIÇÃO_LOGO}} (ex: canto inferior esquerdo / centralizado), tamanho {{TAMANHO_LOGO}}, opacidade {{OPACIDADE_LOGO}}
- Texto: '{{TEXTO_RODAPE}}' em {{FONTE_RODAPE}}, {{COR_RODAPE}}, {{TAMANHO_RODAPE}})

ESTILO: {{ESTILO_GERAL}}
(ex: Lista visual tipo "infográfico Instagram". Clean e escaneável. Uso inteligente de ícones e números para criar hierarquia visual. Cores vibrantes mas profissionais. Tipografia bold e legível em qualquer tamanho. Estilo Buzzfeed/Visme para conteúdo educativo)
(ex: Checklist corporativo premium. Inspirado em templates Notion e materiais B2B de empresas como McKinsey e Deloitte. Minimalista, organizado, com uso inteligente de whitespace. Cores corporativas sóbrias com 1 cor de destaque. Tipografia Inter/Roboto. Profissional e confiável)
(ex: Lista estilo "thread viral do Twitter/X". Texto-forward com elementos visuais mínimos. Fundo limpo, tipografia impactante, badge numérico chamativo. Foco total no conteúdo. Estilo que funciona como hook forte. Minimalista mas eficaz)

PROPORÇÃO E PARÂMETROS: --ar 9:16 --v 6.0 --style raw --q 2

══════════════════════════════════════════════════════════════
NOTAS DE EXECUÇÃO PARA O DIRETOR DE ARTE:
- Listas devem ser ESCANEÁVEIS em 2 segundos: número grande + título claro + preview
- Badge numérico é o elemento de maior impacto visual após o título
- Preview de itens cria "information gap" e curiosity gap (essencial para engagement)
- Máximo revelar 2-3 itens no preview; o resto deve sugerir continuidade
- Ícones devem complementar texto, não substituí-lo (acessibilidade)
- Cada item da lista deve ter respiro visual (espaçamento generoso)
- Numerar itens cria mais impacto que bullets (números = conteúdo concreto)
- Cor do badge numérico deve contrastar fortemente com fundo (ratio 5:1+)
- Testar se lista é legível sem zoom em tela de celular (tamanho mínimo 16pt equivalente)
══════════════════════════════════════════════════════════════`;


// ============================================================================
// TIPO DE CAPA: COMPARAÇÃO (Antes vs Depois, Errado vs Certo, A vs B)
// ============================================================================

export const templateCapaComparacao = `AJA COMO UM DIRETOR DE ARTE E DESIGNER GRÁFIco SÊNIOR. Gere uma capa de carrossel Instagram vertical de COMPARAÇÃO VISUAL impactante e dicotômica. A composição deve apresentar claramente dois lados contrastantes, criando tensão visual e curiosidade sobre qual é o "correto", seguindo rigorosamente a seguinte hierarquia visual:

1. FUNDO E DIVISÃO:
Fundo {{COR_FUNDO_PRIMARIA}} (ex: branco #FFFFFF / cinza claro #F5F5F5). Divisão visual entre os dois lados da comparação:
{{TIPO_DIVISAO}}
(ex: Linha vertical central em {{COR_LINHA_DIVISAO}} com {{ESPESSURA_LINHA}} de espessura, possivelmente com elemento central sobreposto)
(ex: Diagonal do canto superior-esquerdo ao inferior-direito, criando dois triângulos)
(ex: Linha ondulada/sinuousa no centro, criando separação orgânica)
(ex: Sem linha de divisão, mas com contrastes de cores nos lados: lado esquerdo {{COR_LADO_A}}, lado direito {{COR_LADO_B}})

Lado esquerdo ({{NOME_LADO_A}} - ex: "ERRADO", "ANTES", "PROBLEMA"):
{{DESCRICAO_VISUAL_LADO_A}}
(ex: Fundo {{COR_FUNDO_LADO_A}} (ex: vermelho claro #FEE2E2 / cinza / tom "negativo"). Elementos visuais representando o lado negativo: {{ELEMENTOS_LADO_A}})

Lado direito ({{NOME_LADO_B}} - ex: "CERTO", "DEPOIS", "SOLUÇÃO"):
{{DESCRICAO_VISUAL_LADO_B}}
(ex: Fundo {{COR_FUNDO_LADO_B}} (ex: verde claro #D1FAE5 / branco / tom "positivo"). Elementos visuais representando o lado positivo: {{ELEMENTOS_LADO_B}})

2. TÍTULO DA COMPARAÇÃO:
{{NUMERO_LINHAS_TITULO}} linha(s) de título no TOPO, centralizado, spanning ambos os lados:
{{LINHAS_TITULO}}
(Especificação: fonte {{FONTE_TITULO}} (ex: 'Inter' ExtraBold / 'Roboto' Black), cor {{COR_TITULO}} (ex: cinza escuro #1F2937), tamanho {{TAMANHO_TITULO}}, com palavras de contraste destacadas em {{TIPO_DESTAQUE}} (ex: "ERRADO" em vermelho / "CERTO" em verde / "VS" em amarelo))

3. RÓTULOS DOS LADOS:
{{DESCRICAO_ROTULOS}}
(ex: Em cada lado, no topo da respectiva área:
Lado A: Texto '{{TEXTO_ROTULO_A}}' em {{FONTE_ROTULO_A}}, cor {{COR_ROTULO_A}} (ex: vermelho #DC2626), sobre {{FUNDO_ROTULO_A}} (ex: retângulo arredondado vermelho claro / badge circular / sem fundo, texto direto)
Lado B: Texto '{{TEXTO_ROTULO_B}}' em {{FONTE_ROTULO_B}}, cor {{COR_ROTULO_B}} (ex: verde #059669), sobre {{FUNDO_ROTULO_B}})

4. ELEMENTO VISUAL LADO A (NEGATIVO):
{{DESCRICAO_ELEMENTO_LADO_A}}
(ex: Na área central do lado esquerdo:
- Objeto/Ilustração: {{DESCRIÇÃO_OBJETO_A}} (ex: gráfico de barras em queda / pessoa com expressão confusa / documento com carimbo "REPROVADO" / relógio com símbolo de atraso)
- Estilo: {{ESTILO_VISUAL_A}} (ex: flat design / fotografia P&B / ícone line art / ilustração 3D)
- Cor predominante: {{COR_PREDOMINANTE_A}} (ex: vermelho / cinza / laranja)
- Tamanho: {{TAMANHO_ELEMENTO_A}} (ex: 30% da largura do lado)
- Elementos adicionais: {{ADICIONAIS_A}} (ex: X vermelho sobreposto / símbolo de proibido / seta para baixo))

5. ELEMENTO VISUAL LADO B (POSITIVO):
{{DESCRICAO_ELEMENTO_LADO_B}}
(ex: Na área central do lado direito:
- Objeto/Ilustração: {{DESCRIÇÃO_OBJETO_B}} (ex: gráfico de barras ascendente / pessoa confiante / documento com selo "APROVADO" / relógio com check de pontualidade)
- Estilo: {{ESTILO_VISUAL_B}} (ex: flat design / fotografia colorida / ícone line art / ilustração 3D)
- Cor predominante: {{COR_PREDOMINANTE_B}} (ex: verde / azul / dourado)
- Tamanho: {{TAMANHO_ELEMENTO_B}} (ex: 30% da largura do lado)
- Elementos adicionais: {{ADICIONAIS_B}} (ex: check verde / estrela dourada / seta para cima))

6. VERSUS/CONECTOR CENTRAL:
{{DESCRICAO_VERSUS}}
(ex: Na linha de divisão central, elemento destacando o contraste:
- Formato: {{FORMATO_VERSUS}} (ex: círculo / losango / escudo / badge hexagonal)
- Cor: {{COR_VERSUS}} (ex: amarelo #F59E0B / laranja #EA580C / preto #000000)
- Texto: '{{TEXTO_VERSUS}}' (ex: "VS", "≠", "X", "OU?") em {{FONTE_VERSUS}}, {{COR_TEXTO_VERSUS}}, tamanho {{TAMANHO_VERSUS}}
- Efeito: {{EFEITO_VERSUS}} (ex: drop shadow / glow / centralizado na divisão / sobreposto à linha))

7. TEXTO DE APOIO (CONTEXTUALIZAÇÃO):
{{DESCRICAO_TEXTO_APOIO}}
(ex: Abaixo dos elementos visuais, 1-2 linhas de texto contextual:
- Lado A: "{{TEXTO_APOIO_A}}" em {{FONTE_APOIO_A}}, {{COR_APOIO_A}}, {{TAMANHO_APOIO_A}}
- Lado B: "{{TEXTO_APOIO_B}}" em {{FONTE_APOIO_B}}, {{COR_APOIO_B}}, {{TAMANHO_APOIO_B}})

8. CTA/INDICADOR DE CONTINUIDADE:
{{DESCRICAO_CTA_COMPARACAO}}
(ex: Na base da imagem, centralizado spanning ambos os lados ou focado em um lado:
- Texto: '{{TEXTO_CTA}}' (ex: "Qual você escolhe?" / "Entenda as diferenças →" / "Descubra qual é o certo ≫")
- Estilo: {{ESTILO_CTA}} (ex: pílula / texto simples com seta / badge)
- Cor: {{COR_CTA}}, fonte {{FONTE_CTA}})

9. RODAPÉ (BRANDING):
{{DESCRICAO_RODAPE}}
(ex: {{FORMATO_RODAPE}} na base com {{ELEMENTOS_RODAPE}} (ex: logo / nome da marca / website))

ESTILO: {{ESTILO_GERAL}}
(ex: Comparação visual tipo "infográfico educativo". Lado negativo em tons quentes (vermelho/laranja) transmitindo alerta. Lado positivo em tons frios (verde/azul) transmitindo solução. Flat design consistente em ambos os lados. Divisão clara e objetiva. Estilo Visme/Canva para conteúdo educacional)
(ex: Estilo "antes e depois" fotográfico realista. Mesmo cenário/objeto em dois estados diferentes. Tratamento de cor diferente: lado A dessaturado/negativo, lado B vibrante/positivo. Linha de divisão sutil. Profissional e impactante)
(ex: Minimalista tipográfico. Sem ilustrações, apenas texto grande e contrastante. Lado A em vermelho com X, Lado B em verde com check. Fundo neutro. Direto ao ponto. Funciona bem para conteúdo rápido de Instagram)

PROPORÇÃO E PARÂMETROS: --ar 9:16 --v 6.0 --style raw --q 2

══════════════════════════════════════════════════════════════
NOTAS DE EXECUÇÃO PARA O DIRETOR DE ARTE:
- Comparação deve ser INSTANTANEAMENTE compreensível (< 2 segundos)
- Contraste de cores entre lados é essencial (ex: vermelho vs verde, cinza vs colorido)
- Elementos visuais dos lados devem ser SIMÉTRICOS em tamanho e posição
- Lado "negativo" não deve ser repulsivo; lado "positivo" não deve ser exagerado
- Elemento "VS" central é o âncora visual da composição
- Ambos os lados devem ter mesma quantidade de informação (balanceamento)
- Evitar viés óbvio demais: criar curiosidade genuína sobre o "certo"
- Testar design em escala de cinza para garantir que contraste funciona sem cor
- Rótulos dos lados devem ser curtos e impactantes (máx 2 palavras cada)
══════════════════════════════════════════════════════════════`;


// ============================================================================
// TIPO DE CAPA: BASTIDORES/HUMANO (Equipe, Processo, Storytelling)
// ============================================================================

export const templateCapaHumano = `AJA COMO UM DIRETOR DE ARTE E DESIGNER GRÁFICO SÊNIOR. Gere uma capa de carrossel Instagram vertical de BASTIDORES/STORYTELLING com forte apelo humano e emocional. A composição deve transmitir autenticidade, conexão humana e transparência, seguindo rigorosamente a seguinte hierarquia visual:

1. FUNDO E ATMOSFERA:
{{TIPO_FUNDO_HUMANO}}
(ex: Fotografia real de {{CENARIO_FOTO}} (ex: escritório / equipe trabalhando / reunião com cliente / ambiente de produção) com tratamento {{TRATAMENTO_FOTO}} (ex: cores quentes e acolhedoras / filtro vintage leve / alto contraste dramático / natural sem filtro pesado). A fotografia ocupa {{PORCENTAGEM_FUNDO}}% do canvas.)
(ex: Ilustração de {{CENARIO_ILUSTRACAO}} (ex: pessoas colaborando em mesa / aperto de mãos / processo de trabalho em etapas) em estilo {{ESTILO_ILUSTRACAO}} (ex: corporate Memphis / line art colorido / 3D amigável / aquarela digital). A ilustração ocupa {{PORCENTAGEM_ILUSTRACAO}}% do canvas.)

Sobre a imagem/ilustração: {{ELEMENTOS_SOBRE_FUNDO}}
(ex: overlay de gradiente escuro na parte inferior (30% de opacidade) para legibilidade do texto)
(ex: marca d'água '{{TEXTO_MARCA_AGUA}}' em {{COR_MARCA_AGUA}}, 8% opacidade)
(ex: padrão de textura sutil de {{TIPO_TEXTURA}} (ex: papel / grão de filme / ruído orgânico) em 5% opacidade)

2. TÍTULO EMOCIONAL (HOOK HUMANO):
{{NUMERO_LINHAS_TITULO}} linha(s) de título, {{ALINHAMENTO_TITULO}} (ex: sobreposto à fotografia na área inferior / centralizado em área de respiro da imagem):
{{LINHAS_TITULO}}
(Especificação: fonte {{FONTE_TITULO}} (ex: 'Playfair Display' Bold para tom editorial / 'Inter' ExtraBold para moderno / 'Caveat' para手写 humanizado), cor {{COR_TITULO}} (ex: branco #FFFFFF sobre foto escura / cinza escuro sobre fundo claro), tamanho {{TAMANHO_TITULO}}, com efeito {{EFEITO_TITULO}} (ex: drop shadow para legibilidade sobre foto / sem efeito sobre fundo limpo / outline para destaque))

3. SUBTÍTULO CONTEXTUAL:
{{DESCRICAO_SUBTITULO}}
(ex: {{NUMERO_LINHAS_SUB}} linha(s) abaixo do título:
- Texto: "{{TEXTO_SUBTITULO}}"
- Fonte: {{FONTE_SUB}}, cor {{COR_SUB}}, tamanho {{TAMANHO_SUB}} (ex: 45% do título)
- Estilo: {{ESTILO_SUB}} (ex: regular / itálico para tom narrativo / com linha decorativa acima))

4. ELEMENTO HUMANO FOCAL:
{{DESCRICAO_ELEMENTO_HUMANO}}
(ex: Na área {{POSICAO_ELEMENTO_HUMANO}} da composição:
- Pessoa/Pessoas: {{DESCRIÇÃO_PESSOAS}} (ex: profissional sorrindo olhando para câmera / equipe em reunião colaborativa / mãos trabalhando em documento / pessoa apontando para tela)
- Expressão/Emoção: {{EMOCAO}} (ex: confiança e sorriso / concentração e foco / comemoração e alegria / empatia e escuta)
- Enquadramento: {{ENQUADRAMENTO}} (ex: meio corpo / close no rosto / corpo inteiro em contexto / mãos e objetos de trabalho)
- Tratamento: {{TRATAMENTO_PESSOA}} (ex: fotografia natural / ilustração estilizada / silhueta com cor de marca / pop art com cores vibrantes))

5. ELEMENTO DE CONTEXTO (CENÁRIO/OBJETOS):
{{DESCRICAO_CENARIO}}
(ex: Ao redor ou atrás da pessoa/pessoas:
- Cenário: {{DESCRIÇÃO_CENARIO}} (ex: escritório moderno com plantas / mesa com documentos e laptop / quadro branco com anotações / ambiente industrial criativo)
- Objetos de trabalho: {{OBJETOS}} (ex: laptop aberto / calculadora e documentos / xícaras de café / gráficos e relatórios)
- Profundidade: {{PROFUNDIDADE}} (ex: fundo desfocado (bokeh) / tudo em foco / perspectiva com profundidade de campo))

6. SELLO/ELEMENTO DE CREDIBILIDADE:
{{DESCRICAO_SELLO_CREDIBILIDADE}}
(ex: No canto {{POSICAO_SELLO}}:
- Formato: {{FORMATO_SELLO}} (ex: badge circular / retângulo arredondado / faixa diagonal)
- Texto: '{{TEXTO_SELLO}}' (ex: "+1000 clientes satisfeitos" / "5 anos de experiência" / "Equipe certificada")
- Cor: {{COR_SELLO}}, fonte {{FONTE_SELLO}}
- Ícone: {{ICONE_SELLO}} (ex: estrela / troféu / handshake / check))

7. INDICADOR DE CONTEÚDO (ARRASTE):
{{DESCRICAO_INDICADOR_SCROLL}}
(ex: Na base, {{FORMATO_INDICADOR}} (ex: texto + seta / ícone de swipe / pílula):
- Texto: '{{TEXTO_INDICADOR}}' (ex: "Conheça nossa história →" / "Veja os bastidores ≫" / "Deslize para conhecer a equipe")
- Estilo: {{ESTILO_INDICADOR}} (ex: discreto / chamativo / animado implicitamente))

8. RODAPÉ (BRANDING HUMANO):
{{DESCRICAO_RODAPE}}
(ex: {{FORMATO_RODAPE}} na base:
- Logo: {{POSIÇÃO_LOGO}}, tamanho {{TAMANHO_LOGO}}
- Texto: '{{TEXTO_RODAPE}}' (ex: "Alfa Contabilidade - Pessoas reais, resultados reais")
- Elemento humano extra: {{ELEMENTO_EXTRA_RODAPE}} (ex: foto mini da equipe em círculo / ícone de coração / assinatura manuscrita))

ESTILO: {{ESTILO_GERAL}}
(ex: Fotografia humanizada estilo "About Us" de startup moderna. Cores quentes e acolhedoras. Iluminação natural. Pessoas reais (não stock photos genéricas). Tom amigável mas profissional. Estilo que transmite "somos pessoas como você". Instagram e LinkedIn friendly)
(ex: Storytelling visual tipo documentário corporativo. Fotografia com profundidade e contexto. Pessoas em ação, não posadas. Estilo National Geographic meets corporate. Autêntico, cru mas profissional. Transmite transparência e confiança)
(ex: Ilustração amigável corporate Memphis. Pessoas estilizadas em cenários de trabalho. Cores da marca aplicadas. Acessível e inclusivo. Bom para marcas que querem humanizar sem expor pessoas reais. Moderno e escalável)

PROPORÇÃO E PARÂMETROS: --ar 9:16 --v 6.0 --style raw --q 2

══════════════════════════════════════════════════════════════
NOTAS DE EXECUÇÃO PARA O DIRETOR DE ARTE:
- Pessoas são o elemento MAIS importante: devem parecer reais e autênticas
- Evitar stock photos genéricas: preferir fotos que pareçam específicas da marca
- Emoção facial é comunicada mesmo em ilustrações: garantir expressão adequada
- Olhar para câmera cria conexão; olhar para objeto cria contexto
- Texto sobre fotografia exige overlay escuro ou área de respiro para legibilidade
- Diversidade e inclusão são essenciais: representar variedade de pessoas
- Cenário de trabalho deve ser reconhecível e aspiracional pelo público-alvo
- Selos de credibilidade sociais (clientes, tempo, avaliações) aumentam confiança
- Título emocional > título informativo neste tipo de capa
- Testar se rosto(s) são reconhecíveis em thumbnail pequena (mínimo 15% do canvas)
══════════════════════════════════════════════════════════════`;


// ============================================================================
// EXPORT DE TODOS OS TEMPLATES
// ============================================================================

export const promptTemplatesCapas = {
  alertaUrgente: templateCapaAlertaUrgente,
  educativo: templateCapaEducativo,
  comunicado: templateCapaComunicado,
  lista: templateCapaLista,
  comparacao: templateCapaComparacao,
  humano: templateCapaHumano,
} as const;

export type TemplateCapaKey = keyof typeof promptTemplatesCapas;

/**
 * Preenche um template de capa com valores específicos
 */
export function preencherTemplateCapa(
  templateKey: TemplateCapaKey,
  variaveis: Record<string, string>
): string {
  let template = promptTemplatesCapas[templateKey];
  
  // Substituir todas as variáveis no formato {{CHAVE}}
  for (const [chave, valor] of Object.entries(variaveis)) {
    const regex = new RegExp(`\\{\\{${chave}\\}\\}`, 'g');
    template = template.replace(regex, valor);
  }
  
  // Remover indicações de variáveis não preenchidas (manter como placeholder visual)
  template = template.replace(/\{\{(\w+)\}\}/g, '[$1 - NÃO INFORMADO]');
  
  return template;
}

/**
 * Retorna lista de todas as variáveis necessárias para um template
 */
export function getVariaveisNecessarias(templateKey: TemplateCapaKey): string[] {
  const template = promptTemplatesCapas[templateKey];
  const matches = template.match(/\{\{(\w+)\}\}/g) || [];
  return [...new Set(matches.map(m => m.replace(/\{\{|\}\}/g, '')))];
}

export default promptTemplatesCapas;
