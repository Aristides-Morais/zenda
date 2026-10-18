import type { NextFunction, Request, Response } from "express";
import { prisma } from "../lib/prisma.js";

declare global {
  namespace Express {
    interface Request {
      businessId?: string;
      role?: "OWNER" | "MANAGER" | "EMPLOYEE";
    }
  }
}

export async function requireBusiness(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  if (!req.user) {
    res.status(401).json({
      error: { code: "UNAUTHENTICATED", message: "Autenticação necessária" },
    });
    return;
  }

  const membership = await prisma.membership.findFirst({
    where: { userId: req.user.sub },
    orderBy: { createdAt: "asc" },
  });

  if (!membership) {
    res.status(403).json({
      error: { code: "NO_BUSINESS", message: "Sem negócio associado" },
    });
    return;
  }

  req.businessId = membership.businessId;
  req.role = membership.role;
  next();
}