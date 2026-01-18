---
name: Architect Specialist
description: Design PrimeCloudProV2 system architecture
status: filled
generated: 2026-01-18
---

# Architect Specialist Agent Playbook

## Mission
Design and maintain the overall system architecture for PrimeCloudProV2. Focus on monorepo structure, API design, database schema, and integration patterns between client and server.

## Responsibilities
- Design overall system architecture and patterns
- Define technical standards and best practices
- Evaluate and recommend technology choices
- Plan system scalability and maintainability
- Create architectural documentation

## Best Practices
- Maintain the monorepo structure (client/server/shared)
- Use Zod schemas as single source of truth
- Keep IStorage interface for database abstraction
- Document architectural decisions

## Repository Starting Points
- `client/` — React frontend application
- `server/` — Express.js backend API
- `shared/` — Shared types, schemas, utilities
- `drizzle.config.ts` — Database configuration

## Current Architecture

### Monorepo Structure
```
PrimeCloudProV2/
├── client/           # React 18 + Vite
│   └── src/
│       ├── pages/    # Route components
│       ├── components/ # UI (Radix + custom)
│       ├── hooks/    # React Query hooks
│       └── lib/      # Utilities
├── server/           # Express.js 5
│   ├── routes.ts     # API endpoints
│   ├── storage.ts    # Database abstraction
│   └── services/     # Business logic
└── shared/           # Shared code
    ├── schema.ts     # Zod schemas
    └── routes.ts     # URL builders
```

### Key Architectural Patterns

#### 1. Schema-First Design
```typescript
// shared/schema.ts - Single source of truth
export const accountSchema = z.object({...});
export type Account = z.infer<typeof accountSchema>;
// Used in both client and server
```

#### 2. Storage Abstraction
```typescript
// server/storage.ts
interface IStorage {
  getAccount(id: string): Promise<Account>;
  createAccount(data: CreateAccountRequest): Promise<Account>;
  // All database operations through interface
}

class DatabaseStorage implements IStorage {
  // Drizzle ORM implementation
}
```

#### 3. React Query Data Layer
```typescript
// client/src/hooks/use-*.ts
// All data fetching through custom hooks
// Mutations automatically invalidate related queries
```

### Technology Decisions

| Area | Choice | Rationale |
|------|--------|-----------|
| Frontend | React + Vite | Fast DX, TypeScript support |
| Backend | Express.js | Mature, flexible, widely understood |
| Database | PostgreSQL + Drizzle | Type-safe queries, migrations |
| State | React Query | Server state management |
| Validation | Zod | Runtime + TypeScript types |
| UI | Radix + Tailwind | Accessible, customizable |

### Data Flow
```
User Action → React Component → Custom Hook
     ↓
apiRequest → Express Route → Storage Layer → PostgreSQL
     ↓
Response → React Query Cache → UI Update
```

## Architectural Decisions Log (ADRs)

### ADR-001: Monorepo Structure
**Decision**: Use single repo with client/server/shared directories
**Rationale**: Enables sharing types and schemas, simplifies deployment

### ADR-002: Zod for Validation
**Decision**: Use Zod schemas for API validation and type generation
**Rationale**: Single schema generates both runtime validation and TypeScript types

### ADR-003: IStorage Interface
**Decision**: Abstract database behind interface
**Rationale**: Enables testing, potential for multiple storage backends

## Documentation Touchpoints
- [Architecture Notes](../docs/architecture.md)
- [Data Flow](../docs/data-flow.md)
- [Project Overview](../docs/project-overview.md)

## Hand-off Notes

After architecture work:
- Update architecture.md documentation
- Verify TypeScript types pass
- Ensure patterns are consistent
- Document any new ADRs
