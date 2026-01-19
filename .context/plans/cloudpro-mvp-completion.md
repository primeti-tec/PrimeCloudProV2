```yaml
status: unfilled
generated: 2026-01-19
agents:
  - type: "code-reviewer"
    role: "Review code changes for quality, style, and best practices"
  - type: "bug-fixer"
    role: "Analyze bug reports and error messages"
  - type: "feature-developer"
    role: "Implement new features according to specifications"
  - type: "refactoring-specialist"
    role: "Identify code smells and improvement opportunities"
  - type: "test-writer"
    role: "Write comprehensive unit and integration tests"
  - type: "documentation-writer"
    role: "Create clear, comprehensive documentation"
  - type: "performance-optimizer"
    role: "Identify performance bottlenecks"
  - type: "security-auditor"
    role: "Identify security vulnerabilities"
  - type: "backend-specialist"
    role: "Design and implement server-side architecture"
  - type: "frontend-specialist"
    role: "Design and implement user interfaces"
  - type: "architect-specialist"
    role: "Design overall system architecture and patterns"
  - type: "devops-specialist"
    role: "Design and maintain CI/CD pipelines"
  - type: "database-specialist"
    role: "Design and optimize database schemas"
  - type: "mobile-specialist"
    role: "Develop native and cross-platform mobile applications"
docs:
  - "project-overview.md"
  - "architecture.md"
  - "development-workflow.md"
  - "testing-strategy.md"
  - "glossary.md"
  - "data-flow.md"
  - "security.md"
  - "tooling.md"
phases:
  - id: "phase-1"
    name: "Discovery & Alignment"
    prevc: "P"
  - id: "phase-2"
    name: "Implementation & Iteration"
    prevc: "E"
  - id: "phase-3"
    name: "Validation & Handoff"
    prevc: "V"
---

# Cloudpro Mvp Completion Plan

> Plano para completar as funcionalidades pendentes do MVP baseado no PRD-FINAL-CloudStorage.md. Foco em: integração MinIO, billing automatizado, SFTPGo, emails, e notificações.

## Task Snapshot
- **Primary goal:** Fully implement MinIO integration, automated billing, SFTPGo integration, email services, and notifications as specified in PRD-FINAL-CloudStorage.md.
- **Success signal:** All features related to storage (MinIO), billing, SFTPGo, emails and notifications function according to specification, passing automated testing, and acceptance testing on staging.
- **Key references:**
  - [Documentation Index](../docs/README.md)
  - [Agent Handbook](../agents/README.md)
  - [Plans Index](./README.md)

## Codebase Context
- **Codebase analysis:** *No codebase insights available.*

## Agent Lineup
| Agent | Role in this plan | Playbook | First responsibility focus |
| --- | --- | --- | --- |
| Code Reviewer | Ensure code quality is upheld throughout the implementation | [Code Reviewer](../agents/code-reviewer.md) | Review code changes for quality, style, and best practices |
| Bug Fixer | Resolve any emergent bugs during development and testing | [Bug Fixer](../agents/bug-fixer.md) | Analyze bug reports and error messages |
| Feature Developer | Implement the core features according to specifications | [Feature Developer](../agents/feature-developer.md) | Implement MinIO integration, focusing on the `server/storage.ts` file. |
| Refactoring Specialist | Improve code structure and maintainability as new features are added | [Refactoring Specialist](../agents/refactoring-specialist.md) | Identify code smells and improvement opportunities in existing services. |
| Test Writer | Develop comprehensive tests for new functionalities | [Test Writer](../agents/test-writer.md) | Write comprehensive unit and integration tests for MinIO integration |
| Documentation Writer | Update documentation with all the new features | [Documentation Writer](../agents/documentation-writer.md) | Create clear, comprehensive documentation for new features and modifications. |
| Performance Optimizer | Ensure that the new functionalities don't impact the system performance | [Performance Optimizer](../agents/performance-optimizer.md) | Identify performance bottlenecks |
| Security Auditor | Audit implementations, especially authentication and authorization around SFTPGo | [Security Auditor](../agents/security-auditor.md) | Identify security vulnerabilities |
| Backend Specialist | Implement server-side logic for billing and notifications | [Backend Specialist](../agents/backend-specialist.md) | Design and implement server-side architecture for billing in `server/services`. |
| Frontend Specialist | Implement UI components for billing information and notifications | [Frontend Specialist](../agents/frontend-specialist.md) | Design and implement user interfaces for `client/src/pages/Billing.tsx` |
| Architect Specialist | Ensure features align with the overall system | [Architect Specialist](../agents/architect-specialist.md) | Design overall system architecture and patterns |
| Devops Specialist | Handle CI/CD for the new features | [Devops Specialist](../agents/devops-specialist.md) | Design and maintain CI/CD pipelines |
| Database Specialist | Optimize database interactions related to billing | [Database Specialist](../agents/database-specialist.md) | Design and optimize database schemas for billing. |
| Mobile Specialist | N/A | [Mobile Specialist](../agents/mobile-specialist.md) | N/A |

## Documentation Touchpoints
| Guide | File | Primary Inputs |
| --- | --- | --- |
| Project Overview | [project-overview.md](../docs/project-overview.md) | Roadmap, README, stakeholder notes |
| Architecture Notes | [architecture.md](../docs/architecture.md) | ADRs, service boundaries, dependency graphs |
| Development Workflow | [development-workflow.md](../docs/development-workflow.md) | Branching rules, CI config, contributing guide |
| Testing Strategy | [testing-strategy.md](../docs/testing-strategy.md) | Test configs, CI gates, known flaky suites |
| Glossary & Domain Concepts | [glossary.md](../docs/glossary.md) | Business terminology, user personas, domain rules |
| Data Flow & Integrations | [data-flow.md](../docs/data-flow.md) | System diagrams, integration specs, queue topics |
| Security & Compliance Notes | [security.md](../docs/security.md) | Auth model, secrets management, compliance requirements |
| Tooling & Productivity Guide | [tooling.md](../docs/tooling.md) | CLI scripts, IDE configs, automation workflows |

## Risk Assessment
Identify potential blockers, dependencies, and mitigation strategies before beginning work.

### Identified Risks
| Risk | Probability | Impact | Mitigation Strategy | Owner |
| --- | --- | --- | --- | --- |
| Dependency on external MinIO API changes | Medium | High | Monitor MinIO release notes, establish fallback plan | Backend Specialist |
| Insufficient test coverage for billing | Low | Medium | Allocate time for test writing in Phase 2, prioritize critical billing scenarios | Test Writer |

### Dependencies
- **Internal:** Account and Subscription models need to be stable before billing implementation; UI components from shared component library
- **External:** MinIO service availability, SFTPGo API stability, Email provider API.
- **Technical:** Access keys must be securely stored and accessible for MinIO and SFTPGo integrations.

### Assumptions
- Assume current API schema from external services (MinIO, SFTPGo, Email Provider) remains stable.
- If these services change, integrations break, so a contingency plan is needed.

## Resource Estimation

### Time Allocation
| Phase | Estimated Effort | Calendar Time | Team Size |
| --- | --- | --- | --- |
| Phase 1 - Discovery | 3 person-days | 3-5 days | 2 people |
| Phase 2 - Implementation | 10 person-days | 1-2 weeks | 3-4 people |
| Phase 3 - Validation | 5 person-days | 3-5 days | 2-3 people |
| **Total** | **18 person-days** | **2-3 weeks** | **-** |

### Required Skills
- React experience, TypeScript proficiency, Database optimization, Infrastructure knowledge, Familiarity with MinIO, SFTPGo and email provider APIs
- Potential skill gap: In-depth knowledge on integrating 3rd party APIs

### Resource Availability
- **Available:** Feature Developer, Backend Specialist, Frontend Specialist, Test Writer, Code Reviewer, Architect Specialist
- **Blocked:** None identified
- **Escalation:** Project Manager if resources are insufficient

## Working Phases
### Phase 1 — Discovery & Alignment
**Steps**
1.  Review the PRD-FINAL-CloudStorage.md document to confirm requirements, and assign the Feature Developer.
2.  Identify open questions regarding integration details with MinIO, SFTPGo, and the billing provider. Clarify any ambiguities in the PRD.
3.  Create class diagrams for the models affected. Reference `shared/schema.ts`.
4.  List the routes that will require creating. Reference `shared/routes.ts`.
5.  List the existing services that will require adapting. Reference `\server\services`.

**Commit Checkpoint**
- After completing this phase, capture the agreed context and create a commit (for example, `git commit -m "chore(plan): complete phase 1 discovery"`).

### Phase 2 — Implementation & Iteration
**Steps**
1.  Implement MinIO integration in `server/storage.ts`, focusing on bucket creation and object storage. Pair Feature Developer with Backend Specialist. Define a review cadence of daily standups.
2.  Implement automated billing logic in `server/services`, integrating with billing provider API. Reference existing email service for sending invoices, located in `server/services/email.ts`.
3.  Implement SFTPGo integration, focusing on user authentication and file transfer mechanisms. Reference security documentation, especially authentication and authorization best practices, at `docs/security.md`.
4.  Develop UI components for billing information in `client/src/pages/Billing.tsx`, pulling in shared UI components where available. Ensure responsiveness across devices.
5.  Write unit and integration tests for each component and integration, with guidance from the Test Writer.
6.  Implement notification system.

**Commit Checkpoint**
- Summarize progress, update cross-links, and create a commit documenting the outcomes of this phase (for example, `git commit -m "chore(plan): complete phase 2 implementation"`).

### Phase 3 — Validation & Handoff
**Steps**
1.  Perform end-to-end testing on staging environment, covering all new functionalities.
2.  Verify data integrity across MinIO, SFTPGo, and database.
3.  Update `architecture.md` documentation with details of MinIO and SFTPGo integrations, detailing data flow in `data-flow.md`, and security considerations in `security.md`.
4.  Prepare demonstration for stakeholders.
5.  Document the validation evidence for future maintainers.

**Commit Checkpoint**
- Record the validation evidence and create a commit signalling the handoff completion (for example, `git commit -m "chore(plan): complete phase 3 validation"`).

## Rollback Plan
Document how to revert changes if issues arise during or after implementation.

### Rollback Triggers
When to initiate rollback:
- Critical bugs affecting core functionality (e.g., billing failure)
- Performance degradation beyond acceptable thresholds
- Data integrity issues detected (e.g., corrupted storage)
- Security vulnerabilities introduced
- User-facing errors exceeding alert thresholds

### Rollback Procedures
#### Phase 1 Rollback
- Action: Discard discovery branch, restore previous documentation state
- Data Impact: None (no production changes)
- Estimated Time: < 1 hour

#### Phase 2 Rollback
- Action: Revert commits, restore database to pre-migration snapshot from before billing schema changes and SFTPGo integration.
- Data Impact: Loss of billing data created during testing. Account data will be reverted to previous state.
- Estimated Time: 2-4 hours

#### Phase 3 Rollback
- Action: Full deployment rollback, restore previous version
- Data Impact: Potential data inconsistencies between database and storage if rollback occurs after data migration. Document data synchronization requirements to address such discrepancies.
- Estimated Time: 1-2 hours

### Post-Rollback Actions
1. Document reason for rollback in incident report
2. Notify stakeholders of rollback and impact
3. Schedule post-mortem to analyze failure
4. Update plan with lessons learned before retry

## Evidence & Follow-up

List artifacts to collect (logs, PR links, test runs, design notes). Record follow-up actions or owners.
```
