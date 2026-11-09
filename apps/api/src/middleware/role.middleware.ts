import type { NextFunction, Request, Response } from "express";

export function requireRole(allowedRoles: Array<"OWNER" | "MANAGER" | "EMPLOYEE">) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.role || !allowedRoles.includes(req.role)) {
      res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: "Não tem permissões para realizar esta ação.",
        },
      });
      return;
    }
    next();
  };
}