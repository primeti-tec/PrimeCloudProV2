# Glossary

This glossary defines key terms, entities, acronyms, and domain rules used across **PrimeCloudProV2**—a multi-tenant cloud infrastructure management platform providing **S3-compatible object storage**, **VPS orchestration**, and **team collaboration**.

Use this document to align naming across the **server** (`server/`), **client** (`client/src/`), and shared types (`shared/`).

---

## Core Domain Concepts

### Account (Tenant)
The top-level **tenant container** for resources, billing, and members.

- Owns: buckets, access keys, members, invoices, usage records, branding settings.
- Primary shared types:
  - `Account` (base model) — `shared/schema.ts`
  - `AccountWithDetails` (enriched model) — `shared/schema.ts`
  - `AccountWithRole` (account + caller’s role) — `shared/schema.ts`
- Role/permission model: `AccountRole` — `shared/schema.ts`

**Related code**
- Types and request schemas: `shared/schema.ts`
- UI and membership management: `client/src/pages/Team.tsx` (and hooks under `client/src/hooks/`)

---

### Bucket (S3 Bucket)
An **S3-compatible logical container** for storing objects (files).

- Important invariant: bucket names are **globally unique** (not just per account).
- Primary shared types:
  - `Bucket` — `shared/schema.ts`
  - `BucketPermission` — `shared/schema.ts`
- Service layer:
  - `MinioService` — `server/services/minio.service.ts`

**Related code**
- Bucket operations and metrics: `server/services/minio.service.ts`
- Client bucket browsing/types: `client/src/hooks/use-buckets.ts` (`BucketObject`, list/tag/share responses)

---

### Object (S3 Object)
A file (or pseudo-folder prefix) stored inside a bucket.

- Client representation: `BucketObject` — `client/src/hooks/use-buckets.ts`
- Often includes: key/path, ETag, size, last modified timestamp.

**Associated concepts**
- **Object Favorite**: user-specific bookmark for frequently accessed objects.
- **Object Tag**: key/value metadata tags attached to an object.
- **Object Share**: share link/record enabling controlled access to an object.

**Related code**
- Favorites/tags/shares types and API responses: `client/src/hooks/use-buckets.ts`
- Shared types: `ObjectFavorite`, `ObjectTag`, `ObjectShare` — `shared/schema.ts`

---

### Access Key (S3 Credentials)
A credential pair used to authenticate programmatic access to the S3 layer.

- Consists of an Access Key ID and Secret Access Key.
- Shared types:
  - `AccessKey` — `shared/schema.ts`
  - `CreateAccessKeyRequest` — `shared/schema.ts`

**Security note**
Access key lifecycle events should be auditable (see **Audit Log**).

---

### VPS (Virtual Private Server)
Managed compute instances with specific CPU/RAM/storage configurations.

- Shared types:
  - `VpsConfig` — `shared/schema.ts`
  - `CreateVpsOrderRequest` — `shared/schema.ts`
- Ordering/fulfillment is represented via orders (see **Order**).

---

### Order
Represents a purchase/provisioning workflow for a resource (often VPS or other products).

- Shared types:
  - `Order` — `shared/schema.ts`
  - `OrderWithDetails` — `shared/schema.ts` (enriched order + product/billing context)

**Associated concept**
- **Order Status**: lifecycle state (e.g., pending/active/suspended/cancelled). If you need exact values, check the relevant enum/constant definitions in `shared/schema.ts`.

---

### Quota
A limit (soft or hard) applied to storage and/or compute usage.

- Primary shared types:
  - `QuotaRequest` — `shared/schema.ts`
  - `CreateQuotaRequestRequest` — `shared/schema.ts`
- Enforcement behavior (high-level):
  - **Hard quotas** can block uploads or actions when limits are reached.

**Typical errors**
- `403 Forbidden` or `507 Insufficient Storage` when attempting uploads beyond a hard limit.

---

### Billing / Invoice
Tracks charges and payment state for an account based on usage and/or subscriptions.

- Shared types:
  - `Invoice`, `UsageRecord` — `shared/schema.ts`
  - `Customer`, `CustomerInvoice` — `shared/schema.ts`
- Service layer:
  - `BillingService` — `server/services/billing.service.ts`
- Scheduled jobs:
  - `runMonthlyBilling` and invoice reminders: `server/cron/usage-collector.ts`

---

### Usage Collector (Cron)
Background job(s) that periodically aggregate usage for billing and enforcement.

- Primary responsibilities:
  - Collect storage/bandwidth metrics for active accounts
  - Generate monthly invoices
  - Check overdue invoices and trigger reminders/suspensions
- Implementation:
  - `collectUsageMetrics`, `checkOverdueInvoices`, `runMonthlyBilling` — `server/cron/usage-collector.ts`
  - job control: `startCronJobs`, `stopCronJobs`, `triggerUsageCollection`, `triggerMonthlyBilling`

---

### Audit Log
A historical record of administrative and security-sensitive actions.

- Shared type:
  - `AuditLog` — `shared/schema.ts`
- Service layer:
  - `AuditService`, `AuditSeverity`, `AuditDetails` — `server/services/audit.service.ts`

**Invariant**
Security-relevant actions (e.g., access key creation, bucket deletions) must be recorded and standard users must not be able to delete audit history.

---

### Notifications
System alerts for billing, security, and operational events.

- Shared type:
  - `Notification` — `shared/schema.ts`
- Service layer:
  - `NotificationService` — `server/services/notification.service.ts`

---

### Branding
Account-level UI customization and domain-related settings, such as:

- Logo / colors
- Custom domains
- UI theme configuration for tenant-specific experience

**Related code**
- Provider:
  - `BrandingProvider` — `client/src/components/branding-provider.tsx`
- Settings UI:
  - `client/src/components/settings/AppBranding.tsx`

---

## Infrastructure / Integration Terms

### MinIO
S3-compatible object storage backend used by the platform.

- Integration/service wrapper:
  - `MinioService` — `server/services/minio.service.ts`
- Common outputs:
  - `BucketInfo`, `UsageMetrics`, `StorageQuota`, `LifecycleRule` — `server/services/minio.service.ts`

---

### SftpGo
Integrated service providing SFTP/SCP access into storage backends.

- Integration/service wrapper:
  - `SftpGoService` — `server/services/sftpgo.service.ts`
- Data structures:
  - `SftpGoConfig`, `SftpGoUser`, `SftpGoFilesystem`, `SftpGoVirtualFolder` — `server/services/sftpgo.service.ts`

---

### SMTP
Email delivery mechanism used for notifications (e.g., invoices, system alerts).

- Routes/handlers:
  - `handleConfigureSMTP`, `handleTestSMTP` — `server/routes/smtp.ts`

---

### Zero Bandwidth Policy
A configuration/enforcement state where account data transfer is restricted—typically due to non-payment or policy enforcement.

**Related code**
- Operational script/job:
  - `server/scripts/zero-bandwidth.ts`

---

### Imperius
Internal codename/reference to an orchestration layer managing underlying infrastructure. Treat as a platform-internal term; the implementation details may evolve.

---

## Roles / Personas

### Account Owner
Highest-privilege user within an account.

- Typically the only role allowed to:
  - Delete the account
  - Change subscription tier / manage billing at the highest level (depending on policy)
- See `AccountRole` in `shared/schema.ts`.

### Technical Administrator
Manages resources (buckets, SFTP credentials, VPS health) without necessarily having billing authority.

### Team Member
Day-to-day operator: uploads files, manages objects, checks statuses.

### System Administrator (Root Admin)
Platform operator: manages global resources, approves quota requests, maintains pricing/product catalog.

---

## Acronyms & Abbreviations

- **API** — Application Programming Interface (communication layer between React client and Express server)
- **S3** — Simple Storage Service protocol (object storage operations)
- **SFTP** — Secure File Transfer Protocol
- **SMTP** — Simple Mail Transfer Protocol
- **VPS** — Virtual Private Server
- **CPF** — *Cadastro de Pessoas Físicas* (Brazilian individual tax ID)
- **CNPJ** — *Cadastro Nacional da Pessoa Jurídica* (Brazilian business tax ID)

**Related code (document validation)**
- Server-side: `server/lib/document-validation.ts` (`isValidCPF`, `isValidCNPJ`, `validateDocument`)
- Client-side formatting/validation: `client/src/lib/document-validation.ts`

---

## Domain Rules & Invariants (Developer-Facing)

### Bucket name uniqueness
Bucket names must be globally unique across the entire provider.

**Impact**
- Bucket creation must check global uniqueness, not only within an `Account`.

### Billing cycle and invoice generation
- Usage is collected periodically.
- Monthly billing generates invoices for the previous period.

**Related code**
- `server/cron/usage-collector.ts`

### Overdue handling
Unpaid invoices past the grace period may trigger:
- Automated reminders
- Suspension or enforcement actions (including bandwidth restrictions)

**Related code**
- `checkOverdueInvoices` — `server/cron/usage-collector.ts`
- Zero bandwidth enforcement — `server/scripts/zero-bandwidth.ts`

### Audit persistence
Audit logs for security-relevant actions must be retained and not be user-deletable.

**Related code**
- `AuditService` — `server/services/audit.service.ts`
- `AuditLog` — `shared/schema.ts`

### Quota enforcement
Hard quotas must prevent actions that exceed limits (uploads, provisioning), returning appropriate HTTP errors.

---

## Where to Find the Source of Truth

- **Shared domain models and request DTOs**: `shared/schema.ts`
- **Server services (billing, audit, storage integrations)**: `server/services/*`
- **Scheduled jobs (usage collection/billing)**: `server/cron/usage-collector.ts`
- **Client hooks and API types**: `client/src/hooks/*`
- **Branding & UI concepts**: `client/src/components/*`

---

## Related Documentation

- [Project Overview](project-overview.md)
