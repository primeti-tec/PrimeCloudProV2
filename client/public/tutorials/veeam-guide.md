# Guia de Configuração: Veeam Backup & Replication

Este guia ajuda você a conectar o **Veeam Backup** ao repositório S3 do Prime Cloud Pro.

## Requisitos
- Veeam Backup & Replication v10 ou superior (edições Enterprise ou Community suportam S3).

## Passo 1: Adicionar Repositório
1. Abra o console do Veeam.
2. Vá para **"Backup Infrastructure"** > **"Backup Repositories"**.
3. Clique em **"Add Repository"**.

## Passo 2: Selecionar Tipo
1. Escolha **"Object Storage"**.
2. Selecione **"S3 Compatible"**.

## Passo 3: Configurar Conexão
1. **Name**: Digite `Prime Cloud Pro`.
2. **Service Point**: Digite `https://s3.cloudstoragepro.com.br`.
3. **Region**: `us-east-1`.
4. **Credentials**: Clique em "Add..." e insira sua **Access Key** e **Secret Key**.

## Passo 4: Escolher Bucket e Pasta
1. O Veeam listará seus buckets. Selecione o bucket de destino (ex: `backup-veeam`).
2. Clique em "Browse" para criar ou selecionar uma pasta dentro do bucket.
3. Marque a opção **"Limit concurrent tasks"** se desejar controlar a largura de banda.

## Passo 5: Imutabilidade (Opcional)
Se você habilitou o *Object Lock* na criação do bucket, marque a opção "Make recent backups immutable" para proteção contra ransomware.

## Conclusão
Agora você pode criar um **Backup Job** ou **Backup Copy Job** apontando para este novo repositório!
