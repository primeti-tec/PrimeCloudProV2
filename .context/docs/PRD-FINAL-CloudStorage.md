# CloudStorage Pro — Final Product Requirements Document (PRD)

CloudStorage Pro is a white-label, S3-compatible cloud storage management platform. It connects provider-managed storage infrastructure (MinIO AIStor) to end users through an intuitive portal for bucket administration, credential management (S3 + SFTP), automated backups onboarding, and usage-based billing.

This PRD is written to be actionable for developers and aligns product requirements with the repository’s current implementation patterns (services, shared schema/types, routes, and UI modules).

---

## 1. Executive Summary

CloudStorage Pro enables infrastructure providers to sell Storage-as-a-Service (SaaS) with:

- **Automated tenant provisioning** (per account / organization)
- **Multi-tenant isolation** (no cross-account data access)
- **S3 + SFTP/FTPS access** via MinIO + SFTPGo
- **Usage collection and monthly invoicing**
- **Audit logging** for compliance and security investigations
- **White-label branding** and admin operations

---

## 2. Goals & Non-Goals

### 2.1 Goals
- Provide a **self-service** portal for storage customers (accounts) to:
  - Create and manage buckets
  - Manage S3 access keys with secure handling (“one-time view”)
  - Manage SFTP credentials
  - View usage metrics (storage, bandwidth, requests)
  - View invoices and billing status (where authorized)
- Provide a **provider admin panel** to:
  - Approve/reject registrations
  - Manage global pricing/quotas
  - Monitor operational status and usage
  - Investigate actions via audit logs

### 2.2 Non-Goals (current scope)
- Cross-region replication management (planned Phase 3)
- Enterprise SSO/SAML (planned Phase 3)
- Fully automated payment processing (planned Phase 2; integrations like Stripe/Mercado Pago)

---

## 3. Personas, User Tiers & Permissions

The platform enforces a strict hierarchy.

### 3.1 Tier 1 — Super Admin (Provider)
**Surface:** Admin panel  
**Typical needs:**
- Approve/reject account registrations
- Adjust pricing configuration
- Monitor infrastructure health
- Control system-wide branding
- Review audit logs, billing summaries, MRR/churn metrics (as product evolves)

### 3.2 Tier 2 — Account Owner (Customer Organization)
**Surface:** Customer portal  
**Typical needs:**
- Full access to billing & team management
- Full technical control over storage resources
- Invite/manage members

### 3.3 Tier 3 — Account Members
Roles (as described in requirements):

- **Admin:** Full technical access to storage (buckets, keys, SFTP), but **no billing** and **no team management**
- **Developer:** Read-only access to storage configuration & keys (no destructive operations)

> Implementation note (repository alignment): roles are modeled as `AccountRole` and account/member constructs live in the shared schema. Enforce role checks at API route handlers and mirror in UI affordances.

---

## 4. System Architecture (Product View + Repo Mapping)

### 4.1 High-Level Components
- **Frontend:** Client portal + admin views
- **Backend API:** Multi-tenant business logic, storage orchestration, billing, audit
- **Storage:** MinIO (S3 protocol)
- **SFTP/FTPS:** SFTPGo, mapping buckets as virtual folders
- **Background Jobs/Cron:** Usage collection, invoice generation, reminders
- **Database:** Accounts, buckets, keys, invoices, usage records, audit logs

### 4.2 Repository Mapping (Implementation Anchors)
While the PRD describes Next/Nest conceptually, the repository implements equivalent responsibilities with the following modules:

#### Backend (services & cron)
- **MinIO orchestration:** `server/services/minio.service.ts` (`MinioService`, `getMinioConfig`)
- **SFTP provisioning:** `server/services/sftpgo.service.ts` (`SftpGoService`)
- **Billing logic:** `server/services/billing.service.ts` (`BillingService`)
- **Audit logging:** `server/services/audit.service.ts` (`AuditService`)
- **Usage + billing cron:** `server/cron/usage-collector.ts`
  - `collectUsageMetrics`
  - `runMonthlyBilling`
  - `checkOverdueInvoices`
  - `startCronJobs`, `stopCronJobs`, manual triggers

#### Shared contracts
- **Domain models and request DTOs:** `shared/schema.ts`
  - Types: `Account`, `Bucket`, `AccessKey`, `Invoice`, `UsageRecord`, `QuotaRequest`, `SftpCredential`, `AuditLog`, etc.
  - Request payloads: `CreateBucketRequest`, `CreateAccessKeyRequest`, `CreateUsageRecordRequest`, etc.
- **Route helpers:** `shared/routes.ts` (`buildUrl`)

#### Frontend (hooks & pages)
- **Buckets, objects, sharing/tagging:** `client/src/hooks/use-buckets.ts` (types like `BucketObject`, `ListObjectsResponse`, etc.)
- **Admin bucket management:** `client/src/hooks/use-admin-buckets.ts`
- **Audit log UI data layer:** `client/src/hooks/use-audit-logs.ts`
- **Billing UI data layer:** `client/src/hooks/use-billing.ts`
- **HTTP client wrapper:** `client/src/lib/queryClient.ts` (`apiRequest`)

---

## 5. Key Functional Modules & Requirements

### 5.1 Automated Onboarding

#### Requirements
1. **Validation**
   - CPF/CNPJ validation (Brazilian tax IDs)
   - Corporate email validation
2. **Approval Workflow**
   - Registration enters a **pending** state
   - Super Admin approves or rejects
3. **Provisioning**
   - On approval, system provisions tenant resources in MinIO
   - Generates initial credentials and baseline bucket configuration (as defined)

#### Implementation references
- Document validation utilities exist on both sides:
  - `server/lib/document-validation.ts` (`isValidCPF`, `isValidCNPJ`, `validateDocument`)
  - `client/src/lib/document-validation.ts` (validation + formatting)
- Tenant provisioning should be orchestrated via `MinioService` and audited via `AuditService`.

#### Acceptance criteria
- A pending account cannot create buckets/keys until approved.
- Approval triggers:
  - Tenant baseline (policy/quota scaffolding as applicable)
  - Audit record: “ACCOUNT_APPROVED” (or equivalent)

---

### 5.2 Storage & Bucket Management (S3)

#### Requirements
- Bucket lifecycle:
  - Create/Delete buckets
  - Toggle versioning
  - Configure lifecycle policies (e.g., delete objects after N days)
- Access keys:
  - Generate S3 access/secret keys
  - Support “one-time view” secret display (never retrievable again)
  - Key rotation support (create new, revoke old)
- Usage metrics:
  - Real-time-ish charts for storage and bandwidth
  - Historical trend views for billing transparency

#### Implementation references
- MinIO operations are encapsulated in `server/services/minio.service.ts` (`MinioService`)
  - Configuration types: `MinioConfig`, `StorageQuota`, `LifecycleRule`, `UsageMetrics`, etc.
- Client bucket/object operations are surfaced via `client/src/hooks/use-buckets.ts`
- Shared domain types: `Bucket`, `AccessKey`, `LifecycleRule` in `shared/schema.ts`

#### Acceptance criteria
- Bucket creation is scoped to the account’s tenant context.
- Delete bucket is blocked if non-empty unless explicitly designed otherwise (define behavior).
- Access keys:
  - Secret is returned only once at creation time.
  - Subsequent fetches return metadata only (id, name, createdAt, lastUsed, status).

---

### 5.3 Backup Integrations

#### Requirements
- Provide guided integrations for third-party backup tools:
  - Imperius Backup (explicitly referenced)
  - Veeam
  - Acronis
- Connection tester:
  - Backend utility validates endpoint + credentials against MinIO
- Downloadable configuration templates:
  - `.xml` and/or `.json` per vendor

#### Implementation references
- Script(s) exist for connectivity and MinIO checks:
  - `scripts/test-minio.ts`
  - `scripts/check_imperius.ts`
- Product implementation should standardize this as an API endpoint + UI workflow rather than only scripts.

#### Acceptance criteria
- User can run a connection test using generated credentials; UI shows actionable error reasons (DNS/SSL/auth/bucket not found).
- User can download a vendor config template that includes:
  - Endpoint
  - Access key
  - Secret key (only if created in-session)
  - Region (if applicable)
  - Bucket name / path conventions

---

### 5.4 Multi-Protocol Access (SFTP/FTPS)

#### Requirements
- SFTPGo integration:
  - Map S3 buckets as virtual folders
  - Separate credentials for SFTP (not reuse S3 secret)
  - Support legacy clients (WinSCP, FileZilla) and automation

#### Implementation references
- `server/services/sftpgo.service.ts`
  - `SftpGoService`
  - `generateSecurePassword`
  - config + availability checks: `getSftpGoConfig`, `checkSftpGoAvailability`
- Shared type: `SftpCredential` in `shared/schema.ts`

#### Acceptance criteria
- Creating an SFTP credential results in a SFTPGo user:
  - Bound to the correct account/tenant
  - With scoped virtual folder mapping to allowed buckets
- Password is stored hashed (bcrypt) and never returned after creation (one-time view).

---

## 6. Billing & Usage Tracking (Pay-as-you-go)

### 6.1 Metrics Collected
Collected **hourly**:
- Storage bytes per bucket
- Bandwidth ingress/egress
- Request counts (GET/PUT/POST/DELETE)

### 6.2 Default Pricing Model
| Resource | Unit | Default Price |
|---|---:|---:|
| Storage | per GB | R$ 0,15 |
| Egress Bandwidth | per GB | R$ 0,40 |
| Requests | per 10k | R$ 0,10 |

> Pricing should be configurable globally (provider) and ideally versioned for auditability.

### 6.3 Implementation references
- `server/cron/usage-collector.ts`
  - `collectUsageMetrics` — periodic ingestion
  - `runMonthlyBilling` — invoice generation for previous month
  - `checkOverdueInvoices` — reminders/flags
  - `triggerUsageCollection`, `triggerMonthlyBilling` — manual/admin triggers
- `server/services/billing.service.ts` (`BillingService`)
  - Types: `PricingConfig`, `UsageSummary`, `InvoiceData`
- Shared: `UsageRecord`, `Invoice`, `PricingConfig`, `PricingHistory` in `shared/schema.ts`
- Client: `client/src/hooks/use-billing.ts`

### 6.4 Acceptance criteria
- Usage records are written per account with timestamps; invoices aggregate the previous month.
- Invoice calculation is reproducible:
  - Same inputs (usage + pricing version) → same total.
- Billing visibility respects roles:
  - Account Owner sees invoices
  - Storage Admin does not

---

## 7. Security & Compliance

### 7.1 Core Requirements
- **LGPD alignment / Brazilian-hosted data** (deployment and operational requirement)
- **Encryption**
  - Secrets encrypted at rest (AES-256 stated)
  - SFTP passwords hashed with bcrypt
- **Tenant isolation**
  - Separate tenants per account in MinIO
- **Audit logs**
  - Track actions like login attempts, key rotations, bucket deletions, approvals, billing events

### 7.2 Implementation references
- `server/services/audit.service.ts` (`AuditService`)
  - Key constructs: `AuditSeverity`, `AuditContext`, `AuditDetails`
- Shared model: `AuditLog` in `shared/schema.ts`
- Client hook: `client/src/hooks/use-audit-logs.ts`

### 7.3 Acceptance criteria
- Every privileged operation produces an audit event with:
  - actor (user/session)
  - account scope
  - action type
  - severity
  - relevant metadata (bucket name, key id, invoice id)
- Secrets are never logged in plaintext.

---

## 8. Deployment & Operations

### 8.1 Containerized Deployment
The system is intended to run via Docker Compose with:

- Backend API container
- Frontend container
- SFTPGo container
- NGINX reverse proxy (TLS termination)
- Datastores (Postgres/Redis)

(Exact composition may differ per environment.)

### 8.2 Operational jobs
- Cron job(s) must be started in server runtime:
  - `startCronJobs` / `stopCronJobs` in `server/cron/usage-collector.ts`
- Provide manual triggers for admin debugging:
  - `triggerUsageCollection`
  - `triggerMonthlyBilling`

---

## 9. Data Model Overview (Developer-Facing)

Canonical types live in `shared/schema.ts`. Key entities relevant to Cloud Storage:

- **Account / AccountMember / AccountRole**
- **Bucket**
- **AccessKey**
- **SftpCredential**
- **UsageRecord**
- **Invoice**
- **AuditLog**
- Optional/object-level features:
  - `ObjectFavorite`, `ObjectTag`, `ObjectShare`
  - `BucketPermission`

Recommended invariants:
- `Bucket.accountId` must exist and be enforced server-side.
- `AccessKey` should store secret encrypted (or not stored at all, depending on MinIO behavior) and only return plaintext secret at creation.
- `UsageRecord` should be append-only (no edits), enabling auditable billing.

---

## 10. API & UI Conventions (Repo Patterns)

### 10.1 HTTP client usage
Frontend requests should go through `apiRequest`:
- File: `client/src/lib/queryClient.ts`
- Centralizes auth token logic and error handling (`throwIfResNotOk`)

### 10.2 Data fetching patterns
- Use TanStack Query hooks (`client/src/hooks/...`) to:
  - Fetch lists (buckets, objects, invoices, audit logs)
  - Perform mutations (create bucket, add key, delete bucket, etc.)
  - Invalidate/refetch on mutation success

### 10.3 URL construction
- Shared helper: `shared/routes.ts` (`buildUrl`) to avoid inconsistent endpoints.

---

## 11. Roadmap

### Phase 1 (MVP — Current)
- S3 & SFTP access
- Manual admin approval
- Basic usage charts
- Simple invoice generation

### Phase 2 (Growth)
- Stripe/Mercado Pago integrations
- Public file sharing (signed URLs)
- Object tagging and metadata search
- Custom domain support

### Phase 3 (Enterprise)
- SSO/SAML integration
- Advanced analytics (cost prediction)
- Cross-region replication management

---

## 12. Developer Checklist (Practical)

Use this checklist when implementing or validating features against this PRD:

- **Onboarding**
  - [ ] CPF/CNPJ validation enforced server-side
  - [ ] Pending approval blocks resource creation
  - [ ] Approval triggers MinIO provisioning + audit event

- **Buckets & Keys**
  - [ ] Bucket operations are account-scoped and role-guarded
  - [ ] Access key secrets are one-time view only
  - [ ] Bucket lifecycle/versioning implemented and reflected in UI

- **SFTPGo**
  - [ ] SFTP credential creates/updates SFTPGo user
  - [ ] Virtual folder maps only allowed buckets
  - [ ] Password stored securely; one-time view only

- **Billing**
  - [ ] Usage cron runs hourly and is observable
  - [ ] Monthly billing job generates invoices deterministically
  - [ ] Billing access restricted by role

- **Audit & Security**
  - [ ] Audit logs cover all privileged actions
  - [ ] No secrets in logs
  - [ ] Tenant isolation verified in MinIO policy design

---

## 13. Related Repository Files (Cross-Reference)

- Storage (S3/MinIO): `server/services/minio.service.ts`
- SFTP: `server/services/sftpgo.service.ts`
- Billing: `server/services/billing.service.ts`
- Audit: `server/services/audit.service.ts`
- Usage cron: `server/cron/usage-collector.ts`
- Shared schema/contracts: `shared/schema.ts`
- Route helper: `shared/routes.ts`
- Frontend buckets hook: `client/src/hooks/use-buckets.ts`
- Frontend billing hook: `client/src/hooks/use-billing.ts`
- Frontend audit logs hook: `client/src/hooks/use-audit-logs.ts`
- Frontend HTTP wrapper: `client/src/lib/queryClient.ts`
- Scripts/ops (diagnostics/migration):
  - `scripts/test-minio.ts`
  - `script/sync-minio-buckets.ts`, `script/sync-minio-buckets-full.ts`
  - `script/migrate-bucket.ts`, `script/fix-storage.ts`, `script/check-bucket-size.ts`

---
