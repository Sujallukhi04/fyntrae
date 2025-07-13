import { WeekStart } from "@prisma/client";

export interface TokenPayload {
  id: string;
}

export interface UserMain {
  id: string;
  email: string;
  password: string;
  currentTeamId: string | null;
  isActive: boolean;
  weekStart: WeekStart;
  createdAt: Date;
  updatedAt: Date;
}

declare global {
  namespace Express {
    interface Request {
      user?: UserMain;
    }
  }
}
