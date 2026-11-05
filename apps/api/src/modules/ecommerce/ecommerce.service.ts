import { prisma } from "../../lib/prisma.js";
import type { CheckoutInput, CreateEcomProductInput } from "./ecommerce.schemas.js";

export class EcomError extends Error {
  constructor(public code: string, message: string, public statusCode = 400) {
    super(message);
    this.name = "EcomError";
  }
}

// --- LADO PÚBLICO (STORE) ---

export async function getPublicStore(businessId: string) {
  const business = await prisma.business.findUnique({
    where: { id: businessId },
    select: { name: true },
  });
  if (!business) throw new EcomError("NOT_FOUND", "Loja não encontrada", 404);

  const categories = await prisma.category.findMany({
    where: { businessId },
    orderBy: { name: "asc" },
  });

  const products = await prisma.ecomProduct.findMany({
    where: { businessId, active: true },
    orderBy: { createdAt: "desc" },
  });

  return { businessName: business.name, categories, products };
}

export async function processCheckout(input: CheckoutInput) {
  return prisma.$transaction(async (tx) => {
    let total = 0;
    const orderItemsData = [];

    for (const item of input.items) {
      const product = await tx.ecomProduct.findFirst({
        where: { id: item.productId, businessId: input.businessId, active: true },
      });

      if (!product) throw new EcomError("PRODUCT_NOT_FOUND", "Produto não encontrado", 404);
      if (product.stock < item.quantity) {
        throw new EcomError("INSUFFICIENT_STOCK", `Stock insuficiente para ${product.name}`, 400);
      }

      const unitPrice = Number(product.price);
      total += unitPrice * item.quantity;
      orderItemsData.push({ productId: product.id, quantity: item.quantity, unitPrice });

      await tx.ecomProduct.update({
        where: { id: product.id },
        data: { stock: { decrement: item.quantity } },
      });
    }

    const order = await tx.order.create({
      data: {
        businessId: input.businessId,
        customerName: input.customerName,
        customerPhone: input.customerPhone,
        customerAddress: input.customerAddress,
        total,
        items: { create: orderItemsData },
      },
    });

    return { ...order, total: Number(order.total) };
  });
}

// --- LADO ADMIN (GESTÃO) ---

export async function createCategory(businessId: string, name: string) {
  const slug = name.toLowerCase().replace(/\s+/g, "-").replace(/[^\w-]+/g, "");
  return prisma.category.create({
    data: { businessId, name, slug },
  });
}

export async function listAdminProducts(businessId: string) {
  const items = await prisma.ecomProduct.findMany({
    where: { businessId },
    include: { category: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });
  return items.map(p => ({ ...p, price: Number(p.price) }));
}

export async function createEcomProduct(businessId: string, input: CreateEcomProductInput) {
  const product = await prisma.ecomProduct.create({
    data: { businessId, ...input, price: input.price },
  });
  return { ...product, price: Number(product.price) };
}

export async function listOrders(businessId: string) {
  const orders = await prisma.order.findMany({
    where: { businessId },
    include: { items: { include: { product: { select: { name: true } } } } },
    orderBy: { createdAt: "desc" },
  });
  return orders.map(o => ({ ...o, total: Number(o.total) }));
}