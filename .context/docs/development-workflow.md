# Fluxo de Trabalho de Desenvolvimento

Descreve o processo diário de engenharia para este repositório.

## Branching e Releases

- **Branch Principal**: `main` - código pronto para produção
- **Branches de Funcionalidade**: Crie a partir de `main` para novas funcionalidades
- **Modelo de Branching**: Fluxo de feature branch

## Desenvolvimento Local

### Pré-requisitos
- Node.js (v18 ou superior recomendado)
- Banco de dados PostgreSQL
- Gerenciador de pacotes npm

### Comandos

| Comando | Descrição |
|---------|-------------|
| `npm install` | Instalar dependências |
| `npm run dev` | Iniciar servidor de desenvolvimento (cliente + servidor) |
| `npm run build` | Compilar para produção |
| `npm run start` | Executar build de produção |
| `npm run check` | Verificação de tipos TypeScript |
| `npm run db:push` | Enviar schema Drizzle para o banco de dados |

### Configuração de Ambiente

1. Crie um banco de dados PostgreSQL
2. Configure variáveis de ambiente para conexão com o banco de dados
3. Execute `npm run db:push` para inicializar o schema
4. Inicie o desenvolvimento com `npm run dev`

## Estrutura do Projeto

```
├── client/           # Frontend React
│   └── src/
│       ├── pages/    # Componentes de página
│       ├── components/ # Componentes de UI
│       ├── hooks/    # Hooks de busca de dados (ex: useProducts, useOrders)
│       └── lib/      # Utilitários (ex: cn, apiRequest, isValidCPF)
├── server/           # Backend Express
│   ├── routes.ts     # Rotas da API (usando shared/routes.ts para segurança de tipos)
│   ├── storage.ts    # Camada de banco de dados (interface IStorage, classe DatabaseStorage)
│   └── services/     # Lógica de negócios (ex: email.ts para envio de emails)
├── shared/           # Tipos/schemas compartilhados
│   └── schema.ts     # Schemas Zod para validação de dados (ex: Product, Order)
│   └── routes.ts     # Construção de rota segura por tipo com buildUrl()
└── script/           # Scripts de build
```

## Expectativas de Revisão de Código

### Antes de Enviar
- Execute `npm run check` para verificar tipos TypeScript
- Teste suas alterações localmente com `npm run dev`
- Garanta que não haja erros ou avisos no console

### Checklist de Revisão
- [ ] Código segue padrões existentes
- [ ] Tipos estão devidamente definidos
- [ ] Alterações na API incluem atualizações de schema
- [ ] Validação de documento brasileiro funciona (CPF/CNPJ) usando `isValidCPF`, `isValidCNPJ`, e `formatDocument` em `client/src/lib/document-validation.ts`

## Adicionando Novas Funcionalidades

### Frontend
1. Crie componente de página em `client/src/pages/` (ex: `Dashboard.tsx`, `Settings.tsx`)
2. Adicione hooks customizados em `client/src/hooks/` (ex: `useProducts`, `useOrders`, `useToast`)
3. Use componentes de UI existentes de `client/src/components/ui/` (ex: `Button`, `Badge`, `Calendar`)
4. Use funções utilitárias de `client/src/lib/` (ex: `cn`, `apiRequest`, `isUnauthorizedError`)

   ```typescript
   // Exemplo usando um hook customizado e um componente de UI
   import { useProducts } from "@/src/hooks/use-products";
   import { Button } from "@/src/components/ui/button";

   function ProductList() {
     const { data: products, isLoading } = useProducts();

     if (isLoading) {
       return <p>Carregando...</p>;
     }

     return (
       <ul>
         {products?.map((product) => (
           <li key={product.id}>
             {product.name} - {product.price}
             <Button>Adicionar ao Carrinho</Button>
           </li>
         ))}
       </ul>
     );
   }
   ```

### Backend
1. Adicione rotas de API em `server/routes.ts`
2. Atualize interface de armazenamento em `server/storage.ts`
3. Defina schemas em `shared/schema.ts`

   ```typescript
   // Exemplo de rota de API usando tipos compartilhados e storage
   import { Request, Response } from 'express';
   import { Account } from '../shared/schema';
   import { storage } from './storage';

   export const getAccountRoute = async (req: Request, res: Response) => {
     const accountId = req.params.id;
     try {
       const account: Account | null = await storage.getAccount(accountId);
       if (account) {
         res.json(account);
       } else {
         res.status(404).send('Conta não encontrada');
       }
     } catch (error) {
       console.error(error);
       res.status(500).send('Erro Interno do Servidor');
     }
   };
   ```

### Tipos Compartilhados
1. Defina schemas Zod em `shared/schema.ts`
2. Exporte tipos inferidos para uso cliente/servidor
3. Use `buildUrl()` de `shared/routes.ts` para URLs type-safe

   ```typescript
   // Exemplo de definição de um schema Zod e uso de buildUrl
   import { z } from 'zod';
   import { buildUrl } from './routes';

   export const ProductSchema = z.object({
     id: z.string(),
     name: z.string(),
     price: z.number(),
   });

   export type Product = z.infer<typeof ProductSchema>;

   // Exemplo de construção de uma URL
   const productUrl = buildUrl('/products/:id', { id: '123' }); // Retorna "/products/123"
   ```

## Tarefas de Onboarding

1. Clone o repositório e execute `npm install`
2. Configure banco de dados PostgreSQL local
3. Execute `npm run db:push` para criar tabelas
4. Explore o código base com `npm run dev`
5. Revise hooks existentes em `client/src/hooks/` para entender padrões de dados
6. Familiarize-se com componentes de UI em `client/src/components/ui/`
7. Entenda schemas compartilhados em `shared/schema.ts`

## Solução de Problemas

### Problemas de Banco de Dados
- Verifique a string de conexão PostgreSQL
- Execute `npm run db:push` para sincronizar o schema

### Erros de Build
- Limpe `node_modules` e reinstale
- Verifique compatibilidade de versão do TypeScript

### Problemas de Autenticação
- Garanta que o Clerk esteja configurado corretamente.
- Verifique `client\src\lib\auth-utils.ts` para utilitários relacionados a autenticação como `isUnauthorizedError` e `redirectToLogin`.

### Erros de API
- Inspecione requisições de rede nas ferramentas de desenvolvedor do navegador.
- Verifique logs do lado do servidor para mensagens de erro usando a função `log` em `server/index.ts`.
- Verifique as rotas da API em `server/routes.ts`.

### Problemas de Envio de Email
- Revise as funções de envio de email (`sendEmail`, `sendInvitationEmail`, etc.) em `server\services\email.ts`.
- Verifique configurações e credenciais do servidor de email.
