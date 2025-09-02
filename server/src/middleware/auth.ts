import jwt from "jsonwebtoken";
import { NextFunction, Request, Response } from "express";
import { TokenPayload } from "../types";
import { ErrorHandler } from "../utils/errorHandler";
import { getUserById } from "../helper/user";
import { catchAsync } from "../utils/catchAsync";
import { config } from "../config/config";

const ACCESS_TOKEN_SECRET = config.ACCESS_TOKEN_SECRET;

export const protectRoute = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const token = req.cookies.accessToken;

    if (!token) {
      throw new ErrorHandler("Unauthorized - No token provided", 401);
    }

    const decoded = jwt.verify(token, ACCESS_TOKEN_SECRET) as TokenPayload;

    if (!decoded) {
      throw new ErrorHandler("Unauthorized - Invalid token", 401);
    }

    const user = await getUserById(decoded.id);

    if (!user) {
      throw new ErrorHandler("Unauthorized - User not found", 401);
    }

    //@ts-ignore
    req.user = user;

    next();
  }
);
