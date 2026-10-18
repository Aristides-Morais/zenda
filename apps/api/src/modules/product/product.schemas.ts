import { z } from "zod";

export const createProductSchema = z.object({
  name: z.string().trim().min(2, "O nome deve ter pelo menos 2 caracteres").max(120),
  sku: z.string().trim().max(50).optional().nullable(),
  price: z.coerce.number().positive("O preço deve ser maior que zero"),
  cost: z.coerce.number().min(0, "O custo não pode ser negativo"),
  stock: z.coerce.number().int().min(0, "O stock não pode ser negativo").default(0),
  minStock: z.coerce.number().int().min(0, "O stock mínimo não pode ser negativo").default(0),
  active: z.boolean().default(true),
});

export const updateProductSchema = createProductSchema.partial();

export const listProductsQuerySchema = z.object({
  q: z.string().trim().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type ListProductsQuery = z.infer<typeof listProductsQuerySchema>;