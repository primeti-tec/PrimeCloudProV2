---
name: Backend Specialist
description: Design and implement PrimeCloudProV2 server-side features
status: filled
generated: 2026-01-18
---

# Backend Specialist Agent Playbook

## Mission
Design and implement server-side features for the PrimeCloudProV2 platform. Focus on Express.js API routes, Drizzle ORM database operations, Passport.js authentication, and email services.

## Responsibilities
- Design and implement Express.js API routes
- Create and maintain database operations with Drizzle ORM
- Optimize query performance and data models
- Implement authentication and authorization
- Build email notification services

## Best Practices
- Validate all inputs with Zod schemas
- Use the IStorage interface for database operations
- Implement proper error handling and logging
- Follow RESTful API conventions
- Add audit logging for significant actions

## Key Project Resources
- Documentation: [docs/README.md](../docs/README.md)
- Architecture: [docs/architecture.md](../docs/architecture.md)
- Security: [docs/security.md](../docs/security.md)

## Repository Starting Points
- `server/index.ts` — Express server setup and middleware
- `server/routes.ts` — API route handlers
- `server/storage.ts` — IStorage interface and DatabaseStorage
- `server/db.ts` — Drizzle ORM instance
- `server/services/email.ts` — Email notification service
- `server/lib/` — Server-side utilities

## Server Architecture

### Entry Point
```typescript
// server/index.ts
const app = express();
app.use(express.json());
app.use(session({...}));
setupAuth(app);  // Passport.js
registerRoutes(app);  // API routes
```

### API Route Pattern
```typescript
// server/routes.ts
app.get('/api/accounts', async (req, res) => {
  const accounts = await storage.getAccountsByUser(req.user.id);
  res.json(accounts);
});

app.post('/api/accounts', async (req, res) => {
  const data = createAccountRequest.parse(req.body);
  const account = await storage.createAccount(data);
  res.status(201).json(account);
});
```

### Storage Interface
```typescript
// server/storage.ts
interface IStorage {
  // Account operations
  getAccount(id: string): Promise<Account | null>;
  createAccount(data: CreateAccountRequest): Promise<Account>;
  updateAccount(id: string, data: UpdateAccountRequest): Promise<Account>;

  // Bucket operations
  getBuckets(accountId: string): Promise<Bucket[]>;
  createBucket(data: CreateBucketRequest): Promise<Bucket>;

  // Access key operations
  getAccessKeys(accountId: string): Promise<AccessKey[]>;
  createAccessKey(data: CreateAccessKeyRequest): Promise<AccessKey>;
  rotateAccessKey(keyId: string): Promise<AccessKey>;
}
```

### Database Operations
```typescript
// Use Drizzle ORM
class DatabaseStorage implements IStorage {
  async createAccount(data: CreateAccountRequest) {
    const [account] = await db
      .insert(accounts)
      .values(data)
      .returning();
    return account;
  }
}
```

## Email Service

```typescript
// server/services/email.ts
import { sendEmail, sendInvitationEmail, sendWelcomeEmail } from './email';

// Send team invitation
await sendInvitationEmail({
  to: invitee.email,
  accountName: account.name,
  inviterName: inviter.name,
  token: invitation.token,
});
```

## Authentication

### Passport.js Setup
- Local strategy for username/password
- OpenID Connect for OAuth providers
- Session stored in PostgreSQL

### Route Protection
```typescript
// Protect routes with middleware
app.get('/api/accounts', requireAuth, async (req, res) => {
  // req.user is available
});
```

## Brazilian Document Validation

```typescript
import { isValidCNPJ, validateDocument } from './lib/document-validation';

// Validate in route handler
if (!isValidCNPJ(data.cnpj)) {
  return res.status(400).json({ error: 'Invalid CNPJ' });
}
```

## Logging

```typescript
import { log } from './index';

log('Account created', { accountId, userId });
```

## Error Handling

```typescript
app.post('/api/accounts', async (req, res) => {
  try {
    const data = createAccountRequest.parse(req.body);
    const account = await storage.createAccount(data);
    res.status(201).json(account);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ errors: error.errors });
    }
    log('Error creating account', { error });
    res.status(500).json({ error: 'Internal server error' });
  }
});
```

## Documentation Touchpoints
- [Architecture Notes](../docs/architecture.md)
- [Data Flow](../docs/data-flow.md)
- [Security](../docs/security.md)

## Hand-off Notes

After completing backend work:
- Verify TypeScript types pass (`npm run check`)
- Test API endpoints with various inputs
- Check error handling for edge cases
- Ensure audit logging for admin actions
