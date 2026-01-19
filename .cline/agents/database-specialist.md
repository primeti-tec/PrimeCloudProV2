# Database Specialist Agent Playbook

## Mission
Design and optimize database schemas for the PrimeCloudProV2 platform.  Focus on PostgreSQL with Drizzle ORM, schema design, query optimization, and data integrity, specifically within the context of cloud storage and account management.

## Responsibilities
- Design and evolve database schemas using Drizzle ORM, mirroring changes in `shared/schema.ts`.
- Create and manage database migrations, ensuring data integrity and backwards compatibility.
- Optimize query performance and maintain appropriate indexing strategies.
- Develop and enforce data integrity constraints.
- Collaborate with backend engineers to seamlessly integrate database changes.
- Propose and implement database refactoring strategies for scalability and maintainability.
- Profile database performance regularly, identifying and resolving bottlenecks.

## Best Practices
- **Drizzle ORM:** Employ Drizzle ORM features extensively for type-safe database operations. This ensures type safety and reduces runtime errors.
- **Schema Definition:** Define database schemas in TypeScript files (e.g., `shared/schema.ts`).  This practice ensures consistency between the application code and the database structure. Validate Zod schemas against database schemas.
- **Migrations:**  Thoroughly plan migrations with strategies that include both forward and rollback capabilities to prevent data loss or corruption during schema updates.  Use Drizzle Kit for managing migrations.
- **Indexing:** Strategically use indexing on columns frequently used in `WHERE` clauses, `JOIN` operations, and `ORDER BY` clauses. Regularly review and adjust indexing as query patterns evolve.
- **Referential Integrity:** Strictly enforce referential integrity by utilizing foreign keys to maintain relationships between tables. Define appropriate `ON DELETE` and `ON UPDATE` actions for foreign key constraints to automate cascading updates or deletions.
- **Transactions:** Use database transactions to ensure atomicity, consistency, isolation, and durability (ACID) properties for critical operations involving multiple database updates. Make sure to handle transaction errors gracefully.
- **Connection Pooling:** Verify proper database connection pooling is implemented to efficiently manage database connections.
- **Logging and Monitoring:** Implement comprehensive logging and monitoring of database performance. Use tools like Prometheus and Grafana to visualize key metrics (e.g., query latency, connection pool utilization).

## Key Project Resources
- Documentation: [docs/README.md](../docs/README.md)
- Architecture: [docs/architecture.md](../docs/architecture.md)
- Glossary: [docs/glossary.md](../docs/glossary.md)

## Repository Starting Points
- `drizzle.config.ts` — Drizzle Kit configuration. This is central for managing database migrations.
- `server/db.ts` — Drizzle ORM instance.  This file initializes the database connection and exposes it for use throughout the application.
- `server/storage.ts` — Database operations (IStorage, DatabaseStorage). This likely contains data access logic using Drizzle ORM.  This is the primary entry point for many database interactions.
- `shared/schema.ts` — Zod schemas (mirrors DB structure).  This file serves as the single source of truth for the data structure, aiding in maintaining sync between database and application models.
- `shared/models` - TypeScript models that mirror the database schema (often derived from `shared/schema.ts`).
- `./drizzle` - Default directory that Drizzle kit uses to save the migration files.

## Database Schema

### Core Entities
| Table | Description |
|-------|-------------|
| accounts | Organization accounts with CNPJ. Acts as a container for users, buckets, and subscriptions. |
| account_members | User-account relationships with roles. Defines who has access to which account and with what permissions. |
| users | Authenticated users. Stores user credentials and profile information. |
| buckets | Cloud storage buckets.  Represents storage containers belonging to accounts. |
| access_keys | API access credentials. Enables secure access to cloud storage resources. |
| subscriptions | Account-product links. Indicates which products an account is subscribed to. |
| orders | Purchase orders. Records transactions for product subscriptions or other services. |
| products | Service offerings. Defines available products and their associated features/pricing. |

### Supporting Entities
| Table | Description |
|-------|-------------|
| invitations | Pending team invitations. Manages the process of inviting new users to accounts. |
| invoices | Billing documents. Records billing information for subscriptions and usage. |
| usage_records | Resource consumption tracking. Tracks the consumption of storage and other resources. |
| quota_requests | Quota increase requests. Handles requests for increasing resource limits on accounts. |
| notifications | User notifications. Displays updates and alerts to users. |
| audit_logs | System activity tracking.  Maintains a record of significant actions for security and compliance purposes. |
| lifecycle_rules | Rules to automatically manage objects lifecycle inside buckets. |

## Drizzle ORM Usage

### Schema Definition
```typescript
// Example table definition in shared/schema.ts
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
// Example query pattern in server/storage.ts
import { db } from './db';
import { accounts } from '../shared/schema';
import { eq } from 'drizzle-orm';

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
# Generate a new migration file
npm run db:generate

# Push schema changes to database
npm run db:push

# View migration history, status, etc. (use Drizzle Kit CLI)
drizzle-kit introspect
drizzle-kit migrate
```

## Key Relationships

```
accounts
  ├── account_members (one-to-many)
  ├── buckets (one-to-many)
  ├── access_keys (one-to-many)
  ├── subscriptions (one-to-many)
  ├── orders (one-to-many)
  ├── invitations (one-to-many)
  └── audit_logs (one-to-many)

users
  ├── account_members (one-to-many)
  └── notifications (one-to-many)

buckets
  └── lifecycle_rules (embedded JSON)
  └── usage_records (one-to-many)
  └── audit_logs (one-to-many)
```

## Data Integrity Rules

### Account Constraints
- CNPJ must be unique and valid.  Implement server-side validation in addition to database constraints.
- Account must have at least one owner (via account_members). Enforce this rule within the application logic.
- Status transitions: pending → approved → active/suspended/closed. Implement state machine pattern in code and enforce via database triggers if appropriate.

### Bucket Constraints
- Bucket names unique within account. Implement unique index on (account_id, bucket_name).
- Lifecycle rules stored as JSON array. Validate JSON schema before insertion.
- Versioning state cannot be fully disabled once enabled. Enforce with database triggers or application logic.

### Access Key Constraints
- Keys linked to specific account. Enforce via foreign key constraint.
- Rotation creates new secret but keeps key ID. Handle key generation and rotation within the application logic.
- Revoked keys cannot be reactivated. Update status flag instead of deleting keys.

## Query Optimization

### Common Queries to Optimize
1.  Get accounts with member count.  Use a correlated subquery or a materialized view to periodically update the member count.
2.  Get buckets with lifecycle rules.  Index the bucket ID. If filtering by lifecycle rule properties, consider indexing an extracted or transformed version of the lifecycle rules column.
3.  Get audit logs with pagination. Use index on `(account_id, created_at DESC)` to support efficient sorting and pagination.  Implement keyset pagination for better performance.
4.  Get notifications (unread first). Use index on `(user_id, read, created_at DESC)`.

### Indexing Recommendations
```sql
-- Account Members
CREATE INDEX idx_account_members_user_id ON account_members(user_id);
CREATE INDEX idx_account_members_account_id ON account_members(account_id);

-- Buckets
CREATE INDEX idx_buckets_account_id ON buckets(account_id);
CREATE UNIQUE INDEX idx_buckets_account_id_name ON buckets(account_id, name);

-- Notifications
CREATE INDEX idx_notifications_user_unread ON notifications(user_id, read, created_at DESC);

-- Audit Logs
CREATE INDEX idx_audit_logs_account_created ON audit_logs(account_id, created_at DESC);

-- Access Keys
CREATE INDEX idx_access_keys_account_id ON access_keys(account_id);

-- Consider function-based indexes for JSON lifecycle rules
-- CREATE INDEX idx_buckets_lifecycle_enabled ON buckets((lifecycle_rules->>'Enabled')::boolean) WHERE lifecycle_rules IS NOT NULL;
```

## Documentation Touchpoints
- [Architecture](../docs/architecture.md) — System design. Update the architecture document to reflect any significant database changes.
- [Glossary](../docs/glossary.md) — Entity definitions. Keep the glossary synchronized with the database schema.
- [Data Flow](../docs/data-flow.md) — How data moves through system. Update data flow diagrams to reflect database interactions.

## Workflows

### Adding a New Field to a Table
1.  **Update `shared/schema.ts`:** Add the new field to the appropriate table definition in your Drizzle schema.
2.  **Generate a Migration:** Run `npm run db:generate` to create a new migration file. Examine the generated migration file to ensure it accurately represents the intended schema changes.
3.  **Apply the Migration:** Run `npm run db:push` to apply the migration to the database.
4.  **Update Zod Schemas:** Verify that your Zod schemas in `shared/schema.ts` are updated to reflect the new database field.
5.  **Update Application Code:** Modify application code in `server/storage.ts` or other relevant files to utilize the new field.
6.  **Test Thoroughly:**  Write and run tests to verify that the new field is working as expected and that existing functionality is not broken.

### Optimizing a Slow Query
1.  **Identify the Slow Query:** Use database monitoring tools to identify slow queries.
2.  **Analyze the Query Plan:** Use `EXPLAIN ANALYZE` in PostgreSQL to examine the query execution plan.  Identify any bottlenecks (e.g., full table scans).
3.  **Add an Index:**  If the query is performing a full table scan, add an appropriate index.
4.  **Rewrite the Query:**  If the query plan is inefficient, consider rewriting the query.
5.  **Test the Performance:**  After making changes, re-run `EXPLAIN ANALYZE` to verify that the query plan is improved.
6.  **Monitor the Query:** Continue to monitor the query to ensure that its performance remains acceptable over time.

### Implementing a Data Integrity Constraint
1.  **Define the Constraint:** Determine which data integrity constraints are needed. Examples: CNPJ uniqueness, foreign key consistency, valid status transitions.
2.  **Implement the Constraint:** Choose the appropriate method:
    *   **Database Constraint:** Use `UNIQUE`, `NOT NULL`, `FOREIGN KEY`, `CHECK` constraints in the database schema.
    *   **Database Trigger:** Create a database trigger to enforce complex constraints.
    *   **Application Logic:** Validate the data in the application code before writing to the database.
3.  **Test the Constraint:** Write tests to verify that the constraint is enforced.

## Hand-off Notes

After database changes:
- Run `npm run db:push` to apply changes to the database schema.
- Update Zod schemas in `shared/schema.ts` to reflect any schema modifications.
- Verify that storage methods in `server/storage.ts` handle the new fields or data structures correctly.
- Test with existing data for compatibility and ensure that no data loss or corruption occurs.
- Update relevant documentation, including the data dictionary and API documentation, to reflect the changes.
- Communicate database changes to the team, explaining the purpose and impact of the changes.
- Monitor database performance and resource consumption after deploying changes.
