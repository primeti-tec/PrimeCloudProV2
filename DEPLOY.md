# Guia de Deploy no Coolify

Este guia descreve como implantar o **PrimeCloudProV2** em uma instância do Coolify.

## Pré-requisitos

1. Uma instância do **Coolify** rodando na sua VPS.
2. Este repositório conectado à sua conta do Coolify (GitHub/GitLab/Bitbucket ou URL pública).

## Opção 1: Deploy com Docker Compose (Recomendado)

Esta opção é ideal se você quer subir a aplicação E os serviços dependentes (PostgreSQL e MinIO) tudo de uma vez.

1. No Coolify, crie um novo recurso do tipo **Git Repository** ou **Docker Compose**.
2. Selecione este repositório.
3. Em **Build Pack**, escolha **Docker Compose**.
4. No campo **Docker Compose Location**, aponte para `./docker-compose.prod.yml` (ou copie o conteúdo deste arquivo para o editor do Coolify).
5. **Variáveis de Ambiente**:
   Preencha todas as variáveis listadas em `.env.production.example`.
   - `DATABASE_URL`: Se estiver usando o serviço `postgres` do compose, a URL interna será `postgresql://postgres:postgres@postgres:5432/primecloud`.
   - `MINIO_ENDPOINT`: Se usar o serviço `minio`, use `minio`.
6. Configure os Domínios:
   - Para o serviço `app`, aponte seu domínio principal (ex: `app.seudominio.com`) para a porta `5000`.
   - Para o `minio`, aponte um subdomínio (ex: `s3.seudominio.com`) para a porta `9000` e outro para o console `9001` (opcional).

## Opção 2: Deploy com Dockerfile (Apenas App)

Use esta opção se você já tiver bancos de dados PostgreSQL e S3 (MinIO/AWS) rodando separadamente no Coolify ou externamente.

1. Crie um novo recurso do tipo **Application**.
2. Fonte: **Git Repository**.
3. **Build Pack**: **Dockerfile**.
4. **Docker Image**: Deixe em branco (vai usar o arquivo do repo).
5. **Dockerfile Path**: `/Dockerfile`.
6. Defina as **Environment Variables** (Secrets):
   - Copie as chaves do `.env.production.example`.
   - **Crucial**: `DATABASE_URL` deve apontar para seu banco existente.
7. **Mappings**:
   - Porta Interna: `5000`.
8. Faça o **Deploy**.

## Notas Importantes

### Armazenamento Persistente (Volumes)
- O `docker-compose.prod.yml` já define volumes persistentes para `postgres_data` e `minio_data`.
- Se usar o Coolify, ele gerencia volumes Docker automaticamente, mas verifique na aba "Storage" se os caminhos estão corretos (`/var/lib/postgresql/data` para PG e `/data` para MinIO).

### Migrações de Banco de Dados
- O container está configurado para rodar `npx drizzle-kit push` automaticamente ao iniciar (`docker-entrypoint.sh`).
- Isso garante que qualquer mudança de schema seja aplicada no deploy. **Cuidado em produção**: Para maior controle, considere rodar migrações manualmente via CLI se preferir.

### MinIO (Armazenamento de Arquivos)
- Se usar o MinIO embutido, lembre-se de configurar os domínios no painel do Coolify para acessar os arquivos publicamente.
- O bucket padrão deve ser criado manualmente ou via script se ainda não existir (o app tenta criar, mas precisa de credenciais válidas).

### Domínios e SSL
- O Coolify (via Traefik) gerencia SSL automaticamente (Let's Encrypt). Apenas aponte os registros DNS (A/CNAME) para o IP da sua VPS.

## Configuração do Clerk (Autenticação)

### Variáveis Obrigatórias

O Clerk requer as seguintes variáveis configuradas:

**Build Arguments** (necessárias durante o build):
```
VITE_CLERK_PUBLISHABLE_KEY=pk_live_xxxx
```

**Environment Variables** (necessárias em runtime):
```
CLERK_PUBLISHABLE_KEY=pk_live_xxxx
CLERK_SECRET_KEY=sk_live_xxxx
```

### Configuração no Coolify

1. No painel do Coolify, vá em **Settings** > **Environment Variables**
2. Adicione as variáveis `CLERK_PUBLISHABLE_KEY` e `CLERK_SECRET_KEY`
3. Vá em **Settings** > **Build** e adicione o Build Argument `VITE_CLERK_PUBLISHABLE_KEY`
4. Faça o deploy

### Problemas Conhecidos

**Erro: "Cannot access 'at' before initialization" ou "Cannot read properties of undefined (reading 'useState')"**

Este erro ocorre quando há conflito de bundling entre React e Clerk. Soluções aplicadas:

1. **Vite versão 5.4.x** - Versões mais novas (7.x) causam conflitos de mangling
2. **Sem manualChunks** - O `vite.config.ts` não deve ter configuração customizada de `manualChunks` para evitar problemas de ordem de carregamento
3. **optimizeDeps** - Incluir Clerk no `optimizeDeps.include`:
   ```typescript
   optimizeDeps: {
     include: ['@clerk/clerk-react', '@clerk/shared', '@clerk/types'],
   },
   ```

**Erro: "Publishable key not valid" (500)**

Este erro indica que as variáveis do Clerk não estão configuradas corretamente no runtime.

1. Verifique se `CLERK_PUBLISHABLE_KEY` e `CLERK_SECRET_KEY` estão no `.env` do Coolify
2. O Coolify pode sobrescrever o `.env` a cada deploy - configure as variáveis no painel
3. Após corrigir o `.env`, recrie o container:
   ```bash
   cd /data/coolify/applications/<app-id>
   docker compose up -d --force-recreate api
   ```

### Versões Testadas

- Node.js: 20.x
- Vite: 5.4.14
- @clerk/clerk-react: 5.59.4
- @clerk/express: 1.7.63
