import { config } from "../config/config";
import { db } from "../prismaClient";
import crypto from "crypto";

export async function storeRefreshToken(userId: string, expiresAt?: Date) {
  const token = crypto.randomUUID();
  const tokenExpiresAt =
    expiresAt ??
    new Date(
      Date.now() + Number(config.REFRESH_TOKEN_EXPIRES_IN) ||
        7 * 24 * 60 * 60 * 1000
    );

  const refreshToken = await db.refreshToken.create({
    data: {
      token,
      userId,
      expiresAt: tokenExpiresAt,
    },
  });

  return refreshToken.token;
}

export async function rotateRefreshToken(
  oldToken: string,
  userId: string,
  expiresAt?: Date
) {
  await db.refreshToken.deleteMany({ where: { token: oldToken } });
  return storeRefreshToken(userId, expiresAt);
}

export async function createToken(
  email: string,
  type: "EmailVerification" | "PasswordReset"
): Promise<string> {
  const token = crypto.randomUUID();
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);

  const existingToken = await db.tokens.findFirst({
    where: {
      email,
      type,
    },
  });

  if (existingToken) {
    await db.tokens.update({
      where: { id: existingToken.id },
      data: {
        token,
        expires,
      },
    });
  } else {
    // Create a new token
    await db.tokens.create({
      data: {
        email,
        token,
        expires,
        type,
      },
    });
  }

  return token;
}
