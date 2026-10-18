import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";
import { hashPassword } from "../src/lib/argon.js";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 A limpar base de dados...");
  await prisma.auditLog.deleteMany();
  await prisma.saleItem.deleteMany();
  await prisma.sale.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.product.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.membership.deleteMany();
  await prisma.business.deleteMany();
  await prisma.user.deleteMany();

  console.log("🏢 A criar negócio...");
  const business = await prisma.business.create({
    data: { name: "Mercearia Central" },
  });

  console.log("👤 A criar utilizadores...");
  const passwordHash = await hashPassword("password123");

  const owner = await prisma.user.create({
    data: {
      email: "dono@zenda.app",
      passwordHash,
      name: "Aristides Morais",
    },
  });

  const manager = await prisma.user.create({
    data: {
      email: "gerente@zenda.app",
      passwordHash,
      name: "Maria Fernandes",
    },
  });

  const employee = await prisma.user.create({
    data: {
      email: "empregado@zenda.app",
      passwordHash,
      name: "João Silva",
    },
  });

  await prisma.membership.createMany({
    data: [
      { userId: owner.id, businessId: business.id, role: "OWNER" },
      { userId: manager.id, businessId: business.id, role: "MANAGER" },
      { userId: employee.id, businessId: business.id, role: "EMPLOYEE" },
    ],
  });

  console.log("📦 A criar produtos...");
  const productNames: [string, number, number][] = [
    ["Arroz Agulha 5kg", 4500, 3200],
    ["Feijão Manteiga 1kg", 1200, 850],
    ["Óleo de Palma 1L", 1800, 1250],
    ["Açúcar Branco 1kg", 900, 620],
    ["Farinha de Trigo 1kg", 750, 520],
    ["Leite em Pó 400g", 2400, 1750],
    ["Café Moído 250g", 3200, 2300],
    ["Chá Preto 20 saquetas", 1500, 1050],
    ["Sabão em Pó 1kg", 2100, 1500],
    ["Detergente Loiça 500ml", 1200, 800],
    ["Pasta de Dentes", 950, 650],
    ["Sabonete 3x", 800, 520],
    ["Papel Higiénico 4 rolos", 1300, 900],
    ["Água Mineral 1.5L", 350, 180],
    ["Refrigerante 2L", 900, 620],
    ["Sumo de Laranja 1L", 1600, 1150],
    ["Bolachas Maria", 700, 450],
    ["Chocolate ao Leite", 1400, 950],
    ["Sardinha em Lata", 1100, 780],
    ["Atum em Lata", 1900, 1350],
  ];

  const products = await Promise.all(
    productNames.map(([name, price, cost], i) =>
      prisma.product.create({
        data: {
          businessId: business.id,
          name,
          sku: `SKU-${String(i + 1).padStart(4, "0")}`,
          price,
          cost,
          stock: Math.floor(Math.random() * 80) + 5,
          minStock: 10,
        },
      })
    )
  );

  console.log("🧑‍🤝‍🧑 A criar clientes...");
  const customerNames = [
    "Ana Paula",
    "Carlos Mendes",
    "Domingos Kiala",
    "Elisa Neto",
    "Fernando Baptista",
    "Gabriela Santos",
    "Hélder Dias",
    "Isabel Sousa",
    "Joaquim Neves",
    "Lúcia Correia",
  ];

  const customers = await Promise.all(
    customerNames.map((name, i) =>
      prisma.customer.create({
        data: {
          businessId: business.id,
          name,
          phone: `+244 9${String(i).padStart(2, "0")} ${Math.floor(100000 + Math.random() * 900000)}`,
          email: `${name.toLowerCase().replace(/\s/g, ".")}@email.ao`,
        },
      })
    )
  );

  console.log("💰 A criar vendas...");
  const now = new Date();
  const userIds = [owner.id, manager.id, employee.id];

  for (let i = 0; i < 50; i++) {
    const daysAgo = Math.floor(Math.random() * 30);
    const date = new Date(now);
    date.setDate(date.getDate() - daysAgo);

    const itemsCount = Math.floor(Math.random() * 4) + 1;
    const chosenProducts = [...products]
      .sort(() => Math.random() - 0.5)
      .slice(0, itemsCount);

    const items = chosenProducts.map((p) => {
      const qty = Math.floor(Math.random() * 5) + 1;
      const unitPrice = Number(p.price);
      return {
        productId: p.id,
        quantity: qty,
        unitPrice,
        subtotal: unitPrice * qty,
      };
    });

    const total = items.reduce((sum, it) => sum + it.subtotal, 0);
    const userId = userIds[Math.floor(Math.random() * userIds.length)];

    await prisma.sale.create({
      data: {
        businessId: business.id,
        userId,
        customerId:
          Math.random() > 0.3
            ? customers[Math.floor(Math.random() * customers.length)].id
            : null,
        total,
        status: "COMPLETED",
        createdAt: date,
        items: { create: items },
      },
    });
  }

  console.log("💸 A criar despesas...");
  const expenseCategories = [
    "Renda",
    "Transporte",
    "Salários",
    "Água e Luz",
    "Fornecedor",
  ];

  for (let i = 0; i < 30; i++) {
    const daysAgo = Math.floor(Math.random() * 30);
    const date = new Date(now);
    date.setDate(date.getDate() - daysAgo);

    await prisma.expense.create({
      data: {
        businessId: business.id,
        userId: owner.id,
        description: `Despesa #${i + 1}`,
        amount: Math.floor(Math.random() * 30000) + 5000,
        category:
          expenseCategories[Math.floor(Math.random() * expenseCategories.length)],
        date,
      },
    });
  }

  console.log("\n✅ Seed concluída com sucesso!");
  console.log(`   - 1 negócio: ${business.name}`);
  console.log(`   - 3 utilizadores (password: password123)`);
  console.log(`   - ${products.length} produtos`);
  console.log(`   - ${customers.length} clientes`);
  console.log(`   - 50 vendas`);
  console.log(`   - 30 despesas`);
  console.log("\n🔑 Login de teste:");
  console.log("   Email: dono@zenda.app");
  console.log("   Password: password123\n");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });