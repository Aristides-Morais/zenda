import { prisma } from "../../lib/prisma.js";
import type { CreateCustomerInput, UpdateCustomerInput } from "./customer.schemas.js";

export class CustomerError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode: number = 400
  ) {
    super(message);
    this.name = "CustomerError";
  }
}

export async function listCustomers(
  businessId: string,
  q?: string,
  page = 1,
  limit = 20
) {
  const skip = (page - 1) * limit;

  const where = {
    businessId,
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" as const } },
            { email: { contains: q, mode: "insensitive" as const } },
            { phone: { contains: q, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [items, total] = await Promise.all([
    prisma.customer.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.customer.count({ where }),
  ]);

  return {
    data: items,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getCustomer(businessId: string, id: string) {
  const customer = await prisma.customer.findFirst({
    where: { id, businessId },
  });

  if (!customer) {
    throw new CustomerError("NOT_FOUND", "Cliente não encontrado", 404);
  }

  return customer;
}

export async function createCustomer(businessId: string, input: CreateCustomerInput) {
  return prisma.customer.create({
    data: {
      businessId,
      name: input.name,
      phone: input.phone || null,
      email: input.email || null,
      notes: input.notes || null,
    },
  });
}

export async function updateCustomer(
  businessId: string,
  id: string,
  input: UpdateCustomerInput
) {
  const existing = await prisma.customer.findFirst({
    where: { id, businessId },
  });

  if (!existing) {
    throw new CustomerError("NOT_FOUND", "Cliente não encontrado", 404);
  }

  return prisma.customer.update({
    where: { id },
    data: {
      ...(input.name !== undefined && { name: input.name }),
      ...(input.phone !== undefined && { phone: input.phone || null }),
      ...(input.email !== undefined && { email: input.email || null }),
      ...(input.notes !== undefined && { notes: input.notes || null }),
    },
  });
}

export async function deleteCustomer(businessId: string, id: string) {
  const existing = await prisma.customer.findFirst({
    where: { id, businessId },
  });

  if (!existing) {
    throw new CustomerError("NOT_FOUND", "Cliente não encontrado", 404);
  }

  // Hard delete: remove o cliente. As vendas associadas ficarão com customerId nulo.
  await prisma.customer.delete({
    where: { id },
  });
}