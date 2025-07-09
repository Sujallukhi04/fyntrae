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
      `/organization/${organizationId}/invite`,
      { email, role }
    );
    return response.data;
  },
  acceptInvitation: async (token: string) => {
    const response = await axiosInstance.put(
      `/organization/invitation/accept/${token}`
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
      `/organization/${organizationId}/members/${memberId}`,
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
      `/organization/${organizationId}/invitations/${invitationId}/resend`
    );
    return response.data;
  },
  reinviteInactiveMember: async (
    organizationId: string,
    memberId: string
  ) => {
    const response = await axiosInstance.post(
      `/organization/${organizationId}/invite/${memberId}/reinvite`
    );
    return response.data;
  },
};
