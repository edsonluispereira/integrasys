# INTEGRASYS ERP

Sistema ERP web para gestão de empresas de manufatura/fabricação. Controla pedidos de venda, ordens de fabricação, financeiro, clientes, fornecedores e produtos com estrutura (BOM).

---

## Tecnologias

| Camada | Tecnologia |
|---|---|
| Frontend | React 18 + Vite + Lucide Icons |
| Backend | Node.js + Express |
| ORM | Prisma |
| Banco de Dados | PostgreSQL 16 |
| Infraestrutura | Docker + Docker Compose |
| Web Server | Nginx (Alpine) |

---

## Arquitetura

```
integrasys/
├── backend/                  # API REST (Node/Express)
│   ├── routes/               # Rotas por módulo
│   ├── services/             # Lógica de negócio (NF-e)
│   ├── scripts/              # Seed do banco
│   └── prisma/schema.prisma  # Schema do banco de dados
├── frontend/                 # SPA React
│   └── src/
│       ├── views/            # Telas principais
│       ├── components/       # Componentes reutilizáveis
│       └── utils/            # Geração de PDF/impressão
└── docker-compose.yml        # Orquestração dos containers
```

### Containers Docker

| Container | Função | Porta |
|---|---|---|
| `integrasys2-db` | PostgreSQL 16 | 5432 |
| `integrasys2-backend` | API Node.js | 5000 (interno) |
| `integrasys2-frontend` | Nginx + React | 8081 |

---

## Módulos do Sistema

| Módulo | Funcionalidades |
|---|---|
| **Dashboard** | KPIs de vendas, produção e financeiro |
| **Pedidos de Venda** | Criação, edição, faturamento e impressão |
| **Clientes** | Cadastro completo com dados fiscais |
| **Produtos** | Catálogo com estrutura BOM (Kit/Conjunto) |
| **Fabricação** | Ordens de Fabricação (OF) com impressão A4 |
| **Financeiro** | Contas a receber/pagar, baixa de títulos |
| **Fornecedores** | Cadastro de fornecedores |
| **Configurações** | Empresa, usuários, fiscal, backup |

---

## Rodando Localmente

### Pré-requisitos
- Docker Desktop instalado e rodando

### Subir o sistema

```bash
cd integrasys
docker compose up -d --build
```

Acesse: **http://localhost:8081**

### Parar o sistema

```bash
docker compose down
```

---

## Deploy na VPS

### Primeira vez

```bash
# Na VPS (via SSH)
cd ~
git clone git@github.com:edsonluispereira/integrasys.git
cd integrasys
docker compose up -d --build
```

Acesse: **http://IP_DA_VPS:8081**

### Atualizar após alterações

```bash
# 1. No computador local — enviar alterações para o GitHub
git add .
git commit -m "descrição da alteração"
git push

# 2. Na VPS — baixar e aplicar
cd ~/integrasys
git pull
docker compose up -d --build
```

---

## Acesso SSH à VPS

| Campo | Valor |
|---|---|
| IP | `191.252.201.27` |
| Usuário | `root` |
| Porta | `22` |

---

## Banco de Dados

### Conexão (DBeaver ou outro cliente)

| Campo | Valor |
|---|---|
| Host | `localhost` (local) ou `191.252.201.27` (VPS) |
| Porta | `5432` |
| Database | `integrasys` |
| Usuário | `integrasys` |
| Senha | `1ntegra@sys` |

### Backup via pg_dump (VPS)

```bash
docker exec integrasys2-db pg_dump -U integrasys integrasys > /root/backup_$(date +%Y-%m-%d).sql
```

### Baixar backup para o computador

```powershell
scp root@191.252.201.27:/root/backup_*.sql C:\Users\Edson\Downloads\
```

---

## Usuários Padrão

| Usuário | Senha | Perfil |
|---|---|---|
| `admin` | `Admin@123` | Master (acesso total) |
| `master` | `master123` | Master (acesso total) |
| `vendedor` | `vendedor123` | Vendas |
| `producao` | `producao123` | Produção |
| `financeiro` | `financeiro123` | Financeiro |

> Altere as senhas após o primeiro acesso em **Configurações → Usuários e Permissões**.

---

## Perfis de Acesso (RBAC)

| Perfil | Permissões |
|---|---|
| **Master** | Acesso total ao sistema |
| **Vendas** | Clientes, Produtos e Pedidos |
| **Produção** | Visualizar e imprimir Ordens de Fabricação |
| **Financeiro** | Fluxo de caixa e baixa de títulos |

---

## Backup e Restauração pelo Sistema

Acesse **Configurações → Backup**:

- **Exportar** — baixa um `.json` com todos os dados
- **Restaurar** — faz upload de um `.json` e substitui todos os dados

> O backup inclui: clientes, fornecedores, produtos, pedidos, OFs, financeiro, configurações e usuários (senhas não incluídas).

---

## Criação do Usuário Admin (banco vazio)

Rode no servidor caso o banco esteja sem usuários:

```bash
docker exec integrasys2-backend sh -c "cd /app && node --input-type=module <<'EOF'
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
const perms = ['SALES_READ','SALES_WRITE','PROD_READ','PROD_WRITE','PROD_PRINT','FINANCE_READ','FINANCE_WRITE','ADMIN'];
for (const code of perms) await prisma.permission.upsert({ where:{code}, update:{}, create:{code, name:code} });
await prisma.group.upsert({ where:{name:'Master'}, update:{}, create:{name:'Master', description:'Acesso total', permissions:{connect:perms.map(code=>({code}))}} });
await prisma.user.upsert({ where:{username:'admin'}, update:{password:'Admin@123'}, create:{username:'admin', password:'Admin@123', groups:{connect:[{name:'Master'}]}} });
console.log('Usuário admin criado com sucesso.');
await prisma.\$disconnect();
EOF"
```

---

## Repositório

```
git@github.com:edsonluispereira/integrasys.git
```

Conta GitHub: **edsonluispereira**
