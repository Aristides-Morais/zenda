import type { NextFunction, Request, Response } from "express";
import rateLimit from "express-rate-limit";
import { prisma } from "../lib/prisma.js";

// 1. Middleware para limitar a criação de produtos (Plano FREE)
export function checkProductLimit() {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.businessId) {
      res.status(401).json({ error: { code: "UNAUTHENTICATED", message: "Não autorizado" } });
      return;
    }

    const business = await prisma.business.findUnique({
      where: { id: req.businessId },
      select: { plan: true },
    });

    if (!business) {
      res.status(404).json({ error: { code: "NOT_FOUND", message: "Negócio não encontrado" } });
      return;
    }

    if (business.plan === "PRO") {
      return next(); // Plano PRO não tem limites
    }

    const productCount = await prisma.product.count({
      where: { businessId: req.businessId, active: true },
    });

    if (productCount >= 50) {
      res.status(403).json({
        error: {
          code: "LIMIT_REACHED",
          message: "Atingiu o limite de 50 produtos do plano Grátis. Faça upgrade para o PRO.",
        },
      });
      return;
    }

    next();
  };
}

// 2. Rate Limiter para o Checkout do Kanda (Previne bots de compras falsas)
export const checkoutLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 5, // Máximo de 5 encomendas por IP por hora
  message: { 
    error: { 
      code: "TOO_MANY_REQUESTS", 
      message: "Demasiadas tentativas de compra. Por favor, tente novamente mais tarde." 
    } 
  },
  standardHeaders: true,
  legacyHeaders: false,
});