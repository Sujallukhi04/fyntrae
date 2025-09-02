import { rateLimit } from "express-rate-limit";

export const globalLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  limit: 300, // 300 requests per IP per minute
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later." },
});

// Auth limiter (stricter)
export const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 10, // only 10 requests per minute
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { error: "Too many requests on auth endpoints. Try again later." },
});

// General API limiter
export const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 100,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { error: "Too many requests. Please try later." },
});
