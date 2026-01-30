# QA & Developer FAQ (PrimeCloudProV2)

Welcome to the **PrimeCloudProV2** developer documentation hub. This section is aimed at both **developers** and **QA engineers** who need to understand the system architecture, maintain code quality, and quickly find implementation details across the platform (storage, billing, authentication, and admin operations).

This documentation complements the codebase that follows a **Model–Controller–Service** architecture and is shared across:

- **Backend** (`server/`): Express routes, service layer integrations (MinIO, SFTPGo, billing, audit, notifications), cron jobs
- **Frontend** (`client/`): React pages/components, hooks, API client helpers
- **Shared** (`shared/`): Drizzle ORM schema + shared types and route helpers

---

## Getting Started

- **[Setup & Installation](./getting-started.md)**  
  Step-by-step instructions for local development setup:
  - environment variables
  - database initialization
  - storage services initialization (**MinIO** / **SFTPGo**)

---

## Architecture & Design

- **[Project Structure](./project-structure.md)**  
  A map of the codebase and how it follows the Model–Controller–Service pattern.
  - **Models**: Defined in `shared/schema.ts` using Drizzle ORM
  - **Services**: Core logic for:
    - `MinioService` (`server/services/minio.service.ts`)
    - `SftpGoService` (`server/services/sftpgo.service.ts`)
    - `BillingService` (`server/services/billing.service.ts`)
    - `AuditService` (`server/services/audit.service.ts`)
  - **Controllers**: Express routes and authentication integration (including Replit Auth)

- **[Service Layer Deep Dive](./services.md)**  
  Technical details on service interactions with:
  - external providers
  - internal persistence (database)
  - cross-service patterns (auditing, notifications, error handling)

---

## Core Features

- **[Authentication & Security](./authentication.md)**  
  Covers:
  - Replit Auth integration and session management (`server/replit_integrations/auth/`)
  - Security primitives and access management:
    - `AccessKey`
    - `BucketPermission`

- **[Database & Data Access](./database.md)**  
  Covers:
  - schema definitions for Accounts, Buckets, VPS configurations, Invoices, etc.
  - how to use **shared Drizzle types** (`shared/schema.ts`) consistently on frontend + backend

- **[API Endpoints](./api-endpoints.md)**  
  Documentation of REST routes for:
  - bucket management
  - billing operations
  - admin workflows  
  Includes client-side usage of:
  - `apiRequest` (`client/src/lib/queryClient.ts`)

---

## Billing & Operations

- **[Usage Tracking & Billing](./billing.md)**  
  Explains:
  - how the `usage-collector.ts` cron job aggregates metrics (`server/cron/usage-collector.ts`)
  - invoice lifecycle: generation → reminders → payment tracking / status transitions

- **[Error Handling](./error-handling.md)**  
  Standardized patterns for:
  - error responses
  - logging conventions  
  Includes how/when to use `AuditService` for sensitive actions and system traceability.

- **[SMTP & Notifications](./notifications.md)**  
  How system emails and notifications work:
  - SMTP configuration endpoints (`server/routes/smtp.ts`)
  - `NotificationService` patterns (`server/services/notification.service.ts`)

---

## Testing & Quality Control

- **[Testing Guide](./testing.md)**  
  How to run test suites and validate system behavior. Includes an overview of scripts under `scripts/` and `script/`, such as:
  - `scripts/test-minio.ts`
  - `scripts/db_test.ts`
  - bucket and storage maintenance utilities

- **[Data Validation](./validation.md)**  
  Details validation rules and utilities, including:
  - CPF/CNPJ validation helpers (mirrored in server/client libs)
  - schema-level constraints enforced by shared models

---

## Technical Symbol Reference (Quick Lookup)

The project relies heavily on a shared schema/types layer (`shared/schema.ts`) and service abstractions. Use this section as a quick map when you need to locate the “source of truth” for a concept.

| Category | Key Symbols | Where to Look |
| --- | --- | --- |
| **Storage** | `MinioService`, `SftpGoService`, `Bucket`, `ObjectShare` | `server/services/minio.service.ts`, `server/services/sftpgo.service.ts`, `shared/schema.ts` |
| **Billing** | `BillingService`, `Invoice`, `UsageRecord`, `PricingConfig` | `server/services/billing.service.ts`, `server/cron/usage-collector.ts`, `shared/schema.ts` |
| **Auth** | `Account`, `AccountMember`, `AccountRole`, `AccessKey` | `shared/schema.ts`, `server/replit_integrations/auth/*` |
| **Admin / Auditing** | `AuditService`, `AuditLog`, `QuotaRequest` | `server/services/audit.service.ts`, `shared/schema.ts` |
| **Client API** | `apiRequest`, `use-buckets`, `use-billing`, `use-audit-logs` | `client/src/lib/queryClient.ts`, `client/src/hooks/*` |

---

## Related Code Areas (Cross-References)

When debugging or extending features, these files are common “hubs”:

- **Schema & shared types**: `shared/schema.ts`
- **Route building / shared routing helpers**: `shared/routes.ts` (`buildUrl`)
- **Backend entry & server setup**: `server/index.ts`
- **Cron operations**: `server/cron/usage-collector.ts`
- **Storage integrations**: `server/services/minio.service.ts`, `server/services/sftpgo.service.ts`
- **Notifications & SMTP**: `server/services/notification.service.ts`, `server/routes/smtp.ts`
- **Client API helper**: `client/src/lib/queryClient.ts` (`apiRequest`)

---

*Last Updated: 2026-01-22*
