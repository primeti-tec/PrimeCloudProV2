# Error Handling (QA / Developer Guide)

This document describes how PrimeCloudProV2 handles errors end-to-end—frontend UX, backend API responses, and failures from external infrastructure (e.g., MinIO, SFTPGo). It’s intended for developers implementing new endpoints, services, or UI features and for QA validating expected behavior.

---

## Goals and Principles

PrimeCloudProV2 uses a layered strategy to ensure that:

- **Users get actionable feedback** (clear messages, non-blocking UX where possible).
- **APIs respond consistently** (JSON error payloads with meaningful HTTP status codes).
- **The server remains stable** (centralized error middleware prevents crashes).
- **Operations are auditable** (security/billing/resource failures can be recorded via audit logs).
- **Optional dependencies degrade gracefully** (features can be disabled when an integration is down).

---

## Error Flow Overview

### Frontend
1. UI triggers a query/mutation (typically via **React Query**).
2. The request is made via `apiRequest()` (centralized fetch wrapper).
3. Non-2xx HTTP responses are converted to thrown `Error`s.
4. The component/mutation `onError` handler surfaces the error (usually via a **toast**).
5. Auth failures (401/403) can trigger a re-auth flow via `isUnauthorizedError`.

### Backend
1. Routes/controllers call services and repositories.
2. Services typically wrap external calls with `try/catch`.
3. Errors either:
   - become user-friendly `Error`s (message meant for clients), or
   - are propagated to Express error middleware.
4. A global Express error handler returns JSON `{ message }` and logs server-side.
5. Critical failures can also be logged using `AuditService`.

---

## Frontend Error Handling

### Central API Utility: `apiRequest`

**File:** `client/src/lib/queryClient.ts`  
Most frontend networking should go through `apiRequest()` to ensure consistent handling of failed HTTP statuses and consistent error messages.

Key behavior:
- Executes `fetch`.
- Calls `throwIfResNotOk(res)`.
- If `res.ok` is false, attempts to parse `{ message }` from JSON and throws `Error(message)`.

```ts
// client/src/lib/queryClient.ts (conceptual)
async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(errorBody.message || "An unexpected error occurred");
  }
}

export async function apiRequest(method: string, url: string, data?: unknown) {
  const res = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: data ? JSON.stringify(data) : undefined,
  });

  await throwIfResNotOk(res);
  return res;
}
```

#### Developer rules
- **Do not use raw `fetch`** directly in pages/hooks unless you are intentionally bypassing the default behavior.
- Ensure backend error payloads include a top-level `message` string to show meaningful UI errors.

---

### React Query: surfacing errors consistently

Most user-facing failures should be displayed using the toast system.

**Toast hook:** `useToast` (client hook)  
Typical pattern:

```ts
const { toast } = useToast();

const mutation = useMutation({
  mutationFn: (payload) => apiRequest("POST", "/api/resource", payload),
  onError: (error: Error) => {
    toast({
      title: "Operation Failed",
      description: error.message,
      variant: "destructive",
    });
  },
});
```

#### UX conventions
- Prefer **“destructive”** toasts for error states.
- Use short titles (what failed) and put details in the description.
- Avoid exposing raw stack traces or internal error codes to end users.

---

### Authentication / Authorization Errors

**Utility:** `isUnauthorizedError`  
**File:** `client/src/lib/auth-utils.ts`

Expected behavior:
- Detects whether an error indicates **401 Unauthorized** or **403 Forbidden**.
- The app may redirect to login, clear session state, or trigger a re-auth flow.

#### QA checklist
- When a token/session expires, actions should fail gracefully:
  - no infinite spinners,
  - user gets redirected or prompted to sign in again,
  - no sensitive internal errors shown in the toast.

---

## Backend Error Handling

### Global Express Error Middleware

**File:** `server/index.ts`

The server defines a global error handler to:
- Normalize unexpected failures into a JSON response.
- Set an appropriate HTTP status code when provided, otherwise default to `500`.
- Log errors server-side for diagnosis.

Conceptual shape:

```ts
app.use((err, _req, res, _next) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  res.status(status).json({ message });
  log(`Error: ${message}`);
});
```

#### Developer rules
- When throwing custom errors in routes/services, attach a `status` (or `statusCode`) when you want a specific HTTP status returned.
- Always assume the global handler is the final safety net—**do not** let the process crash due to an unhandled exception.

---

### Audit Logging for Critical Failures

**Service:** `AuditService`  
**File:** `server/services/audit.service.ts`  
Used to record high-value events such as security-related failures, billing issues, and provisioning problems.

Severity levels (as used across the system):
- `INFO`
- `WARNING`
- `ERROR`
- `CRITICAL`

Example:

```ts
await auditService.log({
  action: "RESOURCE_CREATE_FAILED",
  severity: AuditSeverity.ERROR,
  details: { error: err.message, resourceId: "bucket-123" },
  userId: currentUser.id,
});
```

#### When to audit (guideline)
Audit when:
- a user action impacts **billing**, **access control**, **resource provisioning**, or **data integrity**
- the error indicates suspicious activity (repeated auth failures, permission violations)
- an external dependency failure blocks core workflows

Avoid auditing:
- noisy client-side validation errors
- transient failures in non-critical UI-only calls (unless diagnosing an incident)

---

## Service-Specific Error Handling

### MinIO (Object Storage)

**Service:** `MinioService`  
**File:** `server/services/minio.service.ts`

MinIO/S3 operations can fail with provider-specific codes (e.g., bucket already exists, access denied). The service layer should:
- catch provider errors,
- translate them into user-friendly messages,
- treat certain errors as non-fatal where appropriate (idempotency).

Pattern:

```ts
try {
  await this.client.makeBucket(bucketName);
} catch (error: any) {
  if (error.code === "BucketAlreadyOwnedByYou") {
    return; // non-fatal, idempotent create
  }
  throw new Error(`Failed to create storage container: ${error.message}`);
}
```

#### QA checklist
- Creating an already-existing bucket (owned by the account) should not break the flow.
- Permission failures should return a clear message and the correct status code (commonly 403).

---

### SFTPGo Integration

**Service:** `SftpGoService`  
**File:** `server/services/sftpgo.service.ts`

Expected behavior:
- Health/availability is checked (e.g., `checkSftpGoAvailability`).
- If the service is down, SFTP-related endpoints should return **503 Service Unavailable** (or equivalent) and frontend should degrade gracefully (disable/hide controls instead of breaking).

#### QA checklist
- Simulate SFTPGo down:
  - SFTP actions fail quickly with a clear message
  - UI does not remain in a loading state indefinitely
  - UI disables SFTP-only features where applicable

---

## Validation Errors

### Document Validation (CPF/CNPJ)

Shared logic exists to validate documents before persisting them.

**Backend file:** `server/lib/document-validation.ts`  
**Frontend file:** `client/src/lib/document-validation.ts`

Expected behavior:
- Client should validate early for better UX.
- Server must still validate (never trust client validation).

#### QA checklist
- Invalid CPF/CNPJ is rejected with a clear message.
- Formatting helpers (client) should not allow invalid values to be silently persisted.

---

### Schema Validation (Zod)

The platform uses Zod to validate request payloads (POST/PATCH). When invalid:
- API should return **400 Bad Request**
- Response should include a clear `message` and, where implemented, validation details.

#### Developer rules
- Validate at API boundaries (routes/controllers).
- Keep error responses consistent and consumable by `apiRequest()` (top-level `message` string).

---

## Error Response Contract (Recommended)

To keep client behavior consistent with `throwIfResNotOk`, backend error responses should follow:

```json
{
  "message": "Human readable error message"
}
```

Optionally, you may include details for debugging (be careful not to leak secrets):

```json
{
  "message": "Validation failed",
  "details": [
    { "path": "email", "error": "Invalid email" }
  ]
}
```

If you add `details`, ensure:
- the client won’t break if it ignores them,
- sensitive data is not included (tokens, secrets, internal stack traces).

---

## Best Practices (Developer Checklist)

### Frontend
- Use `apiRequest()` for all API calls.
- Handle errors in React Query with `onError`.
- Display errors via toasts (`variant: "destructive"`).
- Use `isUnauthorizedError` to trigger re-auth flows.

### Backend
- Throw errors with meaningful messages; set `status`/`statusCode` when appropriate.
- Rely on global error middleware as a safety net (but don’t hide known failure modes).
- Wrap external integrations in service-level `try/catch` and translate errors.
- Audit critical failures using `AuditService`.

### Infrastructure/Integrations
- Prefer **graceful degradation** for optional features (SFTP).
- Treat idempotent operations as non-fatal where safe (e.g., “already exists”).

---

## Related Files (Cross-Reference)

- Frontend API wrapper: `client/src/lib/queryClient.ts`
  - `apiRequest`, `throwIfResNotOk`
- Frontend auth error detection: `client/src/lib/auth-utils.ts`
  - `isUnauthorizedError`
- Backend server & error middleware: `server/index.ts`
- Audit logging: `server/services/audit.service.ts`
- MinIO integration: `server/services/minio.service.ts`
- SFTPGo integration: `server/services/sftpgo.service.ts`
- Document validation:
  - `server/lib/document-validation.ts`
  - `client/src/lib/document-validation.ts`

---
