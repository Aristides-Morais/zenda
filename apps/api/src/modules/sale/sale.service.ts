import { prisma } from "../../lib/prisma.js";
import type { CreateSaleInput } from "./sale.schemas.js";

export class SaleError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode: number = 400
  ) {
    super(message);
    this.name = "SaleError";
  }
}

export async function listSales(businessId: string, page = 1, limit = 20) {
  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    prisma.sale.findMany({
      where: { businessId },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      include: {
        customer: { select: { name: true } },
        user: { select: { name: true } },
        _count: { select: { items: true } },
      },
    }),
    prisma.sale.count({ where: { businessId } }),
  ]);

  return {
    data: items.map((s) => ({
      ...s,
      total: Number(s.total),
    })),
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getSale(businessId: string, id: string) {
  const sale = await prisma.sale.findFirst({
    where: { id, businessId },
    include: {
      customer: true,
      user: { select: { name: true } },
      items: {
        include: {
          product: { select: { name: true, sku: true } },
        },
      },
    },
  });

  if (!sale) {
    throw new SaleError("NOT_FOUND", "Venda não encontrada", 404);
  }

  return {
    ...sale,
    total: Number(sale.total),
    items: sale.items.map((i) => ({
      ...i,
      unitPrice: Number(i.unitPrice),
      subtotal: Number(i.subtotal),
    })),
  };
}

export async function createSale(
  businessId: string,
  userId: string,
  input: CreateSaleInput
) {
  // O segredo está aqui: $transaction garante que se algo falhar, nada é gravado.
  return prisma.$transaction(async (tx) => {
    let total = 0;
    const saleItemsData: Array<{
      productId: string;
      quantity: number;
      unitPrice: number;
      subtotal: number;
    }> = [];

    for (const item of input.items) {
      const product = await tx.product.findFirst({
        where: { id: item.productId, businessId, active: true },
      });

      if (!product) {
        throw new SaleError("PRODUCT_NOT_FOUND", `Produto não encontrado`, 404);
      }

      if (product.stock < item.quantity) {
        throw new SaleError(
          "INSUFFICIENT_STOCK",
          `Stock insuficiente para o produto ${product.name}. Disponível: ${product.stock}`,
          400
        );
      }

      const unitPrice = Number(product.price);
      const subtotal = unitPrice * item.quantity;
      total += subtotal;

      saleItemsData.push({
        productId: product.id,
        quantity: item.quantity,
        unitPrice,
        subtotal,
      });

      // Baixa o stock imediatamente no âmbito da transação
      await tx.product.update({
        where: { id: product.id },
        data: { stock: { decrement: item.quantity } },
      });
    }

    // Se passou por todos os itens sem falhar, cria a venda
    const sale = await tx.sale.create({
      data: {
        businessId,
        userId,
        customerId: input.customerId || null,
        total,
        status: "COMPLETED",
        items: { create: saleItemsData },
      },
      include: {
        customer: { select: { name: true } },
        items: { include: { product: { select: { name: true } } } },
      },
    });

    return {
      ...sale,
      total: Number(sale.total),
      items: sale.items.map((i) => ({
        ...i,
        unitPrice: Number(i.unitPrice),
        subtotal: Number(i.subtotal),
      })),
    };
  });
}