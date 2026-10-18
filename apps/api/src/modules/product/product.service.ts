import { prisma } from "../../lib/prisma.js";
import type { CreateProductInput, UpdateProductInput } from "./product.schemas.js";

export class ProductError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode: number = 400
  ) {
    super(message);
    this.name = "ProductError";
  }
}

export async function listProducts(
  businessId: string,
  q?: string,
  page = 1,
  limit = 20
) {
  const skip = (page - 1) * limit;

  const where = {
    businessId,
    active: true,
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" as const } },
            { sku: { contains: q, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [items, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.product.count({ where }),
  ]);

  return {
    data: items.map((p) => ({
      ...p,
      price: Number(p.price),
      cost: Number(p.cost),
    })),
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getProduct(businessId: string, id: string) {
  const product = await prisma.product.findFirst({
    where: { id, businessId, active: true },
  });

  if (!product) {
    throw new ProductError("NOT_FOUND", "Produto não encontrado", 404);
  }

  return {
    ...product,
    price: Number(product.price),
    cost: Number(product.cost),
  };
}

export async function createProduct(businessId: string, input: CreateProductInput) {
  if (input.sku) {
    const existing = await prisma.product.findFirst({
      where: { businessId, sku: input.sku },
      select: { id: true },
    });
    if (existing) {
      throw new ProductError("SKU_TAKEN", "Já existe um produto com este SKU", 409);
    }
  }

  const product = await prisma.product.create({
    data: {
      businessId,
      name: input.name,
      sku: input.sku || null,
      price: input.price,
      cost: input.cost,
      stock: input.stock,
      minStock: input.minStock,
      active: input.active,
    },
  });

  return {
    ...product,
    price: Number(product.price),
    cost: Number(product.cost),
  };
}

export async function updateProduct(
  businessId: string,
  id: string,
  input: UpdateProductInput
) {
  const existing = await prisma.product.findFirst({
    where: { id, businessId, active: true },
  });

  if (!existing) {
    throw new ProductError("NOT_FOUND", "Produto não encontrado", 404);
  }

  if (input.sku && input.sku !== existing.sku) {
    const skuTaken = await prisma.product.findFirst({
      where: { businessId, sku: input.sku, id: { not: id } },
      select: { id: true },
    });
    if (skuTaken) {
      throw new ProductError("SKU_TAKEN", "Já existe um produto com este SKU", 409);
    }
  }

  const product = await prisma.product.update({
    where: { id },
    data: {
      ...(input.name !== undefined && { name: input.name }),
      ...(input.sku !== undefined && { sku: input.sku || null }),
      ...(input.price !== undefined && { price: input.price }),
      ...(input.cost !== undefined && { cost: input.cost }),
      ...(input.stock !== undefined && { stock: input.stock }),
      ...(input.minStock !== undefined && { minStock: input.minStock }),
      ...(input.active !== undefined && { active: input.active }),
    },
  });

  return {
    ...product,
    price: Number(product.price),
    cost: Number(product.cost),
  };
}

export async function deleteProduct(businessId: string, id: string) {
  const existing = await prisma.product.findFirst({
    where: { id, businessId, active: true },
  });

  if (!existing) {
    throw new ProductError("NOT_FOUND", "Produto não encontrado", 404);
  }

  await prisma.product.update({
    where: { id },
    data: { active: false },
  });
}