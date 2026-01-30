# Relatório Técnico Atualizado — PrimeCloudProV2 (v2.2)

**Repositório:** `PrimeCloudProV2`  
**Data:** 20/01/2026  
**Status:** Desenvolvimento ativo (≈ 60–70% concluído)

Este documento consolida o estado atual do PrimeCloudProV2, descrevendo arquitetura, serviços, recursos implementados, APIs principais, scripts operacionais e prioridades. Ele serve como referência prática para desenvolvedores que estão entrando no projeto ou retomando atividades.

---

## 1. Visão Geral do Produto

O **PrimeCloudProV2** é uma plataforma **multi-tenant** de backup/armazenamento online baseada em **S3 (MinIO)**, com portal web **white-label** para que cada cliente (tenant) gerencie:

- Buckets e objetos (via S3 e via UI)
- Chaves de acesso (Access Keys)
- Usuários do time e permissões (RBAC)
- Acesso via **SFTP gerenciado** (SFTPGo)
- Branding e domínio customizado
- SMTP por conta (envio de e-mails por servidor do tenant)
- Cobrança por uso (uso/transferência), faturas e assinaturas
- Auditoria e notificações

---

## 2. Stack Tecnológica

### Backend
- **Node.js + Express 5** (TypeScript)
- **Drizzle ORM** + **PostgreSQL**
- Integrações: **MinIO (S3)**, **SFTPGo**, **Nodemailer/SendGrid**, **ws (WebSocket)**
- Jobs/rotinas: **cron** (coleta de uso e faturamento)

### Frontend
- **React 18** + **Vite**
- **Tailwind CSS** + **shadcn/ui**

### Auth
- **Clerk** (principal)
- Alternativa/fallback: rotas e storage de sessão (integração `replit_integrations/auth`)

### Testes
- **Vitest** + **Happy DOM** + Testing Library

---

## 3. Arquitetura e Organização do Código

Visão por camadas/diretórios (alto nível):

- **shared/**  
  Tipos, schema e rotas compartilhadas entre cliente e servidor.  
  Arquivos-chave:
  - `shared/schema.ts` — **fonte central** das entidades e DTOs
  - `shared/routes.ts` — utilitários/definições de rotas e `buildUrl()`

- **server/**  
  API, serviços, cron jobs e integrações:
  - `server/index.ts` — bootstrap do servidor, logs
  - `server/routes/*` — handlers específicos (ex.: SMTP)
  - `server/services/*` — serviços de domínio (MinIO, Billing, Audit, etc.)
  - `server/cron/usage-collector.ts` — coleta de métricas + faturamento
  - `server/replit_integrations/auth/*` — auth/session storage

- **client/src/**  
  UI, hooks e libs:
  - `client/src/pages/*` — páginas
  - `client/src/components/*` — componentes (inclui shadcn/ui e módulos)
  - `client/src/hooks/*` — hooks de dados (buckets, billing, audit, etc.)
  - `client/src/lib/queryClient.ts` — `apiRequest()` e helpers HTTP

---

## 4. Serviços de Domínio (Backend)

A camada de serviços concentra regras e integrações. Principais serviços:

### 4.1 `MinioService`
**Arquivo:** `server/services/minio.service.ts`  
**Responsabilidade:** Gerenciar buckets/objetos no MinIO e coletar métricas.

Recursos típicos:
- CRUD de buckets
- Estatísticas de buckets/objetos
- Regras de lifecycle (expiração/transição)
- Métricas de uso (armazenamento/transferência)
- Inicialização de cliente MinIO e leitura de configuração

**Tipos relevantes:**
- `MinioConfig`, `BucketInfo`, `ObjectStats`, `UsageMetrics`, `StorageQuota`, `LifecycleRule`

**Função relevante exportada:**
- `getMinioConfig()` — carrega configuração do MinIO usada pelo serviço

### 4.2 `SftpGoService`
**Arquivo:** `server/services/sftpgo.service.ts`  
**Responsabilidade:** Provisionar e gerenciar acesso SFTP por tenant via SFTPGo.

Destaques:
- Criação/atualização de usuários SFTP
- Virtual folders / filesystem mapping por bucket/tenant
- Geração de senha segura: `generateSecurePassword()`
- Checagem de disponibilidade do SFTPGo: `checkSftpGoAvailability()`

**Tipos relevantes:**
- `SftpGoConfig`, `SftpGoUser`, `SftpGoFilesystem`, `SftpGoVirtualFolder`

### 4.3 `BillingService`
**Arquivo:** `server/services/billing.service.ts`  
**Responsabilidade:** Uso, precificação, geração de faturas e resumo de consumo.

Elementos típicos:
- Consolidação mensal de uso
- Regras de pricing/plans
- Criação/atualização de invoices

**Tipos relevantes:**
- `PricingConfig`, `UsageSummary`, `InvoiceData`

### 4.4 `NotificationService`
**Arquivo:** `server/services/notification.service.ts`  
**Responsabilidade:** Notificações multi-canal e eventos internos.

Inclui:
- Enfileirar/enviar notificações
- Payload estruturado e integração com e-mail (dependendo da configuração SMTP)

**Tipo relevante:**
- `NotificationPayload`

### 4.5 `AuditService`
**Arquivo:** `server/services/audit.service.ts`  
**Responsabilidade:** Auditoria central de ações e eventos (segurança e rastreabilidade).

Inclui:
- Registro de eventos (ações em buckets, keys, billing, admin etc.)
- Severidades (`AuditSeverity`)
- Contexto e detalhes (`AuditContext`, `AuditDetails`)

### 4.6 `DomainService`
**Arquivo:** `server/services/domain-service.ts`  
**Responsabilidade:** Domínios customizados e verificação de ownership por DNS.

Funções relevantes:
- `generateVerificationToken()`
- `verifyDomainOwnership()`
- `isValidDomain()`
- `isDomainUnique()`

---

## 5. Rotinas Automatizadas (Cron / Jobs)

**Arquivo principal:** `server/cron/usage-collector.ts`

Rotinas implementadas:
- `collectUsageMetrics()` — coleta métricas de uso para contas ativas
- `checkOverdueInvoices()` — verifica faturas vencidas e dispara lembretes
- `runMonthlyBilling()` — job mensal para gerar faturas do período anterior
- `startCronJobs()` / `stopCronJobs()` — controle de execução
- `triggerUsageCollection()` / `triggerMonthlyBilling()` — gatilhos manuais (úteis em admin/debug)

Essas rotinas são o núcleo operacional de “billing por uso”.

---

## 6. Modelo de Dados (Drizzle / PostgreSQL)

**Arquivo:** `shared/schema.ts`  
O schema concentra entidades (tabelas), tipos e DTOs usados em client e server.

### 6.1 Principais entidades (≈ 15 tabelas)
- **Core / Multi-tenant**
  - `accounts`, `users`, `account_members`, `invitations`
- **Storage / Acesso**
  - `buckets`, `access_keys`, `sftp_credentials`
  - `bucket_permissions`, `object_favorites`, `object_tags`, `object_shares`
- **Financeiro**
  - `products`, `subscriptions`, `orders`
  - `invoices`, `usage_records`, `pricing_config`, `pricing_history`
  - `customers`, `customer_invoices`
- **Sistema**
  - `notifications`, `audit_logs`, `quota_requests`

### 6.2 Tipos/DTOs exportados (exemplos)
- Entidades: `Account`, `Bucket`, `AccessKey`, `Invoice`, `UsageRecord`, `AuditLog`, etc.
- Requests: `CreateBucketRequest`, `CreateAccessKeyRequest`, `CreateInvoiceRequest`, etc.
- RBAC: `AccountRole`, `AccountWithRole`, `AccountWithDetails`

**Observação prática:** `shared/schema.ts` é a base para consistência de tipos entre UI e API.

---

## 7. API (Visão Prática)

As rotas REST são definidas majoritariamente no servidor e espelhadas/utilizadas pelo cliente via helpers compartilhados.

### 7.1 Utilitário de URL compartilhado
**Arquivo:** `shared/routes.ts`  
- `buildUrl()` — padroniza construção de endpoints.

### 7.2 Cliente HTTP no Frontend
**Arquivo:** `client/src/lib/queryClient.ts`  
- `apiRequest()` — wrapper de requisições (inclui token, tratamento de erro)
- `throwIfResNotOk()`, `getClerkToken()` — suporte de autenticação/erros

### 7.3 Exemplo de consumo (frontend)
```ts
import { apiRequest } from "@/lib/queryClient";

async function listBuckets() {
  const res = await apiRequest("GET", "/api/buckets");
  return res.json();
}
```

> Endpoints específicos variam conforme rotas no servidor; use `shared/routes.ts` e handlers em `server/routes/*` como referência canônica.

---

## 8. Funcionalidades Implementadas (Resumo)

### 8.1 Multi-tenancy e RBAC
- Isolamento por conta (tenant)
- Gestão de equipe e papéis (Owner/Admin/Developer)
- Convites com token (onboarding seguro)

### 8.2 Storage (MinIO) e Credenciais
- Buckets: criação/listagem/atualização/remoção
- Lifecycle/versioning (base funcional)
- Access Keys: geração segura (hash SHA-256) e gerenciamento
- Operações e scripts de sincronização/validação de buckets

### 8.3 SFTP Gerenciado (SFTPGo)
- Criação de credenciais e usuários por tenant
- Senhas geradas de forma segura
- Mapeamento de pastas virtuais (conforme implementação)

### 8.4 Billing e Operações
- Coleta de métricas por cron
- Invoices mensais e uso por conta
- Orders e fluxo de cobrança em evolução

### 8.5 White-label / Branding / Domínios / SMTP
- Configuração de aparência e marca por conta
- Domínios customizados com verificação DNS
- SMTP por tenant com rotas dedicadas

---

## 9. Scripts e Operação de Desenvolvimento

Scripts encontrados no repositório (úteis para manutenção/ops):

- `scripts/test-minio.ts` — teste de conectividade MinIO
- `scripts/db_test.ts` — verificação de banco (diagnóstico)
- `script/sync-minio-buckets.ts` e `script/sync-minio-buckets-full.ts` — sincronização/estatísticas de buckets
- `script/migrate-bucket.ts` — migração de bucket (operações assistidas)
- `script/fix-storage.ts` — correções de storage
- `script/check-bucket-size.ts` — checagem de tamanho de bucket
- `script/build.ts` — build customizado

Comandos comuns (conforme `package.json`, citado no contexto):
- `npm run dev` — ambiente de desenvolvimento
- `npm run build` — build via script customizado
- `npm run db:push` — sincroniza schema Drizzle
- `npm run test` — suíte Vitest

---

## 10. Progresso por Área

| Área | Status | Progresso |
|---|---:|---:|
| Banco (schema) | Avançado | ~95% |
| Backend API | Avançado | ~75% |
| Services Layer | Em evolução | ~70% |
| MinIO Integration | Funcional | ~65% |
| Billing & Invoices | Núcleo pronto | ~60% |
| Frontend UI | Inicial | ~20% |
| DevOps/CI-CD | Pendente | ~10% |

---

## 11. Prioridades e Roadmap (Curto Prazo)

### Fase 1 — Frontend Core (imediato)
- Dashboard principal com visualizações de uso
- Bucket Browser (listar/upload/download)
- UI de Access Keys (criar/rotacionar/revogar)

### Fase 2 — Recursos avançados
- Completar painel White-label (branding + domínio)
- UI de SMTP (configurar + testar)
- Painel de Billing (faturas e pagamentos)

### Fase 3 — Infra e maturidade
- Dockerização (Postgres, MinIO, App)
- WebSocket para notificações em tempo real
- Aumentar cobertura de testes nos serviços críticos

---

## 12. Referências Rápidas (Arquivos-Chave)

- **Schema e tipos compartilhados:** `shared/schema.ts`
- **Rotas/utilitários compartilhados:** `shared/routes.ts`
- **Servidor (entrada):** `server/index.ts`
- **MinIO:** `server/services/minio.service.ts`
- **SFTPGo:** `server/services/sftpgo.service.ts`
- **Billing:** `server/services/billing.service.ts`
- **Auditoria:** `server/services/audit.service.ts`
- **Notificações:** `server/services/notification.service.ts`
- **Domínios:** `server/services/domain-service.ts`
- **Cron (uso e billing):** `server/cron/usage-collector.ts`
- **SMTP routes:** `server/routes/smtp.ts`
- **HTTP client frontend:** `client/src/lib/queryClient.ts`

---

## 13. Notas para Desenvolvimento

- **Fonte de verdade do domínio de dados:** mantenha `shared/schema.ts` como referência central para entidades/DTOs.
- **Separação clara:** “regras e integrações” devem permanecer em `server/services/*`, enquanto `server/routes/*` deve ser fino (handler + validação + chamada de serviço).
- **Consistência de rotas:** prefira usar `buildUrl()` e padrões já adotados para manter simetria entre client/server.
- **Observabilidade:** registre ações relevantes no `AuditService` (principalmente admin/keys/billing/storage).

---
