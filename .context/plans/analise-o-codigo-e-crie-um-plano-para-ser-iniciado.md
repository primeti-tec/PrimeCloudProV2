---
status: filled
generated: 2026-01-18
agents:
  - type: "devops-specialist"
    role: "Configure local development environment"
  - type: "backend-specialist"
    role: "Set up server and database"
  - type: "frontend-specialist"
    role: "Verify frontend builds and runs"
  - type: "database-specialist"
    role: "Configure PostgreSQL and run migrations"
docs:
  - "project-overview.md"
  - "development-workflow.md"
  - "tooling.md"
phases:
  - id: "phase-1"
    name: "Environment Setup"
    prevc: "P"
  - id: "phase-2"
    name: "Database Configuration"
    prevc: "E"
  - id: "phase-3"
    name: "Run & Verify"
    prevc: "V"
---

# Local Development Setup Plan

> Get PrimeCloudProV2 running on your local machine

## Task Snapshot
- **Primary goal:** Successfully run PrimeCloudProV2 locally for development
- **Success signal:** Application accessible at localhost with working authentication
- **Key references:**
  - [Project Overview](../docs/project-overview.md)
  - [Development Workflow](../docs/development-workflow.md)
  - [Tooling Guide](../docs/tooling.md)

## Codebase Context
- **Stack:** Express.js 5 + React 18 + PostgreSQL + Drizzle ORM
- **Build:** Vite for frontend, tsx for backend
- **Package Manager:** npm

## Agent Lineup
| Agent | Role in this plan | Playbook |
| --- | --- | --- |
| DevOps Specialist | Configure environment and build scripts | [devops-specialist.md](../agents/devops-specialist.md) |
| Backend Specialist | Verify server starts correctly | [backend-specialist.md](../agents/backend-specialist.md) |
| Frontend Specialist | Verify client builds and renders | [frontend-specialist.md](../agents/frontend-specialist.md) |
| Database Specialist | Set up PostgreSQL and schema | [database-specialist.md](../agents/database-specialist.md) |

## Prerequisites

### Required Software
| Software | Version | Purpose |
| --- | --- | --- |
| Node.js | v18+ | JavaScript runtime |
| npm | v9+ | Package manager |
| PostgreSQL | v14+ | Database |
| Git | Latest | Version control |

### Verify Installation
```bash
node --version    # Should show v18+
npm --version     # Should show v9+
psql --version    # Should show 14+
```

## Working Phases

### Phase 1 — Environment Setup

**Steps**
1. Clone the repository
   ```bash
   git clone <repository-url>
   cd PrimeCloudProV2
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Create environment configuration
   ```bash
   # Create .env file with required variables
   DATABASE_URL=postgresql://user:password@localhost:5432/primecloudpro
   SESSION_SECRET=your-development-secret
   ```

**Verification**
- [ ] `node_modules/` directory exists
- [ ] No npm install errors
- [ ] `.env` file configured

### Phase 2 — Database Configuration

**Steps**
1. Create PostgreSQL database
   ```bash
   createdb primecloudpro
   # Or using psql:
   psql -c "CREATE DATABASE primecloudpro;"
   ```

2. Push Drizzle schema to database
   ```bash
   npm run db:push
   ```

3. Verify tables created
   ```bash
   psql primecloudpro -c "\dt"
   # Should show: accounts, users, buckets, access_keys, etc.
   ```

**Verification**
- [ ] Database `primecloudpro` exists
- [ ] All tables created (accounts, users, buckets, etc.)
- [ ] No migration errors

### Phase 3 — Run & Verify

**Steps**
1. Start development server
   ```bash
   npm run dev
   ```

2. Verify server output
   ```
   Server started on port 5000
   Vite dev server running
   ```

3. Open browser
   - Navigate to `http://localhost:5000`
   - Verify login page loads
   - Test authentication flow

4. Check TypeScript
   ```bash
   npm run check
   # Should complete with no errors
   ```

**Verification**
- [ ] Server starts without errors
- [ ] Frontend loads at localhost:5000
- [ ] Login page renders correctly
- [ ] TypeScript check passes

## Troubleshooting

### Database Connection Errors
```
Error: Connection refused
```
**Solution:** Verify PostgreSQL is running and DATABASE_URL is correct

### Port Already in Use
```
Error: EADDRINUSE: address already in use :::5000
```
**Solution:** Kill existing process or change port

### Module Not Found
```
Error: Cannot find module 'X'
```
**Solution:** Run `npm install` again

### TypeScript Errors
```
Type errors found
```
**Solution:** Run `npm run check` and fix reported issues

## Quick Reference Commands

| Command | Purpose |
| --- | --- |
| `npm install` | Install dependencies |
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run check` | TypeScript type checking |
| `npm run db:push` | Push schema to database |

## Evidence & Follow-up

### Success Artifacts
- [ ] Screenshot of running application
- [ ] Server logs showing successful startup
- [ ] Database tables verified

### Next Steps After Setup
1. Review [Development Workflow](../docs/development-workflow.md)
2. Explore the codebase structure
3. Read [Architecture Notes](../docs/architecture.md)
4. Start with a small feature or bug fix
