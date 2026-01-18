---
name: Database Specialist
description: Design and optimize PrimeCloudProV2 database schemas
status: filled
generated: 2026-01-18
---

# Database Specialist Agent Playbook

## Mission
Design and optimize database schemas for the PrimeCloudProV2 platform. Focus on PostgreSQL with Drizzle ORM, schema design, query optimization, and data integrity.

## Responsibilities
- Design and optimize database schemas with Drizzle ORM
- Create and manage database migrations
- Optimize query performance and indexing
- Ensure data integrity and consistency
- Handle schema changes and data migrations

## Best Practices
- Use Drizzle ORM for type-safe database operations
- Define schemas in TypeScript for consistency
- Plan migrations with rollback strategies
- Use appropriate indexing for common queries
- Maintain referential integrity with foreign keys

## Key Project Resources
- Documentation: [docs/README.md](../docs/README.md)
- Architecture: [docs/architecture.md](../docs/architecture.md)
- Glossary: [docs/glossary.md](../docs/glossary.md)

## Repository Starting Points
- `drizzle.config.ts` — Drizzle Kit configuration
- `server/db.ts` — Drizzle ORM instance
- `server/storage.ts` — Database operations (IStorage, DatabaseStorage)
- `shared/schema.ts` — Zod schemas (mirrors DB structure)

## Database Schema

### Core Entities
| Table | Description |
|-------|-------------|
| accounts | Organization accounts with CNPJ |
| account_members | User-account relationships with roles |
| users | Authenticated users |
| buckets | Cloud storage buckets |
| access_keys | API access credentials |
| subscriptions | Account-product links |
| orders | Purchase orders |
| products | Service offerings |

### Supporting Entities
| Table | Description |
|-------|-------------|
| invitations | Pending team invitations |
| invoices | Billing documents |
| usage_records | Resource consumption tracking |
| quota_requests | Quota increase requests |
| notifications | User notifications |
| audit_logs | System activity tracking |

## Drizzle ORM Usage

### Schema Definition
```typescript
// Example table definition
import { pgTable, text, timestamp, boolean } from 'drizzle-orm/pg-core';

export const accounts = pgTable('accounts', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  cnpj: text('cnpj').notNull().unique(),
  status: text('status').notNull().default('pending'),
  createdAt: timestamp('created_at').defaultNow(),
});
```

### Query Patterns
```typescript
// server/storage.ts
class DatabaseStorage implements IStorage {
  async getAccountsByUser(userId: string) {
    return db.query.accounts.findMany({
      where: eq(accounts.userId, userId),
      with: {
        members: true,
        buckets: true,
      },
    });
  }

  async createAccount(data: CreateAccountRequest) {
    const [account] = await db
      .insert(accounts)
      .values(data)
      .returning();
    return account;
  }
}
```

### Migrations
```bash
# Push schema changes to database
npm run db:push
```

## Key Relationships

```
accounts
  ├── account_members (one-to-many)
  ├── buckets (one-to-many)
  ├── access_keys (one-to-many)
  ├── subscriptions (one-to-many)
  ├── orders (one-to-many)
  └── invitations (one-to-many)

users
  ├── account_members (one-to-many)
  └── notifications (one-to-many)

buckets
  └── lifecycle_rules (embedded JSON)
```

## Data Integrity Rules

### Account Constraints
- CNPJ must be unique and valid
- Account must have at least one owner (via account_members)
- Status transitions: pending → approved → active/suspended

### Bucket Constraints
- Bucket names unique within account
- Lifecycle rules stored as JSON array
- Versioning state cannot be fully disabled once enabled

### Access Key Constraints
- Keys linked to specific account
- Rotation creates new secret but keeps key ID
- Revoked keys cannot be reactivated

## Query Optimization

### Common Queries to Optimize
1. Get accounts with member count
2. Get buckets with lifecycle rules
3. Get audit logs with pagination
4. Get notifications (unread first)

### Indexing Recommendations
```sql
-- Common lookup patterns
CREATE INDEX idx_account_members_user_id ON account_members(user_id);
CREATE INDEX idx_buckets_account_id ON buckets(account_id);
CREATE INDEX idx_notifications_user_unread ON notifications(user_id, read);
CREATE INDEX idx_audit_logs_account_created ON audit_logs(account_id, created_at);
```

## Documentation Touchpoints
- [Architecture](../docs/architecture.md) — System design
- [Glossary](../docs/glossary.md) — Entity definitions
- [Data Flow](../docs/data-flow.md) — How data moves through system

## Hand-off Notes

After database changes:
- Run `npm run db:push` to apply changes
- Update Zod schemas in `shared/schema.ts` if needed
- Verify storage methods handle new fields
- Test with existing data for compatibility
