# PRD FINAL - Sistema de Gestão de Vendas de Cloud Storage
## CloudStorage Pro - Plataforma White-Label S3-Compatible

**Versão:** 1.0  
**Data:** Janeiro 2025  
**Autores:** Equipe de Produto

---

## 📚 ÍNDICE

1. [Visão Geral](#1-visão-geral)
2. [Objetivos e Métricas](#2-objetivos-e-métricas)
3. [Personas e User Stories](#3-personas-e-user-stories)
4. [Hierarquia de Usuários](#4-hierarquia-de-usuários)
5. [Funcionalidades do MVP](#5-funcionalidades-do-mvp)
6. [Integrações Críticas](#6-integrações-críticas)
7. [Arquitetura Técnica](#7-arquitetura-técnica)
8. [Modelo de Dados](#8-modelo-de-dados)
9. [Design e UX](#9-design-e-ux)
10. [Roadmap](#10-roadmap)
11. [Critérios de Aceitação](#11-critérios-de-aceitação)
12. [Anexos](#12-anexos)

---

## 1. VISÃO GERAL

### 1.1 Problema

Provedores de infraestrutura que operam MinIO AIStor não têm um sistema integrado para:
- Comercializar espaço de storage como serviço (SaaS)
- Automatizar provisionamento de clientes (multi-tenancy)
- Billing preciso baseado em uso real (storage + bandwidth + requests)
- Portal self-service para clientes finais
- Gestão de equipes com permissões granulares

### 1.2 Solução

Plataforma white-label completa que permite:
- Venda de storage S3-compatible como SaaS
- Provisionamento automático via MinIO Admin API
- Billing engine integrado (coleta métricas + gera faturas + cobra)
- Portal do cliente (dashboard + buckets + keys + SFTP + backup)
- Painel administrativo (aprovação + quotas + métricas + branding)
- Suporte a múltiplos protocolos: S3, SFTP, FTPS

### 1.3 Diferenciais Competitivos

| Aspecto | Nós | AWS S3 | Concorrentes BR |
|---------|-----|--------|-----------------|
| **Soberania de Dados** | ✅ 100% Brasil | ❌ EUA | ⚠️ Parcial |
| **Precificação** | R$ 0,15/GB | R$ 0,39/GB | R$ 0,20-0,30/GB |
| **Taxa de Egress** | ✅ Gratuito | ❌ Cobra | ⚠️ Varia |
| **Suporte** | 🇧🇷 PT-BR 24/7 | 🇺🇸 EN apenas | 🇧🇷 Horário comercial |
| **Setup** | < 2 minutos | ~10 minutos | ~30 minutos |
| **Protocolos** | S3 + SFTP + FTPS | S3 apenas | S3 apenas |

---

## 2. OBJETIVOS E MÉTRICAS

### 2.1 Objetivos de Negócio (Mês 6)

- **Clientes:** 50 pagantes ativos
- **MRR:** R$ 10.000
- **Churn:** < 5% ao mês
- **NPS:** > 50
- **Capacidade Vendida:** 50 TB / 100 TB total

### 2.2 Objetivos Técnicos

- **Uptime:** 99.9% (≈ 43min downtime/mês)
- **Provisionamento:** < 2 minutos (signup → credenciais)
- **Precisão de Billing:** 99.99% (margem erro < R$ 0,01)
- **API Latency:** P95 < 200ms

### 2.3 KPIs para Monitorar

**Dashboard Executivo:**
```
┌─────────────────────────────────────────────────────────┐
│  MRR:    R$ 15.200  (↗️ +8% MoM)                        │
│  Clientes: 52 ativos, 3 pending, 2 churned             │
│  ARPU:    R$ 292/cliente                                │
│  Capacity: 12 TB vendido / 50 TB (24%)                  │
│  Churn:   3.8% este mês                                 │
│  CAC:     R$ 450 (Google Ads + SEO)                     │
│  LTV:     R$ 3.500 (12 meses médio)                     │
│  LTV/CAC: 7.8x (saudável > 3x)                          │
└─────────────────────────────────────────────────────────┘
```

---

## 3. PERSONAS E USER STORIES

### Persona 1: Super Admin (Você - Provedor)

**Perfil:**
- Dono da plataforma
- Gerencia infraestrutura e todos os clientes
- Precisa de visibilidade 360° do negócio

**Jobs to Be Done:**
1. Aprovar novos clientes rapidamente
2. Monitorar saúde financeira (MRR, churn)
3. Planejar expansão de hardware
4. Customizar marca (white-label)
5. Suspender inadimplentes

**User Stories:**
```
Como Super Admin,
Quero aprovar cadastros com 1 clique,
Para onboarding rápido sem burocracia.

Como Super Admin,
Quero ver gráfico de MRR dos últimos 6 meses,
Para identificar tendências de crescimento.

Como Super Admin,
Quero ajustar quota de qualquer cliente,
Para resolver escalações urgentes.
```

### Persona 2: Cliente Owner (Empresa Pequena)

**Perfil:**
- CTO ou Fundador de startup/empresa pequena
- 5-20 funcionários técnicos
- Budget: R$ 200-1000/mês
- Precisa de backup confiável e acessível

**Pain Points:**
- AWS S3 é caro (egress fees)
- Serviços estrangeiros têm suporte ruim
- Compliance LGPD exige dados no Brasil

**User Stories:**
```
Como Cliente Owner,
Quero ver meu uso em tempo real,
Para controlar custos e evitar surpresas.

Como Cliente Owner,
Quero adicionar desenvolvedores sem dar acesso ao billing,
Para segregar responsabilidades.

Como Cliente Owner,
Quero configurar Veeam Backup em 5 minutos,
Para começar a proteger dados rapidamente.
```

### Persona 3: Cliente Admin (SysAdmin/DevOps)

**Perfil:**
- Funcionário técnico da empresa cliente
- Responsável por infraestrutura
- Não lida com billing/finanças

**User Stories:**
```
Como Cliente Admin,
Quero criar buckets com lifecycle policies,
Para otimizar custos deletando dados antigos.

Como Cliente Admin,
Quero acesso SFTP para ferramentas legadas,
Para migrar dados de servidores antigos.
```

### Persona 4: Cliente Developer

**Perfil:**
- Desenvolvedor que integra com storage
- Usa SDK/API S3
- Apenas visualiza (não gerencia)

**User Stories:**
```
Como Developer,
Quero ver minhas access keys,
Para configurar meu código localmente.

Como Developer,
Quero copiar credenciais com 1 clique,
Para agilizar desenvolvimento.
```

---

## 4. HIERARQUIA DE USUÁRIOS (CLARIFICAÇÃO CRÍTICA)

### 4.1 Estrutura de 3 Níveis

```
NÍVEL 1: SUPER ADMIN (PROVEDOR - VOCÊ)
│
├─ Acesso: Painel Administrativo
├─ Permissões: Controle total da plataforma
├─ Quantidade: 1-3 usuários (você + sócios/funcionários)
│
└─► NÍVEL 2: CLIENTES (EMPRESAS/CONTAS)
    │
    ├─ Acesso: Portal do Cliente
    ├─ Quantidade: Ilimitado
    │
    └─► NÍVEL 3: USUÁRIOS DO CLIENTE (MEMBROS DA EQUIPE)
        │
        ├─ OWNER (1 por conta)
        │  └─ Acesso total: billing, equipe, storage
        │
        ├─ ADMIN (0-N por conta)
        │  └─ Gerencia storage técnico (sem billing)
        │
        └─ DEVELOPER (0-N por conta)
           └─ Visualiza apenas (read-only)
```

### 4.2 Matriz de Permissões Completa

**Legenda:** ✅ = Sim | ❌ = Não | 👁️ = View only | 📊 = Parcial

| Recurso | Super Admin | Owner | Admin | Developer |
|---------|-------------|-------|-------|-----------|
| **NÍVEL 1: PROVEDOR** ||||
| Ver todos os clientes | ✅ | ❌ | ❌ | ❌ |
| Aprovar/rejeitar cadastros | ✅ | ❌ | ❌ | ❌ |
| Suspender/reativar contas | ✅ | ❌ | ❌ | ❌ |
| Ver MRR e métricas de negócio | ✅ | ❌ | ❌ | ❌ |
| Ajustar quota manualmente | ✅ | ❌ | ❌ | ❌ |
| Configurar branding (logo/cores) | ✅ | ❌ | ❌ | ❌ |
| Acessar MinIO root | ✅ | ❌ | ❌ | ❌ |
| **STORAGE** ||||
| Ver dashboard | ❌ | ✅ | ✅ | ✅ |
| Criar buckets | ❌ | ✅ | ✅ | ❌ |
| Deletar buckets | ❌ | ✅ | ✅ | ❌ |
| Ver buckets | ❌ | ✅ | ✅ | ✅ |
| Configurar versioning | ❌ | ✅ | ✅ | ❌ |
| Configurar lifecycle policies | ❌ | ✅ | ✅ | ❌ |
| **ACCESS KEYS S3** ||||
| Gerar novas keys | ❌ | ✅ | ✅ | ❌ |
| Ver keys existentes | ❌ | ✅ | ✅ | ✅ |
| Revogar keys | ❌ | ✅ | ✅ | ❌ |
| Rotacionar keys | ❌ | ✅ | ✅ | ❌ |
| **SFTP/FTPS** ||||
| Ver credenciais SFTP | ❌ | ✅ | ✅ | ✅ |
| Resetar senha SFTP | ❌ | ✅ | ✅ | ❌ |
| **BACKUP (Imperius, Veeam, etc)** ||||
| Ver guia de configuração | ❌ | ✅ | ✅ | 👁️ |
| Baixar templates | ❌ | ✅ | ✅ | 👁️ |
| Testar conexão | ❌ | ✅ | ✅ | ❌ |
| **BILLING** ||||
| Ver uso e custos | ❌ | ✅ | ❌ | ❌ |
| Ver faturas | ❌ | ✅ | ❌ | ❌ |
| Baixar notas fiscais | ❌ | ✅ | ❌ | ❌ |
| Adicionar método de pagamento | ❌ | ✅ | ❌ | ❌ |
| Pagar faturas | ❌ | ✅ | ❌ | ❌ |
| Solicitar upgrade de quota | ❌ | ✅ | ❌ | ❌ |
| Alterar plano | ❌ | ✅ | ❌ | ❌ |
| **EQUIPE** ||||
| Adicionar membros | ❌ | ✅ | ❌ | ❌ |
| Remover membros | ❌ | ✅ | ❌ | ❌ |
| Alterar role de membro | ❌ | ✅ | ❌ | ❌ |
| **CONFIGURAÇÕES** ||||
| Alterar dados da conta | ❌ | ✅ | ❌ | ❌ |
| Ver logs de auditoria | ❌ | ✅ | 📊 | ❌ |
| Deletar conta | ❌ | ✅ | ❌ | ❌ |

### 4.3 Fluxo de Convite de Membros

```
1. Owner acessa "Equipe" → clica "+ Adicionar Membro"
2. Preenche email + seleciona role (Admin/Developer)
3. Sistema envia email com link único (exp. 7 dias)
4. Membro clica link → cria senha → entra na conta
5. Membro vê dashboard conforme permissões da role
```

**Email de Convite:**
```
De: noreply@cloudstoragepro.com.br
Para: maria@empresa.com.br
Assunto: Convite para Empresa XYZ no CloudStorage Pro

Olá!

João Silva (joao@empresa.com.br) convidou você para se juntar
à equipe da Empresa XYZ no CloudStorage Pro.

Papel: Developer (visualização apenas)

[Aceitar Convite e Criar Senha]

Este link expira em 7 dias.
```

---

## 5. FUNCIONALIDADES DO MVP

### 5.1 Autenticação e Cadastro

#### F1.1 - Registro de Cliente

**Campos:**
- Nome completo *
- Email corporativo *
- CPF ou CNPJ *
- Telefone (com WhatsApp) *
- Senha (min 8 chars, 1 número, 1 maiúscula) *
- [ ] Aceito os Termos de Serviço *

**Fluxo:**
```
1. Usuário preenche formulário
2. Backend valida:
   - Email único (não cadastrado)
   - CPF/CNPJ válido (algoritmo)
   - Senha forte
3. Envia código 6 dígitos por email
4. Usuário confirma email
5. Cria Account com status: "pending_approval"
6. Cria User com role: "OWNER"
7. Admin recebe notificação
8. Usuário vê mensagem:
   "Cadastro recebido! Você receberá email em até 24h
    após aprovação do nosso time."
```

**Validações:**
```typescript
// Validação de CPF
function isValidCPF(cpf: string): boolean {
  // Remove pontos e traços
  cpf = cpf.replace(/[^\d]/g, '');
  
  // Verifica se tem 11 dígitos
  if (cpf.length !== 11) return false;
  
  // Verifica se não é sequência (111.111.111-11, etc)
  if (/^(\d)\1{10}$/.test(cpf)) return false;
  
  // Calcula dígitos verificadores
  // ... algoritmo completo
  
  return true;
}

// Validação de CNPJ
function isValidCNPJ(cnpj: string): boolean {
  // Similar ao CPF, 14 dígitos
  // ... algoritmo
}
```

#### F1.2 - Aprovação de Cadastro (Admin)

**Tela Admin:**
```
┌────────────────────────────────────────────────────────┐
│  📋 Cadastros Pendentes (3)                            │
├────────────────────────────────────────────────────────┤
│                                                         │
│  ┌──────────────────────────────────────────────────┐ │
│  │ TechCorp Soluções Ltda                           │ │
│  │ CNPJ: 12.345.678/0001-90                         │ │
│  │ Email: contato@techcorp.com.br                   │ │
│  │ Telefone: (11) 98765-4321                        │ │
│  │ Solicitado em: 18/01/2025 14:32                  │ │
│  │ Plano desejado: Business (500 GB)                │ │
│  │                                                   │ │
│  │ 👤 Responsável: João Silva                       │ │
│  │    joao@techcorp.com.br                          │ │
│  │                                                   │ │
│  │ [✅ Aprovar]  [❌ Rejeitar]  [👁️ Ver Site]      │ │
│  └──────────────────────────────────────────────────┘ │
│                                                         │
└────────────────────────────────────────────────────────┘
```

**Ao Aprovar:**
```
1. Status Account → "active"
2. Provisiona tenant no MinIO:
   - Cria usuário MinIO
   - Cria access key + secret key
   - Define quota inicial (10 GB free ou conforme plano)
3. Salva credenciais no banco (encrypted)
4. Envia email de boas-vindas:
```

**Email de Boas-Vindas:**
```
Assunto: ✅ Conta aprovada! Bem-vindo ao CloudStorage Pro

Olá João,

Sua conta foi aprovada! Você já pode começar a usar.

CREDENCIAIS S3:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Endpoint:    https://s3.cloudstoragepro.com.br
Region:      us-east-1
Access Key:  AKI8X7N2P4Q9R1S5T6U
Secret Key:  [enviado em anexo seguro]

Quota Inicial: 10 GB (gratuito)
Bandwidth:     10 GB/mês

PRÓXIMOS PASSOS:
1. Acesse o dashboard: https://app.cloudstoragepro.com.br
2. Crie seu primeiro bucket
3. Configure seu software de backup

Dúvidas? Responda este email ou acesse nossa documentação.

Att,
Equipe CloudStorage Pro
```

**Ao Rejeitar:**
```
1. Status Account → "rejected"
2. Campo "rejection_reason" preenchido (opcional)
3. Email ao usuário:
```

**Email de Rejeição:**
```
Assunto: Cadastro não aprovado - CloudStorage Pro

Olá João,

Infelizmente não pudemos aprovar seu cadastro no momento.

Motivo: [Dados incompletos / CNPJ inválido / Outro]

Se você acredita que houve um erro, responda este email
com mais informações.

Att,
Equipe CloudStorage Pro
```

---

### 5.2 Portal do Cliente - Dashboard

#### F2.1 - Cards de Métricas

**4 Cards Principais:**

1. **Storage Utilizado**
   ```
   💾 Storage Utilizado
   345 GB / 500 GB
   [█████████░░] 69%
   ↗️ +12 GB esta semana
   ```
   - Atualizado: A cada hora (cron job)
   - Fonte: MinIO Prometheus → `minio_bucket_usage_total_bytes`
   - Cor progress bar: Verde (<75%), Amarelo (75-90%), Vermelho (>90%)

2. **Bandwidth**
   ```
   📡 Bandwidth
   89 GB este mês
   Ingress: 45 GB | Egress: 44 GB
   ```
   - Período: Mês atual (reseta dia 1)
   - Fonte: `minio_s3_traffic_sent_bytes` + `minio_s3_traffic_received_bytes`

3. **Custo Estimado**
   ```
   💰 Custo Estimado
   R$ 124,50
   Fatura fecha em 12 dias
   [Ver Detalhes →]
   ```
   - Cálculo em tempo real baseado em uso atual
   - Fórmula: (storage_gb * 0.15) + (bandwidth_gb * 0.40) + (requests * 0.00001)

4. **Alertas de Quota**
   ```
   ⚠️ Atenção: Quota
   Você está usando 69%
   Considere upgrade
   [Solicitar Aumento →]
   ```
   - Mostra apenas se > 80%
   - Cor: Amarelo (80-95%), Vermelho (>95%)

#### F2.2 - Gráfico de Uso (Recharts)

```
📈 Uso de Storage (últimos 30 dias)

[Gráfico de linha mostrando evolução diária]

X-axis: Datas (últimos 30 dias)
Y-axis: GB utilizados
Dados: TimescaleDB (1 ponto por dia)
```

**Query:**
```sql
SELECT 
  DATE(timestamp) as date,
  AVG(storage_bytes) / 1024 / 1024 / 1024 as storage_gb
FROM usage_records
WHERE account_id = $1
  AND timestamp >= NOW() - INTERVAL '30 days'
GROUP BY DATE(timestamp)
ORDER BY date ASC;
```

---

### 5.3 Gestão de Buckets

#### F3.1 - Listar Buckets

**Tabela:**
```
┌─────────────────────────────────────────────────────────┐
│ 🗂️ Meus Buckets (4)                 [+ Criar Bucket]   │
├─────────────────────────────────────────────────────────┤
│                                                          │
│ Nome           Tamanho  Objetos  Versioning  Ações      │
│ ──────────────────────────────────────────────────────  │
│ 📦 backup-prod  245 GB   12.4k    ✅           [...]    │
│ 📦 media-assets  89 GB    3.2k    ❌           [...]    │
│ 📦 logs          11 GB     890    ❌           [...]    │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

**Dropdown de Ações (...):**
```
📊 Ver Detalhes
⚙️ Configurações
  ├─ Versioning (on/off)
  ├─ Public Access (on/off)
  └─ Lifecycle Policy
🔗 Copiar URL
─────────────────
🗑️ Deletar
```

#### F3.2 - Criar Bucket

**Modal:**
```
┌───────────────────────────────────────────────────────┐
│               Criar Novo Bucket                  [X]  │
├───────────────────────────────────────────────────────┤
│                                                        │
│ Nome do Bucket *                                       │
│ ┌──────────────────────────────────────────────────┐ │
│ │ backup-producao                                   │ │
│ └──────────────────────────────────────────────────┘ │
│ 💡 Regras:                                            │
│ • Apenas letras minúsculas, números e hífen          │
│ • Entre 3-63 caracteres                              │
│ • Não pode começar/terminar com hífen                │
│ • Deve ser único globalmente                         │
│                                                        │
│ ☐ Habilitar versionamento                            │
│    Mantém versões anteriores dos arquivos            │
│                                                        │
│ ☐ Acesso público                                      │
│    ⚠️ Não recomendado para dados sensíveis           │
│                                                        │
│             [Cancelar]  [Criar Bucket →]              │
│                                                        │
└───────────────────────────────────────────────────────┘
```

**Validação em Tempo Real:**
```javascript
// Frontend validation
const validateBucketName = (name: string): string | null => {
  if (name.length < 3 || name.length > 63) {
    return "Nome deve ter entre 3-63 caracteres";
  }
  
  if (!/^[a-z0-9-]+$/.test(name)) {
    return "Apenas letras minúsculas, números e hífen";
  }
  
  if (name.startsWith('-') || name.endsWith('-')) {
    return "Não pode começar/terminar com hífen";
  }
  
  if (name.includes('--')) {
    return "Não pode ter hífens consecutivos";
  }
  
  return null; // válido
};
```

**Backend - Criar Bucket:**
```typescript
// backend/src/services/bucket.service.ts

async createBucket(accountId: string, name: string, config: BucketConfig) {
  // 1. Validar nome (server-side também)
  if (!this.isValidBucketName(name)) {
    throw new BadRequestException('Nome de bucket inválido');
  }
  
  // 2. Verificar se já existe
  const exists = await this.prisma.bucket.findUnique({
    where: { name }
  });
  
  if (exists) {
    throw new ConflictException('Bucket já existe');
  }
  
  // 3. Criar no MinIO
  await this.minioClient.makeBucket(name, 'us-east-1');
  
  // 4. Configurar versioning (se solicitado)
  if (config.versioning) {
    await this.minioClient.setBucketVersioning(name, {
      Status: 'Enabled'
    });
  }
  
  // 5. Salvar no banco
  const bucket = await this.prisma.bucket.create({
    data: {
      accountId,
      name,
      versioning: config.versioning,
      publicAccess: config.publicAccess,
    }
  });
  
  // 6. Log de auditoria
  await this.audit.log({
    accountId,
    action: 'BUCKET_CREATED',
    resource: name,
  });
  
  return bucket;
}
```

---

### 5.4 Gestão de Access Keys

#### F4.1 - Listar Access Keys

**Tabela:**
```
┌─────────────────────────────────────────────────────────┐
│ 🔑 Access Keys (2)                  [+ Gerar Nova Key]  │
├─────────────────────────────────────────────────────────┤
│                                                          │
│ Access Key ID        Status    Criada Em     Ações      │
│ ──────────────────────────────────────────────────────  │
│ AKI8X7N2P4Q9R1S5T6U  ✅ Ativa  10/01/2025   [...]      │
│ AKIWZYX9876ABCDEFGH  ⏸️ Inativa 05/12/2024   [...]      │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

**Dropdown de Ações:**
```
📋 Copiar Access Key ID
⏸️ Desativar
♻️ Rotacionar (gerar nova e desativar esta em 7 dias)
────────────────
🗑️ Revogar Permanentemente
```

#### F4.2 - Gerar Nova Access Key

**UX CRÍTICA - Modal Fullscreen:**

```
┌─────────────────────────────────────────────────────────┐
│                                                          │
│        ✅ Access Key Criada com Sucesso!                │
│                                                          │
│  ⚠️ ATENÇÃO: Esta é a ÚNICA vez que você verá a        │
│     Secret Key. Salve em local seguro agora.            │
│                                                          │
│  ─────────────────────────────────────────────────────  │
│                                                          │
│  Access Key ID:                                          │
│  ┌────────────────────────────────────────────────┐    │
│  │ AKI8X7N2P4Q9R1S5T6U                            │    │
│  └────────────────────────────────────────────────┘    │
│  [📋 Copiar]                                            │
│                                                          │
│  Secret Access Key:                                      │
│  ┌────────────────────────────────────────────────┐    │
│  │ wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY       │    │
│  └────────────────────────────────────────────────┘    │
│  [📋 Copiar]                                            │
│                                                          │
│  ─────────────────────────────────────────────────────  │
│                                                          │
│  💾 Salvar em Arquivo:                                  │
│  [📥 Download .env]  [📥 Download JSON]  [📥 .aws/credentials] │
│                                                          │
│  ─────────────────────────────────────────────────────  │
│                                                          │
│  ✅ Salvei as credenciais em local seguro               │
│  [ ] Não mostrar este aviso novamente                   │
│                                                          │
│          [Fechar e Ir para Dashboard →]                 │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

**Arquivos Gerados para Download:**

**.env:**
```bash
# CloudStorage Pro - S3 Credentials
S3_ENDPOINT=https://s3.cloudstoragepro.com.br
S3_REGION=us-east-1
S3_ACCESS_KEY_ID=AKI8X7N2P4Q9R1S5T6U
S3_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
```

**credentials.json:**
```json
{
  "provider": "CloudStorage Pro",
  "endpoint": "https://s3.cloudstoragepro.com.br",
  "region": "us-east-1",
  "accessKeyId": "AKI8X7N2P4Q9R1S5T6U",
  "secretAccessKey": "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
}
```

**~/.aws/credentials:**
```ini
[cloudstoragepro]
aws_access_key_id = AKI8X7N2P4Q9R1S5T6U
aws_secret_access_key = wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
```

---

## 6. INTEGRAÇÕES CRÍTICAS

### 6.1 Imperius Backup e Soluções S3-Compatible

#### Objetivo

Permitir que clientes usem software de backup instalado em seus servidores para enviar dados diretamente aos buckets contratados.

#### Softwares Suportados

✅ **Tier 1 (Suporte Completo + Tutorial Dedicado):**
- Imperius Backup
- Veeam Backup & Replication
- Acronis Cyber Backup

✅ **Tier 2 (Suporte Genérico S3):**
- Duplicati
- Restic
- rclone
- MSP360 (CloudBerry)
- Comet Backup

#### F6.1 - Tela "Configurar Software de Backup"

**Localização:** Dashboard → Sidebar → 💾 Backup

**Layout:**
```
┌─────────────────────────────────────────────────────────┐
│  💾 Configurar Software de Backup                       │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Conecte seu software de backup ao seu storage:         │
│                                                          │
│  📦 Selecione seu software:                             │
│  ┌────────────────────────────────────────────────┐    │
│  │ [⚡ Imperius]  [Veeam]  [Acronis]  [Duplicati] │    │
│  │ [Restic]  [rclone]  [Outro S3-compatible]      │    │
│  └────────────────────────────────────────────────┘    │
│                                                          │
│  ✅ Imperius Backup Selecionado                         │
│                                                          │
│  📋 Credenciais S3:                                     │
│  ┌────────────────────────────────────────────────┐    │
│  │ Endpoint:      s3.cloudstoragepro.com.br       │    │
│  │ Porta:         443 (HTTPS)                      │    │
│  │ Região:        us-east-1                        │    │
│  │ Access Key:    AKI8X7N2P4Q9R1S5T6U             │    │
│  │ Secret Key:    •••••••••••• [👁️ Mostrar]      │    │
│  │ Bucket Sugerido: backup-servidor-01            │    │
│  │ SSL/TLS:       ✅ Habilitado                    │    │
│  └────────────────────────────────────────────────┘    │
│                                                          │
│  🧪 [Testar Conexão S3]                                │
│                                                          │
│  [📋 Copiar Tudo]  [📥 Download config.xml]            │
│                                                          │
│  ─────────────────────────────────────────────────────  │
│                                                          │
│  📚 Guia Passo-a-Passo para Imperius Backup:           │
│  ┌────────────────────────────────────────────────┐    │
│  │ 1. Abra o Imperius Backup Manager               │    │
│  │ 2. Vá em: Tools → Options → Cloud Storage       │    │
│  │ 3. Clique em "Add New Storage"                  │    │
│  │ 4. Selecione "Amazon S3 Compatible"             │    │
│  │ 5. Cole as credenciais acima:                   │    │
│  │    - Service URL: https://s3.cloudsto...        │    │
│  │    - Access Key ID: AKI8X7N2...                 │    │
│  │    - Secret Key: wJalr...                       │    │
│  │ 6. Clique "Test Connection"                     │    │
│  │    ✅ Connection successful!                    │    │
│  │ 7. Salve e configure seu backup job             │    │
│  │                                                  │    │
│  │ [📹 Assistir Vídeo Tutorial (2:30)]             │    │
│  │ [📄 Download PDF Detalhado]                     │    │
│  └────────────────────────────────────────────────┘    │
│                                                          │
│  💡 Dicas:                                              │
│  • Crie um bucket dedicado para cada servidor           │
│     Ex: backup-web-01, backup-db-prod                   │
│  • Use lifecycle policies para deletar backups > 90 dias│
│  • Teste a restauração periodicamente                   │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

#### config.xml para Imperius (Download)

```xml
<?xml version="1.0" encoding="UTF-8"?>
<ImperiusBackupConfig>
  <CloudStorage>
    <Provider>S3Compatible</Provider>
    <DisplayName>CloudStorage Pro</DisplayName>
    <ServiceURL>https://s3.cloudstoragepro.com.br</ServiceURL>
    <Region>us-east-1</Region>
    <AccessKeyID>AKI8X7N2P4Q9R1S5T6U</AccessKeyID>
    <SecretAccessKey>wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY</SecretAccessKey>
    <BucketName>backup-servidor-01</BucketName>
    <UseSSL>true</UseSSL>
    <Port>443</Port>
  </CloudStorage>
</ImperiusBackupConfig>
```

#### F6.2 - Botão "Testar Conexão S3"

**Funcionalidade:**
Faz uma chamada de teste ao MinIO para validar credenciais.

**Backend:**
```typescript
// POST /api/backup/test-connection

async testS3Connection(accountId: string) {
  const credentials = await this.getAccountS3Credentials(accountId);
  
  try {
    const testClient = new MinioClient({
      endPoint: process.env.MINIO_ENDPOINT,
      port: 443,
      useSSL: true,
      accessKey: credentials.accessKeyId,
      secretKey: credentials.secretAccessKey,
    });
    
    // Tenta listar buckets
    await testClient.listBuckets();
    
    return {
      success: true,
      message: 'Conexão estabelecida com sucesso! ✅'
    };
    
  } catch (error) {
    return {
      success: false,
      message: `Erro na conexão: ${error.message}`,
      troubleshooting: [
        'Verifique se as credenciais estão corretas',
        'Confirme que o endpoint está acessível',
        'Firewall pode estar bloqueando porta 443'
      ]
    };
  }
}
```

#### Biblioteca de Tutoriais

**Estrutura de Pastas:**
```
/public/tutorials/
├── imperius-backup/
│   ├── video.mp4 (screencast 2-3 min)
│   ├── guide.pdf (10-15 páginas com screenshots)
│   └── config-template.xml
├── veeam/
│   ├── video.mp4
│   ├── guide.pdf
│   └── s3-repository-setup.txt
├── acronis/
│   └── ...
└── generic-s3/
    ├── rclone-config.txt
    ├── restic-quickstart.md
    └── aws-cli-config.sh
```

---

### 6.2 SFTP/FTPS Integration

#### Contexto

Clientes com ferramentas legadas ou processos estabelecidos que só suportam FTP/SFTP precisam acessar o storage via esses protocolos.

#### Solução Técnica: SFTPGo

**Arquitetura:**

```
Cliente (FileZilla, WinSCP, scripts)
         │
         │ SFTP (porta 2022) / FTPS (porta 2121)
         ▼
┌─────────────────────────────────────┐
│       SFTPGo Server                 │
│  (Container Docker no VPS)          │
│                                     │
│  - Autentica usuário                │
│  - Mapeia /home/user → S3 bucket    │
│  - Traduz operações FTP → S3 API    │
└─────────────┬───────────────────────┘
              │ S3 API (MinIO Client)
              ▼
┌─────────────────────────────────────┐
│     MinIO AIStor Cluster            │
│  Buckets do cliente                 │
└─────────────────────────────────────┘
```

#### docker-compose.yml (VPS)

```yaml
version: '3.8'

services:
  sftpgo:
    image: drakkan/sftpgo:latest
    container_name: sftpgo
    ports:
      - "2022:2022"  # SFTP
      - "2121:2121"  # FTPS
      - "8081:8080"  # Web Admin UI (interno apenas)
    environment:
      - SFTPGO_DATA_PROVIDER__DRIVER=postgresql
      - SFTPGO_DATA_PROVIDER__NAME=sftpgo
      - SFTPGO_DATA_PROVIDER__HOST=postgres
      - SFTPGO_DATA_PROVIDER__PORT=5432
      - SFTPGO_DATA_PROVIDER__USERNAME=sftpgo
      - SFTPGO_DATA_PROVIDER__PASSWORD=${SFTPGO_DB_PASSWORD}
    volumes:
      - sftpgo-data:/srv/sftpgo
    depends_on:
      - postgres
    restart: unless-stopped

volumes:
  sftpgo-data:
```

#### F6.3 - Provisionamento Automático de Usuário SFTP

**Quando:** Cliente cria primeiro bucket OU clica em "Habilitar SFTP" no dashboard

**Backend Service:**
```typescript
// backend/src/services/sftp-provisioning.service.ts

import axios from 'axios';
import * as bcrypt from 'bcrypt';

export class SftpProvisioningService {
  private sftpgoApiUrl = 'http://sftpgo:8080';
  private sftpgoApiKey = process.env.SFTPGO_API_KEY;

  async createSftpUserForAccount(account: Account) {
    const username = `sftp-${account.id}`;
    const password = this.generateSecurePassword(16);
    
    // Buscar buckets do cliente
    const buckets = await this.prisma.bucket.findMany({
      where: { accountId: account.id },
      select: { name: true }
    });
    
    // Criar usuário no SFTPGo
    const sftpUser = {
      username,
      password,
      status: 1, // enabled
      home_dir: `/s3-${account.id}`,
      permissions: {
        "/": ["list", "download", "upload", "create_dirs", "rename", "delete"]
      },
      filesystem: {
        provider: 2, // S3
        s3config: {
          bucket: "", // bucket dinâmico via virtual folders
          region: 'us-east-1',
          access_key: process.env.MINIO_ROOT_USER,
          access_secret: process.env.MINIO_ROOT_PASSWORD,
          endpoint: process.env.MINIO_ENDPOINT,
          upload_part_size: 5,
          upload_concurrency: 4
        }
      },
      virtual_folders: buckets.map(bucket => ({
        name: bucket.name,
        mapped_path: `/${bucket.name}`,
        filesystem: {
          provider: 2,
          s3config: {
            bucket: bucket.name,
            // ... rest of S3 config
          }
        }
      }))
    };

    await axios.post(`${this.sftpgoApiUrl}/api/v2/users`, sftpUser, {
      headers: { 'X-API-Key': this.sftpgoApiKey }
    });

    // Salvar credenciais no banco
    const hashedPassword = await bcrypt.hash(password, 10);
    
    await this.prisma.sftpCredential.create({
      data: {
        accountId: account.id,
        username,
        passwordHash: hashedPassword,
        status: 'ACTIVE'
      }
    });

    return { username, password };
  }

  private generateSecurePassword(length: number): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < length; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }

  async resetSftpPassword(accountId: string): Promise<string> {
    const credential = await this.prisma.sftpCredential.findUnique({
      where: { accountId }
    });

    if (!credential) {
      throw new NotFoundException('SFTP não configurado');
    }

    const newPassword = this.generateSecurePassword(16);
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Atualizar no SFTPGo
    await axios.put(
      `${this.sftpgoApiUrl}/api/v2/users/${credential.username}`,
      { password: newPassword },
      { headers: { 'X-API-Key': this.sftpgoApiKey } }
    );

    // Atualizar no banco
    await this.prisma.sftpCredential.update({
      where: { id: credential.id },
      data: { passwordHash: hashedPassword }
    });

    return newPassword;
  }
}
```

#### F6.4 - Tela "Acesso SFTP/FTPS"

**Localização:** Dashboard → Sidebar → 📁 SFTP

```
┌─────────────────────────────────────────────────────────┐
│  📁 Acesso via SFTP/FTPS                                │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  🔐 Credenciais SFTP/FTPS:                              │
│  ┌────────────────────────────────────────────────┐    │
│  │ Protocolo:   SFTP (recomendado)                │    │
│  │ Host:        sftp.cloudstoragepro.com.br       │    │
│  │ Porta:       2022                               │    │
│  │                                                  │    │
│  │ Usuário:     sftp-abc123-uuid                   │    │
│  │ Senha:       ••••••••••••••                     │    │
│  │              [👁️ Mostrar] [♻️ Resetar Senha]   │    │
│  └────────────────────────────────────────────────┘    │
│                                                          │
│  📦 Buckets Acessíveis via SFTP:                        │
│  Quando você se conectar, verá as seguintes pastas:     │
│  • /backup-prod                                          │
│  • /media-assets                                         │
│  • /logs                                                 │
│                                                          │
│  💡 Cada pasta corresponde a um bucket S3               │
│                                                          │
│  ─────────────────────────────────────────────────────  │
│                                                          │
│  🛠️ Cliente FTP Recomendado:                            │
│  ┌────────────────────────────────────────────────┐    │
│  │ [📥 FileZilla] (Windows/Mac/Linux)             │    │
│  │ [📥 WinSCP] (Windows)                           │    │
│  │ [📥 Cyberduck] (Mac)                            │    │
│  └────────────────────────────────────────────────┘    │
│                                                          │
│  📋 Configuração Rápida para FileZilla:                 │
│  ┌────────────────────────────────────────────────┐    │
│  │ 1. Abra FileZilla                               │    │
│  │ 2. File → Site Manager → New Site               │    │
│  │ 3. Configure:                                    │    │
│  │    Protocol: SFTP                                │    │
│  │    Host: sftp.cloudstoragepro.com.br            │    │
│  │    Port: 2022                                    │    │
│  │    Logon Type: Normal                            │    │
│  │    User: sftp-abc123-uuid                        │    │
│  │    Password: [sua senha]                         │    │
│  │ 4. Conectar!                                     │    │
│  │                                                  │    │
│  │ [📹 Vídeo Tutorial (1:45)]                       │    │
│  └────────────────────────────────────────────────┘    │
│                                                          │
│  ⚠️ Segurança:                                          │
│  • Sempre use SFTP (criptografado) ao invés de FTP     │
│  • FTPS também usa TLS e está disponível na porta 2121 │
│  • Nunca compartilhe suas credenciais                   │
│                                                          │
│  📊 Estatísticas de Uso SFTP:                           │
│  • Última conexão: Hoje às 14:32                        │
│  • Conexões este mês: 45                                │
│  • Uploads: 89 arquivos (2.3 GB)                        │
│  • Downloads: 12 arquivos (890 MB)                      │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

#### Modelo de Dados Adicional

```prisma
model SftpCredential {
  id          String   @id @default(uuid())
  accountId   String   @unique
  account     Account  @relation(fields: [accountId], references: [id])
  
  username    String   @unique // sftp-{accountId}
  passwordHash String  // bcrypt hash
  
  status      CredentialStatus @default(ACTIVE)
  
  lastLoginAt DateTime?
  lastLoginIp String?
  loginCount  Int      @default(0)
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@map("sftp_credentials")
}

// Tabela de logs de acesso SFTP (opcional, para auditoria)
model SftpAccessLog {
  id          String   @id @default(uuid())
  username    String
  action      String   // LOGIN, UPLOAD, DOWNLOAD, DELETE
  filepath    String?
  sizeBytes   BigInt?
  ipAddress   String
  timestamp   DateTime @default(now())
  
  @@index([username, timestamp])
  @@map("sftp_access_logs")
}
```

---

## 7. ARQUITETURA TÉCNICA

### 7.1 Stack Completo

```
┌─────────────────── FRONTEND ───────────────────────┐
│                                                      │
│  Landing Page (Marketing):                          │
│  - Next.js 14 (SSG/ISR)                             │
│  - Tailwind CSS + Shadcn/ui                         │
│  - Framer Motion (animações)                        │
│                                                      │
│  Portal do Cliente + Admin Panel:                   │
│  - Next.js 14 (App Router + Server Actions)         │
│  - TanStack Query (data fetching)                   │
│  - Zustand (state management)                       │
│  - Recharts (gráficos)                              │
│  - Lucide Icons                                     │
│                                                      │
└──────────────────────────────────────────────────────┘

┌─────────────────── BACKEND ────────────────────────┐
│                                                      │
│  API Server:                                         │
│  - NestJS (TypeScript)                              │
│  - Prisma ORM                                        │
│  - Class Validator (validation)                     │
│  - Passport JWT (auth)                              │
│  - BullMQ (job queue)                               │
│  - node-cron (scheduled tasks)                      │
│                                                      │
│  Serviços:                                           │
│  - MinIO Client (minio npm package)                 │
│  - Axios (HTTP requests para SFTPGo, etc)           │
│  - Nodemailer / SendGrid (emails)                   │
│  - Stripe SDK / Mercado Pago SDK                    │
│                                                      │
└──────────────────────────────────────────────────────┘

┌────────────────── DATABASES ───────────────────────┐
│                                                      │
│  PostgreSQL 16:                                      │
│  - Dados transacionais                              │
│  - Usuários, Contas, Buckets, Faturas              │
│  - TimescaleDB extension para métricas             │
│                                                      │
│  Redis 7:                                            │
│  - Sessions (JWT refresh tokens)                    │
│  - BullMQ queues                                     │
│  - Cache (dados de dashboard)                       │
│                                                      │
└──────────────────────────────────────────────────────┘

┌───────────────── INFRASTRUCTURE ───────────────────┐
│                                                      │
│  VPS Hostinger (R$ 160/mês):                        │
│  - 2 vCPU, 4GB RAM                                   │
│  - Docker Compose:                                   │
│    • Next.js (porta 3000)                           │
│    • NestJS (porta 4000)                            │
│    • PostgreSQL (porta 5432)                        │
│    • Redis (porta 6379)                             │
│    • SFTPGo (portas 2022/2121/8081)                │
│    • NGINX (reverse proxy, SSL/TLS)                │
│                                                      │
│  Datacenter Separado (já pago):                     │
│  - MinIO AIStor Cluster                             │
│  - Acesso via API (porta 9000)                      │
│                                                      │
│  Cloudflare:                                         │
│  - DNS + CDN (free tier)                            │
│  - DDoS protection                                   │
│  - SSL/TLS certificates                             │
│                                                      │
└──────────────────────────────────────────────────────┘

┌──────────────── EXTERNAL SERVICES ─────────────────┐
│                                                      │
│  Email: SendGrid Free Tier (100/dia) ou AWS SES    │
│  Payment: Stripe ou Mercado Pago                    │
│  NF-e: Focus NFe ou eNotas (futuro)                │
│  Monitoring: UptimeRobot (free) + Grafana          │
│                                                      │
└──────────────────────────────────────────────────────┘
```

### 7.2 Docker Compose (VPS)

```yaml
# docker-compose.yml
version: '3.8'

services:
  # ============= FRONTEND =============
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: cloudstorage-frontend
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=https://api.cloudstoragepro.com.br
    depends_on:
      - backend
    restart: unless-stopped

  # ============= BACKEND =============
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: cloudstorage-backend
    ports:
      - "4000:4000"
    environment:
      - DATABASE_URL=postgresql://postgres:${DB_PASSWORD}@postgres:5432/cloudstorage
      - REDIS_URL=redis://redis:6379
      - MINIO_ENDPOINT=${MINIO_ENDPOINT}
      - MINIO_ROOT_USER=${MINIO_ROOT_USER}
      - MINIO_ROOT_PASSWORD=${MINIO_ROOT_PASSWORD}
      - JWT_SECRET=${JWT_SECRET}
      - SENDGRID_API_KEY=${SENDGRID_API_KEY}
      - STRIPE_SECRET_KEY=${STRIPE_SECRET_KEY}
    depends_on:
      - postgres
      - redis
    restart: unless-stopped

  # ============= DATABASES =============
  postgres:
    image: timescale/timescaledb:latest-pg16
    container_name: cloudstorage-postgres
    ports:
      - "5432:5432"
    environment:
      - POSTGRES_DB=cloudstorage
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=${DB_PASSWORD}
    volumes:
      - postgres-data:/var/lib/postgresql/data
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    container_name: cloudstorage-redis
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data
    restart: unless-stopped

  # ============= SFTP/FTPS =============
  sftpgo:
    image: drakkan/sftpgo:latest
    container_name: cloudstorage-sftpgo
    ports:
      - "2022:2022"  # SFTP
      - "2121:2121"  # FTPS
      - "8081:8080"  # Web Admin (interno)
    environment:
      - SFTPGO_DATA_PROVIDER__DRIVER=postgresql
      - SFTPGO_DATA_PROVIDER__NAME=sftpgo
      - SFTPGO_DATA_PROVIDER__HOST=postgres
      - SFTPGO_DATA_PROVIDER__PORT=5432
      - SFTPGO_DATA_PROVIDER__USERNAME=sftpgo
      - SFTPGO_DATA_PROVIDER__PASSWORD=${SFTPGO_DB_PASSWORD}
    volumes:
      - sftpgo-data:/srv/sftpgo
    depends_on:
      - postgres
    restart: unless-stopped

  # ============= REVERSE PROXY =============
  nginx:
    image: nginx:alpine
    container_name: cloudstorage-nginx
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/ssl:/etc/nginx/ssl:ro
      - certbot-webroot:/var/www/certbot
    depends_on:
      - frontend
      - backend
    restart: unless-stopped

  # ============= SSL CERTIFICATES =============
  certbot:
    image: certbot/certbot
    container_name: cloudstorage-certbot
    volumes:
      - ./nginx/ssl:/etc/letsencrypt
      - certbot-webroot:/var/www/certbot
    entrypoint: "/bin/sh -c 'trap exit TERM; while :; do certbot renew; sleep 12h & wait $${!}; done;'"

volumes:
  postgres-data:
  redis-data:
  sftpgo-data:
  certbot-webroot:

networks:
  default:
    name: cloudstorage-network
```

### 7.3 nginx.conf

```nginx
events {
    worker_connections 1024;
}

http {
    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=100r/m;
    limit_req_zone $binary_remote_addr zone=login:10m rate=5r/m;

    # Redirect HTTP → HTTPS
    server {
        listen 80;
        server_name cloudstoragepro.com.br www.cloudstoragepro.com.br;
        
        location /.well-known/acme-challenge/ {
            root /var/www/certbot;
        }
        
        location / {
            return 301 https://$host$request_uri;
        }
    }

    # Frontend (Next.js)
    server {
        listen 443 ssl http2;
        server_name cloudstoragepro.com.br www.cloudstoragepro.com.br;

        ssl_certificate /etc/nginx/ssl/live/cloudstoragepro.com.br/fullchain.pem;
        ssl_certificate_key /etc/nginx/ssl/live/cloudstoragepro.com.br/privkey.pem;

        location / {
            proxy_pass http://frontend:3000;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
        }
    }

    # Backend API
    server {
        listen 443 ssl http2;
        server_name api.cloudstoragepro.com.br;

        ssl_certificate /etc/nginx/ssl/live/cloudstoragepro.com.br/fullchain.pem;
        ssl_certificate_key /etc/nginx/ssl/live/cloudstoragepro.com.br/privkey.pem;

        location / {
            limit_req zone=api burst=20 nodelay;
            
            proxy_pass http://backend:4000;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_cache_bypass $http_upgrade;
        }
        
        location /auth/login {
            limit_req zone=login burst=5 nodelay;
            proxy_pass http://backend:4000;
        }
    }

    # SFTP subdomain (apenas documentação, não proxy)
    server {
        listen 443 ssl http2;
        server_name sftp.cloudstoragepro.com.br;

        ssl_certificate /etc/nginx/ssl/live/cloudstoragepro.com.br/fullchain.pem;
        ssl_certificate_key /etc/nginx/ssl/live/cloudstoragepro.com.br/privkey.pem;

        location / {
            return 200 'Use um cliente SFTP para conectar na porta 2022';
            add_header Content-Type text/plain;
        }
    }
}
```

---

## 8. MODELO DE DADOS COMPLETO

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ==================== ENUMS ====================

enum UserRole {
  OWNER       // Dono da conta (billing + storage + team)
  ADMIN       // Administrador técnico (storage only)
  DEVELOPER   // Desenvolvedor (read-only)
}

enum AccountStatus {
  PENDING_APPROVAL
  ACTIVE
  SUSPENDED
  REJECTED
  CANCELED
}

enum Plan {
  FREE_TIER
  STARTER
  BUSINESS
  ENTERPRISE
  CUSTOM
}

enum CredentialStatus {
  ACTIVE
  REVOKED
  EXPIRED
}

enum InvoiceStatus {
  PENDING
  PAID
  OVERDUE
  CANCELED
}

enum NotificationType {
  QUOTA_WARNING_80
  QUOTA_CRITICAL_95
  QUOTA_EXCEEDED
  INVOICE_GENERATED
  PAYMENT_OVERDUE
  PAYMENT_RECEIVED
  ACCOUNT_SUSPENDED
  ACCOUNT_ACTIVATED
  WELCOME
  APPROVAL_APPROVED
  APPROVAL_REJECTED
  MEMBER_INVITED
  MEMBER_JOINED
}

enum RequestStatus {
  PENDING
  APPROVED
  REJECTED
}

// ==================== CORE MODELS ====================

model User {
  id            String    @id @default(uuid())
  email         String    @unique
  passwordHash  String
  fullName      String
  phoneNumber   String?
  role          UserRole  @default(OWNER)
  
  accountId     String
  account       Account   @relation(fields: [accountId], references: [id], onDelete: Cascade)
  
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  lastLoginAt   DateTime?
  lastLoginIp   String?
  
  @@index([accountId])
  @@index([email])
  @@map("users")
}

model Account {
  id                String         @id @default(uuid())
  
  // Company info
  companyName       String?
  tradingName       String?
  taxId             String         @unique // CPF ou CNPJ
  email             String         @unique
  phoneNumber       String
  
  // Status
  status            AccountStatus  @default(PENDING_APPROVAL)
  approvedAt        DateTime?
  approvedBy        String?
  rejectedReason    String?
  suspendedAt       DateTime?
  suspensionReason  String?
  
  // Plan & billing
  plan              Plan           @default(FREE_TIER)
  quotaGB           Int            @default(10)
  
  // White-label
  customDomain      String?
  brandingSettings  Json?          // {logoUrl, faviconUrl, primaryColor, etc}
  
  // Relations
  users             User[]
  minioCredentials  MinioCredential[]
  sftpCredentials   SftpCredential?
  buckets           Bucket[]
  invoices          Invoice[]
  usageRecords      UsageRecord[]
  notifications     Notification[]
  quotaRequests     QuotaChangeRequest[]
  auditLogs         AuditLog[]
  
  createdAt         DateTime       @default(now())
  updatedAt         DateTime       @updatedAt
  
  @@index([status])
  @@index([plan])
  @@map("accounts")
}

model UserInvitation {
  id         String    @id @default(uuid())
  accountId  String
  email      String
  role       UserRole
  token      String    @unique
  expiresAt  DateTime
  createdBy  String    // User ID
  
  acceptedAt DateTime?
  
  createdAt  DateTime  @default(now())
  
  @@index([token])
  @@map("user_invitations")
}

// ==================== MINIO & SFTP ====================

model MinioCredential {
  id              String    @id @default(uuid())
  accountId       String
  account         Account   @relation(fields: [accountId], references: [id], onDelete: Cascade)
  
  accessKeyId     String    @unique
  secretAccessKey String    // Encrypted with AES-256
  
  status          CredentialStatus @default(ACTIVE)
  expiresAt       DateTime?
  lastUsedAt      DateTime?
  
  createdAt       DateTime  @default(now())
  revokedAt       DateTime?
  
  @@index([accountId])
  @@map("minio_credentials")
}

model SftpCredential {
  id          String   @id @default(uuid())
  accountId   String   @unique
  account     Account  @relation(fields: [accountId], references: [id], onDelete: Cascade)
  
  username    String   @unique // sftp-{accountId}
  passwordHash String  // bcrypt
  
  status      CredentialStatus @default(ACTIVE)
  
  lastLoginAt DateTime?
  lastLoginIp String?
  loginCount  Int      @default(0)
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@map("sftp_credentials")
}

// ==================== STORAGE ====================

model Bucket {
  id          String   @id @default(uuid())
  accountId   String
  account     Account  @relation(fields: [accountId], references: [id], onDelete: Cascade)
  
  name        String   @unique
  sizeBytes   BigInt   @default(0)
  objectCount Int      @default(0)
  
  versioning  Boolean  @default(false)
  publicAccess Boolean @default(false)
  
  lifecycleRules Json?   // Array de regras
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  deletedAt   DateTime? // Soft delete
  
  @@index([accountId])
  @@index([name])
  @@map("buckets")
}

// ==================== USAGE METRICS ====================

model UsageRecord {
  id              String   @id @default(uuid())
  accountId       String
  account         Account  @relation(fields: [accountId], references: [id], onDelete: Cascade)
  
  timestamp       DateTime @default(now())
  
  // Métricas coletadas via Prometheus
  storageBytes    BigInt   // Snapshot neste momento
  bandwidthIngress BigInt  // Bytes enviados (upload)
  bandwidthEgress  BigInt  // Bytes baixados (download)
  requestsGET     Int
  requestsPUT     Int
  requestsDELETE  Int
  requestsLIST    Int
  requestsHEAD    Int
  
  @@index([accountId, timestamp(sort: Desc)])
  @@map("usage_records")
}

// ==================== BILLING ====================

model Invoice {
  id              String        @id @default(uuid())
  accountId       String
  account         Account       @relation(fields: [accountId], references: [id], onDelete: Cascade)
  
  invoiceNumber   String        @unique // INV-2025-01-00123
  periodStart     DateTime
  periodEnd       DateTime
  
  // Breakdown de custos
  storageGB       Float
  storageCost     Float
  
  bandwidthGB     Float
  bandwidthCost   Float
  
  requestsCount   Int
  requestsCost    Float
  
  subtotal        Float
  taxPercent      Float         @default(0)
  taxAmount       Float         @default(0)
  discountAmount  Float         @default(0)
  
  totalAmount     Float
  
  status          InvoiceStatus @default(PENDING)
  
  dueDate         DateTime
  paidAt          DateTime?
  
  paymentMethod   String?       // "credit_card", "boleto", "pix"
  paymentId       String?       // External gateway payment ID
  
  pdfUrl          String?       // S3 URL do PDF
  nfeXml          String?       // NF-e XML (futuro)
  
  createdAt       DateTime      @default(now())
  
  @@index([accountId, periodStart])
  @@index([status])
  @@map("invoices")
}

// ==================== NOTIFICATIONS ====================

model Notification {
  id          String            @id @default(uuid())
  accountId   String
  account     Account           @relation(fields: [accountId], references: [id], onDelete: Cascade)
  
  type        NotificationType
  title       String
  message     String
  
  read        Boolean           @default(false)
  readAt      DateTime?
  
  metadata    Json?             // Extra data
  
  createdAt   DateTime          @default(now())
  
  @@index([accountId, read])
  @@index([createdAt(sort: Desc)])
  @@map("notifications")
}

// ==================== ADMIN ====================

model AdminSettings {
  id            String   @id @default(uuid())
  
  // Pricing (por GB/mês)
  pricePerGB    Float    @default(0.15)
  pricePerGBBandwidth Float @default(0.40)
  pricePerRequest Float  @default(0.00001)
  minimumCharge Float    @default(10.00)
  
  // Branding
  platformName  String   @default("CloudStorage Pro")
  logoUrl       String?
  faviconUrl    String?
  primaryColor  String   @default("#0066cc")
  secondaryColor String  @default("#00cc66")
  accentColor   String   @default("#ff6b00")
  
  // System
  autoApproval  Boolean  @default(false)
  defaultQuotaGB Int     @default(10)
  freeTierEnabled Boolean @default(true)
  
  updatedAt     DateTime @updatedAt
  
  @@map("admin_settings")
}

model QuotaChangeRequest {
  id            String   @id @default(uuid())
  accountId     String
  account       Account  @relation(fields: [accountId], references: [id], onDelete: Cascade)
  
  currentQuota  Int      // GB
  requestedQuota Int     // GB
  reason        String?
  
  status        RequestStatus @default(PENDING)
  
  approvedBy    String?  // Admin user ID
  approvedAt    DateTime?
  rejectedReason String?
  
  createdAt     DateTime @default(now())
  
  @@index([status])
  @@map("quota_change_requests")
}

// ==================== AUDIT ====================

model AuditLog {
  id         String   @id @default(uuid())
  accountId  String
  account    Account  @relation(fields: [accountId], references: [id], onDelete: Cascade)
  
  userId     String?  // User que executou a ação
  action     String   // BUCKET_CREATED, KEY_REVOKED, etc
  resource   String?  // Nome do recurso afetado
  details    Json?    // Extra metadata
  ipAddress  String?
  
  timestamp  DateTime @default(now())
  
  @@index([accountId, timestamp(sort: Desc)])
  @@map("audit_logs")
}
```

---

Esse PRD está completo com:
- ✅ 3 níveis hierárquicos clarificados (Super Admin / Cliente Owner/Admin/Developer)
- ✅ Integração com Imperius Backup + outras soluções S3
- ✅ SFTP/FTPS via SFTPGo
- ✅ Modelo de dados completo
- ✅ Arquitetura Docker detalhada
- ✅ Referência ao guia visual separado

Quer que eu:
1. Crie wireframes interativos em HTML?
2. Gere código boilerplate (Next.js + NestJS)?
3. Detalhe mais alguma funcionalidade específica?
4. Crie diagramas de fluxo visuais?
