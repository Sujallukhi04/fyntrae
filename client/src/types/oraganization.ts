export interface Organization {
  id: string;
  name: string;
  personalTeam: boolean;
  dateFormat: "MM/DD/YYYY" | "DD/MM/YYYY" | "YYYY-MM-DD";
  currency: "INR" | "USD" | "EUR" | "GBP";
  employeesCanSeeBillableRates: boolean;
  billableRates: number | null;
  intervalFormat: "12h" | "decimal";
  timeFormat: "12h" | "24h";
  numberFormat: "1,000.00" | "1.000,00" | "1 000.00" | "1,00,000.00";
  createdAt: string;
  updatedAt: string;
}

export interface OrganizationUpdateData {
  name: string;
  currency: "INR" | "USD" | "EUR" | "GBP";
  dateFormat: "MM/DD/YYYY" | "DD/MM/YYYY" | "YYYY-MM-DD";
  timeFormat: "12h" | "24h";
  intervalFormat: "12h" | "decimal";
  numberFormat: "1,000.00" | "1.000,00" | "1 000.00" | "1,00,000.00";
  billableRates: number;
  employeesCanSeeBillableRates: boolean;
}

export interface Member {
  id: string;
  userId: string;
  organizationId: string;
  role: "OWNER" | "ADMIN" | "MANAGER" | "EMPLOYEE";
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
  billableRate?: number;
}

export interface Invitation {
  id: string;
  email: string;
  organizationId: string;
  role: "ADMIN" | "MANAGER" | "EMPLOYEE";
  status: "PENDING" | "EXPIRED" | "ACCEPTED";
  expiresAt: string;
  createdAt: string;
  resendCount: number;
  lastReSentAt?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
}

export interface PaginationType {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface Client {
  id: string;
  name: string;
  organizationId: string;
  archivedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
