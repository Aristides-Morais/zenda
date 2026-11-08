import { randomUUID } from "node:crypto";
import { prisma } from "../../lib/prisma.js";
import { hashPassword, verifyPassword } from "../../lib/argon.js";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "../../lib/jwt.js";
import type { LoginInput, RegisterInput } from "./auth.schemas.js";

export class AuthError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode: number = 400
  ) {
    super(message);
    this.name = "AuthError";
  }
}

export type AuthResult = {
  user: { id: string; email: string; name: string };
  business: { id: string; name: string; plan: string };
  accessToken: string;
  refreshToken: string;
};

// Função auxiliar para gerar e guardar os tokens na base de dados
async function generateTokens(user: { id: string; email: string }) {
  const accessToken = signAccessToken({ sub: user.id, email: user.email });
  const jti = randomUUID();
  const refreshToken = signRefreshToken({ sub: user.id, jti });

  // Guardar o JTI (ID único do token) na base de dados
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7 dias

  await prisma.refreshToken.create({
    data: {
      token: jti,
      userId: user.id,
      expiresAt,
    },
  });

  return { accessToken, refreshToken };
}

export async function register(input: RegisterInput): Promise<AuthResult> {
  const existing = await prisma.user.findUnique({
    where: { email: input.email },
    select: { id: true },
  });

  if (existing) {
    throw new AuthError("EMAIL_TAKEN", "Este email já está registado", 409);
  }

  const passwordHash = await hashPassword(input.password);

  const { user, business } = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: { email: input.email, name: input.name, passwordHash },
    });

    const business = await tx.business.create({
      data: { name: input.businessName },
    });

    await tx.membership.create({
      data: { userId: user.id, businessId: business.id, role: "OWNER" },
    });

    return { user, business };
  });

  const { accessToken, refreshToken } = await generateTokens(user);

  return {
    user: { id: user.id, email: user.email, name: user.name },
    business: { id: business.id, name: business.name, plan: business.plan },
    accessToken,
    refreshToken,
  };
}

export async function login(input: LoginInput): Promise<AuthResult> {
  const user = await prisma.user.findUnique({
    where: { email: input.email },
  });

  if (!user) {
    throw new AuthError("INVALID_CREDENTIALS", "Email ou password incorretos", 401);
  }

  const passwordOk = await verifyPassword(user.passwordHash, input.password);

  if (!passwordOk) {
    throw new AuthError("INVALID_CREDENTIALS", "Email ou password incorretos", 401);
  }

  const membership = await prisma.membership.findFirst({
    where: { userId: user.id },
    include: { business: true },
    orderBy: { createdAt: "asc" },
  });

  if (!membership) {
    throw new AuthError("NO_BUSINESS", "Utilizador sem negócio associado", 500);
  }

  const { accessToken, refreshToken } = await generateTokens(user);

  return {
    user: { id: user.id, email: user.email, name: user.name },
    business: {
      id: membership.business.id,
      name: membership.business.name,
      plan: membership.business.plan,
    },
    accessToken,
    refreshToken,
  };
}

export async function rotateRefreshToken(oldRefreshToken: string) {
  let payload;
  try {
    payload = verifyRefreshToken(oldRefreshToken);
  } catch {
    throw new AuthError("INVALID_TOKEN", "Token inválido ou expirado", 401);
  }

  // Procurar o token na base de dados
  const storedToken = await prisma.refreshToken.findUnique({
    where: { token: payload.jti },
  });

  // Se não existir, significa que já foi usado ou é falso
  if (!storedToken) {
    throw new AuthError("INVALID_TOKEN", "Token já utilizado ou revogado", 401);
  }

  // Apagar o token antigo (Rotação)
  await prisma.refreshToken.delete({
    where: { id: storedToken.id },
  });

  // Gerar novos tokens
  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
    select: { id: true, email: true },
  });

  if (!user) throw new AuthError("USER_NOT_FOUND", "Utilizador não encontrado", 404);

  return generateTokens(user);
}

export async function revokeRefreshToken(jti: string) {
  await prisma.refreshToken.deleteMany({
    where: { token: jti },
  });
}

export type MeResult = {
  user: { id: string; email: string; name: string };
  memberships: Array<{
    businessId: string;
    businessName: string;
    role: string;
    plan: string;
  }>;
};

export async function me(userId: string): Promise<MeResult> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      memberships: {
        select: {
          role: true,
          business: { select: { id: true, name: true, plan: true } },
        },
      },
    },
  });

  if (!user) {
    throw new AuthError("USER_NOT_FOUND", "Utilizador não encontrado", 404);
  }

  return {
    user: { id: user.id, email: user.email, name: user.name },
    memberships: user.memberships.map((m) => ({
      businessId: m.business.id,
      businessName: m.business.name,
      role: m.role,
      plan: m.business.plan,
    })),
  };
}