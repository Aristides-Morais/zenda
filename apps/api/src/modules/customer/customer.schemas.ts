import { z } from "zod";

export const createCustomerSchema = z.object({
  name: z.string().trim().min(2, "O nome deve ter pelo menos 2 caracteres").max(120),
  phone: z.string().trim().max(30).optional().nullable(),
  email: z.string().trim().email("Email inválido").optional().nullable().or(z.literal("")),
  notes: z.string().trim().max(500).optional().nullable(),
});

export const updateCustomerSchema = createCustomerSchema.partial();

export const listCustomersQuerySchema = z.object({
  q: z.string().trim().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;
export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>;
export type ListCustomersQuery = z.infer<typeof listCustomersQuerySchema>;