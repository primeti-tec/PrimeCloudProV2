# Authentication (QA)

This document explains how authentication works in **PrimeCloud Pro V2**, how to test it end-to-end, and where to look in the codebase when investigating issues. It covers both **local username/password** flows and **Replit SSO header-based** authentication.

---

## Scope and goals

Authentication in this repository provides:

- **Session-based authentication** on the server (Express sessions).
- **User persistence** via a storage layer (`AuthStorage`).
- **Provider integration** for Replit environments (SSO via headers).
- **Client-side user state** via a React hook (`useAuth`) and protected routes.
- **Role-based access control (RBAC)** at the account level (owner/admin/member).

---

## High-level architecture

### 1) Storage layer (database persistence)

- **File**: `server/replit_integrations/auth/storage.ts`
- **Key types**: `UpsertUser` from `shared/models/auth.ts`
- **Key class**: `AuthStorage` implements `IAuthStorage`

Responsibilities:

- Create user records.
- Fetch users by id/username.
- Update/“upsert” user details when logging in via an external identity (Replit).

### 2) Server layer (sessions + auth routes)

- **File**: `server/replit_integrations/auth/replitAuth.ts`
  - `setupAuth(app)` — initializes session middleware and provider-specific behavior.
  - `getSession(req)` — extracts identity (notably in Replit).
  - `upsertUser(...)` — ensures user exists in DB for provider-based logins.
  - `updateUserSession(...)` — synchronizes user/session state.

- **File**: `server/replit_integrations/auth/routes.ts`
  - `registerAuthRoutes(app)` — registers auth endpoints.

Responsibilities:

- Validate credentials (local flow).
- Create/destroy sessions.
- Return current authenticated user.
- Detect Replit headers and auto-authenticate (SSO behavior).

### 3) Client layer (React context + guarded routing)

- **Hook**: `useAuth` (client-side; typically under `client/src/hooks/use-auth`)
- **HTTP helper**: `apiRequest` in `client/src/lib/queryClient.ts`

Responsibilities:

- Load the current user (`GET /api/user`).
- Provide `user` and `isLoading` for pages/components.
- Redirect unauthenticated users away from protected routes.

---

## Key server endpoints

Authentication routes are registered via `registerAuthRoutes`.

Common endpoints you should expect to exist and be used by the client:

| Method | Path | Purpose |
|------:|------|---------|
| POST | `/api/register` | Create a new local account/user |
| POST | `/api/login` | Validate credentials and start a session |
| POST | `/api/logout` | Destroy the current session |
| GET  | `/api/user` | Return the currently authenticated user (from session) |

Where to look:
- Route definitions: `server/replit_integrations/auth/routes.ts`
- Core auth/session logic: `server/replit_integrations/auth/replitAuth.ts`

---

## Authentication flows

### Flow A — Local (username/password)

Typical local flow:

1. Client submits credentials to `POST /api/login`.
2. Server validates credentials and creates an Express session.
3. Client calls `GET /api/user` to retrieve the session user (or uses the login response).
4. Subsequent requests include the session cookie automatically.

QA checks:

- Login sets a session cookie.
- `GET /api/user` returns a user while logged in.
- `POST /api/logout` clears the session; `GET /api/user` becomes unauthenticated.

### Flow B — Replit SSO (header-based identity)

When running behind Replit’s auth proxy, identity is derived from headers:

- `X-Replit-User-Id`
- `X-Replit-User-Name`

Typical flow:

1. Request arrives with Replit identity headers.
2. Server uses `getSession(req)` to detect Replit identity.
3. Server calls `upsertUser` to ensure the user is mirrored in the database.
4. Server synchronizes session state (so the client behaves like a normal session-authenticated user).

QA checks:

- Requests containing the Replit headers automatically become authenticated.
- A user record is created/updated in the DB on first login via Replit.

Where to look:
- Header parsing/session extraction: `server/replit_integrations/auth/replitAuth.ts` (`getSession`)
- DB sync logic: `upsertUser`
- Storage operations: `AuthStorage` in `server/replit_integrations/auth/storage.ts`

---

## Client-side usage

### `useAuth` hook

The app’s pages use `useAuth` to determine whether a user is logged in.

Example:

```tsx
import { useAuth } from "@/hooks/use-auth";

export function UserProfile() {
  const { user, isLoading } = useAuth();

  if (isLoading) return <div>Loading...</div>;
  if (!user) return <div>Please sign in</div>;

  return <div>Welcome, {user.username}</div>;
}
```

### Protected routes pattern

A common pattern is to redirect to `/auth` if `user` is missing:

```tsx
import { Route, Redirect } from "wouter";
import { useAuth } from "@/hooks/use-auth";

export function ProtectedRoute({ component: Component, ...rest }: any) {
  const { user, isLoading } = useAuth();

  if (isLoading) return null;

  return (
    <Route {...rest}>
      {user ? <Component /> : <Redirect to="/auth" />}
    </Route>
  );
}
```

### API requests and cookies/sessions

Client requests should use the shared helper:

- **File**: `client/src/lib/queryClient.ts`
- **Function**: `apiRequest(...)`

When debugging “logged in but API says unauthenticated” issues, verify:

- Requests include cookies (`credentials: "include"` in fetch-based clients, if applicable).
- Your dev proxy / domain configuration isn’t stripping cookies.
- `GET /api/user` returns expected data after login.

---

## RBAC: roles and permissions

The project models access at the **account** level (organizations/tenants) with membership roles.

Primary schema types:

- `Account` — account/tenant entity
- `AccountMember` — user-to-account link
- `AccountRole` — enum: `owner`, `admin`, `member`

Role summary (as implemented conceptually):

| Role | Typical capabilities |
|------|----------------------|
| `owner` | Full access: settings, billing, member management |
| `admin` | Manage storage resources; limited billing access |
| `member` | Standard access to assigned resources |

Where to look:
- Schema types: `shared/schema.ts` (`Account`, `AccountMember`, `AccountRole`)
- Any per-route authorization checks: search in `server/routes/**` and services for role checks.

---

## QA checklist (manual)

### 1) Register + login + current user

1. `POST /api/register` with a new username/password.
2. `POST /api/login` with the same credentials.
3. Confirm:
   - Response is success.
   - A session cookie is set.
4. `GET /api/user` returns the authenticated user.

### 2) Logout

1. While logged in: `POST /api/logout`
2. `GET /api/user` should now indicate unauthenticated (commonly `401` or `null` user depending on implementation).

### 3) Session persistence

1. Login.
2. Refresh the browser / restart the client.
3. `GET /api/user` should still return the user until the session expires or is revoked.

### 4) Replit header-based authentication (if applicable)

Using a tool like curl, simulate Replit identity:

```bash
curl -i \
  -H "X-Replit-User-Id: 12345" \
  -H "X-Replit-User-Name: qa-user" \
  http://localhost:PORT/api/user
```

Confirm:

- Response returns a user.
- A corresponding user record exists/updates in the database (via `upsertUser`/`AuthStorage`).

> Note: Exact behavior may depend on environment flags and whether Replit auth is enabled in the running configuration.

---

## Common issues and where to debug

### “`GET /api/user` returns 401 even after login”
Check:

- Session middleware is configured (see `setupAuth`).
- Cookies are being sent by the browser (client fetch config / same-site settings).
- You’re not mixing domains/ports in a way that drops cookies.

Code pointers:

- `server/replit_integrations/auth/replitAuth.ts` (`setupAuth`, session configuration)
- `client/src/lib/queryClient.ts` (`apiRequest`)

### “Replit user not recognized”
Check:

- Requests actually include `X-Replit-User-Id` and `X-Replit-User-Name`.
- `getSession` logic is being reached.
- DB upsert logic works and `AuthStorage` is correctly configured.

Code pointers:

- `server/replit_integrations/auth/replitAuth.ts` (`getSession`, `upsertUser`)
- `server/replit_integrations/auth/storage.ts` (`AuthStorage`)

### “User exists but lacks permissions”
Check:

- Membership records (`AccountMember`) and assigned `AccountRole`.
- Authorization checks in the affected endpoints.

Code pointers:

- `shared/schema.ts` (`AccountMember`, `AccountRole`)
- Server route handlers/services related to the denied action.

---

## Related files (cross-reference)

- **Server**
  - `server/replit_integrations/auth/replitAuth.ts` — session/provider logic
  - `server/replit_integrations/auth/routes.ts` — auth endpoints registration
  - `server/replit_integrations/auth/storage.ts` — DB storage implementation (`AuthStorage`)
  - `server/index.ts` — server startup (where auth setup is typically wired)

- **Shared**
  - `shared/models/auth.ts` — `UpsertUser` type
  - `shared/schema.ts` — `Account`, `AccountMember`, `AccountRole` and other core models

- **Client**
  - `client/src/lib/queryClient.ts` — `apiRequest` helper used for authenticated calls
  - `client/src/hooks/use-auth` (location may vary) — React auth state hook

---
