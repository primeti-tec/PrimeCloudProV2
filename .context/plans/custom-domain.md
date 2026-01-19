# Plano de Implementação de Domínios Customizados

Permitir que os clientes utilizem seus próprios domínios (ex: backup.empresa.com.br) ou subdomínios para acessar a plataforma, reforçando a estratégia de White Label.

## Mudanças Propostas

### 1. Esquema do Banco de Dados
#### [MODIFY] [schema.ts](file:///d:/PROJETOS/PRINECLOUDPROV2/PrimeCloudProV2/shared/schema.ts)
- Adicionar campos à tabela `accounts`:
    - `customDomain`: texto (URL do domínio/subdomínio personalizado, ex: `storage.cliente.com`)
    - `domainStatus`: texto (Status da verificação: `pending`, `active`, `failed`)
    - `dnsVerificationToken`: texto (Token para validação via registro TXT ou CNAME)

### 2. Infraestrutura e Backend (Multi-tenancy por Domínio)
#### [MODIFY] [routes.ts](file:///d:/PROJETOS/PRINECLOUDPROV2/PrimeCloudProV2/server/routes.ts)
- Implementar um middleware de identificação de tenant baseado no header `Host`.
- Se o `Host` da requisição corresponder a um `customDomain` cadastrado, a aplicação deve carregar automaticamente o contexto daquela conta.

#### [NEW] [domain-service.ts](file:///d:/PROJETOS/PRINECLOUDPROV2/PrimeCloudProV2/server/services/domain.service.ts)
- Serviço para validar registros DNS (CNAME/TXT) antes de ativar o domínio na plataforma.

### 3. Gestão de SSL/TLS
- Recomendação de uso de um Proxy Reverso (como Caddy ou Nginx com Certbot) que suporte **SSL On-Demand**, permitindo a geração automática de certificados para os novos domínios dos clientes.
- Alternativamente, integração com a API do Cloudflare (Cloudflare for SaaS) para gestão de SSL em larga escala.

### 4. Interface de Usuário (Frontend)
#### [MODIFY] [Settings.tsx](file:///d:/PROJETOS/PRINECLOUDPROV2/PrimeCloudProV2/client/src/pages/Settings.tsx)
- Adicionar uma nova seção "Domínio Personalizado":
    - Campo para entrada do domínio.
    - Instruções de configuração de DNS (Apontar CNAME para `app.primecloudpro.com.br`).
    - Botão "Verificar DNS" para validar o apontamento.

## Plano de Verificação

### Testes Técnicos
1.  Configurar um domínio de teste no banco de dados.
2.  Simular uma requisição com o header `Host: backup.empresa-teste.com`.
3.  Verificar se o backend identifica corretamente a conta associada.
4.  Testar o fluxo de validação de DNS via interface.

### Verificação de UX
1.  Garantir que as instruções de CNAME sejam claras para o usuário final.
2.  Validar se o status do domínio (Ativo/Pendente) é exibido corretamente.
