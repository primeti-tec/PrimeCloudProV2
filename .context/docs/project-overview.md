---
status: filled
generated: 2026-01-18
---

# Project Overview

PrimeCloudProV2 is a cloud storage management platform that enables organizations to manage storage accounts, buckets, access keys, and subscriptions. The platform provides a complete solution for cloud storage provisioning with billing, quota management, and team collaboration features.

## Quick Facts

- **Root path**: `D:\PROJETOS\PRINECLOUDPROV2\PrimeCloudProV2`
- **Primary languages**:
  - TypeScript (.tsx, .ts) - 105 files
  - JavaScript configuration files
- **Architecture**: Full-stack monorepo (client + server + shared)

## Technology Stack

### Backend
- **Runtime**: Node.js with Express.js 5
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Passport.js (local + OpenID Connect)
- **Session**: Express Session with pg-simple store

### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite 7
- **Styling**: Tailwind CSS 3 with Radix UI components
- **State Management**: TanStack React Query
- **Routing**: Wouter

### Shared
- **Validation**: Zod schemas
- **Type Safety**: Shared types between client and server

## Entry Points

- [`server/index.ts`](../../server/index.ts) - Express server initialization
- [`client/src/main.tsx`](../../client/src/main.tsx) - React application entry
- [`server/replit_integrations/auth/index.ts`](../../server/replit_integrations/auth/index.ts) - Auth module

## Core Features

1. **Account Management** - Create, manage, and approve organizational accounts
2. **Bucket Management** - Cloud storage buckets with lifecycle rules and versioning
3. **Access Keys** - API key management with rotation and toggle capabilities
4. **Team Collaboration** - Invite members with role-based permissions
5. **Subscription & Billing** - Product subscriptions, invoices, and usage tracking
6. **Quota Management** - Request and manage storage quotas
7. **Audit Logging** - Track all system activities
8. **Notifications** - In-app notification system

## File Structure

- `client/` - React frontend application
  - `src/pages/` - Page components
  - `src/components/` - Reusable UI components
  - `src/hooks/` - Custom React hooks for data fetching
  - `src/lib/` - Utilities and helpers
- `server/` - Express backend
  - `routes.ts` - API route definitions
  - `storage.ts` - Database storage layer
  - `services/` - Business logic (email service)
  - `lib/` - Server utilities
- `shared/` - Shared code between client and server
  - `schema.ts` - Zod schemas and types
  - `routes.ts` - URL builder utilities
  - `models/` - Shared type definitions

## Getting Started

1. Install dependencies: `npm install`
2. Set up PostgreSQL database
3. Push schema: `npm run db:push`
4. Start development: `npm run dev`
5. Build for production: `npm run build`

## Key Stakeholders

- **End Users**: Organizations needing cloud storage management
- **Administrators**: Platform operators managing accounts and quotas
- **Developers**: Team members integrating via access keys

## Related Documentation

- [Architecture Notes](./architecture.md)
- [Development Workflow](./development-workflow.md)
- [Security & Compliance](./security.md)
