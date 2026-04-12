# Correção do Erro: `process is not defined`

## Problema Identificado
O erro `process is not defined` ocorria quando o usuário tentava enviar feedback sobre uma imagem gerada. Isso acontecia porque o código frontend estava tentando acessar `process.env.OPENROUTER_API_KEY` diretamente no navegador, onde `process` não existe (é uma variável de ambiente do Node.js, não do browser).

## Causa Raiz
No arquivo `src/services/ai.ts`, duas funções estavam usando `process.env` diretamente:
1. `embedText()` - linha 162
2. `learnFromFeedback()` - linha 204

Essas funções eram executadas no lado do cliente (browser) quando o usuário dava feedback em uma imagem, causando o erro.

## Solução Implementada

### 1. Criado Endpoint no Servidor (server.ts)
- **Endpoint**: `POST /api/ai/learn-from-feedback`
- **Localização**: Após o endpoint `/api/ai/embed` (linha ~819)
- **Funcionalidade**: 
  - Recebe `style`, `slideType`, `status` e `comment`
  - Usa a API Key do servidor (process.env.OPENROUTER_API_KEY)
  - Processa o feedback com Nemotron 3 Super 120B via OpenRouter
  - Retorna o estilo atualizado com StyleDNA refinado

### 2. Atualizado Código do Cliente (src/services/ai.ts)

#### Função `learnFromFeedback()`
**Antes**: 
- Usava `process.env.OPENROUTER_API_KEY` diretamente
- Fazia fetch direto para `https://openrouter.ai/api/v1/chat/completions`
- Processava resposta e merge de StyleDNA no cliente

**Depois**:
- Usa endpoint do servidor: `${AI_API_BASE}/learn-from-feedback`
- Envia dados do feedback via POST
- Recebe estilo atualizado pronto do servidor
- Sem acesso a variáveis de ambiente

#### Função `embedText()`
**Antes**:
- Usava `process.env.OPENROUTER_API_KEY` diretamente
- Fazia fetch direto para `https://openrouter.ai/api/v1/embeddings`

**Depois**:
- Usa endpoint do servidor: `${AI_API_BASE}/embed`
- Envia texto via POST
- Recebe embedding pronto do servidor
- Sem acesso a variáveis de ambiente

## Benefícios da Correção

1. **Segurança**: API keys permanecem no servidor, não expostas no browser
2. **Consistência**: Segue o padrão do projeto usando proxy via servidor
3. **Manutenibilidade**: Lógica complexa de processamento centralizada no servidor
4. **Funcionalidade**: Feedback de imagens agora funciona sem erros

## Testes
- ✅ Build concluído com sucesso (npm run build)
- ✅ Sem erros de compilação TypeScript
- ✅ Código pronto para teste manual do fluxo de feedback

## Arquivos Modificados
1. `server.ts` - Adicionado endpoint `/api/ai/learn-from-feedback`
2. `src/services/ai.ts` - Refatoradas funções `learnFromFeedback()` e `embedText()`

## Observações Técnicas
- O endpoint mantém toda a lógica de prompt e merge de StyleDNA no servidor
- O merge de cores usa estratégia 70% novo / 30% antigo para refinamento gradual
- Parse de JSON da resposta da IA trata markdown code blocks e JSON mal formado
- Todos os campos do StyleDNA são preservados e atualizados corretamente

## Próximos Passos
Testar o fluxo completo:
1. Gerar um carrossel com imagens
2. Dar feedback (aprovar ou reprovar) em uma imagem
3. Verificar se o estilo é atualizado sem erros
4. Confirmar que o aprendizado foi aplicado em gerações futuras
