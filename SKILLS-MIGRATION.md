# Migração de Agentes para Skills

## Visão Geral

Este documento descreve a migração do sistema de **Agentes** para o novo sistema de **Skills** no projeto Carrossel-IA.

## Por que migrar?

As **Skills** oferecem uma arquitetura mais:
- **Modular**: Cada skill é independente e testável isoladamente
- **Reutilizável**: Skills podem ser compostas em diferentes pipelines
- **Tipada**: Interfaces TypeScript bem definidas para inputs/outputs
- **Extensível**: Fácil adicionar novas skills sem modificar código existente
- **Manutenível**: Responsabilidades bem separadas

## Estrutura das Skills

```
src/skills/
├── types.ts           # Interfaces e tipos base
├── base.ts            # Classe abstrata BaseSkill
├── text-generation.ts # Utilitário de geração de texto
├── diagrammer.ts      # Skill Diagramador
├── reviewer.ts        # Skill Revisor
├── designer.ts        # Skill Designer
├── manager.ts         # Skill Gerente
├── refiner.ts         # Skill Refinador
├── orchestrator.ts    # Orquestrador do pipeline
└── index.ts           # Exportações
```

## Skills Disponíveis

### 1. DiagrammerSkill
- **Função**: Converte conteúdo bruto em estrutura de 4 slides
- **Input**: `{ content: string, styleContext: string }`
- **Output**: `{ slides: SlideContent[] }`
- **Modelo**: Qwen/Qwen2.5-Coder-7B-Instruct
- **Temperatura**: 0.7

### 2. ReviewerSkill
- **Função**: Corrige ortografia e gramática PT-BR em cada slide
- **Input**: `{ slide: SlideContent, slideNumber: number }`
- **Output**: `{ correctedSlide: SlideContent }`
- **Modelo**: Qwen/Qwen2.5-Coder-7B-Instruct
- **Temperatura**: 0.3
- **Nota**: Executada sequencialmente com delay de 10s entre slides

### 3. DesignerSkill
- **Função**: Cria prompts de imagem detalhados para cada slide
- **Input**: `{ slide: SlideContent, slideNumber: number, styleContext: string }`
- **Output**: `{ slide: SlideContent }` (com imagePrompt preenchido)
- **Modelo**: Qwen/Qwen2.5-Coder-7B-Instruct
- **Temperatura**: 0.7
- **Nota**: Executada sequencialmente com delay de 10s entre slides

### 4. ManagerSkill
- **Função**: Revisão final de qualidade e feedback ao usuário
- **Input**: `{ slides: SlideContent[], styleContext: string }`
- **Output**: `{ draftResponse: DraftResponse }`
- **Modelo**: Qwen/Qwen2.5-Coder-7B-Instruct
- **Temperatura**: 0.5

### 5. RefinerSkill
- **Função**: Refina o carrossel com base nas considerações do usuário
- **Input**: `{ slides: SlideContent[], managerFeedback: string, userConsiderations: string, style: StyleData }`
- **Output**: `{ draftResponse: DraftResponse }`
- **Modelo**: Qwen/Qwen2.5-Coder-7B-Instruct
- **Temperatura**: 0.5

## Orquestração

O `SkillOrchestrator` gerencia o pipeline completo:

```typescript
const orchestrator = new SkillOrchestrator();

// Geração de rascunho
const draft = await orchestrator.draftCarouselContent(content, style, onProgress);

// Refinamento
const refined = await orchestrator.refineCarouselContent(slides, feedback, considerations, style, onProgress);
```

## Fluxo do Pipeline

```
CONTEÚDO BRUTO + ESTILO
    ↓
[DiagrammerSkill] → Estrutura em 4 slides
    ↓
[ReviewerSkill] → Revisão ortográfica (slide por slide, sequencial)
    ↓
[DesignerSkill] → Cria prompts de imagem (slide por slide, sequencial)
    ↓
[ManagerSkill] → Revisão final + feedback
    ↓
RASCUNHO PRONTO
    ↓
[RefinerSkill] → (Opcional) Refina com feedback do usuário
    ↓
RASCUNHO REFINADO
```

## Mudanças nos Arquivos

### Arquivos Criados
- `src/skills/types.ts`
- `src/skills/base.ts`
- `src/skills/text-generation.ts`
- `src/skills/diagrammer.ts`
- `src/skills/reviewer.ts`
- `src/skills/designer.ts`
- `src/skills/manager.ts`
- `src/skills/refiner.ts`
- `src/skills/orchestrator.ts`
- `src/skills/index.ts`

### Arquivos Modificados
- `src/services/ai.ts` - Agora usa `SkillOrchestrator` ao invés de implementar pipeline diretamente
- `src/pages/CarouselCreation.tsx` - Atualizado "pipeline de agentes" → "pipeline de skills"
- `src/nemotron-rules.ts` - Comentários atualizados de "Agente" → "Skill"

## Interfaces Base

### SkillConfig
```typescript
interface SkillConfig {
  name: string;
  description: string;
  model: string;
  provider: string;
  temperature: number;
  maxTokens: number;
}
```

### SkillResult
```typescript
interface SkillResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  metadata?: {
    model?: string;
    provider?: string;
    tokensUsed?: number;
    latency?: number;
  };
}
```

### Skill (Interface)
```typescript
interface Skill<TInput = any, TOutput = any> {
  readonly name: string;
  readonly description: string;
  readonly config: SkillConfig;
  
  execute(input: TInput, context?: SkillContext): Promise<SkillResult<TOutput>>;
  validateInput(input: TInput): boolean;
  validateOutput(output: TOutput): boolean;
}
```

## Vantagens da Nova Arquitetura

1. **Testabilidade**: Cada skill pode ser testada unitariamente
2. **Composabilidade**: Skills podem ser reorganizadas em diferentes pipelines
3. **Observabilidade**: Metadata detalhada sobre execução (latência, modelo, etc.)
4. **Fallback Graceful**: Skills podem falhar gracefulmente com resultados de erro padronizados
5. **Validação**: Inputs e outputs são validados antes/depois da execução
6. **Extensibilidade**: Nova skill = nova classe implementando a interface `Skill`

## Compatibilidade

✅ **API Pública Mantida**: As funções `draftCarouselContent()` e `refineCarouselContent()` permanecem com a mesma assinatura
✅ **UI Inalterada**: Componentes React não precisaram de mudanças funcionais
✅ **Build Passando**: TypeScript compila sem erros nas Skills
✅ **Pipeline Funcional**: Mesmo fluxo de 4 skills sequenciais

## Próximos Passos (Opcionais)

1. Adicionar testes unitários para cada Skill
2. Implementar caching de resultados de Skills
3. Adicionar métricas de desempenho por Skill
4. Permitir configuração dinâmica de modelos por Skill
5. Criar CLI para testar Skills individualmente
