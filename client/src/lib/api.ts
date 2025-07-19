import type { LoginCredentials, SignupData } from "@/types/auth";
import { axiosInstance } from "./axios";
import type { OrganizationUpdateData } from "@/types/oraganization";

export const authApi = {
  login: async (userData: LoginCredentials) => {
    const response = await axiosInstance.post("/auth/login", userData);
    return response.data;
  },
  signup: async (data: SignupData) => {
    const response = await axiosInstance.post("/auth/register", data);
    return response.data;
  },
  getAuthUser: async () => {
    const res = await axiosInstance.get("/auth/me");
    return res.data;
  },
};

export const organizationApi = {
  getCurrentOrganization: async (organizationId: string) => {
    const response = await axiosInstance.get(`/organization/${organizationId}`);
    return response.data;
  },
  updateOrganization: async (
    organization: string,
    data: OrganizationUpdateData
  ) => {
    const response = await axiosInstance.put(
      `/organization/${organization}`,
      data
    );
    return response.data;
  },
  deleteOrganization: async (organizationId: string) => {
    const response = await axiosInstance.delete(
      `/organization/${organizationId}`
    );
    return response.data;
  },
  createOrganization: async (data: { name: string }) => {
    const response = await axiosInstance.post("/organization", data);
    return response.data;
  },
  switchOrganization: async (organizationId: string) => {
    const response = await axiosInstance.post("/organization/switch", {
      organizationId,
    });
    return response.data;
  },
  getOrganizationMembers: async (
    organizationId: string,
    params?: {
      page?: number;
      pageSize?: number;
    }
  ) => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append("page", params.page.toString());
    if (params?.pageSize)
      queryParams.append("pageSize", params.pageSize.toString());

    const response = await axiosInstance.get(
      `/organization/${organizationId}/members?${queryParams.toString()}`
    );
    return response.data;
  },
  getOrganizationInvitations: async (
    organizationId: string,
    params?: {
      page?: number;
      pageSize?: number;
    }
  ) => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append("page", params.page.toString());
    if (params?.pageSize)
      queryParams.append("pageSize", params.pageSize.toString());

    const response = await axiosInstance.get(
      `/organization/${organizationId}/invitations?${queryParams.toString()}`
    );
    return response.data;
  },
  inviteUser: async (organizationId: string, email: string, role?: string) => {
    const response = await axiosInstance.post(
      `/member/${organizationId}/invite`,
      { email, role }
    );
    return response.data;
  },
  acceptInvitation: async (token: string) => {
    const response = await axiosInstance.put(
      `/member/invitation/accept/${token}`
    );
    return response.data;
  },
  updateMember: async (
    organizationId: string,
    memberId: string,
    data: {
      role?: string;
      billableRate?: number;
    }
  ) => {
    const response = await axiosInstance.put(
      `/member/${organizationId}/members/${memberId}`,
      data
    );
    return response.data;
  },
  deactiveMember: async (organizationId: string, memberId: string) => {
    const response = await axiosInstance.patch(
      `/organization/${organizationId}/members/${memberId}/deactivate`
    );
    return response.data;
  },
  deleteMember: async (organizationId: string, memberId: string) => {
    const response = await axiosInstance.delete(
      `/organization/${organizationId}/members/${memberId}`
    );
    return response.data;
  },
  deleteInvitation: async (organizationId: string, invitationId: string) => {
    const response = await axiosInstance.delete(
      `/organization/${organizationId}/invitations/${invitationId}`
    );
    return response.data;
  },
  resendInvite: async (organizationId: string, invitationId: string) => {
    const response = await axiosInstance.post(
      `/member/${organizationId}/invitations/${invitationId}/resend`
    );
    return response.data;
  },
  reinviteInactiveMember: async (organizationId: string, memberId: string) => {
    const response = await axiosInstance.post(
      `/member/${organizationId}/members/${memberId}/reinvite`
    );
    return response.data;
  },
};

export const clientApi = {
  getClients: async (
    organizationId: string,
    params?: {
      page?: number;
      pageSize?: number;
      type?: "active" | "archived";
    }
  ) => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append("page", params.page.toString());
    if (params?.pageSize)
      queryParams.append("pageSize", params.pageSize.toString());
    if (params?.type) queryParams.append("type", params.type);

    const response = await axiosInstance.get(
      `/client/${organizationId}?${queryParams.toString()}`
    );
    return response.data;
  },
  createClient: async (organizationId: string, name: string) => {
    const response = await axiosInstance.post(
      `/client/create/${organizationId}`,
      {
        name,
      }
    );
    return response.data;
  },
  editClient: async (
    organizationId: string,
    clientId: string,
    name: string
  ) => {
    const response = await axiosInstance.put(
      `/client/${clientId}/organzation/${organizationId}`,
      {
        name,
      }
    );
    return response.data;
  },
  sendArchive: async (clientId: string, organizationId: string) => {
    const response = await axiosInstance.put(`/client/${clientId}/archive`, {
      organizationId,
    });
    return response.data;
  },
  unArchiveClient: async (clientId: string, organizationId: string) => {
    const response = await axiosInstance.put(`/client/${clientId}/unarchive`, {
      organizationId,
    });
    return response.data;
  },
  deleteClient: async (clientId: string, organizationId: string) => {
    const response = await axiosInstance.delete(
      `/client/${clientId}/organization/${organizationId}`
    );
    return response.data;
  },
};

export const projectApi = {
  createProject: async (
    organizationId: string,
    data: {
      name: string;
      color?: string;
      billable?: boolean;
      billableRate?: number;
      estimatedTime?: number;
      clientId?: string | null;
    }
  ) => {
    const response = await axiosInstance.post(
      `/project/create/${organizationId}`,
      data
    );
    return response.data;
  },

  getAllProjects: async (
    organizationId: string,
    params?: {
      page?: number;
      pageSize?: number;
      type?: "active" | "archived";
    }
  ) => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append("page", params.page.toString());
    if (params?.pageSize)
      queryParams.append("pageSize", params.pageSize.toString());
    if (params?.type) queryParams.append("type", params.type);

    const response = await axiosInstance.get(
      `/project/${organizationId}?${queryParams.toString()}`
    );
    return response.data;
  },

  getProjectById: async (projectId: string, organizationId: string) => {
    const response = await axiosInstance.get(
      `/project/${projectId}/organization/${organizationId}`
    );
    return response.data;
  },

  updateProject: async (
    projectId: string,
    organizationId: string,
    data: {
      name: string;
      color?: string;
      billable?: boolean;
      billableRate?: number;
      estimatedTime?: number;
      clientId?: string | null;
    }
  ) => {
    console.log("first");
    const response = await axiosInstance.put(
      `/project/update/${projectId}/organization/${organizationId}`,
      data
    );
    return response.data;
  },

  archiveProject: async (projectId: string, organizationId: string) => {
    const response = await axiosInstance.put(
      `/project/archive/${projectId}/${organizationId}`
    );
    return response.data;
  },

  unarchiveProject: async (projectId: string, organizationId: string) => {
    const response = await axiosInstance.put(
      `/project/unarchive/${projectId}/${organizationId}`
    );
    return response.data;
  },

  getClientsByOrganizationId: async (organizationId: string) => {
    const response = await axiosInstance.get(
      `/project/clients/${organizationId}`
    );
    return response.data;
  },

  deleteProject: async (projectId: string, organizationId: string) => {
    const response = await axiosInstance.delete(
      `/project/${projectId}/${organizationId}`
    );
    return response.data;
  },
};

export const ProjectMemberApi = {
  getProjectMembers: async (projectId: string, organizationId: string) => {
    const response = await axiosInstance.get(
      `/project/project-members/${projectId}/${organizationId}`
    );
    return response.data;
  },

  addProjectMember: async (
    projectId: string,
    organizationId: string,
    data: {
      memberId: string;
      billableRate?: number;
    }
  ) => {
    const response = await axiosInstance.post(
      `/project/project-members/${projectId}/${organizationId}`,
      data
    );
    return response.data;
  },

  updateProjectMember: async (
    projectId: string,
    organizationId: string,
    memberId: string,
    data: {
      billableRate: number;
    }
  ) => {
    const response = await axiosInstance.put(
      `/project/project-members/${projectId}/${organizationId}/${memberId}`,
      data
    );
    return response.data;
  },

  removeProjectMember: async (
    projectId: string,
    organizationId: string,
    memberId: string
  ) => {
    const response = await axiosInstance.delete(
      `/project/project-members/${projectId}/${organizationId}/${memberId}`
    );
    return response.data;
  },

  getOrganizationMembers: async (organizationId: string, projectId: string) => {
    const response = await axiosInstance.get(
      `/project/org-members/${organizationId}?projectId=${projectId}`
    );
    return response.data;
  },
};

export const TaskApi = {
  createTask: async (
    projectId: string,
    organizationId: string,
    data: {
      name: string;
      estimatedTime?: number;
    }
  ) => {
    const response = await axiosInstance.post(
      `/project/tasks/${projectId}/${organizationId}`,
      data
    );
    return response.data;
  },
  updateTask: async (
    taskId: string,
    projectId: string,
    organizationId: string,
    data: {
      name?: string;
      estimatedTime?: number;
    }
  ) => {
    const response = await axiosInstance.put(
      `/project/tasks/${taskId}/${projectId}/${organizationId}`,
      data
    );
    return response.data;
  },
  updateTaskStatus: async (
    taskId: string,
    projectId: string,
    organizationId: string,
    status: "ACTIVE" | "DONE"
  ) => {
    const response = await axiosInstance.put(
      `/project/tasks/status/${taskId}/${projectId}/${organizationId}`,
      { status }
    );
    return response.data;
  },
  deleteTask: async (
    taskId: string,
    projectId: string,
    organizationId: string
  ) => {
    const response = await axiosInstance.delete(
      `/project/tasks/${taskId}/${projectId}/${organizationId}`
    );
    return response.data;
  },
  getProjectTasks: async (projectId: string, organizationId: string) => {
    const response = await axiosInstance.get(
      `/project/tasks/${projectId}/${organizationId}`
    );
    return response.data;
  },
};
