```markdown
# Índice de Documentação

Bem-vindo à base de conhecimento do PrimeCloudProV2. Esta documentação fornece orientações abrangentes para desenvolvedores que trabalham na plataforma de gerenciamento de armazenamento em nuvem.

## Início Rápido

1. Leia a [Visão Geral do Projeto](./project-overview.md) para entender o sistema
2. Siga o [Fluxo de Trabalho de Desenvolvimento](./development-workflow.md) para configurar seu ambiente
3. Revise as [Notas de Arquitetura](./architecture.md) para detalhes técnicos

## Guias Principais

| Guia | Descrição |
|-------|-------------|
| [Visão Geral do Projeto](./project-overview.md) | Propósito do sistema, stack tecnológico e primeiros passos |
| [Notas de Arquitetura](./architecture.md) | Design do sistema, camadas e relacionamentos entre componentes |
| [Fluxo de Trabalho de Desenvolvimento](./development-workflow.md) | Processo de desenvolvimento diário e comandos |
| [Estratégia de Testes](./testing-strategy.md) | Tipos de teste, metas de cobertura e melhores práticas |
| [Glossário](./glossary.md) | Termos do domínio, acrônimos e regras de negócios |
| [Fluxo de Dados](./data-flow.md) | Manipulação de requisições, integrações e gerenciamento de estado |
| [Segurança](./security.md) | Autenticação, autorização e conformidade |
| [Ferramentas](./tooling.md) | Ferramentas de build, configuração de IDE e dicas de produtividade |

## Stack Tecnológico

- **Backend**: Express.js 5, TypeScript, PostgreSQL, Drizzle ORM
- **Frontend**: React 18, Vite, Tailwind CSS, Radix UI
- **Estado**: TanStack React Query, validação Zod
- **Autenticação**: Passport.js, OpenID Connect

## Estrutura do Projeto

```
PrimeCloudProV2/
├── client/           # Frontend React
│   └── src/
│       ├── pages/    # Componentes de rota
│       ├── components/ # Componentes de UI
│       ├── hooks/    # Busca de dados
│       └── lib/      # Utilitários
├── server/           # Backend Express
│   ├── routes.ts     # Endpoints da API
│   ├── storage.ts    # Camada de banco de dados
│   └── services/     # Lógica de negócios
├── shared/           # Código compartilhado
│   ├── schema.ts     # Schemas Zod
│   └── routes.ts     # Utilitários de URL
└── .context/         # Documentação AI
    ├── docs/         # Esta documentação
    └── agents/       # Playbooks de agentes
```

## Conceitos Chave

- **Conta (Account)**: Organização utilizando a plataforma
- **Bucket**: Container de armazenamento em nuvem
- **Chave de Acesso (Access Key)**: Credenciais de API
- **Assinatura (Subscription)**: Vínculo do plano de serviço

Veja o [Glossário](./glossary.md) para a terminologia completa.

## Tarefas Comuns

### Adicionando uma Nova Funcionalidade
1. Defina o schema Zod em `shared/schema.ts`
2. Adicione rotas de API em `server/routes.ts`
3. Atualize o armazenamento em `server/storage.ts`
4. Crie um hook React em `client/src/hooks/`
5. Construa a UI em `client/src/pages/`

### Depurando Problemas
1. Verifique os logs do servidor para erros usando a função `log` exportada de `server/index.ts`
   ```typescript
   import { log } from "../server";
   log("Mensagem de depuração");
   ```
2. Revise as requisições de rede nas ferramentas de desenvolvedor do navegador
3. Consulte os logs de auditoria para ações recentes. O tipo `AuditLog` é definido em `shared/schema.ts` e usado no hook `use-audit-logs.ts` no diretório `client/src/hooks`.
4. Verifique o estado do banco de dados com Drizzle, interagindo com a classe `DatabaseStorage` definida em `server/storage.ts`.

## Exemplos de Documentação de API

### Usando `apiRequest`

A função `apiRequest` (definida em `client/src/lib/queryClient.ts`) fornece uma maneira padronizada de fazer chamadas à API.

```typescript
import { apiRequest } from "@/lib/queryClient";

async function fetchAccountDetails(accountId: string) {
  try {
    const response = await apiRequest("GET", `/accounts/${accountId}`);
    return response; // Assumindo que sua API retorna dados diretamente
  } catch (error) {
    console.error("Erro ao buscar detalhes da conta:", error);
    throw error;
  }
}
```

### Construindo URLs

A função `buildUrl` (definida em `shared/routes.ts`) auxilia na construção de URLs de endpoint de API.

```typescript
import { buildUrl } from "@/../shared/routes";

const userEndpoint = buildUrl("/users/:userId", { userId: "123" });
console.log(userEndpoint); // Saída: /users/123
```

## Autenticação

O arquivo `server/replit_integrations/auth/replitAuth.ts` gerencia a autenticação e o manuseio de sessões usando as funções `getSession`, `updateUserSession`, `upsertUser` e `setupAuth`. A classe `AuthStorage` de `server\replit_integrations\auth\storage.ts` lida com o armazenamento de sessões com uma interface `IAuthStorage`. A `registerAuthRoutes` cria as rotas de autenticação utilizadas.

## Validação de Dados

O sistema utiliza Zod para definir schemas e validar dados. Veja `shared/schema.ts` para definições de schema principais como `Account`, `Bucket` e `AccessKey`. Funções utilitárias como `isValidCPF`, `isValidCNPJ` e `formatDocument` em `client/src/lib/document-validation.ts` ajudam a validar e formatar os dados do documento.

```typescript
import { isValidCPF } from "@/lib/document-validation";

const cpf = "123.456.789-10";
if (isValidCPF(cpf)) {
  console.log("CPF é válido");
} else {
  console.log("CPF é inválido");
}
```

## Recursos Relacionados

- [AGENTS.md](../../AGENTS.md) - Configuração de agentes de IA
- Playbooks de agentes em `.context/agents/`
- Planos de implementação em `.context/plans/`
```
