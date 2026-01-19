# Guia de Configuração: Imperius Backup

Este guia explica como configurar o **Imperius Backup** para enviar seus backups para o Prime Cloud Pro.

## Passo 1: Acesse o Imperius Backup
Abra o software em seu servidor e clique em **"Backup Sets"** para criar ou editar uma tarefa de backup.

## Passo 2: Adicionar Destino
1. Na aba **"Destinations"**, clique no ícone **"+"** (Add Destination).
2. Selecione a opção **"Cloud storage / FTP / SFTP"**.

## Passo 3: Configurar Conta S3
1. Clique no botão de adicionar nova conta Cloud.
2. Escolha **"Amazon S3 Compatible (MinIO, Wasabi, etc)"**.
3. Preencha os campos com as credenciais disponíveis no seu Dashboard:

| Campo | Valor |
|-------|-------|
| **Account Name** | `Prime Cloud Pro` |
| **Service Point URL** | `https://s3.cloudstoragepro.com.br` |
| **Access Key ID** | `(Copie do Dashboard > Access Keys)` |
| **Secret Access Key** | `(Sua chave secreta)` |
| **Region** | `us-east-1` |

## Passo 4: Testar e Salvar
1. Clique em **"Test Connection"**. Se tudo estiver correto, você verá uma mensagem de sucesso.
2. Selecione o **Bucket** desejado na lista.
3. Clique em **OK** para salvar.

## Dicas
- Habilite a **compressão zip** no Imperius para economizar espaço e bandwidth.
- Configure o **lifecycle policy** no nosso Dashboard para remover backups antigos automaticamente.
