# Guia de Onboarding para Seus Clientes (Modelo Revenda/MSP)

Este guia explica como você (Provedor/MSP) deve cadastrar e configurar os **seus clientes finais** dentro da plataforma Prime Cloud Pro.

## Entendendo o Modelo
No Prime Cloud Pro, você tem duas formas de gerenciar seu cliente:
1.  **Entidade de Cobrança (Padrão):** Apenas para organizar buckets e faturas, sem acesso ao painel.
2.  **Entidade com Acesso Externo (Novo):** O cliente ganha um login restrito para visualizar apenas os buckets dele (ex: baixar backups, auditar arquivos).

---

## Passo 1: Cadastrar o Cliente (Entidade de Cobrança)

Primeiro, crie a entidade fiscal/administrativa para vincular os custos.

1.  Acesse seu Dashboard e vá em **Gestão de Clientes** (Menu Lateral).
2.  Clique em **Novo Cliente**.
3.  Preencha os dados: Nome da Empresa, CNPJ/CPF, Emails.
4.  **Configuração de Cobrança:** Defina o modelo (*Fixo, Por Uso ou Híbrido*).
5.  Clique em **Cadastrar**.

---

## Passo 2: Provisionar Armazenamento (Buckets)

Crie o cofre exclusivo para este cliente.

1.  Vá em **Buckets** > **Novo Bucket**.
2.  Nomeie seguindo um padrão: `cliente-nomeempresa-backup01`.
3.  Vá em **Gestão de Clientes**, edite o cliente e **Vinule este bucket** a ele.
    *   *Isso garante que o uso de disco vá para a fatura correta.*

---

## Passo 3: Configurar o Backup (Técnico)

Configure o Imperius no servidor do cliente.

1.  Vá em **Tokens de Acesso** e crie um token (ex: `Token - Cliente XYZ`).
2.  No Imperius/Software de Backup do cliente:
    *   **Endpoint:** `https://s3.cloudstoragepro.com.br`
    *   **Access Key / Secret:** *[Chaves geradas]*
    *   **Bucket:** `cliente-nomeempresa-backup01`

---

## Passo 4: Dar Acesso ao Painel para o Cliente (Opcional)

Se o seu cliente deseja **acessar o portal** para ver os arquivos ou confirmar que o backup está lá:

1.  Vá em **Gestão de Equipe** (Menu do Topo ou Lateral).
2.  Clique em **Convidar Membro**.
3.  **E-mail:** Coloque o e-mail do TI ou gestor do seu cliente.
4.  **Função:** Selecione **"Cliente Externo"**.
    *   *Esta função remove acesso a faturas globais, configurações da sua conta e outros clientes.*
5.  **Buckets Permitidos:**
    *   Aparecerá uma lista dos seus buckets.
    *   **Marque APENAS o bucket deste cliente** (ex: `cliente-nomeempresa-backup01`).
    *   Defina a permissão (Geralmente **Leitura** é suficiente para auditoria, ou **Full** se eles puderem apagar arquivos).
6.  Clique em **Enviar Convite**.

### O que o Cliente vê?
*   Ele receberá um e-mail para criar senha.
*   Ao logar, ele verá um painel simplificado.
*   Ele verá **apenas** o bucket que você compartilhou.
*   Ele **não** vê quanto você paga, nem seus outros clientes.

---

## Resumo do Fluxo

| Ação | Quem Faz? | Onde? |
| :--- | :--- | :--- |
| Criar Cliente (Fiscal) | Você (MSP) | Gestão de Clientes |
| Criar Bucket | Você (MSP) | Buckets |
| Configurar Backup | Técnico | Servidor do Cliente (Imperius) |
| **Dar Acesso Visual** | **Você (MSP)** | **Gestão de Equipe > Convidar (Cliente Externo)** |

Este modelo garante segurança total (segregação de dados) e transparência para seu cliente final.
