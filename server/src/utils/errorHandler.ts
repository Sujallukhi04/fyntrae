import { Request, Response, NextFunction } from "express";
import { Prisma } from "@prisma/client"; 

class ErrorHandler extends Error {
  statusCode: number;

  constructor(message: string | string[], statusCode: number) {
    super(Array.isArray(message) ? message.join(", ") : message);
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
  err.statusCode = err.statusCode || 500;
  err.message = err.message || "Internal Server Error";

  // 🔹 Prisma: known client request errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    // Unique constraint failed (e.g., email already exists)
    if (err.code === "P2002") {
      const target = (err.meta?.target as string[])?.join(", ");
      err = new ErrorHandler(`Duplicate field value: ${target}`, 400);
    }

    // Foreign key constraint failed
    if (err.code === "P2003") {
      err = new ErrorHandler(`Foreign key constraint failed`, 400);
    }

    // Record not found
    if (err.code === "P2025") {
      err = new ErrorHandler(`Record not found`, 404);
    }
  }

  // 🔹 Prisma: validation error
  if (err instanceof Prisma.PrismaClientValidationError) {
    err = new ErrorHandler(`Validation failed: ${err.message}`, 400);
  }

  // 🔹 Prisma: unknown error
  if (err instanceof Prisma.PrismaClientUnknownRequestError) {
    err = new ErrorHandler(`Something went wrong with the database.`, 500);
  }

  // 🔹 JavaScript TypeError
  if (err instanceof TypeError) {
    err = new ErrorHandler(`Type Error: ${err.message}`, 500);
  }

  // 🔹 Fallback response
  res.status(err.statusCode).json({
    success: false,
    message: err.message,
  });
};

export { ErrorHandler, errorHandler };
