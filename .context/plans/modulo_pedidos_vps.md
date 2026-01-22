# Plano de Implementação: Módulo de Pedidos e Configuração de VPS

## ✅ STATUS: IMPLEMENTADO E REORGANIZADO

**Data de Conclusão:** 2026-01-22
**Última Atualização:** Reorganização de menu conforme solicitação

---

## 1. Visão Geral
Este plano descreve o desenvolvimento do novo módulo "Pedidos" (antigo Produtos), focado na contratação de recursos de infraestrutura, com destaque para o **Configurador de VPS** (Virtual Private Server).

---

## 2. Reorganização Realizada

### ✅ Alterações de Navegação
- **"Contratar Serviço"** agora aparece como item principal no menu lateral (Sidebar)
- **"Pedidos"** foi removido do menu lateral e integrado à página de **Faturamento**
- A página de Faturamento agora exibe os pedidos recentes em uma seção dedicada

### Nova Estrutura do Menu:
1. Dashboard
2. **Contratar Serviço** (novo item - acesso direto ao configurador)
3. Armazenamento
4. Acesso SFTP
5. Backup
6. Equipe
7. Faturamento (contém: Faturas + Pedidos)
8. Chaves de API
9. Configurações

---

## 3. O Que Foi Implementado

### ✅ Fase 1: Backend & Banco de Dados
- [x] Tabela `vps_configs` com campos completos para configuração de VPS
- [x] Novos campos na tabela `orders`: `orderType`, `adminNotes`, `estimatedDelivery`, `deliveredAt`
- [x] Métodos `createVpsOrder()` e `getVpsConfig()` no storage

### ✅ Fase 2: API Routes
- [x] Rota `POST /api/accounts/:accountId/orders/vps`
- [x] Validação com Zod e logs de auditoria

### ✅ Fase 3: Frontend
- [x] **VpsConfigurator.tsx** - Interface inspirada no vStack
- [x] **ContractService.tsx** - Catálogo de serviços
- [x] Hook `use-vps-order.ts` para chamadas à API
- [x] Rota `/dashboard/contract` no App.tsx
- [x] Seção de Pedidos integrada à página de Faturamento

### ✅ Fase 4: Reorganização de Menu
- [x] "Contratar Serviço" adicionado como item do menu lateral com ícone Server
- [x] "Pedidos" removido do menu lateral
- [x] Pedidos integrados como seção na página de Faturamento

---

## 4. Fluxo da Aplicação

### Contratar Novo Serviço:
1. Menu lateral → **"Contratar Serviço"**
2. Página de catálogo com opções (VPS, Dedicado, Storage, etc.)
3. Configurador de VPS com sliders interativos
4. "Solicitar Orçamento" → Pedido criado

### Visualizar Pedidos:
1. Menu lateral → **"Faturamento"**
2. Rolar até seção **"Pedidos"**
3. Visualizar status, valores e ações

---

## 5. Arquivos Modificados/Criados

### Criados:
- `client/src/components/VpsConfigurator.tsx`
- `client/src/pages/ContractService.tsx`
- `client/src/hooks/use-vps-order.ts`

### Modificados:
- `shared/schema.ts` - Tabela vps_configs
- `shared/routes.ts` - Rota createVps
- `server/storage.ts` - Métodos VPS
- `server/routes.ts` - Implementação da rota
- `client/src/App.tsx` - Rota /dashboard/contract
- `client/src/components/Sidebar.tsx` - Menu reorganizado
- `client/src/pages/Billing.tsx` - Seção de Pedidos adicionada
- `client/src/pages/Orders.tsx` - Botão removido

---

## 6. Próximos Passos Sugeridos

1. **Painel Admin para VPS**: Tela para Super Admin processar pedidos VPS
2. **Notificações por Email**: Enviar email quando status mudar
3. **Templates Pré-definidos**: Pacotes como "VPS Basic", "VPS Pro"
4. **Integração de Provisionamento**: API para Proxmox/VMware
