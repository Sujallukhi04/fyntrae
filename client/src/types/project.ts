export interface Project {
  id: string;
  name: string;
  color: string;
  billable: boolean;
  billableRate?: number;
  estimatedTime?: number;
  spentTime: number;
  isActive: boolean;
  isArchived: boolean;
  organizationId: string;
  clientId?: string | null;
  createdAt: string;
  updatedAt: string;
  archivedAt?: string | null;
}

