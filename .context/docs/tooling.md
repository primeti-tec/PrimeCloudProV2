---
status: filled
generated: 2026-01-18
---

# Tooling & Productivity Guide

Collect the scripts, automation, and editor settings that keep contributors efficient.

## Required Tooling

| Tool | Version | Purpose |
|------|---------|---------|
| Node.js | v18+ | JavaScript runtime |
| npm | v9+ | Package manager |
| PostgreSQL | v14+ | Database |
| TypeScript | 5.6.3 | Type checking |

## Build Tools

### Vite
- **Version**: 7.3.0
- **Purpose**: Frontend build tool and dev server
- **Config**: `vite.config.ts`
- **Features**: Hot Module Replacement, TypeScript support

### tsx
- **Purpose**: TypeScript execution for server
- **Usage**: `tsx server/index.ts`

### esbuild
- **Purpose**: Production bundling
- **Script**: `script/build.ts`

### Drizzle Kit
- **Version**: 0.31.8
- **Purpose**: Database schema management
- **Config**: `drizzle.config.ts`
- **Commands**: `npm run db:push`

## Development Scripts

```bash
# Start development (client + server with HMR)
npm run dev

# Type checking
npm run check

# Production build
npm run build

# Run production
npm run start

# Push database schema
npm run db:push
```

## Frontend Libraries

### UI Components
- **Radix UI**: Headless accessible components
- **Tailwind CSS**: Utility-first styling
- **Lucide React**: Icon library
- **Framer Motion**: Animations

### State & Data
- **TanStack React Query**: Server state management
- **React Hook Form**: Form handling
- **Zod**: Schema validation

### Navigation
- **Wouter**: Lightweight routing

## Backend Libraries

### Server
- **Express 5**: Web framework
- **Passport.js**: Authentication
- **OpenID Client**: OAuth/OIDC support

### Database
- **Drizzle ORM**: TypeScript ORM
- **pg**: PostgreSQL driver
- **connect-pg-simple**: Session store

## IDE / Editor Setup

### VS Code Recommended Extensions
- ESLint
- Prettier
- Tailwind CSS IntelliSense
- TypeScript Vue Plugin (Volar)
- Drizzle ORM extension

### Settings
```json
{
  "typescript.preferences.importModuleSpecifier": "relative",
  "editor.formatOnSave": true,
  "tailwindCSS.experimental.classRegex": [
    ["cva\\(([^)]*)\\)", "[\"'`]([^\"'`]*).*?[\"'`]"]
  ]
}
```

## Productivity Tips

### Type-Safe API Calls
Use the `apiRequest` helper from `client/src/lib/queryClient.ts` for all API calls.

### URL Building
Use `buildUrl()` from `shared/routes.ts` for type-safe URL construction:
```typescript
import { buildUrl } from '@shared/routes';
const url = buildUrl('/api/accounts/:id', { id: '123' });
```

### Custom Hooks Pattern
All data fetching uses custom hooks in `client/src/hooks/`:
```typescript
import { useAccounts } from '@/hooks/use-accounts';
const { data, isLoading } = useAccounts();
```

### Document Validation
Brazilian CPF/CNPJ validation utilities available in both client and server:
- `client/src/lib/document-validation.ts`
- `server/lib/document-validation.ts`

## Environment Variables

Required environment variables:
- Database connection string
- Session secret
- Email service configuration (for notifications)
