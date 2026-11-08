import { z } from "zod";

export const createCategorySchema = z.object({
  name: z.string().trim().min(2, "Nome muito curto").max(50, "Nome muito longo"),
});

export const createEcomProductSchema = z.object({
  categoryId: z.string().optional().nullable(),
  name: z.string().trim().min(2, "Nome muito curto").max(120, "Nome muito longo"),
  description: z.string().trim().max(500, "Descrição muito longa").optional().nullable(),
  price: z.coerce.number().positive("O preço deve ser positivo"),
  stock: z.coerce.number().int().min(0, "Stock não pode ser negativo").default(0),
  imageUrl: z.string().url("URL da imagem inválida").optional().nullable(),
});

export const checkoutSchema = z.object({
  businessId: z.string().min(1, "Loja inválida"),
  customerName: z.string().trim().min(2, "Nome muito curto").max(100, "Nome muito longo"),
  // Regex para validar números de telefone angolanos (ex: 923111222 ou +244923111222)
  customerPhone: z.string().trim().regex(/^(\+244)?[9][1-9][0-9]{7}$/, "Número de telefone inválido"),
  customerAddress: z.string().trim().min(5, "Endereço muito curto").max(250, "Endereço muito longo"),
  items: z.array(
    z.object({
      productId: z.string().min(1),
      quantity: z.number().int().positive().max(100, "Quantidade máxima excedida por item"),
    })
  ).min(1, "O carrinho está vazio"),
});

export type CreateEcomProductInput = z.infer<typeof createEcomProductSchema>;
export type CheckoutInput = z.infer<typeof checkoutSchema>;