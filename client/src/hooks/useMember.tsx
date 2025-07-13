import { organizationApi } from "@/lib/api";
import { useAuth } from "@/providers/AuthProvider";
import type { Invitation, Member } from "@/types/oraganization";
import React, { useCallback, useState } from "react";
import { toast } from "sonner";

const useMember = () => {
  const { user } = useAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);
  const [isLoadingInvitations, setIsLoadingInvitations] = useState(false);

  const [isInviting, setIsInviting] = useState(false);
  const [isUpdatingMember, setIsUpdatingMember] = useState(false);
  const [isResendingInvitation, setIsResendingInvitation] = useState(false);
  const [isDeletingInvitation, setIsDeletingInvitation] = useState(false);
  const [isRemovingMember, setIsRemovingMember] = useState(false);
  const [isDeactivatingMember, setIsDeactivatingMember] = useState(false);
  const [reactivateMember, setReactivateMember] = useState(false);

  const [membersPagination, setMembersPagination] = useState<{
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  } | null>(null);
  const [invitationsPagination, setInvitationsPagination] = useState<{
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  } | null>(null);

  const getMembers = useCallback(
    async (
      organizationId: string,
      params?: {
        page?: number;
        pageSize?: number;
      }
    ) => {
      try {
        setIsLoadingMembers(true);
        const response = await organizationApi.getOrganizationMembers(
          organizationId,
          params
        );
        setMembers(response.members || []);
        setMembersPagination(response.pagination || null);
      } catch (error: any) {
        const errorMessage =
          error.response?.data?.message || "Failed to fetch members";
        toast.error(errorMessage);
      } finally {
        setIsLoadingMembers(false);
      }
    },
    []
  );

  const getInvitations = useCallback(
    async (
      organizationId: string,
      params?: {
        page?: number;
        pageSize?: number;
      }
    ) => {
      try {
        setIsLoadingInvitations(true);

        const response = await organizationApi.getOrganizationInvitations(
          organizationId,
          params
        );

        setInvitations(response.invitations || []);
        setInvitationsPagination(response.pagination || null);
      } catch (error: any) {
        const errorMessage =
          error.response?.data?.message || "Failed to fetch invitations";
        toast.error(errorMessage);
      } finally {
        setIsLoadingInvitations(false);
      }
    },
    []
  );

  const inviteUser = useCallback(
    async (
      organizationId: string,
      data: {
        email: string;
        role: string;
      }
    ) => {
      try {
        setIsInviting(true);
        const response = await organizationApi.inviteUser(
          organizationId,
          data.email,
          data.role
        );
        toast.success(response.message || "Invitation sent successfully!");

        setInvitations((prev) => {
          const idx = prev.findIndex((inv) => inv.email === data.email);
          if (idx !== -1) {
            const updated = [...prev];
            updated[idx] = response.invitation;
            return updated;
          }
          return [...prev, response.invitation];
        });

        setInvitationsPagination((prev) => {
          if (!prev) return null;
          const exists = invitations.some((inv) => inv.email === data.email);
          return exists
            ? prev
            : {
                ...prev,
                total: prev.total + 1,
                totalPages: Math.ceil((prev.total + 1) / prev.pageSize),
              };
        });

        return response;
      } catch (error: any) {
        const errorMessage =
          error.response?.data?.message || "Failed to send invitation";
        toast.error(errorMessage);
        throw error;
      } finally {
        setIsInviting(false);
      }
    },
    [invitations]
  );

  // Resend invite uses the same API but its own loader
  const resendInvite = useCallback(
    async (organizationId: string, inviteId: string) => {
      try {
        setIsResendingInvitation(true);
        const response = await organizationApi.resendInvite(
          organizationId,
          inviteId
        );

        setInvitations((prev) => {
          const idx = prev.findIndex(
            (inv) => inv.id === response.invitation.id
          );
          if (idx !== -1) {
            const updated = [...prev];
            updated[idx] = response.invitation;
            return updated;
          }
          return [...prev, response.invitation];
        });

        toast.success(response.message || "Invitation resent successfully!");
        return response;
      } catch (error: any) {
        const errorMessage =
          error.response?.data?.message || "Failed to resend invitation";
        toast.error(errorMessage);
        throw error;
      } finally {
        setIsResendingInvitation(false);
      }
    },
    [invitations]
  );

  const reactiveMember = useCallback(
    async (organizationId: string, memberId: string) => {
      try {
        setReactivateMember(true);
        const response = await organizationApi.reinviteInactiveMember(
          organizationId,
          memberId
        );
        toast.success(response.message || "Member reactivated successfully!");

        setInvitations((prev) => {
          const idx = prev.findIndex(
            (inv) => inv.id === response.invitation.id
          );
          if (idx !== -1) {
            const updated = [...prev];
            updated[idx] = response.invitation;
            return updated;
          }
          return [...prev, response.invitation];
        });

        setInvitationsPagination((prev) => {
          if (!prev) return null;
          const exists = invitations.some(
            (inv) => inv.id === response.invitation.id
          );
          return exists
            ? prev
            : {
                ...prev,
                total: prev.total + 1,
                totalPages: Math.ceil((prev.total + 1) / prev.pageSize),
              };
        });

        return response;
      } catch (error: any) {
        const errorMessage =
          error.response?.data?.message || "Failed to reactivate member";
        toast.error(errorMessage);
        throw error;
      } finally {
        setReactivateMember(false);
      }
    },
    []
  );

  const updateMember = useCallback(
    async (
      organizationId: string,
      memberId: string,
      data: {
        role?: string;
        billableRate?: number;
      }
    ) => {
      try {
        setIsUpdatingMember(true);
        const response = await organizationApi.updateMember(
          organizationId,
          memberId,
          data
        );

        setMembers((prev) =>
          prev.map((member) =>
            member.id === response.member.id ? response.member : member
          )
        );

        toast.success("Member updated successfully");
        return response;
      } catch (error: any) {
        const errorMessage =
          error.response?.data?.message || "Failed to update member";
        toast.error(errorMessage);
        throw error;
      } finally {
        setIsUpdatingMember(false);
      }
    },
    [getMembers]
  );

  const deactiveMember = useCallback(
    async (organizationId: string, memberId: string) => {
      try {
        setIsDeactivatingMember(true);
        const response = await organizationApi.deactiveMember(
          organizationId,
          memberId
        );

        setMembers((prev) =>
          prev.map((member) =>
            member.id === response.member.id ? response.member : member
          )
        );

        toast.success("Member deactivated successfully");
        return response;
      } catch (error: any) {
        const errorMessage =
          error.response?.data?.message || "Failed to deactivate member";
        toast.error(errorMessage);
        throw error;
      } finally {
        setIsDeactivatingMember(false);
      }
    },
    []
  );

  const deleteMember = useCallback(
    async (organizationId: string, memberId: string) => {
      try {
        setIsRemovingMember(true);
        const response = await organizationApi.deleteMember(
          organizationId,
          memberId
        );

        // Remove member from local state
        setMembers((prev) => prev.filter((member) => member.id !== memberId));

        // Update pagination
        setMembersPagination((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            total: prev.total - 1,
            totalPages: Math.ceil((prev.total - 1) / prev.pageSize),
          };
        });

        toast.success("Member deleted successfully");
        return response;
      } catch (error: any) {
        const errorMessage =
          error.response?.data?.message || "Failed to delete member";
        toast.error(errorMessage);
        throw error;
      } finally {
        setIsRemovingMember(false);
      }
    },
    []
  );

  const deleteInvite = useCallback(
    async (organizationId: string, invitationId: string) => {
      try {
        setIsDeletingInvitation(true);
        const response = await organizationApi.deleteInvitation(
          organizationId,
          invitationId
        );
        // Remove invitation from local state
        setInvitations((prev) => prev.filter((inv) => inv.id !== invitationId));

        // Update pagination
        setInvitationsPagination((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            total: prev.total - 1,
            totalPages: Math.ceil((prev.total - 1) / prev.pageSize),
          };
        });

        toast.success("Invitation deleted successfully");
        return response;
      } catch (error: any) {
        const errorMessage =
          error.response?.data?.message || "Failed to delete invitation";
        toast.error(errorMessage);
        throw error;
      } finally {
        setIsDeletingInvitation(false);
      }
    },
    []
  );

  return {
    getInvitations,
    getMembers,
    inviteUser,
    updateMember,
    resendInvite,
    deactiveMember,
    deleteMember,
    deleteInvite,
    reactiveMember,
    reactivateMember,
    isDeletingInvitation,
    isRemovingMember,
    isDeactivatingMember,
    isUpdatingMember,
    isResendingInvitation,
    members,
    isInviting,
    invitations,
    isLoadingMembers,
    isLoadingInvitations,
    membersPagination,
    invitationsPagination,
    setMembers,
    setInvitations,
  };
};

export default useMember;
