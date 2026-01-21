# Plano: Sincronização de Buckets MinIO para Conta PrimeTI

Este plano descreve o procedimento para importar buckets órfãos do servidor MinIO para a base de dados do PrimeCloudProV2, vinculando-os à conta PrimeTI e resgatando informações de uso.

## 1. Identificação Inicial
- Localizar o `id` da conta named "PrimeTI" na tabela `accounts`.
- Obter a lista de todos os buckets já registrados no PostgreSQL (`buckets` table).

## 2. Coleta de Dados do MinIO
- Desenvolver um script utilitário (`script/sync-minio-buckets.ts`) que utilize o `minioClient`.
- Listar todos os buckets presentes no servidor via `minioClient.listBuckets()`.

## 3. Lógica de Sincronização
Para cada bucket retornado pelo MinIO que **não** esteja na tabela `buckets`:
- **Verificação de Prefixo**: Se o nome seguir o padrão `tenant-{ID}-{name}`, verificar se o `{ID}` existe na base.
- **Associação**: 
    - Se o ID do tenant for válido, associar a esse cliente.
    - Caso contrário (buckets órfãos), associar ao ID da conta **PrimeTI**.
- **Coleta de Métricas**:
    - Listar objetos do bucket para calcular o `size_bytes` total.
    - Contar o número de objetos (`object_count`).
- **Inserção**: Criar o registro na tabela `buckets` com o `accountId` definido, `name`, `size_bytes`, `object_count` e `createdAt`.

## 4. Atualização de Uso da Conta
- Para as contas que receberam novos buckets, atualizar o campo `storage_used` na tabela `accounts` somando os tamanhos dos novos buckets importados.

## 5. Execução e Logs
- Executar o script em ambiente de desenvolvimento.
- Gerar log detalhando:
    - Buckets importados com sucesso.
    - Buckets que já existiam (ignorados).
    - Erros de conexão ou permissão.

## 6. Verificação
- Validar no painel administrativo se os buckets agora aparecem listados para a conta PrimeTI.
- Confirmar se as métricas de armazenamento no Billing refletem os dados importados.
