```markdown
---
status: filled
generated: 2026-01-18
---

# Glossário e Conceitos de Domínio

Lista de terminologia específica do projeto, acrônimos, entidades de domínio e personas de usuário.

## Entidades Principais de Domínio

### Account (Conta)
A unidade organizacional primária. Representa uma empresa ou organização usando o serviço de armazenamento em nuvem.
- **Schema**: `shared/schema.ts:371`
- **Relacionado**: AccountMember, AccountWithDetails
- **Estados**: pending (pendente), approved (aprovado), suspended (suspenso), active (ativo)

### Bucket
Container de armazenamento em nuvem dentro de uma conta. Suporta versionamento e regras de ciclo de vida.
- **Schema**: `shared/schema.ts:374`
- **Funcionalidades**: Versionamento, Regras de Ciclo de Vida

### Access Key (Chave de Acesso)
Credenciais de API para acesso programático ao armazenamento em nuvem.
- **Schema**: `shared/schema.ts:375`
- **Estados**: active (ativo), inactive (inativo), revoked (revogado)
- **Operações**: Criar, Rotacionar, Alternar (Toggle), Revogar

### Subscription (Assinatura)
Vincula uma conta a um produto/plano com quotas e preços associados.
- **Schema**: `shared/schema.ts:373`

### Order (Pedido)
Solicitação de compra ou serviço por uma conta.
- **Schema**: `shared/schema.ts:370`
- **Relacionado**: OrderWithDetails

### Product (Produto)
Oferta de serviço com preços e funcionalidades.
- **Schema**: `shared/schema.ts:369`

## Gerenciamento de Usuários

### User (Usuário)
Indivíduo autenticado no sistema.
- **Schema**: `shared/models/auth.ts:29`
- **Relacionado**: UpsertUser

### AccountMember (Membro da Conta)
Associação entre um Usuário e uma Conta com atribuição de função.
- **Schema**: `shared/schema.ts:372`
- **Funções (Roles)**: owner (proprietário), admin, member (membro)

### Invitation (Convite)
Solicitação pendente para ingressar em uma conta.
- **Schema**: `shared/schema.ts:378`
- **Estados**: pending (pendente), accepted (aceito), cancelled (cancelado)

## Faturamento e Uso

### Invoice (Fatura)
Documento de cobrança para uma conta.
- **Schema**: `shared/schema.ts:379`

### UsageRecord (Registro de Uso)
Rastreia o consumo de recursos para cobrança.
- **Schema**: `shared/schema.ts:380`

### QuotaRequest (Solicitação de Quota)
Solicitação para aumento de limites de armazenamento/recursos.
- **Schema**: `shared/schema.ts:381`
- **Estados**: pending (pendente), approved (aprovado), rejected (rejeitado)

## Funcionalidades de Bucket

### LifecycleRule (Regra de Ciclo de Vida)
Política automatizada de gerenciamento de dados para buckets.
- **Schema**: `shared/schema.ts:357`
- **Ações**: Transição, Expiração

### Versioning (Versionamento)
Funcionalidade de bucket que mantém múltiplas versões de objetos.

## Sistema

### AuditLog (Log de Auditoria)
Registro de ações significativas do sistema para conformidade e depuração.
- **Schema**: `shared/schema.ts:377`
- **Rastreia**: Ação, Usuário, Timestamp, Recurso

### Notification (Notificação)
Mensagem in-app para usuários.
- **Schema**: `shared/schema.ts:376`
- **Estados**: unread (não lida), read (lida)

### SftpCredential (Credencial SFTP)
Credenciais de acesso SFTP para acesso a buckets.
- **Schema**: `shared/schema.ts:382`

## Acrônimos e Abreviações

| Acrônimo | Expansão | Contexto |
|----------|-----------|----------|
| CPF | Cadastro de Pessoas Físicas | Identificação fiscal de pessoa física no Brasil |
| CNPJ | Cadastro Nacional da Pessoa Jurídica | Identificação fiscal de empresa no Brasil |
| LGPD | Lei Geral de Proteção de Dados | Lei brasileira de proteção de dados |
| SFTP | SSH File Transfer Protocol | Transferência segura de arquivos |
| OIDC | OpenID Connect | Protocolo de autenticação |
| RBAC | Role-Based Access Control | Modelo de autorização |

## Personas / Atores

### Usuário Final
- **Objetivo**: Gerenciar armazenamento em nuvem para sua organização
- **Fluxos de Trabalho**: Criar buckets, gerenciar chaves de acesso, convidar membros da equipe
- **Dores**: Limites de quota, gerenciamento de chaves de acesso

### Administrador da Conta
- **Objetivo**: Gerenciar configurações da organização e equipe
- **Fluxos de Trabalho**: Convidar membros, atribuir funções, gerenciar assinaturas
- **Dores**: Controle de acesso de membros, gerenciamento de faturas

### Administrador da Plataforma
- **Objetivo**: Gerenciar toda a plataforma
- **Fluxos de Trabalho**: Aprovar contas, ajustar quotas, lidar com suporte
- **Dores**: Escalabilidade, prevenção de abuso

## Regras de Domínio e Invariantes

### Regras de Conta
- Conta deve ter pelo menos um proprietário
- Transições de status de conta: pending → approved → active/suspended
- CNPJ deve ser um número de empresa brasileiro válido

### Regras de Bucket
- Nomes de bucket devem ser únicos dentro de uma conta
- Regras de ciclo de vida aplicadas em ordem
- Versionamento não pode ser desabilitado uma vez habilitado (apenas suspenso)

### Regras de Chave de Acesso
- Máximo de chaves ativas por conta (configurável)
- Rotação preserva ID da chave mas regenera segredo
- Chaves revogadas não podem ser reativadas

### Validação de Documentos Brasileiros
- CPF: 11 dígitos com validação de dígitos verificadores
- CNPJ: 14 dígitos com validação de dígitos verificadores
- Ambos suportam entrada formatada e não formatada
```
