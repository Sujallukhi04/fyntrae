import jwt from "jsonwebtoken";
import { NextFunction, Request, Response } from "express";
import { TokenPayload } from "../types";
import { ErrorHandler } from "../utils/errorHandler";
import { getUserById } from "../helper/user";
import { catchAsync } from "../utils/catchAsync";

const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET;

export const validateRefreshToken = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
      throw new ErrorHandler("Refresh token missing", 401);
    }

    const decoded = jwt.verify(refreshToken, REFRESH_TOKEN_SECRET!) as {
      token: string;
    };

    if (!decoded) {
      throw new ErrorHandler("Unauthorized - Invalid token", 401);
    }

    //@ts-ignore
    req.token = decoded.token;

    next();
  }
);
