import { randomUUID } from "node:crypto";
import { prisma } from "../../lib/prisma.js";
import { hashPassword, verifyPassword } from "../../lib/argon.js";
import {
  signAccessToken,
  signRefreshToken,
  type AccessTokenPayload,
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
  user: {
    id: string;
    email: string;
    name: string;
  };
  business: {
    id: string;
    name: string;
  };
  accessToken: string;
  refreshToken: string;
};

export async function register(input: RegisterInput): Promise<AuthResult> {
  const existing = await prisma.user.findUnique({
    where: { email: input.email },
    select: { id: true },
  });

  if (existing) {
    throw new AuthError("EMAIL_TAKEN", "Este email já está registado", 409);
  }

  const passwordHash = await hashPassword(input.password);

  const { user, business, membership } = await prisma.$transaction(
    async (tx) => {
      const user = await tx.user.create({
        data: {
          email: input.email,
          name: input.name,
          passwordHash,
        },
      });

      const business = await tx.business.create({
        data: {
          name: input.businessName,
        },
      });

      const membership = await tx.membership.create({
        data: {
          userId: user.id,
          businessId: business.id,
          role: "OWNER",
        },
      });

      return { user, business, membership };
    }
  );

  const accessToken = signAccessToken({
    sub: user.id,
    email: user.email,
  });

  const refreshToken = signRefreshToken({
    sub: user.id,
    jti: membership.id,
  });

  return {
    user: { id: user.id, email: user.email, name: user.name },
    business: { id: business.id, name: business.name },
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

  const accessToken = signAccessToken({
    sub: user.id,
    email: user.email,
  });

  const refreshToken = signRefreshToken({
    sub: user.id,
    jti: membership.id,
  });

  return {
    user: { id: user.id, email: user.email, name: user.name },
    business: { id: membership.business.id, name: membership.business.name },
    accessToken,
    refreshToken,
  };
}

export type MeResult = {
  user: { id: string; email: string; name: string };
  memberships: Array<{
    businessId: string;
    businessName: string;
    role: string;
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
          business: { select: { id: true, name: true } },
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
    })),
  };
}

export function buildAccessTokenPayload(user: {
  id: string;
  email: string;
}): AccessTokenPayload {
  return { sub: user.id, email: user.email };
}

export { randomUUID };