import { z } from "zod";

export const createSaleSchema = z.object({
  customerId: z.string().optional().nullable(),
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        quantity: z.number().int().positive(),
      })
    )
    .min(1, "A venda deve ter pelo menos um produto"),
});

export const listSalesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type CreateSaleInput = z.infer<typeof createSaleSchema>;