# Plano de Implementação: Gerenciamento de Arquivos no Bucket

## Objetivo
Implementar a funcionalidade completa de gerenciamento de arquivos (Objects) para usuários externos e internos. Isso permitirá:
1. Listar arquivos de um bucket.
2. Visualizar/Baixar arquivos.
3. Fazer upload de arquivos.
4. Excluir arquivos (conforme permissão).

## 1. Backend: Expansão do MinioService
**Arquivo:** `server/services/minio.service.ts`

Adicionar métodos essenciais que faltam no serviço:
- `presignedGetObject(bucketName, objectName, expiry)`: Gerar URL temporária para leitura.
- `presignedPutObject(bucketName, objectName, expiry)`: Gerar URL temporária para upload (PUT).
- `removeObject(bucketName, objectName)`: Remover um objeto.

## 2. Backend: Novas Rotas de API
**Arquivo:** `server/routes.ts`

Criar endpoints para manipulação de arquivos. **Crítico:** Implementar verificação rigorosa de `bucketPermissions`.

### Endpoints
- `GET /api/accounts/:accountId/buckets/:bucketId/objects`
  - Lista arquivos do bucket.
  - Verifica permissão `read` ou `read-write`.

- `POST /api/accounts/:accountId/buckets/:bucketId/objects/upload-url`
  - Gera URL assinada para upload.
  - Body: `{ filename, contentType }`.
  - Verifica permissão `write` ou `read-write`.

- `GET /api/accounts/:accountId/buckets/:bucketId/objects/:key/download-url`
  - Gera URL assinada para download.
  - Verifica permissão `read` ou `read-write`.

- `DELETE /api/accounts/:accountId/buckets/:bucketId/objects/:key`
  - Remove o objeto.
  - Verifica permissão `write` ou `read-write`.

## 3. Frontend: Navegador de Arquivos (Bucket Browser)
**Novo Arquivo:** `client/src/pages/BucketBrowser.tsx`

Criar uma nova interface de usuário que será acessada ao clicar em um bucket na lista.

### Funcionalidades
- **Listagem:** Tabela com ícone, nome, tamanho, última modificação.
- **Navegação:** Suporte a "pastas" (prefixos virtuais).
- **Upload:** Botão "Upload" que:
  1. Pede URL assinada ao backend.
  2. Faz PUT direto para o MinIO/S3.
- **Preview:** Clicar no arquivo abre preview (para imagens/PDFs) ou baixa.
- **Delete:** Botão de lixeira (condicional à permissão).

### Integração
- **Arquivo:** `client/src/pages/Storage.tsx`
  - Transformar o nome do bucket em um link clicável.
  - Redirecionar para `/dashboard/storage/:bucketId` (ou abrir modal).

- **Arquivo:** `client/src/App.tsx`
  - Adicionar nova rota `/dashboard/storage/:bucketId`.

## Estratégia de Deploy
1. Atualizar `MinioService`.
2. Criar rotas de API.
3. Implementar componente Frontend.
4. Integrar e testar permissões (External Client Read-Only vs Read-Write).
