import jwt from "jsonwebtoken";
import { NextFunction, Request, Response } from "express";
import { TokenPayload } from "../types";
import { ErrorHandler } from "../utils/errorHandler";
import { getUserById } from "../helper/user";

const JWT_SECRET = process.env.JWT_SECRET;

export const protectRoute = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = req.cookies.token;

    if (!token) {
      throw new ErrorHandler("Unauthorized - No token provided", 404);
    }

    const decoded = jwt.verify(token, JWT_SECRET!) as TokenPayload;

    if (!decoded) {
      throw new ErrorHandler("Unauthorized - Invalid token", 404);
    }

    const user = await getUserById(decoded.id);

    if (!user) {
      throw new ErrorHandler("Unauthorized - User not found", 404);
    }

    //@ts-ignore
    req.user = user;

    next();
  } catch (error) {
    throw new ErrorHandler(
      error instanceof Error ? error.message : "Unauthorized - Invalid token",
      404
    );
  }
};
