```yaml
status: phase-2-complete
generated: 2026-01-19
last-updated: 2026-01-19
completed-items:
  - "All frontend pages translated to pt-BR"
  - "LandingPage.tsx - Landing page with Brazilian pricing (R$)"
  - "ApiKeys.tsx - API Keys management page"
  - "Storage.tsx - Storage/Buckets management page"
  - "Team.tsx - Team management page"
  - "Billing.tsx - Billing and plans page"
  - "Settings.tsx - User settings page"
  - "SftpAccess.tsx - SFTP access page"
  - "AuditLogs.tsx - Audit logs page"
  - "CreateAccount.tsx - Account creation page"
  - "Orders.tsx - Orders management page"
  - "AcceptInvite.tsx - Invitation acceptance page"
  - "not-found.tsx - 404 page"
  - "AdminDashboard.tsx - Admin dashboard page"
  - "Dashboard.tsx - Main dashboard (already in pt-BR)"
  - "email.ts - All email templates translated to pt-BR"
  - "notification.service.ts - All notifications already in pt-BR"
  - "Documentation translation (All .md files in .context/docs)"
pending-items:
  - "Unit and integration tests"
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
    role: "Identify performance bottlenecks in localized content"
  - type: "security-auditor"
    role: "Identify security vulnerabilities in localized content"
  - type: "backend-specialist"
    role: "Design and implement server-side architecture for localization"
  - type: "frontend-specialist"
    role: "Design and implement user interfaces with pt-BR localization"
  - type: "architect-specialist"
    role: "Design overall system architecture and patterns for localization"
  - type: "devops-specialist"
    role: "Design and maintain CI/CD pipelines for deploying localized content"
  - type: "database-specialist"
    role: "Design and optimize database schemas for localized content"
  - type: "mobile-specialist"
    role: "Develop native and cross-platform mobile applications with pt-BR localization"
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

# Pt Br Localization Plan

> Plano para traduzir todo o sistema Prime Cloud Pro para Português Brasileiro (pt-BR). Inclui: UI do frontend (labels, botões, mensagens), emails, notificações, erros, e documentação. Manter termos técnicos em inglês quando apropriado (ex: bucket, endpoint, access key, API, SFTP, etc).

## Task Snapshot
- **Primary goal:** To provide a fully localized pt-BR experience across the Prime Cloud Pro platform, encompassing UI elements, email communications, notification messages, and documentation while maintaining the clarity and accuracy suitable for our Brazilian user base and technical terminology in English.
- **Success signal:** Measurable KPIs include a 90% or higher satisfaction score from Brazilian users regarding language accuracy and clarity, a reduction in support tickets related to language comprehension, and complete translation of all identified text strings within the platform.
- **Key references:**
  - [Documentation Index](../docs/README.md)
  - [Agent Handbook](../agents/README.md)
  - [Plans Index](./README.md)

## Codebase Context
- **Codebase analysis:** The codebase includes a React frontend (`client/src`), an Express.js backend (`server`), shared models (`shared/models`), and various services (`server/services`).  UI components are located in `client/src/components` and `client/src/components/ui`. Email templates are generated in `server/services/email.ts`.

## Agent Lineup
| Agent | Role in this plan | Playbook | First responsibility focus |
| --- | --- | --- | --- |
| Code Reviewer | Ensures code quality and adherence to localization standards throughout the translation process. | [Code Reviewer](../agents/code-reviewer.md) | Review all code changes related to localization for consistency, accuracy, and best practices. |
| Bug Fixer | Addresses any bugs arising from the localization process, such as incorrect translations or display issues. | [Bug Fixer](../agents/bug-fixer.md) | Resolve any translation errors or UI issues reported by users or QA during validation. |
| Feature Developer | Implements the localization features and integrates them into the existing codebase. | [Feature Developer](../agents/feature-developer.md) | Implement the i18n library and integrate it into the frontend and backend. |
| Refactoring Specialist | Optimizes the codebase to facilitate easy localization and identify any code smells hindering the process. | [Refactoring Specialist](../agents/refactoring-specialist.md) | Refactor the codebase to extract strings into translation files and ensure efficient retrieval. |
| Test Writer | Writes comprehensive tests to ensure the accuracy and functionality of the localized content. | [Test Writer](../agents/test-writer.md) | Create unit and integration tests for components and services to ensure proper pt-BR translations are displayed. |
| Documentation Writer | Updates all documentation to reflect the pt-BR localization. | [Documentation Writer](../agents/documentation-writer.md) | Translate all documentation files (e.g., project-overview.md, architecture.md) into pt-BR. |
| Performance Optimizer | Identifies and resolves any performance bottlenecks introduced by the localization process. | [Performance Optimizer](../agents/performance-optimizer.md) | Monitor application performance and optimize localized content delivery for Brazilian users. |
| Security Auditor | Ensures that the localization process does not introduce any new security vulnerabilities. | [Security Auditor](../agents/security-auditor.md) | Review code changes to ensure that translated content does not introduce security vulnerabilities. |
| Backend Specialist | Configures the server-side infrastructure and services to support pt-BR localization. | [Backend Specialist](../agents/backend-specialist.md) | Implement locale-specific routing and content delivery on the backend. |
| Frontend Specialist | Implements the UI changes required for pt-BR localization. | [Frontend Specialist](../agents/frontend-specialist.md) | Adapt UI components to accommodate pt-BR text length and cultural differences. |
| Architect Specialist | Oversees the overall architecture and ensures that the localization strategy aligns with the system design. | [Architect Specialist](../agents/architect-specialist.md) | Define localization architecture, including file structure for localized content. |
| Devops Specialist | Sets up the CI/CD pipeline to automate the deployment of pt-BR localized content. | [Devops Specialist](../agents/devops-specialist.md) | Configure CI/CD pipeline to automatically build and deploy localized versions of the application. |
| Database Specialist | Ensures that the database schemas and queries support pt-BR localized content efficiently. | [Database Specialist](../agents/database-specialist.md) | Verify that the database supports pt-BR character sets and collation. |
| Mobile Specialist | Adapts mobile apps to support pt-BR localization for native and cross-platform development (currently not applicable but included for completeness). | [Mobile Specialist](../agents/mobile-specialist.md) | N/A (No current mobile app) |

## Documentation Touchpoints
| Guide | File | Primary Inputs |
| --- | --- | --- |
| Project Overview | [project-overview.md](../docs/project-overview.md) | Roadmap, README, stakeholder notes, translated into pt-BR |
| Architecture Notes | [architecture.md](../docs/architecture.md) | ADRs, service boundaries, dependency graphs, translated into pt-BR |
| Development Workflow | [development-workflow.md](../docs/development-workflow.md) | Branching rules, CI config, contributing guide, translated into pt-BR |
| Testing Strategy | [testing-strategy.md](../docs/testing-strategy.md) | Test configs, CI gates, known flaky suites, translated into pt-BR |
| Glossary & Domain Concepts | [glossary.md](../docs/glossary.md) | Business terminology, user personas, domain rules, translated into pt-BR (keeping technical terms in English) |
| Data Flow & Integrations | [data-flow.md](../docs/data-flow.md) | System diagrams, integration specs, queue topics, translated into pt-BR |
| Security & Compliance Notes | [security.md](../docs/security.md) | Auth model, secrets management, compliance requirements, translated into pt-BR |
| Tooling & Productivity Guide | [tooling.md](../docs/tooling.md) | CLI scripts, IDE configs, automation workflows, translated into pt-BR |

## Risk Assessment
Identify potential blockers, dependencies, and mitigation strategies before beginning work.

### Identified Risks
| Risk | Probability | Impact | Mitigation Strategy | Owner |
| --- | --- | --- | --- | --- |
| Dependency on external translation service | Medium | High | Establish clear communication channels, define SLAs, and have a backup translation service. | Architect Specialist |
| Insufficient test coverage | Low | Medium | Allocate time for writing more comprehensive tests in Phase 2. | Test Writer |
| Incorrect/Inaccurate Translations leading to user frustration | Medium | High | Utilize professional translation services, get the translations reviewed by native pt-BR speakers, and run user acceptance tests | Frontend Specialist |

### Dependencies
- **Internal:** UI Components, Email Service (`server/services/email.ts`), Notification Service (`server/services/notification.service.ts`), Error Handling
- **External:** Translation API (e.g., Google Translate, DeepL), localization library (e.g., i18next, react-intl)
- **Technical:** Node.js version, React version, i18n library setup

### Assumptions
- Assume the current API schema will remain stable during the localization process. If the assumption proves false, the Feature Developer and Backend Specialist have to re-evaluate their work.
- Assume translation service provides accurate pt-BR translations. If inaccurate, the strings must be manually edited.

## Resource Estimation

### Time Allocation
| Phase | Estimated Effort | Calendar Time | Team Size |
| --- | --- | --- | --- |
| Phase 1 - Discovery | 3 person-days | 5 days | 1-2 people |
| Phase 2 - Implementation | 10 person-days | 2 weeks | 2-3 people |
| Phase 3 - Validation | 5 person-days | 5 days | 2 people |
| **Total** | **18 person-days** | **3 weeks** | **-** |

### Required Skills
- React experience, TypeScript, i18n library knowledge, pt-BR fluency, API integration
- Skill Gaps: Deep understanding of i18n libraries may be required for some team members. Short on-boarding sessions will be provided by the Architect.

### Resource Availability
- **Available:** All listed agents are available and dedicated to the project.
- **Blocked:** None currently.
- **Escalation:** Architect Specialist

## Working Phases
### Phase 1 — Discovery & Alignment
**Steps**
1.  Architect Specialist: Analyze the codebase to identify all user-facing text strings within the frontend (`client/src/components`, `client/src/pages`), backend services (`server/services/email.ts`, `server/services/notification.service.ts`), and documentation files (`docs`). This includes UI elements, error messages, notifications, and email content. Accountable Owner: Architect Specialist.
2.  Architect Specialist: Select appropriate i18n library (i.e. i18next, react-intl) based on codebase structure and project requirements. Accountable Owner: Architect Specialist.
3.  Architect Specialist: Define the localization file structure and naming conventions for pt-BR translations, e.g., `client/src/locales/pt-BR/translation.json` and `server/locales/pt-BR/emails.json`. Accountable Owner: Architect Specialist.
4.  Backend Specialist: Identify all relevant environment variables that may need to be adjusted for localization (e.g., locale, timezone). Accountable Owner: Backend Specialist.
5.  Frontend Specialist: Determine how to dynamically switch locales in the UI. Accountable Owner: Frontend Specialist.

**Commit Checkpoint**
- After completing this phase, capture the agreed context and create a commit (for example, `git commit -m "chore(plan): complete phase 1 discovery"`).

### Phase 2 — Implementation & Iteration
**Steps**
1.  Feature Developer: Implement selected i18n library in the backend to load and serve pt-BR translations. Accountable Owner: Feature Developer.
2.  Feature Developer: Refactor the frontend codebase (using Refactoring Specialist) to replace hardcoded strings with calls to the i18n library for dynamic pt-BR translation retrieval. Accountable Owner: Feature Developer.
3.  Frontend Specialist: Implement a locale selection component in the UI, allowing users to switch between languages. Accountable Owner: Frontend Specialist.
4.  Documentation Writer: Translate all documentation files (`*.md` in `/docs`) into pt-BR. Accountable Owner: Documentation Writer.
5.  Bug Fixer: Resolve any translation or UI issues reported by the team. Accountable Owner: Bug Fixer.
6.  Code Reviewer: Review all code changes for adherence to localization standards.
7. Performance Optimizer: Optimize loading translated content.

**Commit Checkpoint**
- Summarize progress, update cross-links, and create a commit documenting the outcomes of this phase (for example, `git commit -m "chore(plan): complete phase 2 implementation"`).

### Phase 3 — Validation & Handoff
**Steps**
1.  Test Writer: Create unit and integration tests to verify the accuracy and functionality of the pt-BR translations. Accountable Owner: Test Writer.
2.  Frontend Specialist & Backend Specialist: Perform user acceptance testing with Brazilian users to gather feedback on language accuracy and clarity. Accountable Owner: Frontend Specialist & Backend Specialist.
3.  Documentation Writer: Ensure that all documentation is correctly translated and formatted in pt-BR. Accountable Owner: Documentation Writer.
4.  Devops Specialist: Configure the CI/CD pipeline to automatically build and deploy the localized version of the Prime Cloud Pro platform. Accountable Owner: Devops Specialist.

**Commit Checkpoint**
- Record the validation evidence and create a commit signalling the handoff completion (for example, `git commit -m "chore(plan): complete phase 3 validation"`).

## Rollback Plan
Document how to revert changes if issues arise during or after implementation.

### Rollback Triggers
When to initiate rollback:
- Critical bugs affecting core functionality related to localization
- Performance degradation specifically for pt-BR users
- Data integrity issues detected in pt-BR translations
- Security vulnerabilities introduced by the localization process
- User-facing errors exceeding alert thresholds for pt-BR users

### Rollback Procedures
#### Phase 1 Rollback
- Action: Discard discovery branch, restore previous documentation state.
- Data Impact: None (no production changes).
- Estimated Time: < 1 hour.

#### Phase 2 Rollback
- Action: Revert commits related to i18n implementation, remove translation files, and restore the codebase to its pre-localization state.
- Data Impact: Potential loss of translated strings. Review all commits of the Frontend Specialist and Feature Developer agents.
- Estimated Time: 2-4 hours

#### Phase 3 Rollback
- Action: Full deployment rollback to the previous version, revert CI/CD pipeline changes. Ensure the application reverts to the default (English) locale.
- Data Impact: Potential data inconsistencies if the database schema was modified for localization.
- Estimated Time: 1-2 hours

### Post-Rollback Actions
1. Document reason for rollback in incident report
2. Notify stakeholders of rollback and impact
3. Schedule post-mortem to analyze failure
4. Update plan with lessons learned before retry

## Evidence & Follow-up

List artifacts to collect (logs, PR links, test runs, design notes). Record follow-up actions or owners.
```
