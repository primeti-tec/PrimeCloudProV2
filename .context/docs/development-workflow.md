---
status: filled
generated: 2026-01-18
---

# Development Workflow

Outline the day-to-day engineering process for this repository.

## Branching & Releases

- **Main Branch**: `main` - production-ready code
- **Feature Branches**: Create from `main` for new features
- **Branching Model**: Feature branch workflow

## Local Development

### Prerequisites
- Node.js (v18 or higher recommended)
- PostgreSQL database
- npm package manager

### Commands

| Command | Description |
|---------|-------------|
| `npm install` | Install dependencies |
| `npm run dev` | Start development server (client + server) |
| `npm run build` | Build for production |
| `npm run start` | Run production build |
| `npm run check` | TypeScript type checking |
| `npm run db:push` | Push Drizzle schema to database |

### Environment Setup

1. Create a PostgreSQL database
2. Configure environment variables for database connection
3. Run `npm run db:push` to initialize schema
4. Start development with `npm run dev`

## Project Structure

```
├── client/           # React frontend
│   └── src/
│       ├── pages/    # Page components
│       ├── components/ # UI components
│       ├── hooks/    # Data fetching hooks
│       └── lib/      # Utilities
├── server/           # Express backend
│   ├── routes.ts     # API routes
│   ├── storage.ts    # Database layer
│   └── services/     # Business logic
├── shared/           # Shared types/schemas
└── script/           # Build scripts
```

## Code Review Expectations

### Before Submitting
- Run `npm run check` to verify TypeScript types
- Test your changes locally with `npm run dev`
- Ensure no console errors or warnings

### Review Checklist
- [ ] Code follows existing patterns
- [ ] Types are properly defined
- [ ] API changes include schema updates
- [ ] Brazilian document validation works (CPF/CNPJ)

## Adding New Features

### Frontend
1. Create page component in `client/src/pages/`
2. Add custom hooks in `client/src/hooks/`
3. Use existing UI components from `client/src/components/ui/`

### Backend
1. Add API routes in `server/routes.ts`
2. Update storage interface in `server/storage.ts`
3. Define schemas in `shared/schema.ts`

### Shared Types
1. Define Zod schemas in `shared/schema.ts`
2. Export inferred types for client/server use
3. Use `buildUrl()` from `shared/routes.ts` for type-safe URLs

## Onboarding Tasks

1. Clone repository and run `npm install`
2. Set up local PostgreSQL database
3. Run `npm run db:push` to create tables
4. Explore the codebase with `npm run dev`
5. Review existing hooks in `client/src/hooks/` to understand data patterns

## Troubleshooting

### Database Issues
- Verify PostgreSQL connection string
- Run `npm run db:push` to sync schema

### Build Errors
- Clear `node_modules` and reinstall
- Check TypeScript version compatibility
