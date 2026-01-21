# Plano: Atualização do Dashboard com Dados Reais

Este plano detalha as alterações necessárias para que o painel principal do usuário exiba as estatísticas de uso reais (armazenamento, bandwidth, buckets, membros) em vez de dados fictícios (mock).

## 1. Implementação Backend

### 1.1. Criar Rota de Usage Summary
O arquivo `server/routes.ts` precisa de um novo endpoint para servir o resumo de uso calculado pelo método `storage.getUsageSummary`.

**Rota:** `GET /api/accounts/:id/usage`
**Acesso:** Autenticado (Membros da conta ou Admin).

**Lógica:**
1. Verificar permissão de membro.
2. Chamar `storage.getUsageSummary(accountId)`.
3. Retornar JSON com `storageUsedGB`, `bandwidthUsedGB`, `apiRequestsCount`, `projectedCost`.

## 2. Implementação Frontend

### 2.1. Atualizar Hooks
Verificar se os hooks necessários já existem e estão corretos:
- `useUsageSummary` (em `client/src/hooks/use-billing.ts`) - Já existe, mas precisa do backend.
- `useBuckets` (em `client/src/hooks/use-buckets.ts`) - Para contagem de buckets.
- `useMembers` (em `client/src/hooks/use-members.ts`) - Para contagem de equipe.

### 2.2. Refatorar `Dashboard.tsx`
O arquivo `client/src/pages/Dashboard.tsx` utiliza atualmente uma constante `mockUsage`.

**Passos:**
1. Remover a constante `mockUsage`.
2. Importar e utilizar os hooks:
   - `const { data: usage } = useUsageSummary(currentAccount?.id);`
   - `const { data: buckets } = useBuckets(currentAccount?.id);`
   - `const { data: members } = useMembers(currentAccount?.id);`
3. Substituir os valores estáticos pelos dinâmicos:
   - **Armazenamento**: `usage?.storageUsedGB`
   - **Bandwidth**: `usage?.bandwidthUsedGB`
   - **Buckets Ativos**: `buckets?.length`
   - **Membros**: `members?.length`
4. Atualizar a lógica dos banners de alerta (Warning/Critical) para usar o percentual real.
5. Atualizar o cálculo de "Custo Estimado" para usar `usage?.projectedCost` ou recalcular com base nos dados reais.

## 3. Validação
1. Acessar o Dashboard logado como PrimeTI.
2. Verificar se o card de Armazenamento mostra o valor total dos buckets (ex: ~468 GB).
3. Verificar se a barra de progresso reflete a ocupação da quota.
