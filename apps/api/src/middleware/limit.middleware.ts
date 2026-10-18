import type { NextFunction, Request, Response } from "express";
import { prisma } from "../lib/prisma.js";

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

    // Plano FREE: máximo de 50 produtos
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