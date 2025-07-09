import jwt from "jsonwebtoken";
import { TokenPayload } from "../types";


const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error("Missing JWT_SECRET environment variable");
}

export const generateToken = (user: TokenPayload): string => {
  return jwt.sign(user, JWT_SECRET, { expiresIn: "1d" });
};
