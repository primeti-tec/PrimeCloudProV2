# PrimeCloud Pro V2 — API Endpoints (QA Reference)

This document describes the HTTP API exposed by PrimeCloud Pro V2. It is intended for QA engineers and developers validating integrations and UI behavior.

Most endpoints are routed under the `/api` prefix and are consumed by the web client using `apiRequest` (`client/src/lib/queryClient.ts`), which attaches authentication headers (Clerk token when available) and provides consistent error handling.

---

## Quick links (implementation references)

- Shared request/response schemas and types: `shared/schema.ts`
- Route helper utilities (URL building): `shared/routes.ts` (`buildUrl`)
- Server entry and API wiring: `server/index.ts`
- Core services:
  - MinIO / S3 operations: `server/services/minio.service.ts` (`MinioService`)
  - SFTPGo integration: `server/services/sftpgo.service.ts` (`SftpGoService`)
  - Billing & invoices: `server/services/billing.service.ts` (`BillingService`)
  - Audit logging: `server/services/audit.service.ts` (`AuditService`)
  - Notifications: `server/services/notification.service.ts` (`NotificationService`)
- SMTP route handlers: `server/routes/smtp.ts`
- Cron jobs (usage collection & monthly billing): `server/cron/usage-collector.ts`

---

## Base URL and authentication

### Base URL
All endpoints below are referenced as:
- `https://<host>/api/...`

### Authentication
Most endpoints require an authenticated session.

The client typically calls:
- `apiRequest(method, url, body?)` from `client/src/lib/queryClient.ts`

**Notes**
- If the token/session is missing or invalid, expect `401 Unauthorized`.
- Admin endpoints require elevated privileges; expect `403 Forbidden` when the user lacks permissions.

---

## Common conventions

### Content types
- Requests with bodies are typically JSON:
  - `Content-Type: application/json`
- Upload/download endpoints may return pre-signed URLs rather than directly streaming content through the app server.

### Standard HTTP status codes
- `200 OK` / `201 Created`: success
- `400 Bad Request`: invalid input (validation/constraints)
- `401 Unauthorized`: missing/invalid auth
- `403 Forbidden`: insufficient permissions
- `404 Not Found`: resource doesn’t exist or not visible to caller
- `500 Internal Server Error`: unexpected failure

---

## Authentication & Accounts

### Accounts

#### `GET /api/accounts`
List all accounts associated with the current user.

**Typical use cases**
- Populate account switcher
- Determine accessible organizations/workspaces

---

#### `POST /api/accounts`
Create a new account.

**Body (typical)**
- See `CreateAccountRequest` in `shared/schema.ts`.

---

#### `GET /api/accounts/:id`
Get detailed information about a specific account.

---

#### `PATCH /api/accounts/:id`
Update account settings (e.g., branding, name).

**Body (typical)**
- See `UpdateAccountRequest` in `shared/schema.ts`.

---

#### `DELETE /api/accounts/:id`
Deactivate or remove an account.

**QA considerations**
- Confirm downstream access is revoked (members, buckets visibility)
- Verify behavior when account still has active resources (buckets, invoices, members)

---

### Members & Invitations

#### `GET /api/accounts/:accountId/members`
List all members for an account.

---

#### `POST /api/accounts/:accountId/members`
Add a member to an account.

**Body (typical)**
- See `CreateMemberRequest` in `shared/schema.ts`.

---

#### `POST /api/invitations`
Create an invitation for a user to join an account/team.

**Body (typical)**
- See `CreateInvitationRequest` in `shared/schema.ts`.

---

#### `GET /api/invitations/:token`
Retrieve invitation details by token.

---

#### `POST /api/invitations/:token/accept`
Accept an invitation.

**QA considerations**
- Token reuse should be rejected
- Confirm member role/permissions match invitation
- Confirm accepting invitation updates membership list immediately

---

## Storage (MinIO / S3-compatible)

These endpoints are backed by MinIO and typically operate within the “active account” context.

Implementation reference: `server/services/minio.service.ts` (`MinioService`)

### Buckets

#### `GET /api/buckets`
List buckets for the active account.

---

#### `POST /api/buckets`
Create a new bucket.

**Body (typical)**
- See `CreateBucketRequest` in `shared/schema.ts`.

---

#### `GET /api/buckets/:name`
Get metadata and stats for a bucket.

**QA considerations**
- Validate authorization boundaries: bucket must belong to active account
- Confirm stats update behavior (may be cached or eventually consistent)

---

#### `DELETE /api/buckets/:name`
Delete a bucket.

**QA considerations**
- Empty bucket vs non-empty bucket behavior
- Confirm object cleanup expectations and error messages

---

#### `GET /api/buckets/:name/objects`
List objects in a bucket.

**Query parameters (typical)**
- `prefix` (optional): filter objects by key prefix

---

### Object Operations

#### `GET /api/buckets/:name/objects/download?key=:key`
Generate a temporary download URL for an object key.

**QA considerations**
- URL expiry behavior (time-limited)
- Ensure object access is denied across accounts

---

#### `POST /api/buckets/:name/objects/upload`
Request pre-signed URL(s) for uploading (commonly multi-part upload workflows).

**QA considerations**
- Confirm returned URLs work with correct HTTP method/headers
- Validate upload constraints (size, content-type if enforced)

---

#### `DELETE /api/buckets/:name/objects?key=:key`
Delete a specific object.

---

#### `POST /api/buckets/:name/objects/share`
Create a temporary public share link for an object.

**Body (typical)**
- See `CreateObjectShareRequest` in `shared/schema.ts`.

**QA considerations**
- Verify link expiration and revocation (if supported)
- Confirm link access does not require authentication

---

### Favorites & Tags

#### `GET /api/buckets/:name/favorites`
List favorited objects in a bucket.

---

#### `POST /api/buckets/:name/favorites`
Add an object to favorites.

**Body (typical)**
- See `CreateObjectFavoriteRequest` in `shared/schema.ts`.

---

#### `GET /api/buckets/:name/tags`
Get tags for an object.

**QA note**
- The object identifier is typically passed as query parameter(s) (commonly `key`), depending on server implementation.

---

#### `POST /api/buckets/:name/tags`
Apply tags to an object.

**Body (typical)**
- See `CreateObjectTagRequest` in `shared/schema.ts`.

---

## SFTP Integration (SFTPGo)

These endpoints manage SFTP credentials for an account.

Implementation reference: `server/services/sftpgo.service.ts` (`SftpGoService`)

#### `GET /api/sftp/credentials`
List SFTP credentials for the active account.

---

#### `POST /api/sftp/credentials`
Create new SFTP credentials/user.

**QA considerations**
- Password generation/rotation behavior (may return password once)
- Confirm resulting SFTP user has correct virtual folders / bucket mappings

---

#### `DELETE /api/sftp/credentials/:id`
Revoke SFTP access.

**QA considerations**
- Confirm immediate revocation (existing sessions may vary)
- Ensure deleted credentials no longer appear in listings

---

## Billing & Usage

Billing is backed by server-side metering and scheduled jobs.

Implementation references:
- `server/services/billing.service.ts` (`BillingService`)
- `server/cron/usage-collector.ts` (collect usage, generate invoices)

#### `GET /api/billing/usage`
Retrieve current-month usage summary (bandwidth, storage usage such as GB-hours).

---

#### `GET /api/billing/invoices`
List invoices for the active account.

---

#### `GET /api/billing/invoices/:id`
Get detailed invoice data.

---

#### `POST /api/billing/quota-requests`
Request a storage quota increase.

**Body (typical)**
- See `CreateQuotaRequestRequest` in `shared/schema.ts`.

**QA considerations**
- Validate request lifecycle (pending/approved/denied) if implemented
- Confirm quota enforcement changes after approval

---

## Admin endpoints

These endpoints are restricted to admin users.

#### `GET /api/admin/accounts`
System-wide account overview.

---

#### `GET /api/admin/buckets`
Global bucket monitoring across all accounts.

---

#### `GET /api/admin/audit-logs`
System-wide audit trail.

Implementation reference: `server/services/audit.service.ts`

---

#### `PATCH /api/admin/pricing`
Update global pricing configuration.

**Body (typical)**
- See `UpdatePricingConfigRequest` / `CreatePricingConfigRequest` in `shared/schema.ts`.

---

#### `POST /api/admin/collect-usage`
Manually trigger the usage collection job.

Implementation reference: `server/cron/usage-collector.ts` (`triggerUsageCollection`)

**QA considerations**
- Confirm idempotency or safe repeated triggering
- Verify results appear in usage summaries/invoices as expected

---

## System utilities

#### `GET /api/health`
System health check (API + dependencies like DB/MinIO/SFTPGo).

**QA considerations**
- Confirm degraded dependencies are reflected clearly (partial failures)

---

#### `POST /api/smtp/test`
Test SMTP configuration (commonly used for notifications/email).

Implementation reference: `server/routes/smtp.ts` (`handleTestSMTP`)

---

#### `GET /api/notifications`
Retrieve in-app notifications for the authenticated user.

Implementation reference: `server/services/notification.service.ts`

---

## Developer / QA usage examples

### Using the internal `apiRequest` helper (client)

```ts
import { apiRequest } from "@/lib/queryClient";

// Create a bucket
export async function createBucket(name: string) {
  const res = await apiRequest("POST", "/api/buckets", {
    name,
    region: "us-east-1",
  });
  return res.json();
}

// Fetch current usage
export async function getUsage() {
  const res = await apiRequest("GET", "/api/billing/usage");
  return res.json();
}
```

### cURL smoke tests (manual QA)

```bash
# Health check (may not require auth depending on deployment)
curl -sS https://<host>/api/health

# List buckets (requires auth token; header name may vary by auth middleware)
curl -sS https://<host>/api/buckets \
  -H "Authorization: Bearer <token>"
```

---

## Schema and typing references

For request/response payload shapes, use the shared schema types in `shared/schema.ts`, including (non-exhaustive):
- `CreateAccountRequest`, `UpdateAccountRequest`
- `CreateMemberRequest`
- `CreateBucketRequest`
- `CreateObjectFavoriteRequest`, `CreateObjectTagRequest`, `CreateObjectShareRequest`
- `CreateQuotaRequestRequest`
- `Invoice`, `UsageRecord`, `Account`, `Bucket`, `AccessKey`, etc.

These types are used across server and client to keep API contracts consistent.
