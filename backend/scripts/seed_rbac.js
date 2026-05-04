import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('--- Seeding RBAC (ESM) ---');

  // 1. Create Permissions
  const permissions = [
    { code: 'SALES_READ', name: 'Visualizar Pedidos' },
    { code: 'SALES_WRITE', name: 'Criar/Editar Pedidos' },
    { code: 'PROD_READ', name: 'Visualizar Produção (OF)' },
    { code: 'PROD_WRITE', name: 'Gerenciar Produção (OF)' },
    { code: 'PROD_PRINT', name: 'Imprimir OPs de Produção' },
    { code: 'FINANCE_READ', name: 'Visualizar Financeiro' },
    { code: 'FINANCE_WRITE', name: 'Baixar/Editar Títulos' },
    { code: 'ADMIN', name: 'Acesso Master (Total)' }
  ];

  const dbPermissions = {};
  for (const p of permissions) {
    dbPermissions[p.code] = await prisma.permission.upsert({
      where: { code: p.code },
      update: { name: p.name },
      create: p,
    });
  }

  // 2. Create Groups
  const groupData = [
    { name: 'Master', description: 'Acesso total ao sistema', perms: ['ADMIN', 'SALES_READ', 'SALES_WRITE', 'PROD_READ', 'PROD_WRITE', 'PROD_PRINT', 'FINANCE_READ', 'FINANCE_WRITE'] },
    { name: 'Vendas', description: 'Criação e consulta de pedidos', perms: ['SALES_READ', 'SALES_WRITE', 'PROD_READ'] },
    { name: 'Produção', description: 'Consulta e impressão de OPs', perms: ['PROD_READ', 'PROD_PRINT'] },
    { name: 'Financeiro', description: 'Fluxo de caixa e baixas', perms: ['FINANCE_READ', 'FINANCE_WRITE'] },
  ];

  for (const g of groupData) {
    await prisma.group.upsert({
      where: { name: g.name },
      update: {
        description: g.description,
        permissions: {
          set: g.perms.map(code => ({ id: dbPermissions[code].id }))
        }
      },
      create: {
        name: g.name,
        description: g.description,
        permissions: {
          connect: g.perms.map(code => ({ id: dbPermissions[code].id }))
        }
      },
    });
  }

  // 3. Create Test Users
  const testUsers = [
    { username: 'admin', pass: 'Admin@123', groups: ['Master'] },
    { username: 'master', pass: 'master123', groups: ['Master'] },
    { username: 'vendedor', pass: 'vendedor123', groups: ['Vendas'] },
    { username: 'producao', pass: 'producao123', groups: ['Produção'] },
    { username: 'financeiro', pass: 'financeiro123', groups: ['Financeiro'] },
  ];

  for (const u of testUsers) {
    await prisma.user.upsert({
      where: { username: u.username },
      update: {
        password: u.pass,
        groups: {
          set: u.groups.map(name => ({ name }))
        }
      },
      create: {
        username: u.username,
        password: u.pass,
        groups: {
          connect: u.groups.map(name => ({ name }))
        }
      },
    });
  }

  console.log('--- RBAC Seeding Finished ---');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
