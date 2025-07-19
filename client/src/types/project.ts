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

export interface ProjectMember {
  id: string;
  projectId: string;
  memberId: string;
  userId: string;
  billableRate?: number;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
  member: {
    role: string;
    isActive: boolean;
  };
}

export interface OrganizationMember {
  id: string;
  userId: string;
  role: string;
  billableRate?: number;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

export interface ProjectData {
  name: string;
  color?: string;
  billable?: boolean;
  billableRate?: number;
  estimatedTime?: number;
  clientId?: string | null;
}

export interface Tasks {
  id: string;
  name: string;
  projectId: string;
  organizationId: string;
  estimatedTime?: number;
  spentTime: number;
  status: string;
  creaedAt: string;
  updatedAt: string;
}

export interface TaskData {
  name: string;
  estimatedTime?: number;
}
