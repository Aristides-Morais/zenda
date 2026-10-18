import { z } from "zod";

export const registerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "O nome deve ter pelo menos 2 caracteres")
    .max(80, "O nome não pode ter mais de 80 caracteres"),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Email inválido")
    .max(120),
  password: z
    .string()
    .min(8, "A password deve ter pelo menos 8 caracteres")
    .max(72, "A password não pode ter mais de 72 caracteres"),
  businessName: z
    .string()
    .trim()
    .min(2, "O nome do negócio deve ter pelo menos 2 caracteres")
    .max(100, "O nome do negócio não pode ter mais de 100 caracteres"),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Email inválido"),
  password: z.string().min(1, "Password é obrigatória"),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(1),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;