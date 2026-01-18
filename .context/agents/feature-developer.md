---
name: Feature Developer
description: Implement new features for the PrimeCloudProV2 platform
status: filled
generated: 2026-01-18
---

# Feature Developer Agent Playbook

## Mission
Implement new features for the PrimeCloudProV2 cloud storage management platform. This agent handles end-to-end feature development including backend API routes, database schema changes, frontend UI components, and React hooks for data fetching.

## Responsibilities
- Implement new features according to specifications
- Design clean, maintainable code architecture
- Integrate features with existing codebase patterns
- Write comprehensive tests for new functionality
- Ensure Brazilian document validation (CPF/CNPJ) where applicable

## Best Practices
- Follow the established patterns: Zod schemas → API routes → Storage layer → React hooks → UI
- Use existing Radix UI components from `client/src/components/ui/`
- Leverage TanStack React Query for all data fetching
- Validate all inputs with Zod schemas in `shared/schema.ts`
- Consider audit logging for significant actions

## Key Project Resources
- Documentation index: [docs/README.md](../docs/README.md)
- Agent handbook: [agents/README.md](./README.md)
- Agent knowledge base: [AGENTS.md](../../AGENTS.md)

## Repository Starting Points
- `client/` — React frontend with pages, components, hooks, and utilities
- `server/` — Express.js backend with routes, storage layer, and services
- `shared/` — Zod schemas, types, and URL utilities shared between client/server
- `script/` — Build and deployment scripts

## Key Files
**Entry Points:**
- [`server/index.ts`](../../server/index.ts) — Express server setup
- [`client/src/main.tsx`](../../client/src/main.tsx) — React app entry
- [`shared/schema.ts`](../../shared/schema.ts) — All Zod schemas and types

## Feature Implementation Workflow

### 1. Define Schema
```typescript
// shared/schema.ts
export const createFeatureRequest = z.object({...});
export type CreateFeatureRequest = z.infer<typeof createFeatureRequest>;
```

### 2. Add Storage Method
```typescript
// server/storage.ts - Add to IStorage interface and DatabaseStorage
async createFeature(data: CreateFeatureRequest): Promise<Feature>
```

### 3. Add API Route
```typescript
// server/routes.ts
app.post('/api/features', async (req, res) => {...});
```

### 4. Create React Hook
```typescript
// client/src/hooks/use-features.ts
export function useCreateFeature() {
  return useMutation({...});
}
```

### 5. Build UI Component
```typescript
// client/src/pages/Features.tsx
export function Features() {...}
```

## Architecture Context

### Models
- **Location**: `shared/`, `shared/models`
- **Key types**: Account, Bucket, AccessKey, Order, Subscription, Invoice
- **Pattern**: Zod schemas with inferred TypeScript types

### Services
- **Location**: `server/services`
- **Email**: sendEmail, sendInvitationEmail, sendWelcomeEmail, etc.

### Data Hooks
- **Location**: `client/src/hooks/`
- **Pattern**: useQuery for reads, useMutation for writes
- **Examples**: useAccounts, useBuckets, useAccessKeys

## Documentation Touchpoints
- [Project Overview](../docs/project-overview.md)
- [Architecture Notes](../docs/architecture.md)
- [Development Workflow](../docs/development-workflow.md)
- [Data Flow & Integrations](../docs/data-flow.md)

## Collaboration Checklist

1. Review existing patterns in similar features (e.g., how buckets/access keys work)
2. Update `shared/schema.ts` with new types
3. Add database operations to `server/storage.ts`
4. Create corresponding React hooks
5. Build UI using existing component library
6. Test with `npm run dev` and verify TypeScript with `npm run check`

## Hand-off Notes

After completing a feature:
- Verify all TypeScript types pass (`npm run check`)
- Test the feature end-to-end in development
- Update relevant documentation if behavior changes
- Consider audit logging for admin-visible actions
