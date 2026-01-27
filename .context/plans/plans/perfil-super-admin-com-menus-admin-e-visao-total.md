---
status: filled
generated: 2026-01-22
agents:
  - type: "backend-specialist"
    role: "Define and enforce super admin capabilities"
  - type: "frontend-specialist"
    role: "Mirror /admin menus and navigation"
  - type: "security-auditor"
    role: "Validate access controls and audit"
  - type: "test-writer"
    role: "Add coverage for super admin access"
docs:
  - "architecture.md"
  - "security.md"
  - "development-workflow.md"
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

# Perfil Super Admin com Menus /admin

Criar um perfil super admin para o email `sergio.louzan@gmail.com` com menus iguais ao `/admin` e visao completa de contas, buckets e containers.

## Task Snapshot
- **Primary goal:** permitir que o super admin visualize tudo e todos os containers na plataforma.
- **Success signal:** super admin acessa menus `/admin`, enxerga todas as contas/buckets/containers, e operacoes ficam auditadas.
- **Key references:**
  - [Documentation Index](../docs/README.md)
  - [Agent Handbook](../agents/README.md)
  - [Plans Index](./README.md)

## Design Summary
- **Auth:** identificar super admin pelo email `sergio.louzan@gmail.com` no backend (regra centralizada).
- **UI:** replicar menus do `/admin` para o perfil super admin, mantendo mesma separacao por assuntos.
- **Data:** endpoints administrativos retornam todos os registros (sem filtro por accountId).
- **Audit:** registrar eventos de leitura e operacoes criticas do super admin.

## Working Phases
### Phase 1 -- Discovery & Alignment
1. Mapear menus e rotas atuais de `/admin`.
2. Definir a lista de recursos globais (contas, buckets, containers, logs, usuarios).
3. Definir quais operacoes sao leitura apenas e quais sao administrativas.

### Phase 2 -- Implementation & Iteration
1. Backend: criar util `isSuperAdmin(email)` e aplicar nas rotas administrativas.
2. Backend: habilitar listagens globais e, se necessario, novos endpoints para containers.
3. UI: espelhar menus `/admin` no perfil super admin e garantir visibilidade correta.
4. Auditoria: adicionar logs para acessos globais.

### Phase 3 -- Validation & Handoff
1. Testes: garantir que apenas o email permitido acessa o perfil super admin.
2. Testes: validar listagens globais e visibilidade de containers.
3. Documentacao: registrar regra do super admin e impactos.

## Risks & Mitigations
- **Risco:** acesso amplo sem controle granular. **Mitigacao:** auditoria e revisao de permissao por rota.
- **Risco:** divergencia de menus entre `/admin` e perfil super admin. **Mitigacao:** reutilizar componentes.
- **Risco:** performance em listagens globais. **Mitigacao:** paginacao e filtros.

## Evidence
- Capturas do menu e navegacao.
- Logs de auditoria para acessos globais.
- Resultado de `npm run test`.
