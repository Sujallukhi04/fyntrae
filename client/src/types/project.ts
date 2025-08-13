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
  client?: {
    id: string;
    name: string;
  } | null;
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
  billable: boolean;
  billableRate: number | null;
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
  status: "ACTIVE" | "DONE";
  creaedAt: string;
  updatedAt: string;
}

export interface TaskData {
  name: string;
  estimatedTime?: number;
}

export interface ProjectWithTasks {
  id: string;
  name: string;
  color: string;
  tasks: [
    {
      id: string;
      name: string;
    }
  ];
  members: string[];
}

export interface Tag {
  id: string;
  name: string;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
}

export interface TimeEntry {
  id: string;
  start: Date;
  end: Date;
  duration: number;
  description: string;
  taskId?: string | null;
  projectId?: string | null;
  organizationId: string;
  userId: string;
  tags: string[];
  billable: boolean;
}

export interface GroupRow {
  key: string;
  name: string;
  seconds: number;
  cost: number;
  grouped_data?: GroupRow[] | null;
}

export interface TimeEntryGroupProps {
  groupedData?: GroupRow[];
  groupBy1?: string;
  groupBy2?: string;
  currncy: string;
}

export interface Report {
  id: string;
  name: string;
  description: string;
  organizationId: string;
  isPublic: boolean;
  publicUntil: string | null;
  shareSecret: string | null;
  properties: ReportProperties;
  createdAt: string;
  updatedAt: string;
}

export interface ReportProperties {
  tags: string | null;
  group: string;
  tasks: string | null;
  clients: string | null;
  endDate: string; // "YYYY-MM-DD"
  members: string | null;
  billable: boolean;
  projects: string | null;
  startDate: string; // "YYYY-MM-DD"
}

export interface RunningTimeEntry {
  id: string;
  name: string;
  runningEntry: {
    id: string;
    description: string;
    start: Date;
    end: Date | null;
  };
}

export interface RecentTimeEntry {
  id: string;
  start: Date;
  end: Date;
  duration: number;
  description: string;
  task?: string;
  project?: string;
  color?: string;
  user: string;
}
