# Plano de Implementação: Configuração de E-mail Personalizado (SMTP)

Permitir que cada cliente (conta) configure seus próprios parâmetros de servidor de e-mail (SMTP) para que as comunicações enviadas pela plataforma (convites, notificações, faturas) saiam com sua própria identidade.

## Mudanças Propostas

### 1. Esquema do Banco de Dados
#### [MODIFY] [schema.ts](file:///d:/PROJETOS/PRINECLOUDPROV2/PrimeCloudProV2/shared/schema.ts)
- Adicionar campos de configuração SMTP à tabela `accounts`:
    - `smtpEnabled`: booleano (Ativa/desativa o uso de SMTP personalizado)
    - `smtpHost`: texto (Endereço do servidor SMTP)
    - `smtpPort`: inteiro (Porta do servidor, ex: 587, 465)
    - `smtpUser`: texto (Usuário para autenticação)
    - `smtpPass`: texto (Senha para autenticação - *Observação: armazenar de forma segura*)
    - `smtpFromEmail`: texto (E-mail do remetente)
    - `smtpFromName`: texto (Nome exibido do remetente)
    - `smtpEncryption`: texto (Tipo de criptografia: `none`, `ssl`, `tls`)

### 2. Serviço de E-mail (Backend)
#### [MODIFY] [email.ts](file:///d:/PROJETOS/PRINECLOUDPROV2/PrimeCloudProV2/server/services/email.ts)
- Refatorar a função `sendEmail` para aceitar um `accountId` opcional.
- Se um `accountId` for fornecido e as configurações SMTP estiverem ativas, utilizar a biblioteca `nodemailer` com as configurações da conta.
- Caso contrário, manter o fallback para o SendGrid global ou mock de log.

### 3. API de Gerenciamento
#### [MODIFY] [routes.ts](file:///d:/PROJETOS/PRINECLOUDPROV2/PrimeCloudProV2/server/routes.ts)
- Adicionar rota `PATCH /api/accounts/current/email-config` para salvar as configurações.
- Adicionar rota `POST /api/accounts/current/email-test` para enviar um e-mail de teste e validar a conexão SMTP.

### 4. Interface de Usuário (Frontend)
#### [NEW] [EmailSettings.tsx](file:///d:/PROJETOS/PRINECLOUDPROV2/PrimeCloudProV2/client/src/pages/EmailSettings.tsx) ou integração em [Settings.tsx](file:///d:/PROJETOS/PRINECLOUDPROV2/PrimeCloudProV2/client/src/pages/Settings.tsx)
- Criar formulário para preenchimento dos dados SMTP.
- Adicionar um switch para ativar/desativar o SMTP customizado.
- Botão "Testar Conexão" para feedback imediato ao usuário.
- Dicas e instruções sobre portas comuns e segurança.

## Plano de Verificação

### Testes Técnicos
1.  Configurar uma conta com dados SMTP válidos (ex: usando Mailtrap ou Gmail).
2.  Disparar um convite e verificar se o e-mail foi enviado através do servidor configurado e não pelo SendGrid base.
3.  Simular falha de conexão (porta errada ou senha errada) e verificar se o erro é reportado corretamente na interface.

### Verificação de Segurança
1.  Garantir que os dados SMTP só possam ser lidos por administradores/donos da conta.
2.  Garantir que a senha SMTP não seja retornada para o frontend após ser salva.
