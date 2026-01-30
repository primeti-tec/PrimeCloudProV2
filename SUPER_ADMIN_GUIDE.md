# Manual do Super Admin (Gestor da Plataforma)

Este guia é destinado ao **Dono da Plataforma** (Master/Super Admin). Aqui estão descritos os processos de gestão global do sistema Prime Cloud Pro.

## 1. Visão Geral do Painel
Ao acessar o sistema como Super Admin, sua tela inicial é o **Painel Administrativo**. Ele oferece uma visão macro da saúde do negócio:

*   **MRR (Receita Recorrente mensal):** Soma de todos os contratos ativos.
*   **Novos Cadastros:** Clientes que entraram este mês.
*   **Taxa de Churn:** Percentual de cancelamentos.
*   **Alertas:** Contas pendentes ou solicitações de quota que exigem sua atenção imediata.

---

## 2. Rotina Diária: Aprovações e Solicitações

### Aprovando Novas Contas (MSP/Clientes Diretos)
Novos cadastros podem cair em uma fila de "Aguardando Aprovação".
1.  No Painel, localize o cartão **"Aguardando Aprovação"**.
2.  Verifique os dados da empresa (CNPJ, Nome).
3.  **Ação:**
    *   **Aprovar:** Libera o acesso imediato ao painel.
    *   **Rejeitar:** Bloqueia o cadastro (útil para spans ou cadastros inválidos).

### Gerenciando Solicitações de Aumento de Quota
Quando um cliente atinge o limite do plano, ele pode solicitar mais espaço via painel dele.
1.  Localize a seção **"Solicitações de Quota"**.
2.  Você verá a **Quota Atual**, **Quota Solicitada** e o **Motivo**.
3.  **Ação:**
    *   **Aprovar:** O sistema atualiza o limite de armazenamento do cliente instantaneamente.
    *   **Rejeitar:** O limite permanece o mesmo (você pode adicionar uma nota explicando o motivo).

---

## 3. Gestão de Produtos e Preços

Você define as "regras do jogo" criando Produtos (Planos) que seus clientes podem assinar.

1.  Vá até a sessão **Produtos/Planos** no final do Dashboard.
2.  Clique em **"Criar Produto"**.
3.  **Configurações do Plano:**
    *   **Nome:** Ex: "Plano Starter 1TB".
    *   **Preço Base (R$):** Valor fixo mensal.
    *   **Armazenamento (GB):** Franquia incluída no preço base.
    *   **Preço Excedente (Storage):** Quanto cobrar por GB se o cliente passar da franquia (Ex: R$ 0,15).
    *   **Preço Excedente (Transferência):** Custo de banda, se aplicável.
    *   **Preço Licença Imperius:** Valor unitário da licença de backup (Ex: R$ 59,00).
4.  **Salvar:** O plano ficará disponível para atribuição.

---

## 4. Gestão de Clientes Ativos

Na tabela **"Contas Ativas"**, você tem controle total sobre quem já está usando a plataforma.

*   **Ajuste Manual de Quota:**
    *   Clique em **"Quota"** ao lado de um cliente.
    *   Você pode forçar um novo limite de GB ou mudar o número de licenças Imperius contratadas sem esperar solicitação do cliente.
*   **Suspender Conta:**
    *   Em caso de inadimplência grave, clique em **"Suspender"**.
    *   O cliente perde acesso ao painel e os uploads são bloqueados, mas os dados **não** são apagados imediatamente.
*   **Reativar:** Restaura o acesso de uma conta suspensa.

---

## 5. Faturamento e Faturas (Financeiro)

O sistema possui um motor de geração de faturas.

1.  **Geração Mensal:**
    *   O sistema pode rodar uma rotina (automática ou gatilho manual via API) para fechar o mês.
    *   Ele calcula: `(Valor do Plano)` + `(Excedente de GB * Preço GB)` + `(Licenças Imperius * Preço Licença)`.
2.  **Gestão de Faturas (Menu "Faturas"):**
    *   Visualize faturas em aberto.
    *   Marque faturas como **"Pagas"** manualmente (se o pagamento for via transferência/PIX direto).
    *   O cliente vê essas faturas no painel dele.

---

## 6. Monitoramento de Segurança (Auditoria)

Como Super Admin, você deve ficar atento a:
*   **Exclusão de Contas:** Ação destrutiva que remove todos os buckets e backups. O sistema pede dupla confirmação.
*   **Logs:** O sistema registra quem aprovou quem, e alterações de quota. (Logs técnicos disponíveis no banco de dados `audit_logs`).

---

## Resumo das Responsabilidades

| Frequência | Tarefa | Onde |
| :--- | :--- | :--- |
| **Diário** | Aprovar novos cadastros | Dashboard > Pendentes |
| **Diário** | Analisar pedidos de quota | Dashboard > Solicitações |
| **Mensal** | Confirmar pagamentos (Baixa manual) | Menu Faturas |
| **Eventual** | Criar novos planos/produtos | Dashboard > Produtos |
| **Eventual** | Suspender inadimplentes | Contas Ativas |

Este painel centraliza o controle do seu negócio de Backup as a Service (BaaS).
