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
