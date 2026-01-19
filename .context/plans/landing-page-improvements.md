---
status: ready
generated: 2026-01-19
agents:
  - type: "frontend-specialist"
    role: "Implementar melhorias de UI/UX na landing page"
  - type: "code-reviewer"
    role: "Revisar qualidade do código e consistência"
  - type: "test-writer"
    role: "Adicionar testes para novos componentes"
docs:
  - "project-overview.md"
  - "development-workflow.md"
phases:
  - id: "phase-1"
    name: "Análise Comparativa"
    prevc: "P"
  - id: "phase-2"
    name: "Implementação"
    prevc: "E"
  - id: "phase-3"
    name: "Validação e Ajustes"
    prevc: "V"
---

# Melhorias da Landing Page - Prime Cloud Pro

> Integrar elementos do design da nova landing page HTML (dark theme) na landing page React atual, mantendo a identidade "Prime Cloud Pro" e melhorando a conversão.

## Task Snapshot
- **Primary goal:** Modernizar a landing page com design dark/premium, melhor hierarquia visual e foco em backup corporativo
- **Success signal:** Landing page com visual profissional, informações claras sobre o produto e melhor taxa de conversão
- **Key references:**
  - Arquivo atual: `client/src/pages/LandingPage.tsx`
  - Design de referência: documento "nova home.txt"

## Análise Comparativa

### Landing Page Atual (React)
**Pontos Fortes:**
- ✅ Componentes React funcionais com Framer Motion
- ✅ Integração com autenticação (useAuth)
- ✅ Rotas funcionando (wouter)
- ✅ Design limpo e profissional (light theme)
- ✅ Responsivo

**Pontos Fracos:**
- ❌ Nome genérico "Prime Cloud Pro"
- ❌ Falta especificidade sobre backup corporativo
- ❌ Sem seção "Como Funciona"
- ❌ Sem FAQ
- ❌ Sem contato/WhatsApp
- ❌ Preços fictícios (R$ 99)

### Nova Landing (HTML)
**Pontos Fortes:**
- ✅ Dark theme premium (zinc-950)
- ✅ Branding claro "Prime Cloud Pro"
- ✅ Foco específico em backup corporativo
- ✅ Seções completas: Como Funciona, FAQ, Contato
- ✅ Enfatiza S3 + SFTP/FTPS
- ✅ Destaca dados no Brasil e LGPD
- ✅ Preços "sob consulta" (mais adequado B2B)
- ✅ SEO otimizado (meta tags, JSON-LD)

**Pontos Fracos:**
- ❌ HTML estático (sem interatividade React)
- ❌ Sem integração com autenticação
- ❌ Sem animações (só scroll smooth)

## Estratégia de Integração

### O que manter da landing atual
1. Estrutura React + Framer Motion
2. Integração com autenticação (useAuth)
3. Componentes do shadcn/ui
4. Sistema de rotas (wouter)

### O que adotar da nova landing
1. **Branding**: "Prime Cloud Pro - Backup Corporativo"
2. **Dark Theme**: zinc-950 como base
3. **Hierarquia de Conteúdo**:
   - Hero com foco em backup corporativo
   - S3 + SFTP/FTPS destacados
   - Como Funciona (processo em 3 etapas)
   - Recursos que importam
   - Planos (sob consulta)
   - Segurança e governança
   - FAQ
   - Contato (WhatsApp + Email + Portal)
4. **Copy**: Linguagem B2B, técnica e profissional
5. **Trust Elements**: Soberania de dados, LGPD, suporte PT-BR

## Melhorias Propostas

### 1. Header/Navigation
- Logo: "Prime Cloud Pro" + tagline "Backup Corporativo"
- Background: zinc-950/75 com backdrop-blur
- Links: Como funciona, Recursos, Planos, FAQ
- Botão "Falar com especialista"

### 2. Hero Section
- Título: "Backup corporativo com controle, segurança e visibilidade"
- Subtítulo: "S3 compatível + SFTP/FTPS + portal self-service"
- Badge: "Dados no Brasil • S3 + SFTP/FTPS • Cobrança por uso"
- CTA: "Solicitar proposta" + "Ver planos"
- Card de destaque: "O que você recebe"

### 3. Novas Seções

**Trust Badges** (após hero):
- Soberania de dados (Brasil, LGPD)
- Sem taxa de saída surpresa
- Suporte PT-BR

**Como Funciona** (3 steps):
1. Ativação & credenciais
2. Buckets por workload
3. Monitoramento & custo

**FAQ** (accordion interativo):
- Funciona com Veeam/Imperius/Acronis?
- Posso acessar via SFTP?
- Como controlo custo e crescimento?

**Segurança & Governança**:
- Criptografia e transporte seguro
- Auditoria e rastreabilidade

**Contato**:
- WhatsApp (link direto)
- Email (comercial@primecloudpro.com.br)
- Portal (link para login)

### 4. Features Grid
4 features específicos:
- S3 compatível (MinIO) - ferramentas modernas
- SFTP/FTPS (SFTPGo) - legado
- Portal self-service - gestão
- Multi-tenant + RBAC - segurança

### 5. Pricing
3 planos realistas:
- Starter: Sob consulta (1-3 usuários, S3, portal)
- Business: Sob consulta (S3+SFTP, RBAC, alertas, auditoria) [DESTAQUE]
- Enterprise: Custom (SLA, retenção, suporte prioritário)

### 6. Color Scheme
- Base: bg-zinc-950
- Accent: white/zinc-200 para títulos
- Cards: bg-white/5 com ring-1 ring-white/10

## Working Phases

### Phase 2 — Implementação

**Steps:**

1. **Atualizar branding e cores** (1h)
   - Trocar "Prime Cloud Pro" por "Prime Cloud Pro"
   - Aplicar dark theme (zinc-950)
   - Atualizar palette de cores

2. **Refatorar Hero Section** (2h)
   - Novo título/subtítulo focado em backup
   - Badge com múltiplas informações
   - Card "O que você recebe"
   - CTAs ajustados

3. **Adicionar Trust Badges** (1h)

4. **Criar seção "Como Funciona"** (1.5h)

5. **Refatorar Features Grid** (1h)

6. **Atualizar Pricing** (1h)

7. **Adicionar Segurança & Governança** (45min)

8. **Criar FAQ (accordion)** (1.5h)

9. **Criar seção Contato** (1h)

10. **Atualizar Footer** (30min)

**Estimativa Total:** ~11 horas

### Phase 3 — Validação e Ajustes

1. Testes de responsividade (1h)
2. Ajustes de copy (30min)
3. Testes de navegação (30min)
4. Ajustes finais (1h)

**Estimativa Total:** ~3 horas

## Resource Estimation

| Phase | Estimated Effort | Team Size |
| --- | --- | --- |
| Phase 2 - Implementação | ~11 horas | 1 desenvolvedor |
| Phase 3 - Validação | ~3 horas | 1-2 pessoas |
| **Total** | **~14 horas** | **1-2 pessoas** |

## Checklist de Implementação

### Branding & Visual
- [ ] Trocar nome para "Prime Cloud Pro"
- [ ] Adicionar tagline "Backup Corporativo"
- [ ] Aplicar dark theme (zinc-950)
- [ ] Atualizar cores
- [ ] Atualizar logo/ícone

### Conteúdo
- [ ] Hero: novo título/copy
- [ ] Badge: "Dados no Brasil • S3 + SFTP/FTPS • Cobrança por uso"
- [ ] Card "O que você recebe"
- [ ] Trust badges (3 cards)
- [ ] Como funciona (3 steps)
- [ ] Features: 4 específicos
- [ ] Pricing: 3 planos "sob consulta"
- [ ] Segurança & Governança
- [ ] FAQ (accordion)
- [ ] Contato

### Técnico
- [ ] Manter integração useAuth
- [ ] Manter rotas wouter
- [ ] Manter Framer Motion
- [ ] Adicionar data-testid
- [ ] Responsividade
- [ ] Acessibilidade
- [ ] SEO

---

**Status:** ✅ Pronto para implementação
**Priority:** Alta
**Estimated Completion:** 2-3 dias
