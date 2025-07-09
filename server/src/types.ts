export interface TokenPayload {
  id: string;
}

interface UserMain {
  id: string;
  email: string;
  password: string;
  currentTeamId: string | null;
  isActive: boolean;
  weekStart: string;
  createdAt: Date;
  updateAt: Date;
}

declare global {
  namespace Express {
    interface Request {
      user?: UserMain;
    }
  }
}
