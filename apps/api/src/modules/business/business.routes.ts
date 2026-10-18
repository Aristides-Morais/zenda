import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { requireBusiness } from "../../middleware/business.middleware.js";
import { prisma } from "../../lib/prisma.js";

export const businessRouter = Router();

businessRouter.use(requireAuth);
businessRouter.use(requireBusiness);

businessRouter.patch("/upgrade", async (req, res, next) => {
  try {
    const updated = await prisma.business.update({
      where: { id: req.businessId },
      data: { plan: "PRO" },
    });
    res.json({ plan: updated.plan });
  } catch (err) {
    next(err);
  }
});