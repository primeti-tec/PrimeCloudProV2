# Plano de Implementação White Label

Habilitar a personalização da marca (Logo, Cores, Nome) por conta, permitindo que a aplicação seja re-estilizada dinamicamente.

## Mudanças Propostas

### Esquema do Banco de Dados
#### [MODIFY] [schema.ts](file:///d:/PROJETOS/PRINECLOUDPROV2/PrimeCloudProV2/shared/schema.ts)
- Adicionar campos de branding à tabela `accounts`:
    - `brandingName`: texto (Nome personalizado da aplicação)
    - `brandingLogo`: texto (URL para logo personalizado)
    - `brandingFavicon`: texto (URL para favicon personalizado)
    - `brandingPrimaryColor`: texto (Cor Hex/HSL para ações primárias)
    - `brandingSidebarColor`: texto (Cor para o fundo da barra lateral)

### API Backend
#### [MODIFY] [routes.ts](file:///d:/PROJETOS/PRINECLOUDPROV2/PrimeCloudProV2/server/routes.ts)
- Atualizar GET `/api/accounts/current` para incluir as informações de branding.
- Adicionar PATCH `/api/accounts/current/branding` para atualizar as configurações de marca.

### Integração Frontend
#### [NEW] [branding-provider.tsx](file:///d:/PROJETOS/PRINECLOUDPROV2/PrimeCloudProV2/client/src/components/branding-provider.tsx)
- Criar um provedor de contexto que:
    - Busca a configuração de branding da conta atual.
    - Injeta variáveis CSS dinâmicas para as cores.
    - Fornece os ativos da marca (logo, nome) para toda a aplicação.

#### [MODIFY] [Sidebar.tsx](file:///d:/PROJETOS/PRINECLOUDPROV2/PrimeCloudProV2/client/src/components/Sidebar.tsx)
- Substituir o logo fixo e "Prime Cloud Pro" pelos valores vindos do Branding Provider.

#### [MODIFY] [App.tsx](file:///d:/PROJETOS/PRINECLOUDPROV2/PrimeCloudProV2/client/src/App.tsx)
- Envolver a aplicação com o `BrandingProvider`.

#### [MODIFY] [Settings.tsx](file:///d:/PROJETOS/PRINECLOUDPROV2/PrimeCloudProV2/client/src/pages/Settings.tsx)
- Adicionar uma nova seção/aba de "Branding" para que os donos de conta gerenciem suas configurações de white-label.

## Plano de Verificação

### Verificação Manual
1.  Navegar até Configurações -> Branding (Marca).
2.  Atualizar o Nome da Aplicação, Logo e Cor Primária.
3.  Verificar se o logo e o nome na barra lateral atualizam instantaneamente.
4.  Verificar se os botões primários e detalhes mudam de cor de acordo com a nova configuração.
5.  Recarregar a página e garantir que a personalização persista.
