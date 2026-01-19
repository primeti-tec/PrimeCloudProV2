```markdown
---
status: filled
generated: 2026-01-18
---

# Notas de Segurança e Conformidade

Captura as políticas e salvaguardas que mantêm este projeto seguro e em conformidade.

## Autenticação e Autorização

### Métodos de Autenticação
- **Autenticação Local**: Passport.js com estratégia local (usuário/senha).
- **OpenID Connect**: Suporte a OAuth 2.0 / OIDC. Veja `@server/replit_integrations/auth/replitAuth.ts` para configuração de autenticação usando `setupAuth`. A função `getSession` recupera a sessão atual.
- **Gerenciamento de Sessão**: Sessões Express com armazenamento PostgreSQL (`connect-pg-simple`). `AuthStorage` implementa a interface `IAuthStorage` e é usado para armazenamento de sessão.

### Modelo de Autorização
- **Controle de Acesso Baseado em Função (RBAC)**: Membros têm funções dentro das contas.
- **Permissões em Nível de Conta**: Ações escopadas a contas específicas.
- **Privilégios de Administrador**: Rotas especiais de administração para aprovação de contas, gerenciamento de quotas.

### Segurança de Sessão
- Sessões armazenadas no PostgreSQL para persistência e escalabilidade. A classe `DatabaseStorage` em `server\storage.ts` fornece um exemplo de armazenamento persistente.
- Cookies de sessão com flags de segurança apropriadas.

## Controle de Acesso

### Membros da Conta
- Usuários podem pertencer a múltiplas contas. O tipo `AccountMember` em `shared\schema.ts` define a estrutura de uma associação de conta.
- Cada associação tem uma função associada.
- Proprietários de contas podem convidar/remover membros. `sendInvitationEmail` em `server\services\email.ts` é usado para enviar convites.
- Atualizações de função rastreadas via logs de auditoria. Veja `AuditLog` e `CreateAuditLogRequest` em `shared\schema.ts`.

### Chaves de Acesso API
- Acesso programático via chaves de acesso. O tipo `AccessKey` em `shared\schema.ts` define a estrutura de uma chave de acesso de API.
- Suporte a rotação de chaves (`useRotateAccessKey`).
- Alternar estado ativo/inativo.
- Capacidade de revogação.

## Segredos e Dados Sensíveis

### Locais de Armazenamento
- Strings de conexão de banco de dados em variáveis de ambiente.
- Segredos de sessão em configuração de ambiente.
- Credenciais de serviço de email no ambiente.
   - Exemplo: Configuração de email usada na interface `EmailOptions` definida em `server\services\email.ts`.

### Classificações de Dados
| Tipo de Dado | Classificação | Armazenamento |
|--------------|---------------|---------------|
| Credenciais de usuário | Sensível | Banco de dados (hash) |
| Tokens de sessão | Sensível | Armazenamento PostgreSQL |
| Chaves de acesso | Sensível | Banco de dados |
| Documentos brasileiros (CPF/CNPJ) | PII (Pessoal) | Banco de dados |

### Validação de Documentos
Validação de documentos brasileiros implementada tanto no cliente quanto no servidor:
- Validação de CPF: `isValidCPF()`
  - Lado do servidor: `server\lib\document-validation.ts`
  - Lado do cliente: `client\src\lib\document-validation.ts`
- Validação de CNPJ: `isValidCNPJ()`
  - Lado do servidor: `server\lib\document-validation.ts`
  - Lado do cliente: `client\src\lib\document-validation.ts`
- Helpers de formatação: `formatCPF()`, `formatCNPJ()`, `formatDocument()` em `client\src\lib\document-validation.ts` fornecem utilitários de formatação.

## Conformidade e Políticas

### Proteção de Dados Brasileira (LGPD)
- CPF/CNPJ são considerados dados pessoais.
- Validação adequada antes do armazenamento. Utilizada através da função `validateDocument`.
- Log de auditoria para acesso a dados.

### Trilha de Auditoria
- Todas as ações significativas logadas via `AuditLog`. O tipo `AuditLog` é definido em `shared\schema.ts`.
- Rastreia: tipo de ação, usuário, timestamp, recursos afetados. O tipo `CreateAuditLogRequest` define a estrutura de uma requisição para criar uma entrada de log de auditoria.
- Consultável via hook `useAuditLogs`.

## Melhores Práticas de Segurança

### Validação de Entrada
- Schemas Zod para todas as entradas da API.
- Manipulação de requisição/resposta type-safe.
- Validação no lado do cliente e do servidor. Veja `client\src\lib\document-validation.ts` e `server\lib\document-validation.ts` para exemplos de validação de documentos.

### Segurança da API
- Middleware Express.js para autenticação. Rotas de autenticação são registradas usando `registerAuthRoutes` em `server\replit_integrations\auth\routes.ts`.
- Checagens de autorização em nível de rota.
- Tratamento de erros sem vazamento de informações.

### Segurança do Frontend
- React escapa saída por padrão (proteção XSS).
- Roteamento type-safe com `buildUrl()` em `shared\routes.ts`.
- Helpers de requisição API seguros. Veja `apiRequest` em `client\src\lib\queryClient.ts`.

## Resposta a Incidentes

### Logs
- Log do servidor via função customizada `log()` em `server\index.ts`.
- Saída de log estruturada para monitoramento.

### Passos de Resposta
1. Identificar contas/usuários afetados
2. Verificar logs de auditoria por atividade suspeita
3. Revogar chaves de acesso comprometidas
4. Suspender contas afetadas se necessário
5. Notificar usuários afetados

## Checklist de Segurança

- [ ] Variáveis de ambiente configuradas com segurança
- [ ] Conexão de banco de dados usa SSL em produção
- [ ] Cookies de sessão têm flags seguras
- [ ] Chaves de acesso rotacionadas regularmente
- [ ] Logs de auditoria monitorados
- [ ] Dados de documentos brasileiros criptografados em repouso
```
