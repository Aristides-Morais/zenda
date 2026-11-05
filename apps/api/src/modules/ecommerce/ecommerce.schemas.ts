import { z } from "zod";

export const createCategorySchema = z.object({
  name: z.string().trim().min(2).max(50),
});

export const createEcomProductSchema = z.object({
  categoryId: z.string().optional().nullable(),
  name: z.string().trim().min(2).max(120),
  description: z.string().trim().max(500).optional().nullable(),
  price: z.coerce.number().positive(),
  stock: z.coerce.number().int().min(0).default(0),
  imageUrl: z.string().url().optional().nullable(),
});

export const checkoutSchema = z.object({
  businessId: z.string().min(1),
  customerName: z.string().trim().min(2),
  customerPhone: z.string().trim().min(9),
  customerAddress: z.string().trim().min(5),
  items: z.array(
    z.object({
      productId: z.string(),
      quantity: z.number().int().positive(),
    })
  ).min(1),
});

export type CreateEcomProductInput = z.infer<typeof createEcomProductSchema>;
export type CheckoutInput = z.infer<typeof checkoutSchema>;