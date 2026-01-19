---
status: ready
generated: 2026-01-19
priority: medium
---

# Renomear Aplicação para "Prime Cloud Pro"

> Padronizar o nome da aplicação de "CloudStorage Pro" e "PrimeCloudPro" (sem espaços) para "Prime Cloud Pro" (com espaços) em todo o projeto.

## Objetivo
Atualizar consistentemente o branding da aplicação para usar "Prime Cloud Pro" como nome oficial em todos os arquivos de código, documentação e configuração.

## Situação Atual

### Nomes encontrados no projeto:
1. **"CloudStorage Pro"** - Nome genérico usado na landing page atual
2. **"PrimeCloudPro"** - Nome sem espaços usado em alguns lugares
3. **"Prime Cloud Pro"** - Nome desejado (padronizado)

### Arquivos principais afetados (88 arquivos encontrados):
- `client/src/pages/LandingPage.tsx` - Landing page
- `client/src/pages/Settings.tsx` - Configurações
- `client/src/pages/BackupConfig.tsx` - Configuração de backup
- `client/src/components/Sidebar.tsx` - Barra lateral
- `client/src/locales/pt-BR.json` - Traduções
- `server/services/email.ts` - Templates de email
- `server/services/notification.service.ts` - Notificações
- `README.md` - Documentação principal
- `.context/docs/*` - Documentação AI
- `.context/plans/*` - Planos existentes

## Plano de Ação

### Fase 1: Arquivos de Código (Frontend)

**Arquivos prioritários:**

1. **LandingPage.tsx**
   ```diff
   - CloudStorage Pro
   + Prime Cloud Pro
   ```

2. **Sidebar.tsx**
   ```diff
   - PrimeCloudPro ou CloudStorage Pro
   + Prime Cloud Pro
   ```

3. **Settings.tsx e BackupConfig.tsx**
   ```diff
   - CloudStorage Pro
   + Prime Cloud Pro
   ```

4. **pt-BR.json**
   - Atualizar todas as strings de branding

### Fase 2: Backend e Serviços

5. **email.ts**
   - Templates de email
   - Assinaturas
   - Headers

6. **notification.service.ts**
   - Mensagens de notificação
   - Títulos

### Fase 3: Documentação

7. **README.md**
   - Título principal
   - Referências ao produto

8. **.context/docs/**
   - project-overview.md
   - architecture.md
   - testing-strategy.md
   - PRD documents

9. **.context/plans/**
   - Atualizar planos existentes que referenciam o nome antigo

### Fase 4: Tutoriais e Assets

10. **client/public/tutorials/**
    - veeam-guide.md
    - imperius-guide.md

11. **attached_assets/**
    - PRD documents

## Busca e Substituição

### Padrões a substituir:

```bash
# Pattern 1: CloudStorage Pro → Prime Cloud Pro
"CloudStorage Pro" → "Prime Cloud Pro"

# Pattern 2: PrimeCloudPro (sem espaços) → Prime Cloud Pro
"PrimeCloudPro" → "Prime Cloud Pro"

# Pattern 3: Manter consistência em slugs/URLs
primecloudpro.com → primecloudpro.com (não alterar)
prime-cloud-pro → prime-cloud-pro (manter hífens em slugs)
```

### Exceções (NÃO substituir):
- ❌ URLs de domínio: `primecloudpro.com.br` (manter sem espaços)
- ❌ Slugs de URLs: `prime-cloud-pro` (manter com hífens)
- ❌ Variáveis de ambiente: `PRIMECLOUDPRO_` (manter snake_case)
- ❌ Nomes de pacotes npm: `primecloudpro` (manter sem espaços)

## Implementação

### Script de busca e substituição seguro:

```bash
# 1. Backup do projeto (recomendado)
git commit -m "chore: backup before rebranding"

# 2. Substituir "CloudStorage Pro" → "Prime Cloud Pro"
# Manualmente ou com script
grep -r "CloudStorage Pro" client/ server/ --exclude-dir=node_modules

# 3. Substituir "PrimeCloudPro" → "Prime Cloud Pro"
# (exceto em URLs e slugs)
grep -r "PrimeCloudPro" client/ server/ --exclude-dir=node_modules
```

### Checklist de Verificação

#### Frontend (React)
- [ ] LandingPage.tsx - Título, logo, footer
- [ ] Sidebar.tsx - Nome da aplicação
- [ ] Settings.tsx - Título da página
- [ ] BackupConfig.tsx - Referências
- [ ] pt-BR.json - Strings de tradução

#### Backend
- [ ] email.ts - Templates de email
- [ ] notification.service.ts - Mensagens

#### Documentação
- [ ] README.md - Título e descrições
- [ ] .context/docs/project-overview.md
- [ ] .context/docs/architecture.md
- [ ] .context/docs/testing-strategy.md

#### Tutoriais
- [ ] veeam-guide.md
- [ ] imperius-guide.md

#### Meta
- [ ] package.json - Descrição (se aplicável)
- [ ] index.html - Title tag
- [ ] Favicon/Logo (verificar se precisa atualização)

## Estimativa

- **Tempo estimado:** 2-3 horas
- **Complexidade:** Baixa (busca e substituição)
- **Risco:** Baixo (principalmente textual)

## Rollback

Se necessário reverter:
```bash
git revert <commit-hash>
```

## Próximos Passos

1. ✅ Aprovar o plano
2. Executar busca e substituição nos arquivos de código
3. Verificar compilação (`npm run check`)
4. Testar visualmente (landing page, dashboard, emails)
5. Commit com mensagem clara
6. Deploy

---

**Status:** ✅ Pronto para execução
**Prioridade:** Média
**Impacto:** Visual/Branding apenas
