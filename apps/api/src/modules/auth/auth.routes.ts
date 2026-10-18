import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware.js";
import {
  loginSchema,
  refreshSchema,
  registerSchema,
} from "./auth.schemas.js";
import {
  login as loginService,
  me as meService,
  register as registerService,
} from "./auth.service.js";
import { verifyRefreshToken, signAccessToken } from "../../lib/jwt.js";
import { prisma } from "../../lib/prisma.js";
import { AuthError } from "./auth.service.js";
import { env } from "../../config/env.js";

export const authRouter = Router();

const REFRESH_COOKIE = "zenda_refresh";
const REFRESH_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

const isProd = env.NODE_ENV === "production";

function setRefreshCookie(res: import("express").Response, token: string) {
  res.cookie(REFRESH_COOKIE, token, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax", // <--- A CORREÇÃO ESTÁ AQUI
    path: "/api/v1/auth",
    maxAge: REFRESH_MAX_AGE_MS,
  });
}

function clearRefreshCookie(res: import("express").Response) {
  res.clearCookie(REFRESH_COOKIE, { path: "/api/v1/auth" });
}

authRouter.post("/register", async (req, res, next) => {
  try {
    const input = registerSchema.parse(req.body);
    const result = await registerService(input);
    setRefreshCookie(res, result.refreshToken);
    res.status(201).json({
      user: result.user,
      business: result.business,
      accessToken: result.accessToken,
    });
  } catch (err) {
    next(err);
  }
});

authRouter.post("/login", async (req, res, next) => {
  try {
    const input = loginSchema.parse(req.body);
    const result = await loginService(input);
    setRefreshCookie(res, result.refreshToken);
    res.json({
      user: result.user,
      business: result.business,
      accessToken: result.accessToken,
    });
  } catch (err) {
    next(err);
  }
});

authRouter.post("/refresh", async (req, res, next) => {
  try {
    const raw = req.cookies?.[REFRESH_COOKIE] ?? req.body?.refreshToken;
    const { refreshToken } = refreshSchema.parse({ refreshToken: raw });
    const payload = verifyRefreshToken(refreshToken);

    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true },
    });

    if (!user) {
      throw new AuthError("USER_NOT_FOUND", "Utilizador não encontrado", 401);
    }

    const accessToken = signAccessToken({ sub: user.id, email: user.email });
    res.json({ accessToken });
  } catch (err) {
    next(err);
  }
});

authRouter.post("/logout", (_req, res) => {
  clearRefreshCookie(res);
  res.json({ ok: true });
});

authRouter.get("/me", requireAuth, async (req, res, next) => {
  try {
    const result = await meService(req.user!.sub);
    res.json(result);
  } catch (err) {
    next(err);
  }
});