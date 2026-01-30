# Development Workflow (PrimeCloudProV2)

This document describes the standard engineering workflow for **PrimeCloudProV2**, including how to pick up work, create branches, run the project locally, verify changes, and ship releases. Following this workflow keeps `main` deployable, reduces integration risk, and ensures consistent quality across backend and frontend changes.

Related docs:
- [testing-strategy.md](testing-strategy.md) — what to test and where tests live
- [tooling.md](tooling.md) — repository conventions and AI-assisted development guidance

---

## Repository Orientation (What lives where)

PrimeCloudProV2 follows a clear separation of concerns:

- **Backend (API + services)**: `server/`
  - Request routing: `server/routes/`
  - Business logic: `server/services/`
  - Utilities: `server/lib/`
  - Cron jobs: `server/cron/usage-collector.ts`
  - Auth integration: `server/replit_integrations/auth/` (notably `setupAuth`)
- **Frontend (Vite + React)**: `client/src/`
  - Pages: `client/src/pages/`
  - Components: `client/src/components/`
  - Shared UI primitives: `client/src/components/ui/`
  - Client utilities: `client/src/lib/` (notably `apiRequest`, `cn`)
- **Shared contracts/schemas**: `shared/`
  - Data model + request schemas (Zod): `shared/schema.ts`
  - Route helpers: `shared/routes.ts` (e.g., `buildUrl`)
- **Scripts / maintenance**:
  - One-off scripts: `scripts/` and `script/` (both exist)
- **Tests**:
  - End-to-end / integration style tests: `testsprite_tests/`
  - UI/component tests may exist under `tests/`

When implementing:
- Put backend logic in **`server/services/*`** and call it from routes/controllers.
- Put UI features in **`client/src/pages/*`**, extracting reusable pieces into **`client/src/components/*`**.
- Add or update data contracts in **`shared/schema.ts`** (and keep them safe/backward compatible).

---

## Day-to-Day Workflow

### 1) Task Selection
- Pick a ticket from the project board or onboarding task list.
- Clarify scope and acceptance criteria before coding (especially for billing, auth, or storage).

### 2) Sync Your Environment
Keep your local repo aligned with `main` before starting:

```bash
git checkout main
git pull
```

If you already have a branch, rebase (preferred) or merge from `main` to reduce drift.

### 3) Implement the Change
Follow established patterns:

- **Backend**
  - Add/extend logic in `server/services/` (e.g., storage logic in `server/services/minio.service.ts`)
  - Keep route handlers thin; validate inputs using shared Zod schemas from `shared/schema.ts`
  - Ensure endpoints requiring auth use the project’s auth middleware (see `setupAuth` in `server/replit_integrations/auth/`)

- **Frontend**
  - Use existing UI primitives from `client/src/components/ui`
  - Follow styling conventions (e.g., `cn` utility from `client/src/lib/utils.ts`)
  - Prefer existing data fetching patterns (TanStack Query usage can be seen in pages like `client/src/pages/Dashboard.tsx`)
  - Use `apiRequest` from `client/src/lib/queryClient.ts` for API calls

### 4) Verify Locally
At minimum, verify:
- The API starts
- The UI renders your changes
- The feature works end-to-end
- Tests (where applicable) pass

Typical verification flow:
- Run the dev server
- Exercise the feature in the UI
- Run any relevant scripts/tests (see below)

### 5) Update Documentation
Update docs when your change impacts:
- API endpoints or request/response contracts
- Database schema or Zod contracts in `shared/schema.ts`
- Complex services, integrations, or operational scripts
- Any behavior that another developer/operator needs to know to safely deploy or debug

### 6) Open a Pull Request
Open a PR only when:
- Local checks are green
- The feature is verified
- Documentation is updated (if applicable)

PR description should include:
- What changed and why
- How to test (step-by-step)
- Any migration/config notes
- Screenshots for UI changes

---

## Branching & Releases

### Branching Model (Modified Trunk-Based Development)
- **`main` is the source of truth** and must remain deployable.
- Work happens in **short-lived feature branches**.

### Branch Naming
Use one of:
- `feat/description-of-feature`
- `fix/description-of-bug`
- `chore/maintenance-task`

Examples:
- `feat/team-invitations`
- `fix/minio-timeout-retry`
- `chore/update-deps-jan`

### Release Cadence
- Merges to `main` are deployed to **staging automatically**
- **Production** releases occur **weekly** after successful staging smoke tests

### Tagging (Semantic Versioning)
Tag production releases:

```bash
git tag -a vX.Y.Z -m "Release message"
git push --tags
```

Use SemVer conventions:
- **MAJOR**: breaking changes
- **MINOR**: backward-compatible feature
- **PATCH**: backward-compatible fix

---

## Local Development

### Install Dependencies
```bash
npm install
```

### Environment Configuration
1. Copy `.env.example` to `.env`
2. Fill in required credentials for:
   - PostgreSQL
   - MinIO
   - SFTPGo

Tip: if something fails at runtime, check for missing/incorrect env vars first, especially around storage/auth integrations.

### Database Setup
Apply schema changes to the database:

```bash
npm run db:push
```

If your change modifies `shared/schema.ts`, ensure the DB update path is correct and safe.

### Run the Development Server
Starts backend API and Vite frontend proxy:

```bash
npm run dev
```

### Build for Distribution
Compiles frontend assets and prepares server output:

```bash
npm run build
```

### Useful Maintenance Scripts
These scripts are commonly used when working on storage/database issues:

```bash
# Test MinIO connection
npx tsx scripts/test-minio.ts

# Run database tests
npx tsx scripts/db_test.ts
```

Other storage-related maintenance utilities may exist under `script/` (note the singular folder).

---

## Code Review Expectations

All changes must be peer-reviewed before merging into `main`.

### Reviewer Checklist

**Functionality**
- Does the change meet the ticket acceptance criteria?
- Are edge cases handled (empty states, errors, retries, permissions)?

**Schema Safety**
- If `shared/schema.ts` changed:
  - Are changes backward compatible?
  - Is there a safe rollout path (and DB update path via `db:push` or migration strategy)?
  - Are Zod schemas updated consistently with server routes and client usage?

**Security**
- Are sensitive endpoints protected by authentication/authorization?
- Are inputs validated using Zod schemas?
- Are secrets/config not logged?
- For auth-related work, verify correct usage of `setupAuth` (see `server/replit_integrations/auth/`).

**Consistency**
- Backend logic belongs in `server/services/` (routes/controllers should orchestrate, not implement business logic)
- UI uses standard components from `client/src/components/ui`
- Styling uses the established utility conventions (e.g., `cn`)

**Testing**
- Are tests added/updated where appropriate?
- Are relevant flows covered in `testsprite_tests/` (or unit tests if present/appropriate)?

### Approval Requirements
- At least **one senior engineer approval** is required for changes to core services:
  - Billing
  - MinIO/storage
  - Auth
- For AI-assisted development, cross-check generated code against conventions described in [tooling.md](tooling.md)

---

## Onboarding Tasks (Recommended Path)

If you’re new to the repo, use this sequence to get productive quickly:

1. **UI patterns**
   - Review `client/src/pages/Dashboard.tsx`
   - Focus on layout conventions and TanStack Query data fetching patterns

2. **Storage service patterns**
   - Review `server/services/minio.service.ts`
   - Understand how buckets/objects/metrics are accessed and how errors are handled

3. **Data model and contracts**
   - Read `shared/schema.ts`
   - Understand how Accounts, Buckets, Users, Billing entities, and requests are represented and validated

4. **Pick a starter issue**
   - Find `good-first-issue` tickets (often UI polish or logging improvements)

For deeper testing guidance and where to add coverage, see: [testing-strategy.md](testing-strategy.md).
