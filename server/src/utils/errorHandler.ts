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

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      const target = (err.meta?.target as string[])?.join(", ");
      err = new ErrorHandler(`Duplicate field value: ${target}`, 400);
    }

    if (err.code === "P2003") {
      err = new ErrorHandler(`Foreign key constraint failed`, 400);
    }

    if (err.code === "P2025") {
      err = new ErrorHandler(`Record not found`, 404);
    }
  }

  if (err instanceof Prisma.PrismaClientValidationError) {
    err = new ErrorHandler(`Validation failed: ${err.message}`, 400);
  }

  if (err instanceof Prisma.PrismaClientUnknownRequestError) {
    err = new ErrorHandler(`Something went wrong with the database.`, 500);
  }

  if (err instanceof TypeError) {
    err = new ErrorHandler(`Type Error: ${err.message}`, 500);
  }

  res.status(err.statusCode).json({
    success: false,
    message: err.message,
  });
};

export { ErrorHandler, errorHandler };
