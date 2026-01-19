# Guia de Ferramentas e Produtividade

Este documento coleta os scripts, automação e configurações de editor para ajudar colaboradores a manter a eficiência.

## Ferramentas Necessárias

| Ferramenta | Versão | Propósito |
|------------|--------|-----------|
| Node.js | v18+ | Runtime JavaScript |
| npm | v9+ | Gerenciador de pacotes |
| PostgreSQL | v14+ | Banco de dados |
| TypeScript | 5.6.3 | Verificação de tipos |

## Ferramentas de Build

### Vite
- **Versão**: 7.3.0
- **Propósito**: Ferramenta de build frontend e servidor de desenvolvimento. Lida com HMR (Hot Module Replacement) para desenvolvimento mais rápido. Veja `server/vite.ts` para integração com o backend.
- **Config**: `vite.config.ts`
- **Funcionalidades**: Hot Module Replacement, suporte a TypeScript

### tsx
- **Propósito**: Execução TypeScript para código backend.
- **Uso**: `tsx server/index.ts`

### esbuild
- **Propósito**: Bundling de produção da aplicação servidora.
- **Script**: `script/build.ts`

### Drizzle Kit
- **Versão**: 0.31.8
- **Propósito**: Gerenciamento de schema de banco de dados. Usa `drizzle.config.ts` para conectar ao banco e definir migrações.
- **Config**: `drizzle.config.ts`
- **Comandos**: `npm run db:push`

## Scripts de Desenvolvimento

```bash
# Iniciar desenvolvimento (cliente + servidor com HMR)
npm run dev

# Verificação de tipos
npm run check

# Build de produção
npm run build

# Executar produção
npm run start

# Enviar schema de banco de dados
npm run db:push
```

## Bibliotecas Frontend

### Componentes de UI
- **Radix UI**: Componentes acessíveis headless provendo acessibilidade e estilização mínima.
- **Tailwind CSS**: Framework CSS utility-first para desenvolvimento rápido de UI.
- **Lucide React**: Biblioteca de ícones oferecendo um conjunto consistente de ícones.
- **Framer Motion**: Biblioteca de animação para adicionar transições suaves e efeitos.

### Estado e Dados
- **TanStack React Query**: Gerenciamento de estado do servidor para cache, atualizações em segundo plano e atualizações otimistas. Usa `client/src/lib/queryClient.ts` para configuração.
- **React Hook Form**: Manipulação de formulários performática e flexível.
- **Zod**: Validação de schema para integridade de dados e segurança de tipos.

### Navegação
- **Wouter**: Solução de roteamento leve.

## Bibliotecas Backend

### Servidor
- **Express 5**: Framework web para construir a API.
- **Passport.js**: Middleware de autenticação.
- **OpenID Client**: Suporte OAuth/OIDC para autenticação com provedores externos.

### Banco de Dados
- **Drizzle ORM**: ORM TypeScript para interagir com o banco de dados. Veja `drizzle.config.ts`
- **pg**: Driver PostgreSQL.
- **connect-pg-simple**: Store de sessão para persistir sessões de usuário no banco de dados.

## Configuração de IDE / Editor

### Extensões Recomendadas VS Code
- ESLint
- Prettier
- Tailwind CSS IntelliSense
- TypeScript Vue Plugin (Volar)
- Drizzle ORM extension

### Configurações
```json
{
  "typescript.preferences.importModuleSpecifier": "relative",
  "editor.formatOnSave": true,
  "tailwindCSS.experimental.classRegex": [
    ["cva\\(([^)]*)\\)", "[\"'`]([^\"'`]*).*?[\"'`]"]
  ]
}
```

## Dicas de Produtividade

### Chamadas de API Type-Safe

Use a função helper `apiRequest` de `client/src/lib/queryClient.ts` para todas as chamadas de API para garantir segurança de tipos e tratamento centralizado de erros.

```typescript
import { apiRequest } from "@/lib/queryClient";

async function updateAccount(id: string, data: UpdateAccountRequest) {
  return apiRequest(`/api/accounts/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}
```

### Construção de URL

Use `buildUrl()` de `shared/routes.ts` para construção de URL type-safe, especialmente ao lidar com rotas parametrizadas. Isso reduz erros e melhora a manutenibilidade.

```typescript
import { buildUrl } from '@shared/routes';

const accountId = "123e4567-e89b-12d3-a456-426614174000";
const url = buildUrl('/api/accounts/:id', { id: accountId }); // url será "/api/accounts/123e4567-e89b-12d3-a456-426614174000"

fetch(url).then(...)
```

### Padrão de Hooks Customizados

Toda busca de dados deve ser feita através de hooks customizados localizados em `client/src/hooks/`. Isso fornece uma API consistente, simplifica a lógica de componentes, e permite testes e reutilização mais fáceis.

```typescript
import { useAccounts } from '@/hooks/use-accounts';

function AccountsList() {
  const { data: accounts, isLoading } = useAccounts();

  if (isLoading) {
    return <p>Carregando...</p>;
  }

  return (
    <ul>
      {accounts?.map(account => (
        <li key={account.id}>{account.name}</li>
      ))}
    </ul>
  );
}
```

### Validação de Documento

Utilize os utilitários de validação de CPF/CNPJ brasileiros tanto no código cliente quanto servidor usando:

- `client/src/lib/document-validation.ts`
- `server/lib/document-validation.ts`

```typescript
import { isValidCPF } from 'client/src/lib/document-validation';

const cpf = '123.456.789-00';
if (isValidCPF(cpf)) {
  console.log('CPF é válido');
} else {
  console.log('CPF é inválido');
}
```

## Ferramentas de IA e Automação

### @ai-coders/context

O projeto usa **@ai-coders/context** - um MCP (Model Context Protocol) server que gerencia documentação estruturada, playbooks de agentes e planos de implementação.

#### Configuração de Provedores de IA

O projeto está configurado para usar **Anthropic (Claude)** como provedor principal de IA, com OpenRouter como fallback.

**Provedores Configurados:**

| Provedor | Uso | Configuração |
|----------|-----|--------------|
| **Anthropic (Claude)** | ⭐ Principal - Todas as tarefas | `ANTHROPIC_API_KEY` no `.env` |
| **OpenRouter** | Fallback - Modelos alternativos | `OPENROUTER_API_KEY` no `.env` |
| **Google Gemini** | Opcional - Tarefas rápidas | `GOOGLE_API_KEY` no `.env` |

**Obter API Keys:**
- Anthropic: https://console.anthropic.com/settings/keys
- OpenRouter: https://openrouter.ai/keys
- Google AI: https://aistudio.google.com/app/apikey

#### Scripts NPM Disponíveis

```bash
# Preencher documentação com Claude
npm run ai:fill

# Atualizar documentação após mudanças no código
npm run ai:update

# Criar novo plano de implementação
npm run ai:plan <nome-do-plano> -- --fill -p anthropic

# Preencher skills com conhecimento do projeto
npm run ai:skill:fill

# Sincronizar agentes para todas as ferramentas AI
npm run ai:sync
```

#### Comandos Detalhados

**Preencher Documentação:**
```bash
# Usar Claude (padrão)
npx @ai-coders/context fill . -p anthropic

# Usar modelo específico
npx @ai-coders/context fill . -p anthropic -m claude-3-haiku-20240307

# Limitar número de arquivos
npx @ai-coders/context fill . -p anthropic --limit 5
```

**Criar Planos:**
```bash
# Criar plano com preenchimento automático
npx @ai-coders/context plan meu-plano --fill -p anthropic --summary "Descrição do plano"

# Criar apenas scaffold (sem IA)
npx @ai-coders/context plan meu-plano
```

**Atualizar Documentação:**
```bash
# Atualizar docs dos últimos 7 dias
npx @ai-coders/context update -p anthropic --days 7

# Preview sem aplicar mudanças
npx @ai-coders/context update -p anthropic --dry-run
```

**Gerenciar Skills:**
```bash
# Listar skills disponíveis
npx @ai-coders/context skill list

# Preencher todas as skills
npx @ai-coders/context skill fill . -p anthropic

# Preencher skill específico
npx @ai-coders/context skill fill . -p anthropic --skills code-review
```

#### Modelos Disponíveis

**Anthropic (Claude):**
- `claude-3-5-sonnet-20241022` - Padrão (melhor custo-benefício)
- `claude-3-haiku-20240307` - Rápido e econômico
- `claude-3-opus-20240229` - Máxima qualidade

**Quando Usar Cada Provedor:**

| Tarefa | Provedor Recomendado |
|--------|---------------------|
| Criar planos complexos | Anthropic (Claude Sonnet) |
| Preencher documentação | Anthropic (Claude Haiku) |
| Análise profunda de código | Anthropic (Claude Opus) |
| Tarefas rápidas | Google (Gemini Flash) |
| Modelos alternativos | OpenRouter |

#### Estrutura do Contexto

```
.context/
├── agents/          # Playbooks de agentes especializados
├── docs/            # Documentação estruturada do projeto
├── plans/           # Planos de implementação
└── skills/          # Habilidades reutilizáveis
```

**Agentes Disponíveis:**
- architect-specialist, backend-specialist, frontend-specialist
- bug-fixer, code-reviewer, test-writer
- performance-optimizer, security-auditor
- documentation-writer, refactoring-specialist
- database-specialist, devops-specialist, mobile-specialist

Para mais detalhes, consulte `.context/agents/README.md`.

## Variáveis de Ambiente

Variáveis de ambiente requeridas:

- String de conexão do banco de dados (`DATABASE_URL`)
- Segredo de sessão (`SESSION_SECRET`)
- Configuração do serviço de email (ex: configurações SMTP ou chaves de API para serviços como SendGrid ou Mailgun)
- Chaves API Clerk se usando Clerk para autenticação
- **Chaves de Provedor de IA** (`ANTHROPIC_API_KEY`, `OPENROUTER_API_KEY`, `GOOGLE_API_KEY`)

Consulte arquivos `.env.example` no repositório para listas completas e descrições.
