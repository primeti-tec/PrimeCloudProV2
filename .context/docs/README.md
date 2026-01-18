# Documentation Index

Welcome to the PrimeCloudProV2 knowledge base. This documentation provides comprehensive guidance for developers working on the cloud storage management platform.

## Quick Start

1. Read the [Project Overview](./project-overview.md) to understand the system
2. Follow the [Development Workflow](./development-workflow.md) to set up your environment
3. Review the [Architecture Notes](./architecture.md) for technical details

## Core Guides

| Guide | Description |
|-------|-------------|
| [Project Overview](./project-overview.md) | System purpose, tech stack, and getting started |
| [Architecture Notes](./architecture.md) | System design, layers, and component relationships |
| [Development Workflow](./development-workflow.md) | Day-to-day development process and commands |
| [Testing Strategy](./testing-strategy.md) | Test types, coverage targets, and best practices |
| [Glossary](./glossary.md) | Domain terms, acronyms, and business rules |
| [Data Flow](./data-flow.md) | Request handling, integrations, and state management |
| [Security](./security.md) | Authentication, authorization, and compliance |
| [Tooling](./tooling.md) | Build tools, IDE setup, and productivity tips |

## Technology Stack

- **Backend**: Express.js 5, TypeScript, PostgreSQL, Drizzle ORM
- **Frontend**: React 18, Vite, Tailwind CSS, Radix UI
- **State**: TanStack React Query, Zod validation
- **Auth**: Passport.js, OpenID Connect

## Project Structure

```
PrimeCloudProV2/
├── client/           # React frontend
│   └── src/
│       ├── pages/    # Route components
│       ├── components/ # UI components
│       ├── hooks/    # Data fetching
│       └── lib/      # Utilities
├── server/           # Express backend
│   ├── routes.ts     # API endpoints
│   ├── storage.ts    # Database layer
│   └── services/     # Business logic
├── shared/           # Shared code
│   ├── schema.ts     # Zod schemas
│   └── routes.ts     # URL utilities
└── .context/         # AI documentation
    ├── docs/         # This documentation
    └── agents/       # Agent playbooks
```

## Key Concepts

- **Account**: Organization using the platform
- **Bucket**: Cloud storage container
- **Access Key**: API credentials
- **Subscription**: Service plan linkage

See [Glossary](./glossary.md) for complete terminology.

## Common Tasks

### Adding a New Feature
1. Define Zod schema in `shared/schema.ts`
2. Add API routes in `server/routes.ts`
3. Update storage in `server/storage.ts`
4. Create React hook in `client/src/hooks/`
5. Build UI in `client/src/pages/`

### Debugging Issues
1. Check server logs for errors
2. Review network requests in browser devtools
3. Query audit logs for recent actions
4. Verify database state with Drizzle

## Related Resources

- [AGENTS.md](../../AGENTS.md) - AI agent configuration
- Agent playbooks in `.context/agents/`
- Implementation plans in `.context/plans/`
