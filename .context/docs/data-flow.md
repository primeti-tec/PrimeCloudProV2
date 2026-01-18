---
status: filled
generated: 2026-01-18
---

# Data Flow & Integrations

Explain how data enters, moves through, and exits the system, including interactions with external services.

## High-Level Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   React Client  │────▶│  Express Server │────▶│   PostgreSQL    │
│  (Vite + React) │◀────│  (API + Auth)   │◀────│   (Drizzle)     │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                               │
                               ▼
                        ┌─────────────────┐
                        │  Email Service  │
                        │   (SMTP/API)    │
                        └─────────────────┘
```

## Request Flow

### Client → Server → Database
1. **React Component** triggers action (form submit, button click)
2. **Custom Hook** (e.g., `useCreateAccount`) calls `apiRequest()`
3. **apiRequest** makes fetch to Express API
4. **Express Route** validates with Zod schema
5. **Storage Layer** executes Drizzle query
6. **Response** flows back through React Query cache

### Authentication Flow
1. User submits credentials
2. Passport.js validates against database
3. Session created and stored in PostgreSQL
4. Session cookie returned to client
5. Subsequent requests include session cookie

## Module Dependencies

### Server Dependencies
```
server/index.ts
├── server/routes.ts (API route handlers)
├── server/static.ts (static file serving)
├── server/vite.ts (Vite dev server integration)
└── server/storage.ts
    └── server/db.ts (Drizzle instance)
```

### Client Dependencies
```
client/src/main.tsx
└── client/src/App.tsx
    └── client/src/lib/queryClient.ts
        └── Pages and Components
            └── client/src/hooks/* (data fetching)
```

### Shared Module
```
shared/schema.ts
├── Zod schemas for validation
├── Type exports for client/server
└── shared/models/auth.ts (User types)

shared/routes.ts
└── buildUrl() for type-safe URL construction
```

## Data Layer

### Storage Interface
The `IStorage` interface (`server/storage.ts:12`) defines all database operations:
- Account management (CRUD, approval, suspension)
- Bucket operations (create, delete, versioning, lifecycle)
- Access key management (create, rotate, revoke)
- Member/invitation handling
- Billing (invoices, usage records, quotas)
- Notifications and audit logs

### Database Operations
All operations go through `DatabaseStorage` class (`server/storage.ts:105`):
- Uses Drizzle ORM for type-safe queries
- Transactions for complex operations
- Connection pooling via `pg`

## API Endpoints Pattern

### Resource Operations
```
GET    /api/accounts           → List accounts
POST   /api/accounts           → Create account
GET    /api/accounts/:id       → Get account
PATCH  /api/accounts/:id       → Update account

GET    /api/accounts/:id/buckets     → List buckets
POST   /api/accounts/:id/buckets     → Create bucket
DELETE /api/accounts/:id/buckets/:id → Delete bucket
```

### Admin Operations
```
POST /api/admin/accounts/:id/approve  → Approve account
POST /api/admin/accounts/:id/reject   → Reject account
POST /api/admin/accounts/:id/suspend  → Suspend account
POST /api/admin/quotas/:id/adjust     → Adjust quota
```

## External Integrations

### Email Service
- **Location**: `server/services/email.ts`
- **Functions**:
  - `sendEmail()` - Generic email sending
  - `sendInvitationEmail()` - Team invitations
  - `sendVerificationEmail()` - Account verification
  - `sendWelcomeEmail()` - New user welcome
  - `sendPasswordResetEmail()` - Password recovery

### Authentication Providers
- **Passport Local**: Username/password authentication
- **OpenID Connect**: OAuth 2.0 / OIDC providers
- **Session Store**: PostgreSQL via `connect-pg-simple`

## Client State Management

### React Query Pattern
```typescript
// Data fetching hook
const { data, isLoading, error } = useAccounts();

// Mutation hook
const createAccount = useCreateAccount();
await createAccount.mutateAsync(data);
```

### Cache Invalidation
Mutations automatically invalidate related queries:
- Creating bucket → invalidates bucket list
- Updating account → invalidates account details
- Adding member → invalidates member list

## Observability

### Logging
- Server logging via `log()` function (`server/index.ts:25`)
- Structured log format for production

### Audit Trail
- All significant actions logged to `AuditLog` table
- Queryable via API and `useAuditLogs` hook
- Tracks: action, user, timestamp, affected resources

## Error Handling

### Client-Side
- `isUnauthorizedError()` detects 401 responses
- `redirectToLogin()` handles session expiration
- React Query handles retries and error states

### Server-Side
- Zod validation errors return 400 with details
- Authentication errors return 401
- Not found errors return 404
- Internal errors logged and return 500

## Security Considerations

### Input Validation
- All API inputs validated with Zod schemas
- Brazilian documents (CPF/CNPJ) validated server-side
- Type coercion handled by Drizzle

### Output Filtering
- Sensitive data (passwords, tokens) never returned
- Access keys show masked values after creation
- Session data not exposed in API responses
