import { Request, Response, NextFunction } from "express";
import { Prisma } from "@prisma/client";
import { ZodError } from "zod";
import jwt from "jsonwebtoken";
import { config } from "../config/config";

class ErrorHandler extends Error {
  statusCode: number;
  constructor(message: string | string[], statusCode: number = 500) {
    super(
      Array.isArray(message)
        ? message.join(", ")
        : message || "Something went wrong"
    );
    this.statusCode = statusCode;
    Error.captureStackTrace(this, this.constructor);
  }
}

const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let customError = err;

  if (err instanceof ZodError) {
    customError = new ErrorHandler(err.errors[0].message, 400);
  }

  // Prisma known request errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      case "P2002":
        const target = (err.meta?.target as string[])?.join(", ");
        customError = new ErrorHandler(`Duplicate field value: ${target}`, 400);
        break;
      case "P2003":
        customError = new ErrorHandler(`Foreign key constraint failed`, 400);
        break;
      case "P2025":
        customError = new ErrorHandler(`Record not found`, 404);
        break;
    }
  }

  // Prisma validation error
  if (err instanceof Prisma.PrismaClientValidationError) {
    customError = new ErrorHandler(`Validation failed: ${err.message}`, 400);
  }

  // Prisma unknown errors
  if (err instanceof Prisma.PrismaClientUnknownRequestError) {
    customError = new ErrorHandler(`Unknown database error occurred`, 500);
  }

  // JWT errors
  if (err instanceof jwt.TokenExpiredError) {
    customError = new ErrorHandler("Token expired", 401);
  }
  if (err instanceof jwt.JsonWebTokenError) {
    customError = new ErrorHandler("Invalid token", 401);
  }

  if (err instanceof TypeError) {
    customError = new ErrorHandler(`Type Error: ${err.message}`, 500);
  }

  const statusCode = customError.statusCode || 500;
  const message = customError.message || "Internal Server Error";

  res.status(statusCode).json({
    success: false,
    message,
    ...(config.NODE_ENV !== "production" && {
      stack: customError.stack,
    }),
  });
};
export { ErrorHandler, errorHandler };
