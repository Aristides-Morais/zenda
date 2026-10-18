import { prisma } from "../../lib/prisma.js";

function startOfDay(d: Date): Date {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function startOfMonth(d: Date): Date {
  const copy = new Date(d);
  copy.setDate(1);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function daysAgo(d: Date, days: number): Date {
  const copy = new Date(d);
  copy.setDate(copy.getDate() - days);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

export type Summary = {
  todaySales: number;
  monthSales: number;
  monthExpenses: number;
  estimatedProfit: number;
  todaySalesCount: number;
};

export async function getSummary(businessId: string): Promise<Summary> {
  const now = new Date();
  const todayStart = startOfDay(now);
  const monthStart = startOfMonth(now);

  const [todayAgg, monthAgg, expensesAgg] = await Promise.all([
    prisma.sale.aggregate({
      where: {
        businessId,
        status: "COMPLETED",
        createdAt: { gte: todayStart },
      },
      _sum: { total: true },
      _count: true,
    }),
    prisma.sale.aggregate({
      where: {
        businessId,
        status: "COMPLETED",
        createdAt: { gte: monthStart },
      },
      _sum: { total: true },
    }),
    prisma.expense.aggregate({
      where: {
        businessId,
        date: { gte: monthStart },
      },
      _sum: { amount: true },
    }),
  ]);

  const todaySales = Number(todayAgg._sum.total ?? 0);
  const monthSales = Number(monthAgg._sum.total ?? 0);
  const monthExpenses = Number(expensesAgg._sum.amount ?? 0);

  return {
    todaySales,
    monthSales,
    monthExpenses,
    estimatedProfit: monthSales - monthExpenses,
    todaySalesCount: todayAgg._count,
  };
}

export type SalesChartPoint = {
  date: string;
  total: number;
  count: number;
};

export async function getSalesChart(
  businessId: string,
  days = 30
): Promise<SalesChartPoint[]> {
  const from = daysAgo(new Date(), days);

  const sales = await prisma.sale.findMany({
    where: {
      businessId,
      status: "COMPLETED",
      createdAt: { gte: from },
    },
    select: { createdAt: true, total: true },
  });

  const byDay = new Map<string, { total: number; count: number }>();

  for (let i = 0; i <= days; i++) {
    const d = new Date(from);
    d.setDate(d.getDate() + i);
    const key = d.toISOString().slice(0, 10);
    byDay.set(key, { total: 0, count: 0 });
  }

  for (const sale of sales) {
    const key = sale.createdAt.toISOString().slice(0, 10);
    const entry = byDay.get(key);
    if (entry) {
      entry.total += Number(sale.total);
      entry.count += 1;
    }
  }

  return Array.from(byDay.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, data]) => ({ date, ...data }));
}

export type TopProduct = {
  productId: string;
  name: string;
  quantitySold: number;
  revenue: number;
};

export async function getTopProducts(
  businessId: string,
  limit = 5
): Promise<TopProduct[]> {
  const grouped = await prisma.saleItem.groupBy({
    by: ["productId"],
    where: {
      sale: { businessId, status: "COMPLETED" },
    },
    _sum: { quantity: true, subtotal: true },
    orderBy: { _sum: { quantity: "desc" } },
    take: limit,
  });

  if (grouped.length === 0) return [];

  const products = await prisma.product.findMany({
    where: { id: { in: grouped.map((g) => g.productId) } },
    select: { id: true, name: true },
  });

  const nameById = new Map(products.map((p) => [p.id, p.name]));

  return grouped.map((g) => ({
    productId: g.productId,
    name: nameById.get(g.productId) ?? "—",
    quantitySold: g._sum.quantity ?? 0,
    revenue: Number(g._sum.subtotal ?? 0),
  }));
}

export type LowStockProduct = {
  id: string;
  name: string;
  stock: number;
  minStock: number;
};

export async function getLowStock(
  businessId: string
): Promise<LowStockProduct[]> {
  const products = await prisma.product.findMany({
    where: { 
      businessId, 
      active: true // <--- A CORREÇÃO ESTÁ AQUI
    },
    select: { id: true, name: true, stock: true, minStock: true },
    orderBy: { stock: "asc" },
  });

  return products.filter((p) => p.stock <= p.minStock);
}