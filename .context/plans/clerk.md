---
status: filled
generated: 2026-01-18
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

# Clerk Plan

> Implementar autenticacao de usuarios com Clerk em todo o sistema (cliente e servidor), substituindo o fluxo atual, garantindo protecao de rotas, sessao confiavel e rotas publicas bem definidas, com padroes seguros por default.

## Task Snapshot
- **Primary goal:** Unificar a autenticacao com Clerk em todo o app, com login, cadastro, sessao e protecao de rotas no cliente e no servidor.
- **Success signal:** Usuarios conseguem autenticar via Clerk, rotas privadas bloqueiam acesso anonimo, API valida tokens, e testes basicos de acesso passam.
- **Key references:**
  - [Documentation Index](../docs/README.md)
  - [Agent Handbook](../agents/README.md)
  - [Plans Index](./README.md)

## Codebase Context
- **Total files analyzed:** 106
- **Total symbols discovered:** 172
- **Architecture layers:** Models, Controllers, Services, Utils, Components
- **Entry points:** server\index.ts, server\replit_integrations\auth\index.ts, client\src\main.tsx

### Key Components
**Core Classes:**
- `DatabaseStorage` — D:\PROJETOS\PRINECLOUDPROV2\PrimeCloudProV2\server\storage.ts:105

**Key Interfaces:**
- `OrderWithDetails` — D:\PROJETOS\PRINECLOUDPROV2\PrimeCloudProV2\shared\schema.ts:399
- `AccountWithDetails` — D:\PROJETOS\PRINECLOUDPROV2\PrimeCloudProV2\shared\schema.ts:405
- `IStorage` — D:\PROJETOS\PRINECLOUDPROV2\PrimeCloudProV2\server\storage.ts:12
- `EmailOptions` — D:\PROJETOS\PRINECLOUDPROV2\PrimeCloudProV2\server\services\email.ts:25
- `IAuthStorage` — D:\PROJETOS\PRINECLOUDPROV2\PrimeCloudProV2\server\replit_integrations\auth\storage.ts:7
## Agent Lineup
| Agent | Role in this plan | Playbook | First responsibility focus |
| --- | --- | --- | --- |
| Code Reviewer | Revisar integracao de auth e impacto em rotas | [Code Reviewer](../agents/code-reviewer.md) | Review code changes for quality, style, and best practices |
| Bug Fixer | Apoiar na correcoes durante migracao | [Bug Fixer](../agents/bug-fixer.md) | Analyze bug reports and error messages |
| Feature Developer | Implementar a integracao Clerk | [Feature Developer](../agents/feature-developer.md) | Implement new features according to specifications |
| Refactoring Specialist | Identificar trechos legados de auth | [Refactoring Specialist](../agents/refactoring-specialist.md) | Identify code smells and improvement opportunities |
| Test Writer | Cobrir rotas publicas/privadas e login | [Test Writer](../agents/test-writer.md) | Write comprehensive unit and integration tests |
| Documentation Writer | Atualizar guias de auth e onboarding | [Documentation Writer](../agents/documentation-writer.md) | Create clear, comprehensive documentation |
| Performance Optimizer | Verificar impacto de middleware | [Performance Optimizer](../agents/performance-optimizer.md) | Identify performance bottlenecks |
| Security Auditor | Validar modelo de seguranca e tokens | [Security Auditor](../agents/security-auditor.md) | Identify security vulnerabilities |
| Backend Specialist | Implementar validacao no servidor | [Backend Specialist](../agents/backend-specialist.md) | Design and implement server-side architecture |
| Frontend Specialist | Integrar provider e UI de login | [Frontend Specialist](../agents/frontend-specialist.md) | Design and implement user interfaces |
| Architect Specialist | Garantir arquitetura consistente | [Architect Specialist](../agents/architect-specialist.md) | Design overall system architecture and patterns |
| Devops Specialist | Garantir envs e deploy | [Devops Specialist](../agents/devops-specialist.md) | Design and maintain CI/CD pipelines |
| Database Specialist | Verificar impacto em dados de usuario | [Database Specialist](../agents/database-specialist.md) | Design and optimize database schemas |
| Mobile Specialist | Nao aplicavel no escopo atual | [Mobile Specialist](../agents/mobile-specialist.md) | Develop native and cross-platform mobile applications |

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
| Integracao incorreta de tokens no backend | Medium | High | Validar middleware com endpoints publicos/privados e testar com tokens reais | Backend |
| Quebra de fluxo atual de login | Medium | Medium | Migrar em ambiente de teste e manter fallback temporario | Frontend |
| Variaveis de ambiente faltando | Medium | Medium | Checklist de envs e validacao no start | Devops |

### Dependencies
- **Internal:** Ajustes em rotas do cliente e middlewares do servidor
- **External:** Conta Clerk com aplicacao configurada e chaves ativas
- **Technical:** Configurar variaveis Clerk no `.env` e build

### Assumptions
- Rotas publicas: landing, login, cadastro, reset de senha, docs/ajuda (se existirem)
- Rotas privadas: todo o restante do app (dashboard, pedidos, configuracoes, admin)
- Login: email/senha + OAuth Google (sem SSO corporativo nesta fase)
- Roles: nao implementar agora; apenas usuario autenticado
- Backend: todas as APIs exigem token, exceto healthcheck e rotas publicas
- Se a integracao exigir alteracoes profundas, replanejar escopo e cronograma

## Resource Estimation

### Time Allocation
| Phase | Estimated Effort | Calendar Time | Team Size |
| --- | --- | --- | --- |
| Phase 1 - Discovery | 1-2 person-days | 2-3 days | 1-2 people |
| Phase 2 - Implementation | 4-6 person-days | 1-2 weeks | 2 people |
| Phase 3 - Validation | 1-2 person-days | 2-4 days | 1-2 people |
| **Total** | **6-10 person-days** | **2-3 weeks** | **-** |

### Required Skills
- React/TypeScript, Express middleware, OAuth/JWT
- Conhecimento basico de Clerk e variaveis de ambiente

### Resource Availability
- **Available:** Dev frontend e backend dedicados
- **Blocked:** Nenhum no momento
- **Escalation:** Lider tecnico do projeto

## Working Phases
### Phase 1 — Discovery & Alignment
**Steps**
1. Mapear fluxo atual de autenticacao (cliente e servidor) e rotas protegidas.
2. Definir escopo: login e cadastro com email/senha e OAuth Google; sem SSO.
3. Definir rotas publicas e privadas (publicas: landing, login, cadastro, reset de senha, docs/ajuda).
4. Confirmar que todas as APIs privadas exigem token; excecoes: healthcheck e rotas publicas.
5. Confirmar requisitos de Clerk (publishable key, secret key, domains, redirects).
6. Revisar docs internas e registrar decisoes em `security.md` e `architecture.md`.

**Commit Checkpoint**
- After completing this phase, capture the agreed context and create a commit (for example, `git commit -m "chore(plan): complete phase 1 discovery"`).

### Phase 2 — Implementation & Iteration
**Steps**
1. Frontend: adicionar `ClerkProvider` no entrypoint e configurar `publishable key`.
2. Frontend: criar/ajustar rotas publicas e privadas (ex: guard de rota).
3. Frontend: telas de login/cadastro usando componentes do Clerk.
4. Backend: adicionar middleware de validacao de token Clerk para rotas privadas.
5. Backend: listar e isolar rotas publicas (healthcheck, auth callbacks se houver).
6. Configurar `.env` com chaves do Clerk e validar no bootstrap.
7. Migrar/desabilitar fluxo legado (ex: replit auth) e remover referencias antigas.
8. Adicionar testes basicos de acesso e documentar novos fluxos.

**Commit Checkpoint**
- Summarize progress, update cross-links, and create a commit documenting the outcomes of this phase (for example, `git commit -m "chore(plan): complete phase 2 implementation"`).

### Phase 3 — Validation & Handoff
**Steps**
1. Rodar `npm run test` e checar rotas publicas/privadas manualmente.
2. Validar login/logout no cliente e chamadas autenticadas no servidor.
3. Atualizar docs e registrar evidencias (logs, screenshots ou outputs).

**Commit Checkpoint**
- Record the validation evidence and create a commit signalling the handoff completion (for example, `git commit -m "chore(plan): complete phase 3 validation"`).

## Rollback Plan
## Tasks Detalhadas (Sem Assumir Codigo)
Preencher cada item com os caminhos reais e links do repositorio antes de iniciar implementacao.

### Frontend (client)
1. Inventariar rotas e telas publicas/privadas em `client/src/App.tsx` e `client/src/pages`.
2. Identificar entrypoint do React em `client/src/main.tsx` e o wrapper em `client/src/App.tsx`.
3. Mapear fluxo atual de login/cadastro em `client/src/pages/LandingPage.tsx` e `client/src/pages/CreateAccount.tsx`.
4. Revisar guard de rotas em `client/src/App.tsx` e auth hook em `client/src/hooks/use-auth.ts`.
5. Validar chamadas API autenticadas via `client/src/lib/queryClient.ts` e `client/src/hooks/use-auth.ts`.

### Backend (server)
1. Levantar middleware atual de autenticacao em `server/replit_integrations/auth/replitAuth.ts` e `server/replit_integrations/auth/routes.ts`.
2. Mapear uso do middleware em `server/routes.ts` e rotas publicas existentes.
3. Definir novo middleware de validacao Clerk substituindo `isAuthenticated` em `server/routes.ts`.
4. Verificar impacto em modelos/claims em `shared/models/auth.ts`.
5. Validar requisitos de CORS/headers no bootstrap `server/index.ts`.

### Configuracao e Secrets
1. Listar variaveis Clerk no `.env` e remover chaves Replit nao usadas.
2. Definir validacao de config no bootstrap em `server/index.ts`.
3. Atualizar pipeline/ambientes com novas chaves (referencia `package.json` para scripts).

### Testes e Docs
1. Definir cenarios minimos de acesso anonimo vs autenticado e registrar em `package.json` (scripts).
2. Atualizar `./.context/docs/security.md` e `./.context/docs/architecture.md`.
3. Registrar evidencias no final: outputs de testes e validacoes manuais.

Document how to revert changes if issues arise during or after implementation.

### Rollback Triggers
When to initiate rollback:
- Critical bugs affecting core functionality
- Performance degradation beyond acceptable thresholds
- Data integrity issues detected
- Security vulnerabilities introduced
- User-facing errors exceeding alert thresholds

### Rollback Procedures
#### Phase 1 Rollback
- Action: Discard discovery branch, restore previous documentation state
- Data Impact: None (no production changes)
- Estimated Time: < 1 hour

#### Phase 2 Rollback
- Action: Reverter commits de integracao e reativar auth antigo
- Data Impact: Nenhum, exceto tokens de sessao invalidados
- Estimated Time: 1-2 hours

#### Phase 3 Rollback
- Action: Rollback de deploy e limpeza de variaveis Clerk no ambiente
- Data Impact: Nenhum
- Estimated Time: 1 hour

### Post-Rollback Actions
1. Document reason for rollback in incident report
2. Notify stakeholders of rollback and impact
3. Schedule post-mortem to analyze failure
4. Update plan with lessons learned before retry

## Evidence & Follow-up

List artifacts to collect (logs, PR links, test runs, design notes). Record follow-up actions or owners.
**Artifacts sugeridos:**
- Registro de teste de login/logout
- Lista de rotas publicas/privadas validada
- Saida de `npm run test`
