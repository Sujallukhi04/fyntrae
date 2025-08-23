import { db } from "../prismaClient";
import crypto from "crypto";

export async function storeRefreshToken(userId: string, expiresAt?: Date) {
  const token = crypto.randomUUID(); // could also be JWT
  const tokenExpiresAt =
    expiresAt ??
    new Date(
      Date.now() + Number(process.env.REFRESH_TOKEN_EXPIRES_IN) ||
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
