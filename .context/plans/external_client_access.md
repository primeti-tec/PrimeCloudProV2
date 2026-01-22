# Plano: Acesso de Usuários Externos (Clientes de Terceiros)

Este plano descreve a implementação de uma funcionalidade que permite aos tenants (nossos clientes) fornecerem acesso restrito a terceiros (os clientes deles) para visualização e upload de backups.

## 1. Objetivos
- Permitir que um Tenant (ex: Dicorel) convide um usuário externo (ex: Fliint).
- O usuário externo deve ter acesso apenas ao Gerenciador de Arquivos.
- O usuário externo deve poder visualizar e fazer upload de arquivos em buckets específicos (ou todos da conta).
- Manter o isolamento multi-tenant (Fliint só vê dados da Dicorel).

## 2. Mudanças no Esquema de Dados (`shared/schema.ts`)
- **Novas Roles**: Adicionar a role `external_viewer` ou `client` na tabela `account_members` e `invitations`.
    - `admin`: Controle total.
    - `developer`: Acesso técnico.
    - `external_client`: Acesso apenas a arquivos (view/upload).

## 3. Backend e API (`server/routes.ts`)
- **Proteção de Rotas**:
    - Ajustar middlewares `requireAuth()` e verificações de role.
    - Garantir que `external_client` seja bloqueado em rotas de:
        - Faturamento (`/api/billing/*`)
        - Configurações de SMTP (`/api/accounts/:id/smtp`)
        - Gestão de Membros (não pode convidar outros)
- **Convites**: Atualizar endpoint de convite para suportar a nova role.

## 4. Frontend - Gerenciamento (Dono da Conta)
- **Interface de Equipe**: Adicionar uma aba "Equipe" ou "Acessos" em Configurações.
    - Lista de membros atuais.
    - Botão "Convidar Usuário Externo".
    - Seleção de Buckets (opcional: definir a quais buckets o usuário terá acesso).

## 5. Frontend - Experiência do Usuário Externo
- **Navegação Restrita**: O Sidebar deve ocultar links irrelevantes (Dashboard Financeiro, Settings, Billing).
- **Landing Page**: Ao logar, usuários com role `external_client` são redirecionados diretamente para o File Manager.
- **Branding**: O usuário verá o logo e cores definidos pelo Tenant dono da conta (White-label).

## 6. Progresso e Próximos Passos

### ✅ Fase 1 - Concluído
1. Atualização do enum de roles no `schema.ts` (adicionado `external_client`).
2. Criação do hook `useCurrentRole` para verificar permissões.
3. Atualização do `Sidebar.tsx` para ocultar links com base na role.
4. Atualização do `App.tsx` para redirecionar `external_client` para `/dashboard/storage`.
5. Implementação da opção "Cliente Externo" na interface de convites (`Team.tsx`).

### ✅ Fase 2 - Concluído (Permissões por Bucket)

#### Schema
- ✅ Criada tabela `bucket_permissions` com FK para `account_members` e `buckets`.
- ✅ Adicionado campo `metadata` na tabela `invitations` para armazenar permissões temporárias.

#### Backend
- ✅ `createInvitation` agora aceita `metadata` com permissões de bucket.
- ✅ `acceptInvitation` cria as `bucketPermissions` ao aceitar convite de `external_client`.

#### Frontend
- ✅ Modal de convite exibe lista de buckets com checkboxes quando role é `external_client`.
- ✅ Seletor de permissão (Leitura/Escrita/Leitura e Escrita) para cada bucket.

### ✅ Fase 3 - Concluído (Restrições de UI)

#### Backend
- ✅ Rota de listagem de buckets filtra baseado nas permissões do usuário externo.
- ✅ Rota de listagem retorna campo `userPermission` com a permissão atual do usuário.

#### Frontend (Storage.tsx)
- ✅ Botão "Criar Bucket" oculto para usuários externos.
- ✅ Botão "Excluir" e opções de gerenciamento ocultas para usuários externos.
- ✅ Coluna "Sua Permissão" exibida para usuários externos mostrando Read/Write/Read-Write.
- ✅ Colunas desnecessárias ("Limite GB", "Versionamento") ocultas para usuários externos.

## 7. Fluxo Completo de Uso

1. **Admin** acessa a página **Equipe** e clica em **"Convidar Membro"**.
2. Seleciona **"Cliente Externo (Apenas arquivos)"** como função.
3. Marca os buckets que o cliente poderá acessar e define as permissões para cada um.
4. Envia o convite por e-mail.
5. **Cliente externo** aceita o convite e loga no sistema.
6. É redirecionado diretamente para a página **Armazenamento**.
7. Visualiza apenas os buckets aos quais tem acesso, com sua permissão claramente indicada.
8. Não consegue criar, excluir ou alterar configurações de buckets.
