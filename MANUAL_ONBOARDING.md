# Guia de Onboarding e Configuração de Cliente: Integração Imperius

Este documento descreve o processo passo a passo correto para criar um cliente completo, configurar seus recursos e integrar o backup do Imperius, baseado na arquitetura atual do sistema.

## Visão Geral do Fluxo
1.  **Administrador:** Cria a conta/organização e define a quota (Plano).
2.  **Cliente (Dashboard):** Cria o Bucket de Armazenamento e ativa a "Licença Imperius".
3.  **Cliente (Dashboard):** Gera as Credenciais de Acesso (Access Keys).
4.  **Servidor do Cliente:** Configura o software Imperius Backup com as credenciais.

---

## Passo 1: Criação do Cliente (Lado do Admin/Venda)

Atualmente, o sistema centraliza a gestão no **Admin Dashboard** ou via página de **Auto-Cadastro** (`/create-account`), dependendo do seu modelo de negócio.

### Opção A: Auto-Cadastro (Cliente se cadastra)
1.  Envie o link de cadastro para o cliente: `https://seu-dominio.com/create-account`
2.  O cliente preenche:
    *   **Nome da Organização**
    *   **Documento (CPF/CNPJ)**
    *   **Telefone**
    *   **Licenças Imperius:** Quantidade desejada.
3.  **Aprovação:** Como Admin, vá em **Painel Administrativo** > **Aguardando Aprovação** e clique em **Aprovar**.
    *   *Nota:* Ao aprovar, certifique-se de que a quota de armazenamento (GB) está correta conforme o contrato. Se necessário, ajuste em "Quota" na lista de Contas Ativas.

### Opção B: Criação Manual (Admin cria)
*(Se não houver formulário direto de criação por admin no código atual, use o fluxo de cadastro você mesmo ou utilize APIs se disponíveis. O código atual sugere forte uso de auto-cadastro com aprovação)*.

---

## Passo 2: Provisionamento de Recursos (Lado do Cliente)

Após o cliente ter o acesso liberado:

1.  **Login no Painel:** O cliente acessa `https://seu-dominio.com/dashboard`.
2.  **Criar Bucket (Cofre):**
    *   Navegar até **Buckets** (menu lateral).
    *   Clicar em **Novo Bucket**.
    *   Nomear o bucket (ex: `backup-servidor-01`).
3.  **Vincular Licença Imperius:**
    *   Abrir o bucket criado.
    *   Clicar em **Configurações** (ícone de engrenagem ou menu de opções).
    *   Ativar a opção **"Licença Imperius Backup"**.
    *   *Isso sinaliza para o sistema que este bucket consome uma das licenças contratadas e habilita features específicas de monitoramento.*

---

## Passo 3: Gerar Credenciais de Integração

O Imperius precisa de chaves S3 para conectar. Não use a senha de login do painel.

1.  No Dashboard do Cliente, ir em **Tokens de Acesso** (Access Keys).
2.  Clicar em **Gerar Nova Chave**.
3.  Definir um nome (ex: "Conector Imperius Serviço").
4.  **IMPORTANTE:** Copiar a **Access Key ID** e a **Secret Access Key**.
    *   *A Secret Key é mostrada apenas uma vez.*

---

## Passo 4: Configurar o Software Imperius (No Servidor do Cliente)

Agora, no ambiente onde o backup será realizado:

1.  Abra o **Imperius Backup**.
2.  Crie ou edite uma Tarefa de Backup (**Backup Set**).
3.  Vá na aba **Destinations** > **Adicionar (+)**.
4.  Selecione **Cloud Storage / FTP / SFTP**.
5.  Adicione uma nova conta do tipo **"S3 Compatible"** (MinIO, Wasabi, etc).
6.  Preencha com os dados do Prime Cloud Pro:
    *   **Service Point URL:** `https://s3.cloudstoragepro.com.br` (ou seu domínio configurado).
    *   **Access Key ID:** *[Colar a chave gerada no Passo 3]*
    *   **Secret Access Key:** *[Colar o segredo gerado no Passo 3]*
    *   **Bucket Name:** Selecionar o bucket criado no Passo 2.
7.  Clique em **Test Connection** para validar.

---

## Passo 5: Início das Rotinas e Notificações

### Quando o cliente começa a receber notificações?

1.  **Sucesso do Backup (Diário):**
    *   Esta notificação é configurada **DENTRO DO IMPERIUS BACKUP**.
    *   No Imperius, vá em **Backup Options** > **Email Notifications**.
    *   Configure o SMTP (pode usar o do próprio cliente ou um relay seu) para enviar um e-mail ao final de cada job com o status (Sucesso/Erro).
    *   *O Dashboard Prime Cloud Pro não envia e-mail de "Backup Sucesso" pois ele não gerencia a execução do job, apenas o armazenamento.*

2.  **Alertas de Cota (Armazenamento):**
    *   O Sistema Prime Cloud Pro enviará automaticamente e-mails para o cliente quando o uso do bucket atingir **80%**, **95%** e **100%** da cota contratada.
    *   Isso é nativo do sistema e não requer configuração extra, desde que o e-mail do cliente esteja correto no cadastro.

3.  **Alertas Financeiros:**
    *   Faturas e lembretes de vencimento são gerados e enviados pela plataforma Prime Cloud Pro automaticamente.

---

## Resumo para Check-list

- [ ]  Conta criada e Aprovada (Admin).
- [ ]  Quota de GB e Licenças conferidas (Admin).
- [ ]  Bucket criado com flag "Imperius" ativa (Cliente).
- [ ]  Access Keys geradas (Cliente).
- [ ]  Imperius configurado com Endpoint S3 + Chaves (Servidor).
- [ ]  Notificação de e-mail configurada no software Imperius (Servidor).

Este é o fluxo "correto" e seguro, segregando a responsabilidade de acesso (chaves) da conta principal e garantindo que o monitoramento de licenças funcione corretamente.
