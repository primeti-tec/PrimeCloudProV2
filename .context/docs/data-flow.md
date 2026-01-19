# Fluxo de Dados e Integrações

Explica como os dados entram, movem-se através e saem do sistema, incluindo interações com serviços externos.

## Arquitetura de Alto Nível

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Cliente React  │────▶│ Servidor Express│────▶│   PostgreSQL    │
│  (Vite + React) │◀────│  (API + Auth)   │◀────│   (Drizzle)     │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                               │
                               ▼
                        ┌─────────────────┐
                        │ Serviço de Email│
                        │   (SMTP/API)    │
                        └─────────────────┘
```

## Fluxo de Requisição

### Cliente → Servidor → Banco de Dados
1. **Componente React** dispara ação (envio de formulário, clique em botão)
2. **Hook Customizado** (ex: `useCreateAccount`) chama `apiRequest()`
3. **`apiRequest`** (`client\src\lib\queryClient.ts`) faz fetch para API Express
4. **Rota Express** valida com schema Zod
5. **Camada de Armazenamento** executa query Drizzle via `DatabaseStorage` (`server\storage.ts`)
6. **Resposta** flui de volta através do cache do React Query

### Fluxo de Autenticação
1. Usuário envia credenciais
2. Passport.js valida contra o banco de dados
3. Sessão criada e armazenada no PostgreSQL
4. Cookie de sessão retornado ao cliente
5. Requisições subsequentes incluem cookie de sessão

## Dependências de Módulos

### Dependências do Servidor
```
server/index.ts
├── server/routes.ts (handlers de rota da API)
├── server/static.ts (serviço de arquivos estáticos)
├── server/vite.ts (integração do servidor dev Vite)
└── server/storage.ts
    └── server/db.ts (instância Drizzle)
```

### Dependências do Cliente
```
client/src/main.tsx
└── client/src/App.tsx
    └── client/src/lib/queryClient.ts
        └── Páginas e Componentes
            └── client/src/hooks/* (busca de dados)
```

### Módulo Compartilhado
```
shared/schema.ts
├── Schemas Zod para validação
├── Exportações de tipos para cliente/servidor
└── shared/models/auth.ts (Tipos de Usuário)

shared/routes.ts
└── buildUrl() para construção de URL type-safe
```

## Camada de Dados

### Interface de Armazenamento
A interface `IStorage` (`server/storage.ts:12`) define todas as operações de banco de dados:
- Gerenciamento de contas (CRUD, aprovação, suspensão)
- Operações de Bucket (criar, deletar, versionamento, ciclo de vida)
- Gerenciamento de chaves de acesso (criar, rotacionar, revogar)
- Manipulação de membros/convites
- Faturamento (faturas, registros de uso, quotas)
- Notificações e logs de auditoria

### Operações de Banco de Dados
Todas as operações passam pela classe `DatabaseStorage` (`server/storage.ts:105`):
- Usa Drizzle ORM para queries type-safe
- Transações para operações complexas
- Pooling de conexões via `pg`

## Padrão de Endpoints da API

### Operações de Recursos
```
GET    /api/accounts           → Listar contas
POST   /api/accounts           → Criar conta
GET    /api/accounts/:id       → Obter conta
PATCH  /api/accounts/:id       → Atualizar conta

GET    /api/accounts/:id/buckets     → Listar buckets
POST   /api/accounts/:id/buckets     → Criar bucket
DELETE /api/accounts/:id/buckets/:id → Deletar bucket
```

### Operações Administrativas
```
POST /api/admin/accounts/:id/approve  → Aprovar conta
POST /api/admin/accounts/:id/reject   → Rejeitar conta
POST /api/admin/accounts/:id/suspend  → Suspender conta
POST /api/admin/quotas/:id/adjust     → Ajustar quota
```

## Integrações Externas

### Serviço de Email
- **Localização**: `server/services/email.ts`
- **Funções**:
  - `sendEmail()` - Envio genérico de email
  - `sendInvitationEmail()` - Convites de equipe
  - `sendVerificationEmail()` - Verificação de conta
  - `sendWelcomeEmail()` - Boas-vindas a novo usuário
  - `sendPasswordResetEmail()` - Recuperação de senha
```typescript
import { sendEmail } from "~/server/services/email";
import { EmailOptions } from "~/server/services/email";

const options: EmailOptions = {
  to: "teste@exemplo.com",
  subject: "Email de Teste",
  html: "<p>Este é um email de teste.</p>",
};

sendEmail(options);
```

### Provedores de Autenticação
- **Passport Local**: Autenticação usuário/senha
- **OpenID Connect**: OAuth 2.0 / Provedores OIDC
- **Store de Sessão**: PostgreSQL via `connect-pg-simple`

## Gerenciamento de Estado do Cliente

### Padrão React Query
```typescript
// Hook de busca de dados
const { data, isLoading, error } = useAccounts();

// Hook de mutação
const createAccount = useCreateAccount();
await createAccount.mutateAsync(data);
```

### Invalidação de Cache
Mutações invalidam queries relacionadas automaticamente:
- Criar bucket → invalida lista de buckets
- Atualizar conta → invalida detalhes da conta
- Adicionar membro → invalida lista de membros

## Observabilidade

### Logs
- Log do servidor via função `log()` (`server/index.ts:62`)
- Formato de log estruturado para produção

```typescript
// Exemplo de log do servidor
import { log } from "./index";

log.info("Servidor iniciado com sucesso");
```

### Trilha de Auditoria
- Todas as ações significativas logadas na tabela `AuditLog`
- Consultável via API e hook `useAuditLogs`
- Rastreia: ação, usuário, timestamp, recursos afetados

## Tratamento de Erros

### Lado do Cliente
- `isUnauthorizedError()` detecta respostas 401
- `redirectToLogin()` lida com expiração de sessão
- React Query lida com retentativas e estados de erro

### Lado do Servidor
- Erros de validação Zod retornam 400 com detalhes
- Erros de autenticação retornam 401
- Erros de não encontrado retornam 404
- Erros internos logados e retornam 500

## Considerações de Segurança

### Validação de Entrada
- Todas as entradas da API validadas com schemas Zod
- Documentos brasileiros (CPF/CNPJ) validados no lado do servidor usando `isValidCPF` e `isValidCNPJ` (`server\lib\document-validation.ts`).
- Coerção de tipos tratada pelo Drizzle

### Filtragem de Saída
- Dados sensíveis (senhas, tokens) nunca retornados
- Chaves de acesso mostram valores mascarados após criação
- Dados de sessão não expostos em respostas da API
