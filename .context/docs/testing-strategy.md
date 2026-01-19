# Estratégia de Testes

Este documento descreve a estratégia de testes para manter a qualidade em toda a base de código do Prime Cloud Pro.

## Estado Atual

> **Nota**: Nenhum framework de teste está configurado atualmente no projeto. Este documento descreve as estratégias de teste recomendadas para implementação futura.

## Configuração de Teste Recomendada

### Framework de Teste Unitário

- **Recomendado**: Vitest (integração nativa com Vite) por sua velocidade, simplicidade e excelente suporte a TypeScript.
- **Alternativa**: Jest com suporte a TypeScript.

### Configuração

Exemplo de configuração Vitest:

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom', // Necessário para testes baseados em navegador (ex: componentes React)
    include: ['**/*.test.{ts,tsx}'], // Arquivos que o Vitest deve considerar como testes
    reporters: 'verbose', // Saída clara dos resultados dos testes
    coverage: {
      reporter: ['text', 'json', 'html'], // Gerar relatórios de cobertura
    },
  },
});
```

## Tipos de Teste

### Testes Unitários

- **Alvo**: Funções individuais, classes e módulos isoladamente. Especificamente, funções utilitárias (como aquelas em `client/src/lib/utils.ts`), funções de validação de dados (como `isValidCPF` em `client/src/lib/document-validation.ts` e `server/lib/document-validation.ts`), e outras funções puras.
- **Localização**: Co-localizados com arquivos fonte, usando a extensão `.test.ts` ou `.test.tsx`.
- **Convenção de Nomenclatura**: `[nomedoarquivo].test.ts(x)`. Isso facilita localizar testes para um determinado arquivo.
- **Exemplos**:
  - `client/src/lib/document-validation.test.ts`
  - `server/lib/document-validation.test.ts`
  - `shared/routes.test.ts`
- **Prioridade**: Alta
- **Foco**: Garantir que cada função/módulo execute sua tarefa específica corretamente.

### Testes de Integração

- **Alvo**: Testar a interação entre diferentes partes do sistema. Especificamente, rotas da API envolvendo interações com banco de dados, lógica de negócios central abrangendo múltiplos serviços e integrações de API externa.
- **Configuração**: Requer um banco de dados de teste dedicado com migrações para garantir um ambiente de teste limpo e consistente. Considere usar Docker Compose para fácil configuração e desmontagem do banco de dados.
- **Exemplos**:
  - Testar criação de conta via API.
  - Testar criação e deleção de bucket entre múltiplos serviços.
  - Testar geração e revogação de chaves de acesso.
- **Prioridade**: Alta
- **Foco**: Garantir que diferentes componentes trabalhem juntos corretamente.

### Testes de Componente

- **Alvo**: Componentes React isoladamente ou com dependências mínimas mockadas. Isso inclui renderização de componentes de UI, teste de interação do usuário e gerenciamento de estado.
- **Ferramentas**: React Testing Library é altamente recomendada pelo seu foco em testar o comportamento visível ao usuário.
- **Exemplos**:
  - Testar envios de formulário em componentes React.
  - Testar renderização de estados de erro e carregamento.
  - Testar interações do usuário como cliques em botões e mudanças de input.
- **Prioridade**: Média
- **Foco**: Garantir que componentes renderizem corretamente e respondam às interações do usuário conforme esperado.

## Cenários de Teste Chave

### Validação de Documento

```typescript
import { isValidCPF } from '../src/lib/document-validation'; // Ajuste o caminho de importação

describe('Validação de CPF', () => {
  test('valida um CPF correto', () => {
    expect(isValidCPF('123.456.789-09')).toBe(true);
  });

  test('rejeita um CPF inválido', () => {
    expect(isValidCPF('111.111.111-11')).toBe(false);
  });

  test('rejeita CPF vazio', () => {
    expect(isValidCPF('')).toBe(false);
  });
});
```

### Endpoints de API

```typescript
import request from 'supertest'; // Use supertest para testes de API se usando Express
import app from '../src/index'; // Seu app express

describe('API de Conta', () => {
  const validAccountData = {
    name: 'Conta de Teste',
    cnpj: '12.345.678/0001-90',
  };

  test('cria uma conta com dados válidos', async () => {
    const response = await request(app)
      .post('/api/accounts')
      .send(validAccountData);

    expect(response.status).toBe(201);
    expect(response.body.name).toBe(validAccountData.name);
  });

  test('rejeita um CNPJ inválido', async () => {
    const response = await request(app)
      .post('/api/accounts')
      .send({ cnpj: 'invalido' });

    expect(response.status).toBe(400);
  });
});
```

### Hooks Customizados

```typescript
import { renderHook, waitFor } from '@testing-library/react';
import { useAccounts } from '../src/hooks/use-accounts'; // Ajuste o caminho de importação

describe('useAccounts', () => {
  test('busca contas na montagem', async () => {
    const { result } = renderHook(() => useAccounts());

    // Mockar a chamada de API dentro do hook
    // Por exemplo, se useAccounts usa internamente apiRequest:
    // jest.spyOn(api, 'apiRequest').mockResolvedValue([{ id: 1, name: 'Conta de Teste' }]);

    await waitFor(() => expect(result.current.data).toBeDefined());
  });
});
```

## Portões de Qualidade

### Type Safety

- Execute `npm run check` antes de commits para garantir a correção de tipos.
- Strict mode do TypeScript deve estar habilitado em `tsconfig.json`.
- Minimize o uso de tipos `any`. Se necessário, justifique seu uso com comentários inline.

### Revisão de Código

- Todos os pull requests (PRs) requerem revisão de pelo menos um outro desenvolvedor.
- Áreas de foco durante a revisão de código:
  - Correção de tipos
  - Validação de Schema: Garanta que os dados estejam em conformidade com os schemas esperados.
  - Tratamento de Erros: Valide se cenários de erro são tratados corretamente e graciosamente.
  - Cobertura de Teste: Verifique se testes adequados cobrem as alterações.

## Executando Testes (Futuro)

```bash
# Executar todos os testes
npm run test

# Modo Watch (re-executa testes em alterações de arquivo)
npm run test -- --watch

# Relatório de cobertura
npm run test -- --coverage

# Arquivo específico
npm run test document-validation # ou document-validation.test.ts(x)
```

## Metas de Cobertura Recomendadas

| Categoria   | Meta   | Racional                                              |
|-------------|--------|-------------------------------------------------------|
| Utilitários | 90%    | Garante que funções helper centrais sejam testadas minuciosamente. |
| Validação   | 100%   | Crítico para integridade de dados.                   |
| Rotas API   | 80%    | Garante que endpoints da API funcionem corretamente. |
| Componentes | 70%    | Equilíbrio entre teste de UI e esforço de desenvolvimento. |

## Solução de Problemas

### Problemas Comuns

- **Conexão de Banco de Dados**: Garanta que o banco de dados de teste esteja configurado corretamente e acessível durante os testes.
- **Mocking de Sessão**: Mock `express-session` ou mecanismos de autenticação equivalentes para testes de rota.
- **React Query**: Envolva componentes em `QueryClientProvider` ao testar componentes que usam hooks `react-query`. Mock chamadas de API usando `jest` ou `msw` (Mock Service Worker).
- **Mocking de Módulo**: Use `jest.mock()` para mockar módulos e serviços externos

### Configuração do Banco de Dados de Teste

```bash
# Criar banco de dados de teste
createdb primecloudpro_test

# Enviar schema para db de teste
DATABASE_URL=postgres://...test npm run db:push
```
