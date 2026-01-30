# PrimeCloudProV2 — Documentation Hub (`docs/README.md`)

Welcome to the PrimeCloudProV2 documentation hub. PrimeCloudProV2 is a cloud provisioning and management platform with integrations for **object storage (MinIO)**, **SFTP management (SFTPGo)**, **billing/subscriptions**, **notifications**, and **audit logging**, with a **React (Vite) frontend**, a **Node/Express backend**, and a **shared TypeScript schema** used end-to-end.

This `docs/README.md` is the entry point that helps developers quickly find the right guide and understand how the repository is organized.

---

## Documentation Index

Use these guides as your main navigation:

| Guide | Description |
| --- | --- |
| [**Project Overview**](./project-overview.md) | High-level summary of the platform’s purpose, stakeholders, and roadmap. |
| [**Architecture Notes**](./architecture.md) | Multi-tenant architecture, service boundaries, and dependency notes. |
| [**Development Workflow**](./development-workflow.md) | Local setup, branching conventions, and CI/CD pipelines. |
| [**Testing Strategy**](./testing-strategy.md) | Vitest test suites, integration tests, and quality gates. |
| [**Glossary & Domain Concepts**](./glossary.md) | Definitions for domain terms (Accounts, Buckets, Quotas, VPS Configs, etc.). |
| [**Data Flow & Integrations**](./data-flow.md) | How data moves between UI, API, and third-party services (e.g., MinIO). |
| [**Security & Compliance**](./security.md) | Auth models (Clerk/Replit), RBAC, and audit logging practices. |
| [**Tooling & Productivity**](./tooling.md) | CLI scripts, migration utilities, IDE tips, and a repository map. |

---

## System Architecture (High-Level)

PrimeCloudProV2 uses a modular structure with a clear separation between **frontend**, **backend**, and **shared types/schemas**.

### Core layers

- **Shared schema & models (`shared/`)**
  - Source of truth for types, validation, and database schema (Drizzle + TypeScript).
  - Key file to know: **`shared/schema.ts`** (contains core domain types like `Account`, `Bucket`, `AccessKey`, `Invoice`, etc.).

- **Backend services (`server/services/`)**
  - Encapsulated business logic and integrations:
    - **`MinioService`** — bucket/object operations, quotas, usage metrics  
      ↳ `server/services/minio.service.ts`
    - **`SftpGoService`** — SFTP user provisioning, virtual folders/filesystems  
      ↳ `server/services/sftpgo.service.ts`
    - **`BillingService`** — usage processing and invoice generation  
      ↳ `server/services/billing.service.ts`
    - **`AuditService`** — compliance/event logging  
      ↳ `server/services/audit.service.ts`
    - **`NotificationService`** — in-app notifications and SMTP email flows  
      ↳ `server/services/notification.service.ts`

- **API routes/controllers (`server/routes/`)**
  - Express endpoints that orchestrate calls into services, apply validation, and shape responses.
  - Example: SMTP management routes live in `server/routes/smtp.ts`.

- **Frontend (`client/`)**
  - React + Vite UI with domain components and hooks.
  - API calls are typically funneled through a query client utility (see `client/src/lib/queryClient.ts`).

---

## Key Service Integrations

| Service | Responsibility | Primary implementation |
| --- | --- | --- |
| Object Storage | MinIO bucket/object management, quotas, usage | `server/services/minio.service.ts` (`MinioService`) |
| SFTP Access | SFTPGo user provisioning & filesystem management | `server/services/sftpgo.service.ts` (`SftpGoService`) |
| Identity | Authentication and session management | `server/replit_integrations/auth/*` (and Clerk on client) |
| Billing | Usage collection + invoice generation | `server/services/billing.service.ts` (`BillingService`) |
| Notifications | SMTP + in-app alerts | `server/services/notification.service.ts` (`NotificationService`) |
| Compliance | Event/audit trail | `server/services/audit.service.ts` (`AuditService`) |

---

## Getting Started (Recommended Reading Path)

If you’re new to the repository:

1. Read the **[Glossary](./glossary.md)** to learn the core domain entities (e.g., `Account`, `Member`, `Customer`, `Bucket`, `Quota`).
2. Review **[Architecture Notes](./architecture.md)** to understand service boundaries and how the `server/` uses `shared/`.
3. Skim **[Data Flow & Integrations](./data-flow.md)** to understand how the UI, API, and external systems interact.

---

## Useful Local Commands

Common commands referenced across the docs:

```bash
# Start Vite + Express in development
npm run dev

# Push Drizzle schema changes to the database
npm run db:push

# Run tests
npm run test

# Example utility script: verify MinIO bucket sync/size
npm run check-storage
```

Notes:
- Script entry points are typically under `script/` or `scripts/`.
- Cron/background jobs related to usage and billing are implemented in `server/cron/usage-collector.ts`.

---

## Repository Structure Highlights

This is the mental map you’ll use most often while reading and navigating the code:

- `client/` — React frontend (Vite), UI components, hooks, pages
- `server/` — Express backend, route modules, services, cron jobs
- `shared/` — shared domain types, schema definitions, request/response contracts
- `migrations/` — database migrations (Drizzle-managed)
- `tests/` — unit/integration tests
- `attached_assets/` — static assets for docs (images/diagrams)

For a more detailed breakdown, see **[Tooling & Productivity → Repository Map](./tooling.md#repository-map)**.

---

## Related Code References (When You Need to Go Deeper)

When cross-referencing docs to implementation, these files are frequent “jump points”:

- Shared domain types / schema:
  - `shared/schema.ts`
  - `shared/routes.ts` (route building helpers like `buildUrl`)
- Backend entry points and runtime:
  - `server/index.ts`
  - `server/static.ts` (serving static assets)
  - `server/vite.ts` (Vite integration in dev)
- Cron & automation:
  - `server/cron/usage-collector.ts` (usage metrics, overdue invoices, monthly billing)
- Auth integration:
  - `server/replit_integrations/auth/*`

---
