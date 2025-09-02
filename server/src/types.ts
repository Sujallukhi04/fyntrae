import { Member, WeekStart } from "@prisma/client";
import { File } from "buffer";

export interface TokenPayload {
  id: string;
}

export interface UserMain {
  id: string;
  email: string;
  password: string;
  currentTeamId: string | null;
  isActive: boolean;
  profilePicUrl: string;
  profilePicPublicId: string;
  weekStart: WeekStart;
  createdAt: Date;
  updatedAt: Date;
}

declare global {
  namespace Express {
    interface Request {
      user?: UserMain;
      member?: Member;
      files?:
        | { [fieldname: string]: Express.Multer.File[] }
        | Express.Multer.File[];
    }
  }
}

export interface TimeTrackingData {
  summary: {
    totalHours: number;
    totalCost: number;
    totalEntries: number;
    dateRange: {
      start: string | null;
      end: string | null;
    };
  };
  barChart: any;
  pieChart: any;
  groupedData: any;
  analytics: {
    averageHoursPerDay: number;
    billableHours: number;
    nonBillableHours: number;
    billablePercentage: number;
    topPerformers: Array<{
      name: string;
      hours: number;
      cost: number;
    }>;
  };
}
