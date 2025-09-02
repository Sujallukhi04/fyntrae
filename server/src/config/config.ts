import dotenv from "dotenv";

dotenv.config({
  path:
    process.env.NODE_ENV === "production" ? ".env.production" : ".env.local",
});

function getEnvVar(key: string, required = true): string {
  const value = process.env[key];
  if (required && (!value || value.trim() === "")) {
    console.error(`Missing required environment variable: ${key}`);
    process.exit(1);
  }
  return value as string;
}

export const config = {
  // General
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: process.env.PORT || "5000",

  // Database
  DATABASE_URL: getEnvVar("DATABASE_URL"),

  // Auth
  ACCESS_TOKEN_SECRET: getEnvVar("ACCESS_TOKEN_SECRET"),
  REFRESH_TOKEN_SECRET: getEnvVar("REFRESH_TOKEN_SECRET"),
  ACCESS_TOKEN_EXPIRES_IN: getEnvVar("ACCESS_TOKEN_EXPIRES_IN"),
  REFRESH_TOKEN_EXPIRES_IN: getEnvVar("REFRESH_TOKEN_EXPIRES_IN"),
  MAXIMUM_SESSION: parseInt(getEnvVar("MAXIMUM_SESSION"), 10),

  // Frontend
  FRONTEND_URL: getEnvVar("FRONTEND_URL"),

  // SMTP
  SMTP: {
    HOST: getEnvVar("SMTP_HOST"),
    PORT: parseInt(getEnvVar("SMTP_PORT"), 10),
    SECURE: String(process.env.SMTP_SECURE).toLowerCase() === "true",
    USER: getEnvVar("SMTP_USER"),
    PASS: getEnvVar("SMTP_PASS"),
    FROM_NAME: getEnvVar("SMTP_FROM_NAME"),
    FROM_EMAIL: getEnvVar("SMTP_FROM_EMAIL"),
  },

  // Cloudinary
  CLOUDINARY: {
    CLOUD_NAME: getEnvVar("CLOUDINARY_CLOUD_NAME"),
    API_KEY: getEnvVar("CLOUDINARY_API_KEY"),
    API_SECRET: getEnvVar("CLOUDINARY_API_SECRET"),
  },
};
