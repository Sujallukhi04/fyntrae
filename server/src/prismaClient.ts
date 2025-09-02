import { PrismaClient } from "@prisma/client";
import { config } from "./config/config";

const prismaClientSingleton = () => {
  return new PrismaClient({
    datasources: {
      db: {
        url: config.DATABASE_URL,
      },
    },
  });
};

declare global {
  var prisma: undefined | ReturnType<typeof prismaClientSingleton>;
}

const prisma = globalThis.prisma ?? prismaClientSingleton();

export const db = prisma;

if (process.env.NODE_ENV !== "production") globalThis.prisma = prisma;
