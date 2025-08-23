import jwt from "jsonwebtoken";

export function generateAccessToken(payload: object) {
  const expiresInMs =
    Number(process.env.ACCESS_TOKEN_EXPIRES_IN) || 15 * 60 * 1000; // fallback 15min in ms
  const expiresInSec = Math.floor(expiresInMs / 1000);

  return jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET!, {
    expiresIn: expiresInSec, // number of seconds
  });
}

export function generateRefreshToken(payload: object, expiresAt?: Date) {
  let options: jwt.SignOptions = {};

  if (expiresAt) {
    const now = Date.now();
    const remainingMs = expiresAt.getTime() - now;
    if (remainingMs <= 0)
      throw new Error("Expiration date must be in the future");

    options.expiresIn = Math.floor(remainingMs / 1000);
  } else {
    const expiresInMs =
      Number(process.env.REFRESH_TOKEN_EXPIRES_IN) || 7 * 24 * 60 * 60 * 1000; // fallback 7 days
    options.expiresIn = Math.floor(expiresInMs / 1000);
  }

  return jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET!, options);
}
