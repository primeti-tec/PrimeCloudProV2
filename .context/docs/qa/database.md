# Database (QA) — Architecture, Schema, and Data Persistence

This document describes how PrimeCloudProV2 persists data, how the schema is organized, and how the server accesses and maintains database state. It is intended for developers validating database behavior in QA environments and during local development.

---

## Stack & Design Goals

### Database + ORM
- **Database**: PostgreSQL (relational, transactional)
- **ORM / schema**: **Drizzle ORM**
- **Validation**: **Zod schemas** for incoming API payloads (exported from the shared schema layer)

### Core design goals
- **Multi-tenancy**: Most domain entities are scoped to an `Account` (tenant/org).
- **High integrity auditability**: Central `AuditLog` table captures security/admin actions.
- **Separation of concerns**: Physical storage lives in **MinIO/S3** or **SftpGo**, while the database stores **metadata**, **permissions**, and **billing/usage** records.
- **Shared type safety**: Types defined server-side are exported to the client to keep API, DB models, and UI consistent.

---

## Where the Schema Lives

### Primary schema file
- `shared/schema.ts`

This file defines:
- Table models (e.g., `Account`, `Bucket`, `UsageRecord`, `Invoice`, …)
- Composite / join result types (e.g., `AccountWithDetails`)
- Request validation schemas (e.g., `CreateBucketRequest`, `CreateAccessKeyRequest`, …)

### Related shared models
- `shared/models/auth.ts` (auth-related shared types such as `UpsertUser`)

---

## Schema Modules (by domain)

### 1) Identity & Access Management (IAM)

**Purpose**: Represent tenants (accounts), membership, roles, and invitations.

Key tables/types:
- `Account`: tenant/org root container; most resources belong to an account.
- `AccountMember`: associates a user with an account.
- `AccountRole`: role enum/type used to enforce authorization (Owner/Admin/Member, etc.).
- `Invitation`: onboarding and membership invitation workflow.

Typical flows:
- Create an `Account`
- Add members via `AccountMember` or `Invitation`
- Use role checks in controllers/services to authorize mutations

---

### 2) Storage Metadata (MinIO / SftpGo-backed)

**Purpose**: Store configuration, ownership, and access policies for object storage resources.

Key tables/types:
- `Bucket`: bucket configuration and ownership; lifecycle-related configuration is typically stored as metadata.
- `AccessKey`: S3-compatible access key/secret key association at the account level.
- `BucketPermission`: fine-grained ACLs per user/member for a given bucket.

Object-level metadata:
- `ObjectFavorite`: user “starred”/favorite objects
- `ObjectTag`: user-defined tags for objects
- `ObjectShare`: public sharing configuration / share tokens/links for objects

> Note: Actual object bytes live in MinIO/SftpGo. The DB stores *what exists*, *who owns it*, *who can access it*, and *how it should be billed/governed*.

Related service layer:
- `server/services/minio.service.ts` (`MinioService`, `getMinioConfig`, and bucket/object helpers)
- `server/services/sftpgo.service.ts` (`SftpGoService` and SFTP user/filesystem orchestration)

---

### 3) Billing & Usage Tracking

**Purpose**: Persist metering and invoicing artifacts for tenant billing.

Key tables/types:
- `UsageRecord`: time-series resource usage captured for billing (storage size, bandwidth, API calls, etc.).
- `PricingConfig` / `PricingHistory`: pricing rules and their evolution over time.
- `Invoice` and `CustomerInvoice`: generated billing documents for specific periods/customers.
- `Order`, `VpsConfig`, `Subscription`: commerce and service lifecycle entities (VPS/backup/etc.).

Related service layer:
- `server/services/billing.service.ts` (`BillingService`)

Related scheduled jobs:
- `server/cron/usage-collector.ts`
  - `collectUsageMetrics`: collect usage per active account and persist into `UsageRecord`
  - `runMonthlyBilling`: aggregate usage and generate invoices
  - `checkOverdueInvoices`: reminder and dunning-related checks

---

### 4) System Events, Auditing, and Notifications

**Purpose**: Provide traceability and user-facing event delivery.

Key tables/types:
- `AuditLog`: centralized logging for security events, admin actions, and significant state changes.
- `Notification`: persistent user/system notifications (often backed by realtime/UI polling).

Related services:
- `server/services/audit.service.ts` (`AuditService`, `AuditSeverity`, `AuditContext`)
- `server/services/notification.service.ts` (`NotificationService`)

---

## Key Relationships (Conceptual)

| From | To | Relationship | Why it matters |
|---|---|---|---|
| `AccountMember` | `Account` | Many-to-One | User membership is scoped to a tenant. |
| `Bucket` | `Account` | Many-to-One | Buckets are tenant-owned resources. |
| `AccessKey` | `Account` | Many-to-One | Credentials are issued within a tenant boundary. |
| `BucketPermission` | `Bucket` | Many-to-One | ACLs attach to buckets for fine-grained access. |
| `UsageRecord` | `Account` | Many-to-One | Billing must be computed per tenant. |
| `Invoice` | `Order` (and/or account/customer context) | Many-to-One | Invoices correspond to purchases/periods. |
| `ObjectTag` / `ObjectFavorite` / `ObjectShare` | `Bucket` | Many-to-One | Object metadata is bucket-scoped. |

---

## Data Access Patterns

### Service-oriented data access
Business logic is primarily implemented in services under:
- `server/services/`

These services:
- Encapsulate transactional logic and invariants (e.g., “a bucket must belong to an account”)
- Coordinate side effects across systems (DB + MinIO + SftpGo)
- Provide centralized logging via `AuditService` and notifications via `NotificationService`

### Type-safe API contracts (shared)
The platform exports types and request schemas from `shared/schema.ts` so that:
- Server endpoints validate payloads using `Create...Request` Zod schemas
- Client code consumes the same types to avoid drift

Common exported categories:
- Row types: `Account`, `Bucket`, `UsageRecord`, `Invoice`, …
- Composite types: `AccountWithDetails`, `AccountWithRole`, …
- Request payload schemas: `CreateBucketRequest`, `CreateAccessKeyRequest`, `CreateUsageRecordRequest`, …

---

## Background Jobs & Maintenance

### Usage collection & monthly billing
`server/cron/usage-collector.ts` is the central automation point.

High-level lifecycle:
1. Iterate active accounts.
2. Query MinIO/SftpGo for current usage metrics (storage, objects, etc.).
3. Persist records to `UsageRecord`.
4. On billing schedule, aggregate usage and generate invoices.

Operational triggers (exported functions):
- `startCronJobs`, `stopCronJobs`
- `triggerUsageCollection`
- `triggerMonthlyBilling`

---

## Utility Scripts (DB/Storage Ops)

The repository includes scripts that are useful in QA and when reconciling state:

- `scripts/db_test.ts`: connectivity/CRUD sanity check for the database.
- `script/fix-storage.ts`: reconcile DB metadata with object storage backend state.
- `server/scripts/zero-bandwidth.ts`: reset/initialize bandwidth-related metrics (useful for QA resets).
- Additional storage scripts:
  - `script/sync-minio-buckets.ts`, `script/sync-minio-buckets-full.ts`
  - `script/check-bucket-size.ts`
  - `script/migrate-bucket.ts`

> Recommendation for QA: run reconciliation scripts against a QA snapshot only, and confirm they are read-only or fully understood before executing in shared environments.

---

## Local Development & QA Validation

### Prerequisites
1. PostgreSQL instance available
2. Environment variables set for DB connection (typically via `.env`)

### Common workflow
1. Apply schema changes (if using Drizzle Kit in this repo):
   - `npm run db:push`
2. Validate DB connectivity:
   - Run `scripts/db_test.ts` (via the repo’s standard node/ts runner approach)

### What to validate in QA
- **Multi-tenant isolation**: resources created under one `Account` are not accessible from another.
- **Audit completeness**: sensitive or administrative actions create `AuditLog` entries.
- **Usage correctness**: `UsageRecord` entries are created on schedule and match MinIO/SftpGo reporting.
- **Billing reproducibility**: invoices generated by `runMonthlyBilling` match aggregated usage and pricing rules.
- **Permission enforcement**: `BucketPermission` effectively gates read/write/share operations.

---

## Cross-References (Key Files)

- Schema & shared contracts:
  - `shared/schema.ts`
  - `shared/models/auth.ts`
- Services:
  - `server/services/audit.service.ts`
  - `server/services/billing.service.ts`
  - `server/services/notification.service.ts`
  - `server/services/minio.service.ts`
  - `server/services/sftpgo.service.ts`
- Cron / automation:
  - `server/cron/usage-collector.ts`
- Scripts:
  - `scripts/db_test.ts`
  - `script/fix-storage.ts`
  - `server/scripts/zero-bandwidth.ts`

---
