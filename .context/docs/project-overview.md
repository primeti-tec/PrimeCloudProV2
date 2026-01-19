# Visão Geral do Projeto

O Prime Cloud Pro é uma plataforma de gerenciamento de armazenamento em nuvem que permite que organizações gerenciem contas de armazenamento, buckets, chaves de acesso e assinaturas. A plataforma oferece uma solução completa para provisionamento de armazenamento em nuvem com funcionalidades de cobrança, gerenciamento de quotas e colaboração em equipe.

## Fatos Rápidos

- **Caminho raiz**: `D:\PROJETOS\PRINECLOUDPROV2\PrimeCloudProV2`
- **Linguagens principais**:
  - TypeScript (.tsx, .ts) - 105 arquivos
  - Arquivos de configuração JavaScript
- **Arquitetura**: Full-stack monorepo (client + server + shared)

## Stack Tecnológico

### Backend
- **Runtime**: Node.js com Express.js 5
- **Banco de Dados**: PostgreSQL com Drizzle ORM
- **Autenticação**: Passport.js (local + OpenID Connect)
- **Sessão**: Express Session com armazenamento pg-simple

### Frontend
- **Framework**: React 18 com TypeScript
- **Ferramenta de Build**: Vite 7
- **Estilização**: Tailwind CSS 3 com componentes Radix UI
- **Gerenciamento de Estado**: TanStack React Query
- **Roteamento**: Wouter

### Compartilhado
- **Validação**: Schemas Zod
- **Type Safety**: Tipos compartilhados entre cliente e servidor

## Pontos de Entrada

- [`server/index.ts`](../../server/index.ts) - Inicialização do servidor Express
- [`client/src/main.tsx`](../../client/src/main.tsx) - Entrada da aplicação React
- [`server/replit_integrations/auth/index.ts`](../../server/replit_integrations/auth/index.ts) - Módulo de autenticação

## Funcionalidades Principais

1. **Gerenciamento de Contas**: Criar, gerenciar e aprovar contas organizacionais
2. **Gerenciamento de Buckets**: Buckets de armazenamento em nuvem com regras de ciclo de vida e versionamento
3. **Chaves de Acesso**: Gerenciamento de chaves de API com rotação e ativação/desativação
4. **Colaboração em Equipe**: Convidar membros com permissões baseadas em funções
5. **Assinaturas e Faturamento**: Assinaturas de produtos, faturas e rastreamento de uso
6. **Gerenciamento de Quotas**: Solicitar e gerenciar quotas de armazenamento
7. **Logs de Auditoria**: Rastreamento de todas as atividades do sistema
8. **Notificações**: Sistema de notificação in-app

## Estrutura de Arquivos

- `client/` - Aplicação frontend React
  - `src/pages/` - Componentes de página
  - `src/components/` - Componentes de UI reutilizáveis
  - `src/hooks/` - Hooks React customizados para busca de dados
  - `src/lib/` - Utilitários e helpers
- `server/` - Backend Express
  - `routes.ts` - Definições de rota da API
  - `storage.ts` - Camada de armazenamento de banco de dados ([`DatabaseStorage`](../../server/storage.ts)) que implementa a interface [`IStorage`](../../server/storage.ts).
  - `services/` - Lógica de negócios (serviço de email)
  - `lib/` - Utilitários do servidor
- `shared/` - Código compartilhado entre cliente e servidor
  - `schema.ts` - Schemas Zod e tipos (e.g., [`Account`](../../shared/schema.ts), [`Order`](../../shared/schema.ts), definindo a estrutura de dados em toda a aplicação.)
  - `routes.ts` - Utilitários para construir URLs
  - `models/` - Definições de tipo compartilhadas

## Primeiros Passos

1. Instale as dependências: `npm install`
2. Configure o banco de dados PostgreSQL
3. Envie o schema: `npm run db:push`
4. Inicie o desenvolvimento: `npm run dev`
5. Compile para produção: `npm run build`

## Principais Interessados

- **Usuários Finais**: Organizações que precisam de gerenciamento de armazenamento em nuvem
- **Administradores**: Operadores da plataforma gerenciando contas e quotas
- **Desenvolvedores**: Membros da equipe integrando via chaves de acesso

## API Pública

O projeto expõe vários componentes e estruturas de dados chave:

- **`apiRequest` (client/src/lib/queryClient.ts)**: Uma função utilitária para fazer requisições à API usando `fetch`. Ela lida com autenticação recuperando um token Clerk.
  ```typescript
  import { apiRequest } from "@/lib/queryClient";

  apiRequest("GET", "/accounts").then(response => {
      console.log(response);
  });
  ```

- **`cn` (client/src/lib/utils.ts)**: Um utilitário para combinar nomes de classes CSS condicionalmente, usando `tailwind-merge` e `clsx`.
  ```typescript
  import { cn } from "@/lib/utils";

  <div className={cn("p-4", props.className)}>Exemplo</div>
  ```

- **`isValidCPF` e `isValidCNPJ` (ambos em client/src/lib/document-validation.ts e server/lib/document-validation.ts)**: Funções para validar documentos CPF e CNPJ brasileiros.

- **Schemas Zod (shared/schema.ts)**: Definem a estrutura de dados e regras de validação para várias entidades como `Account`, `Order`, `Bucket`, etc.

- **`buildUrl` (shared/routes.ts)**: Uma função para construir URLs baseadas em padrões de rota e parâmetros.

## Documentação Relacionada

- [Notas de Arquitetura](./architecture.md)
- [Fluxo de Trabalho de Desenvolvimento](./development-workflow.md)
- [Segurança e Conformidade](./security.md)
