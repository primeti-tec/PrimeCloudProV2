# Plano de Melhoria: Dashboard de Faturamento e Planos

Este plano detalha as alterações necessárias na página de Faturamento (`Billing.tsx`) para corrigir inconsistências, remover funcionalidades indesejadas e melhorar a apresentação.

## Objetivos
1. **Remover Mockups**: As faturas (`Invoices`) atualmente podem estar usando dados mockados. Devemos garantir que apenas faturas reais (se existirem) ou uma mensagem de "Nenhuma fatura" sejam exibidas.
2. **Remover Downgrade**: Remover o botão e a lógica de "Fazer Downgrade" conforme solicitado.
3. **Melhorias Visuais e de Dados**:
   - Ajustar a exibição da seção "Planos" para ser mais clara e coerente.
   - Reforçar que os dados de "Resumo de Uso" sejam os dados reais (já implementado no backend/hook, apenas confirmar uso).
   - Ocultar a seção de Faturas se não houver faturas reais, ou exibir mensagem amigável "Nenhuma fatura disponível".

## Etapas de Implementação

### 1. Refatoração da Seção de Planos [CONCLUÍDO]
- [x] Remover o botão "Fazer Downgrade".
- [x] Manter apenas o botão "Alterar Plano" (ou Upgrade).
- [x] Alterar o layout dos cards de planos para destacar o plano atual vs. outros planos disponíveis.

### 2. Limpeza de Faturas (Invoices) [CONCLUÍDO]
- [x] Verificar a implementação de `useInvoices` em `use-billing.ts`. Se estiver retornando mock, alterar para retornar vazio `[]` até que o backend de faturas reais esteja pronto.
- [x] Na UI, se `invoices.length === 0`, exibir um estado vazio (Empty State) em vez de tabela vazia ou mocks.

### 3. Ajustes de Coerência [CONCLUÍDO]
- [x] Garantir que `usageData` esteja sendo usado corretamente para exibir os cards de "Resumo de Uso".
- [x] Remover o cálculo de "Custo Projetado" se ele estiver confuso ou incorreto, ou adicionar um tooltip explicando que é uma estimativa baseada no uso excedente.
 (Nota: Mantido o cálculo de custo projetado, mas garantido que usa dados reais do hook `useUsageSummary`).

## Arquivos Afetados
- `client/src/pages/Billing.tsx`
- `client/src/hooks/use-billing.ts` (verificação)

## Status
Concluído em 2026-01-20. O Dashboard de Billing agora reflete dados reais, não possui opção de downgrade e trata corretamente a ausência de faturas.
