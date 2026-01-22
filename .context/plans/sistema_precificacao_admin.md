# Plano de Implementação: Sistema de Precificação Admin

## ✅ STATUS: CONCLUÍDO (v1.0)

**Data de Início:** 2026-01-22
**Data de Conclusão:** 2026-01-22
**Responsável:** Antigravity (Agent)

---

## 1. Visão Geral

Implementação completa de um sistema de gerenciamento de preços dinâmicos, permitindo que administradores alterem valores de recursos (VPS, Backup, Storage) sem necessidade de alterar código. O sistema inclui backend, frontend admin e integração com os formulários de contratação do cliente.

---

## 2. Componentes Implementados

### ✅ Backend (Server & Database)
- **Schema**: Novas tabelas `pricing_configs` e `pricing_history`.
- **API**: Endpoints CRUD para gerenciamento de preços (`/api/admin/pricing`).
- **Orders**: Novo endpoint e lógica para processar pedidos de Backup (`/api/accounts/:id/orders/backup`), substituindo simulações anteriores.
- **Notificações**: Alertas automáticos para admins quando novos pedidos são criados.

### ✅ Frontend (Admin Dashboard)
- **Gerenciador de Preços**: UI intuitiva para editar preços por categoria.
- **Histórico**: Visualização de log de auditoria de mudanças de preço.
- **Categorias Suportadas**:
  - Servidor VPS (CPU, RAM, SSD, IP, etc.)
  - Backup Cloud (Armazenamento, Retenção, Frequência)
  - Backup VPS (Snapshot, Multiplicadores)

### ✅ Frontend (Área do Cliente)
- **Integração Real**: Formulários de contratação (`VpsConfigurator`, `ContractService`) agora buscam preços da API.
- **Hooks**: `usePricing` para buscar valores e `useCreateBackupOrder` para processar pedidos.
- **Feedback**: Sistema de toast notifications e redirecionamento após sucesso.

---

## 3. Arquitetura de Preços Implementada

### Estrutura de Custo VPS
```typescript
Total = (Cores * PreçoCore) + (RAM * PreçoRAM) + (SSD * PreçoSSD) + 
        (Banda * PreçoBanda) + (IPs * PreçoIP) + Extras
```

### Estrutura de Custo Backup Cloud
```typescript
Total = (Storage * PreçoGB) + PreçoFrequencia + (RetencaoExtra * PreçoDia)
```

### Estrutura de Custo Backup VPS
```typescript
Total = (BaseSnapshot + (TamanhoVM * PreçoGB)) * MultiplicadorFrequencia + 
        (Retencao * PreçoDia) + Addons
```

---

## 4. Arquivos Modificados/Criados

- `shared/schema.ts`: Definição de tabelas e tipos.
- `server/storage.ts`: Lógica de banco de dados e seed.
- `server/routes.ts`: Endpoints da API.
- `client/src/hooks/use-pricing.ts`: Hooks de dados.
- `client/src/hooks/use-backup-order.ts`: Hook de pedido.
- `client/src/components/admin/PricingManager.tsx`: UI Admin.
- `client/src/pages/AdminDashboard.tsx`: Integração no painel.
- `client/src/components/VpsConfigurator.tsx`: Integração VPS.
- `client/src/pages/ContractService.tsx`: Integração Backup.

---

## 5. Próximos Passos (Futuro)

- [ ] Criar painel dedicado para listar e gerenciar todos os pedidos (`/admin/orders`).
- [ ] Implementar sistema de faturas recorrentes baseado nesses preços.
- [ ] Adicionar suporte a múltiplas moedas (USD/EUR).
