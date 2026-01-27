---
status: filled
generated: 2026-01-26
agents:
  - type: "frontend-specialist"
    role: "Implementar interface fiel ao modelo"
  - type: "backend-specialist"
    role: "Garantir listagem segura de objetos"
  - type: "security-auditor"
    role: "Verificar escopo de acesso por bucket"
  - type: "test-writer"
    role: "Cobrir rotas e UI basica"
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

# Interface de Arquivos do Bucket (Admin e Externo)

Criar uma interface de visualizacao de arquivos dentro do bucket do cliente para admins e usuarios externos, seguindo fielmente o layout fornecido, com telas roxas sempre alinhadas ao padrao de white label.

## Task Snapshot
- **Primary goal:** fornecer um browser de arquivos do bucket com layout igual ao modelo HTML fornecido.
- **Success signal:** usuarios admin e externos conseguem navegar e visualizar objetos do bucket com a mesma estrutura visual do modelo.
- **White label:** telas roxas devem respeitar o padrao de white label (cores e branding da conta) em todos os temas.

## Design Summary
- **Layout:** sidebar clara com menu, header roxo (customizado via white label), toolbar com breadcrumbs e acoes, tabela de arquivos com hover e colunas responsivas.
- **Acesso:** mesma interface para admin e external_client, com permissao de leitura por bucket.
- **Componentizacao:** reutilizar pagina atual de bucket browser, ajustando estrutura para corresponder ao modelo.
- **Responsividade:** esconder colunas menos relevantes em telas menores.

## Working Phases
### Phase 1 -- Discovery & Alignment
1. Mapear tela atual de bucket browser e rotas relacionadas.
2. Validar como aplicar branding (header roxo) via white label.
3. Definir quais acoes estao disponiveis para admin e externo (somente leitura vs download).

### Phase 2 -- Implementation & Iteration
1. Atualizar UI do browser para seguir o modelo (sidebar, header, toolbar, tabela).
2. Aplicar cores do white label no header roxo e nos estados ativos.
3. Garantir listagem de objetos e metadados (nome, tamanho, data).
4. Ajustar responsividade (classes hide-mobile equivalentes).

### Phase 3 -- Validation & Handoff
1. Testar navegacao e listagem com usuario admin e external_client.
2. Testar white label em contas diferentes.
3. Documentar a estrutura e quaisquer limites de permissao.

## Risks & Mitigations
- **Risco:** divergencia visual do modelo. **Mitigacao:** seguir estrutura CSS e espacos do layout fornecido.
- **Risco:** conflito de branding. **Mitigacao:** aplicar cores do white label apenas nos pontos roxos do modelo.
- **Risco:** external_client ver buckets indevidos. **Mitigacao:** manter verificacao de permissao de bucket no backend.

## Evidence
- Capturas da tela em desktop e mobile.
- Registro de acesso em audit logs (se aplicavel).
