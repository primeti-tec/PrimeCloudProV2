# CloudStorage Pro - White-Label S3-Compatible Storage Platform

## Overview

CloudStorage Pro is a white-label SaaS platform for selling S3-compatible cloud storage. It enables infrastructure providers operating MinIO to commercialize storage as a service with automated provisioning, usage-based billing, and multi-tenant management. The platform provides both a customer self-service portal and an admin dashboard for account approval and platform metrics.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript, bundled using Vite
- **Routing**: Wouter (lightweight React router)
- **State Management**: TanStack React Query for server state
- **UI Components**: Shadcn/UI with Radix primitives, styled with Tailwind CSS
- **Animations**: Framer Motion for smooth transitions
- **Charts**: Recharts for dashboard analytics
- **Forms**: React Hook Form with Zod validation

### Backend Architecture
- **Runtime**: Node.js with Express
- **Language**: TypeScript compiled with tsx
- **API Design**: RESTful endpoints under `/api/*` prefix
- **Build System**: esbuild for production bundling, Vite for development HMR

### Authentication
- **Provider**: Replit Auth (OpenID Connect)
- **Session Storage**: PostgreSQL-backed sessions using connect-pg-simple
- **Implementation**: Passport.js with OIDC strategy

### Data Layer
- **ORM**: Drizzle ORM with drizzle-zod for schema validation
- **Database**: PostgreSQL (configured via DATABASE_URL environment variable)
- **Migrations**: Drizzle Kit with push command (`npm run db:push`)

### Project Structure
```
├── client/src/          # React frontend
│   ├── components/      # UI components (Shadcn + custom)
│   ├── hooks/           # React Query hooks for API calls
│   ├── pages/           # Route components
│   └── lib/             # Utilities and query client
├── server/              # Express backend
│   ├── routes.ts        # API route definitions
│   ├── storage.ts       # Database access layer
│   └── replit_integrations/auth/  # Authentication logic
├── shared/              # Shared types and schemas
│   ├── schema.ts        # Drizzle database models
│   └── routes.ts        # API route contracts with Zod
└── migrations/          # Database migrations
```

### Multi-Tenancy Model
- **Accounts**: Represent tenant organizations (companies)
- **Members**: Users can belong to multiple accounts with roles (owner, admin, developer)
- **Products**: Subscription plans with storage/bandwidth limits
- **Buckets**: S3-compatible storage containers per account
- **Access Keys**: S3-compatible credentials for API access

## External Dependencies

### Database
- PostgreSQL database required (provision via Replit or external provider)
- Connection via `DATABASE_URL` environment variable

### Authentication
- Replit Auth service (OIDC provider)
- Requires `ISSUER_URL`, `REPL_ID`, and `SESSION_SECRET` environment variables

### Third-Party Libraries
- **@tanstack/react-query**: Async state management
- **drizzle-orm**: Type-safe database queries
- **express-session**: Session middleware
- **passport**: Authentication middleware
- **zod**: Runtime type validation

### Development Tools
- Vite with HMR for frontend development
- Replit-specific plugins for development banners and error overlays

## Recent Changes (January 2026)

### Complete Feature Set (MVP)
All 13 feature phases implemented and tested:

1. **Notifications System**: Real-time notifications with bell icon, read/unread status, and dropdown menu
2. **Audit Logs**: Comprehensive logging of all user actions with filterable history view
3. **CPF/CNPJ Validation**: Full Brazilian document validation (client and server-side)
4. **Email Service (Mocked)**: Template-based email system ready for Resend/SendGrid integration
5. **Team Invitations**: Invite workflow with email notifications and public acceptance page
6. **Admin Features**: Account approval/rejection, suspend/reactivate, manual quota adjustment
7. **Advanced Metrics**: Dashboard with Churn/CAC/LTV/ARPU cards and MRR chart
8. **Bucket Lifecycle**: Versioning, lifecycle policies, object count, copy URL functionality
9. **Access Key Enhancements**: Download formats (.env, JSON, AWS), rotation, deactivation
10. **SFTP Credentials**: Mock SFTP access management with password reset
11. **Dashboard Enhancements**: Cost estimates, quota alerts (80%, 95%), quick actions
12. **Invoice System**: Usage tracking, invoice generation, PDF download
13. **Quota Request Workflow**: Request, approve/reject quota increases

### Bug Fixes
1. **Member Role Update Fix**: Changed `updateMemberRole` and `removeMember` in storage.ts to use `memberId` (numeric ID from accountMembers table) instead of `userId` string for more reliable updates.

2. **Landing Page Login Fix**: Changed all login buttons from using `<Link href="/api/login">` (wouter SPA routing) to `<a href="/api/login">` (regular navigation) so the browser properly navigates to the server endpoint.

3. **Account Status Default**: Changed default account status from "pending" to "active" so new accounts can immediately access the dashboard without approval (MVP behavior).

4. **Billing Page Usage Fix**: Changed `usage.storageUsedGB` to `usageData.storageUsedGB` to prevent undefined errors when usage data is loading.

### Design Decisions
- Access key secrets are hashed with SHA-256 and only shown once on creation
- Storage buckets and access keys are mocked (not connected to real S3/MinIO)
- Role-based access control enforced in backend routes (owner/admin for mutations)
- Primary color palette: #6300FF (primary), #2F0089 (dark), #8140FF (secondary), #EEF0F7 (light)
- Email service uses mocked implementation with console logging (ready for Resend/SendGrid)
- SFTP features are mocked for MVP (no actual server provisioning)