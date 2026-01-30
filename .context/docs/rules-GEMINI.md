# Gemini AI Rules for PrimeCloudProV2 (`docs/rules-GEMINI.md`)

This document defines the governance rules for AI agents working in the **PrimeCloudProV2** repository. It is the “source of truth” for **how** an agent should read the workspace, classify requests, plan work, generate code, and verify changes before considering any task complete.

Use this as the primary reference when you’re:
- Running an AI-assisted change (feature, refactor, fix)
- Reviewing AI-generated PRs
- Adding new agent personas or skill modules under `.agent/`

---

## Purpose and Scope

`docs/rules-GEMINI.md` establishes the **Antigravity Kit**: a set of protocols, behavioral constraints, and technical standards intended to ensure:

- Consistent engineering quality across AI contributions
- Security-first behavior and verifiable outputs
- Correctness and minimal regressions through mandatory checks
- Architectural alignment (server/services vs routes vs shared vs client)
- Predictable interaction patterns (when the agent can code vs must ask questions)

This file is **repository-wide** and applies to all agents and all tasks unless a higher-priority rule overrides it.

---

## Rule Priority Hierarchy (P0 → P2)

The rules are applied in strict priority order. If two rules conflict, the higher priority wins.

### P0 — Universal Workspace Rules
1. **`GEMINI.md`** (Universal Workspace Rules)

This is the top-level contract for the whole workspace. Agents must read this first.

### P1 — Agent-Specific Rules
2. Agent persona files such as:
   - `backend-specialist.md`
   - `frontend-specialist.md`
   - `mobile-developer.md`
   - etc.

These define domain-specific constraints (e.g., UI “template bans”, coding conventions, performance requirements).

### P2 — Skill Modules
3. Skill documentation under:
- `.agent/skills/`

Skills can define:
- required patterns (e.g., clean code)
- required scripts
- validation steps
- domain-specific checklists

**Non-negotiable:** For non-trivial work, agents must read the relevant agent persona file(s) and any referenced skill docs before proposing or implementing changes.

---

## Core Philosophy: Read → Understand → Apply

The governing principle is: **do not implement before understanding**.

### What “Read” means
- Open and scan the relevant files
- Identify affected modules and dependencies
- Locate existing patterns in similar code paths

### What “Understand” means
- Confirm the architectural role of the code (client vs server vs shared)
- Understand the data model impact (especially `shared/schema.ts`)
- Identify security implications (auth, secrets, access control)
- Consider how existing services interact (e.g., billing, minio, audit, notifications)

### What “Apply” means
- Follow existing conventions (naming, error handling, logging, validation)
- Use required testing/verification scripts
- Avoid changes that violate boundaries (e.g., business logic leaking into UI)

---

## Request Classification & Routing

Every incoming request must be classified into a tier that determines:
- how much analysis is required
- whether code can be written immediately
- which specialist agent persona should be used

### Classification Matrix

| Type | Trigger (examples) | Action |
| --- | --- | --- |
| **Question** | “Explain…”, “How does…” | **Tier 0** (Text response only) |
| **Survey/Intel** | “Analyze…”, “List files…” | **Tier 0 + Explorer** (collect session intel) |
| **Simple Code** | Single-file fix/edit | **Tier 1 Lite** (direct edit allowed) |
| **Complex Code** | “Build…”, “Refactor…”, “Implement…” | **Tier 1 Full** + specialist agent + task slug |
| **Design/UI** | “Dashboard…”, “Page design…” | **Tier 1** + frontend specialist |

### Intelligent Routing (Domain Detection)
The system should pick the correct specialist persona based on the dominant domain:

- **Frontend/UI work** → `frontend-specialist`
- **API/DB/backend** → `backend-specialist`
- **Mobile** → `mobile-developer`
- **Security-sensitive** tasks should escalate to security practices even if not explicitly requested.

---

## Development Protocols

### 1) The Socratic Gate (Mandatory for complex tasks)
For **complex features or refactors**, agents are forbidden from writing code immediately.

They must first ask **at least three** strategic clarification questions that expose:
- edge cases
- acceptance criteria
- trade-offs (security, backward compatibility, performance, rollout plan)

Examples of qualifying Socratic Gate questions:
- “What is the expected behavior for existing accounts/data during migration?”
- “Do we need backwards compatibility for existing API clients?”
- “What’s the security model for this endpoint (roles, scopes, audit logging)?”
- “What are the performance constraints and expected payload sizes?”

If these questions are unanswered, the agent should remain in **Ask Mode** or **Plan Mode**.

### 2) Clean Code Standards (`@[skills/clean-code]`)
All generated code must follow the “clean code” skill rules. Key expectations:

- **Self-documenting code** over excessive commentary
- **Tests are mandatory** and should use **AAA**:
  - Arrange
  - Act
  - Assert
- **Performance** must align with modern web expectations (2025 Core Web Vitals mentioned in the rules)
- **Dependency awareness**: before changing core shared modules (e.g., `shared/schema.ts`), verify impact on downstream services.

#### Dependency awareness example (important in this repo)
Changes to shared schema or shared route contracts can ripple through:
- `server/services/*` (e.g., `BillingService`, `MinioService`, `AuditService`)
- `server/routes/*`
- client hooks/pages consuming API responses

Agents should check repository architecture docs (e.g., `ARCHITECTURE.md` when present) and search for schema type usage before modifying shared models.

---

## Behavioral Modes

Agents operate in different “modes” depending on the request type and stage.

### Plan Mode
A structured methodology is required:

1. **Analysis**
2. **Planning**
3. **Solutioning**
4. **Implementation**

**Constraint:** No code is written until Phase 4.

Use Plan Mode for:
- complex features
- cross-module refactors
- anything that might require migration/testing/rollout planning

### Ask Mode
Discovery-only mode focused on:
- clarifying requirements
- surfacing constraints
- confirming expected behavior

Use Ask Mode when:
- acceptance criteria aren’t clear
- the request impacts data/security
- the user hasn’t specified target behavior

### Edit Mode
Direct execution mode intended for:
- small edits
- single-file fixes
- straightforward changes with low ambiguity

---

## Verification & “Done” Definition

A task is **not complete** until verification passes. The rules specify a final gate:

- `.agent/scripts/checklist.py` must return success (the full project audit/deployment verification)

### Audit/Verification Order
When running checks, follow this sequence:

1. **Security**
2. **Lint**
3. **Schema**
4. **Tests**
5. **UX/SEO**
6. **Performance**

This ordering is designed to fail fast on high-risk issues (security/schema) before spending time on polish/perf.

### Key Utility Scripts (Referenced by this policy)

| Script Path | Purpose |
| --- | --- |
| `.agent/scripts/checklist.py` | Full project audit and deployment verification |
| `.agent/skills/vulnerability-scanner/scripts/security_scan.py` | Security scan before deployment |
| `.agent/skills/database-design/scripts/schema_validator.py` | Validates Drizzle schema changes in `shared/schema.ts` |
| `.agent/skills/testing-patterns/scripts/test_runner.py` | Runs unit/integration tests |

**Practical expectation for contributors:** If an AI change touches schema or auth, reviewers should request evidence that these scripts were run (or run them in CI).

---

## Repository-Specific Conventions Enforced by These Rules

### Language Policy
- Prompts may be translated internally by the agent
- **Code, variable names, and comments must remain in English**

### Architectural Boundaries
This repo follows modular separation (high level):
- **Server**: `server/` (routes, services, cron)
- **Shared contracts/models**: `shared/` (schema, routes, shared models)
- **Client**: `client/src/` (pages, components, hooks)
- **Services** (backend): `server/services/*` (e.g., MinIO, billing, audit)

Agents must avoid:
- embedding business logic directly in UI components
- bypassing service layers with ad-hoc route logic
- changing shared contracts without checking all consumers

### UI Restrictions (when applicable)
Frontend work must follow any specialist rules such as:
- “Anti-cliché” UI constraints
- “Template Ban” constraints
- Avoiding default purple/violet themes unless explicitly requested

These are usually defined in the frontend specialist persona file (P1).

---

## How Developers Should Use This Document

### When starting an AI-assisted task
1. Ensure the agent is aware of `docs/rules-GEMINI.md`
2. Confirm it will read `GEMINI.md` (P0) and the relevant specialist persona file (P1)
3. For complex work, enforce the Socratic Gate (≥ 3 questions) before allowing implementation

### When reviewing AI-generated changes
Use this checklist aligned with the rules:
- Did the agent respect architecture boundaries (server vs shared vs client)?
- If `shared/schema.ts` changed, was schema validation performed and consumers updated?
- Are tests added/updated using AAA?
- Were security concerns addressed first (auth, secrets, permissions, audit logs)?
- Did `.agent/scripts/checklist.py` pass (or equivalent CI steps)?

---

## Related Files and Where to Look Next

- **Universal rules (P0):** `GEMINI.md`
- **Agent personas (P1):** e.g., `backend-specialist.md`, `frontend-specialist.md`
- **Skills (P2):** `.agent/skills/`
- **Shared schema/contracts:** `shared/schema.ts`, `shared/routes.ts`
- **Backend services:** `server/services/*`
- **Backend routing:** `server/routes/*`
- **Client UI/hooks:** `client/src/pages/*`, `client/src/hooks/*`, `client/src/components/*`

If you’re modifying anything that affects API contracts or persisted data, cross-check the shared layer first and follow the verification script chain in the prescribed order.
