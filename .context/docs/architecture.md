# Notas de Arquitetura

Descreve como o sistema é montado e por que o design atual existe.

## Visão Geral da Arquitetura do Sistema

Prime Cloud Pro é uma aplicação **monolítica modular** organizada em um **monorepo** com três camadas principais: `client/`, `server/` e `shared/`.

### Topologia

```
┌─────────────────────────────────────────────────────────────────┐
│                         Cliente (Browser)                        │
│                     React SPA + React Query                      │
└─────────────────────────────────────────────────────────────────┘
                                │
                                │ HTTP/REST (JSON)
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                        Servidor Express                          │
│   ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│   │    Rotas     │→ │ Armazenamento│→ │   Banco de Dados     │  │
│   │  (routes.ts) │  │ (storage.ts) │  │ PostgreSQL (Drizzle) │  │
│   └──────────────┘  └──────────────┘  └──────────────────────┘  │
│           │                                                      │
│           ▼                                                      │
│   ┌──────────────┐  ┌──────────────┐                            │
│   │   Serviços   │  │     Auth     │                            │
│   │  (email.ts)  │  │  (Passport)  │                            │
│   └──────────────┘  └──────────────┘                            │
└─────────────────────────────────────────────────────────────────┘
```

### Fluxo de Requisições

1. **Cliente → Servidor**: Requisições HTTP via `fetch` encapsulado em `apiRequest()` do React Query
2. **Servidor → Storage**: Rotas delegam operações CRUD para a classe `DatabaseStorage`
3. **Storage → Database**: Drizzle ORM executa queries tipadas no PostgreSQL
4. **Servidor → Cliente**: Respostas JSON com tipos inferidos dos schemas Zod compartilhados

### Modelo de Deployment

- **Ambiente**: Replit com autoscale
- **Build**: Vite (frontend) + esbuild (backend) → `dist/`
- **Servidor**: Node.js 20 servindo SPA estática + API REST na porta 5000

## Camadas de Arquitetura

O sistema segue uma arquitetura em camadas com separação clara de responsabilidades:

| Camada | Responsabilidade | Localização |
|--------|------------------|-------------|
| **Models** | Definição de tipos e schemas de dados | `shared/schema.ts`, `shared/models/` |
| **Controllers** | Roteamento e manipulação de requisições | `server/routes.ts` |
| **Services** | Lógica de negócio e integrações | `server/services/` |
| **Storage** | Persistência e acesso a dados | `server/storage.ts` |
| **Components** | Interface do usuário | `client/src/components/`, `client/src/pages/` |
| **Hooks** | Busca de dados e estado | `client/src/hooks/` |

### Models
Estruturas de dados e objetos de domínio
... (Símbolos mantidos, pois são referências de código)

### Controllers
Manipulação de requisições e roteamento
...

### Services
Lógica de negócios e orquestração
...

### Utils
Utilitários e helpers compartilhados
...

### Components
Componentes de UI e visualizações
...

## Padrões de Design Detectados
- *Nenhum padrão de design específico detectado ainda.*

## Pontos de Entrada
- [`server\index.ts`](server\index.ts)
- [`server\replit_integrations\auth\index.ts`](server\replit_integrations\auth\index.ts)
- [`client\src\main.tsx`](client\src\main.tsx)

## API Pública
(Tabela de símbolos mantida)

## Fronteiras Internas do Sistema

### Contextos Delimitados

O sistema é dividido em domínios com responsabilidades distintas:

| Domínio | Entidades | Responsabilidade |
|---------|-----------|------------------|
| **Account Management** | Account, AccountMember | Criação, aprovação e gerenciamento de organizações |
| **Storage** | Bucket, AccessKey, SftpCredential | Gerenciamento de buckets e credenciais de acesso |
| **Billing** | Product, Subscription, Invoice, UsageRecord | Produtos, assinaturas e faturamento |
| **Orders** | Order | Processamento de pedidos de produtos |
| **Team** | Invitation, AccountMember | Convites e membros da equipe |
| **Audit** | AuditLog, Notification | Logs de auditoria e notificações |
| **Quota** | QuotaRequest | Solicitações de aumento de quota |

### Separação Frontend/Backend

```
┌─────────────────────────┐         ┌─────────────────────────┐
│        Frontend         │         │         Backend         │
│  (client/src/)          │         │  (server/)              │
├─────────────────────────┤         ├─────────────────────────┤
│ • Componentes React     │  REST   │ • Rotas Express         │
│ • Hooks React Query     │◄───────►│ • DatabaseStorage       │
│ • Roteador Wouter       │  JSON   │ • Autenticação Passport │
│ • Validação Zod         │         │ • Drizzle ORM           │
└─────────────────────────┘         └─────────────────────────┘
              │                                   │
              └──────────────┬────────────────────┘
                             ▼
              ┌─────────────────────────┐
              │    Shared (shared/)     │
              ├─────────────────────────┤
              │ • Schemas Zod           │
              │ • Tipos TypeScript      │
              │ • Construtores de Rota  │
              └─────────────────────────┘
```

### Contratos Compartilhados

- **Type Safety**: Schemas Zod em `shared/schema.ts` garantem consistência de tipos entre frontend e backend
- **Route Builders**: `shared/routes.ts` fornece funções type-safe para construir URLs
- **Validação**: Mesmos schemas Zod usados para validação em ambos os lados

### Propriedade de Dados (Data Ownership)

| Camada | Responsável por |
|--------|-----------------|
| **Storage Layer** | CRUD de todas as entidades, transações |
| **Services** | Lógica de negócio, integrações externas |
| **Routes** | Validação de entrada, autorização, resposta HTTP |
| **Hooks** | Cache de dados, otimistic updates, invalidação |

## Dependências de Serviços Externos

### Serviços de Infraestrutura

| Serviço | Propósito | Autenticação | Considerações de Falha |
|---------|-----------|--------------|------------------------|
| **PostgreSQL** | Banco de dados principal | String de conexão (`DATABASE_URL`) | Retry automático via Drizzle, pooling de conexões |
| **Replit** | Hospedagem e deployment | Integrado via `.replit` | Autoscale gerenciado pela plataforma |

### Serviços de Aplicação

| Serviço | Propósito | Localização | Considerações |
|---------|-----------|-------------|---------------|
| **Email Service** | Envio de emails transacionais | `server/services/email.ts` | Templates para convites, verificação, boas-vindas, redefinição de senha |
| **Replit Auth** | Autenticação OpenID Connect | `server/replit_integrations/auth/` | Sessões gerenciadas com express-session |

### Variáveis de Ambiente Requeridas

```bash
DATABASE_URL          # String de conexão PostgreSQL
REPLIT_DEPLOYMENT     # Indica ambiente de deploy
SESSION_SECRET        # Segredo para sessões (gerado automaticamente se ausente)
```

### Diagrama de Dependências Externas

```
┌──────────────────────────────────────────────────────┐
│                  PrimeCloudProV2                     │
└──────────────────────────────────────────────────────┘
        │              │              │
        ▼              ▼              ▼
┌───────────┐  ┌───────────┐  ┌───────────────┐
│PostgreSQL │  │  Replit   │  │ Email Service │
│    DB     │  │   Auth    │  │    (SMTP)     │
└───────────┘  └───────────┘  └───────────────┘
```
