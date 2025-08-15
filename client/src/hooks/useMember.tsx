import { organizationApi } from "@/lib/api";
import { useAuth } from "@/providers/AuthProvider";
import { useOrgAccess } from "@/providers/OrgAccessProvider";
import type { Invitation, Member } from "@/types/oraganization";
import React, { useCallback, useState } from "react";
import { toast } from "sonner";

const useMember = () => {
  const { user, setUser } = useAuth();
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
  const [transferOwner, setTransferOwner] = useState(false);

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

  const { canCallApi } = useOrgAccess();

  const updatePagination = (
    prev: {
      total: number;
      page: number;
      pageSize: number;
      totalPages: number;
    } | null,
    change: number
  ) => {
    if (!prev) return null;

    const newTotal = Math.max(0, prev.total + change);
    const newTotalPages = Math.max(1, Math.ceil(newTotal / prev.pageSize));
    const newPage = Math.min(prev.page, newTotalPages);

    return {
      ...prev,
      total: newTotal,
      totalPages: newTotalPages,
      page: newPage,
    };
  };

  const getMembers = useCallback(
    async (
      organizationId: string,
      params?: {
        page?: number;
        pageSize?: number;
      }
    ) => {
      if (!canCallApi("viewMembers")) {
        toast.error("You do not have permission to view members.");
        return;
      }

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
      if (!canCallApi("viewInvite")) {
        toast.error("You do not have permission to view invitations.");
        return;
      }

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
      if (!canCallApi("inviteMember")) {
        toast.error("You do not have permission to invite members.");
        return;
      }

      try {
        setIsInviting(true);
        const response = await organizationApi.inviteUser(
          organizationId,
          data.email,
          data.role
        );
        toast.success(response.message || "Invitation sent successfully!");

        setInvitations((prev) => {
          const updated = [response.invitation, ...prev];
          const pageSize = invitationsPagination?.pageSize || 10;

          if (updated.length > pageSize) {
            updated.pop();
          }
          return updated;
        });

        setInvitationsPagination((prev) => {
          const exists = invitations.some((inv) => inv.email === data.email);
          return exists ? prev : updatePagination(prev, 1);
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
      if (!canCallApi("inviteMember")) {
        toast.error("You do not have permission to invite members.");
        return;
      }

      try {
        setIsResendingInvitation(true);
        const response = await organizationApi.resendInvite(
          organizationId,
          inviteId
        );

        setInvitations((prev) =>
          prev.map((inv) =>
            inv.id === response.invitation.id ? response.invitation : inv
          )
        );

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
      if (!canCallApi("inviteMember")) {
        toast.error("You do not have permission to invite members.");
        return;
      }

      try {
        setReactivateMember(true);
        const response = await organizationApi.reinviteInactiveMember(
          organizationId,
          memberId
        );
        toast.success(response.message || "Member reactivated successfully!");

        setInvitations((prev) => {
          const updated = [response.invitation, ...prev];
          const pageSize = invitationsPagination?.pageSize || 10;

          if (updated.length > pageSize) {
            updated.pop();
          }
          return updated;
        });

        setInvitationsPagination((prev) => {
          const exists = invitations.some(
            (inv) => inv.id === response.invitation.id
          );
          return exists ? prev : updatePagination(prev, 1);
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
        billableRate: number | null;
      }
    ) => {
      if (!canCallApi("editMember")) {
        toast.error("You do not have permission to edit members.");
        return;
      }

      try {
        setIsUpdatingMember(true);
        const response = await organizationApi.updateMember(
          organizationId,
          memberId,
          data
        );

        setMembers((prev) =>
          prev.map((m) => (m.id === response.member.id ? response.member : m))
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
      if (!canCallApi("deleteMember")) {
        toast.error("You do not have permission to deactive members.");
        return;
      }

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
      if (!canCallApi("deleteMember")) {
        toast.error("You do not have permission to delete members.");
        return;
      }
      try {
        setIsRemovingMember(true);
        const response = await organizationApi.deleteMember(
          organizationId,
          memberId
        );

        setMembers((prev) => prev.filter((m) => m.id !== memberId));
        setMembersPagination((prev) => updatePagination(prev, -1));

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
      if (!canCallApi("deleteInvite")) {
        toast.error("You do not have permission to delete invite.");
        return;
      }

      try {
        setIsDeletingInvitation(true);
        const response = await organizationApi.deleteInvitation(
          organizationId,
          invitationId
        );

        setInvitations((prev) => prev.filter((inv) => inv.id !== invitationId));
        setInvitationsPagination((prev) => updatePagination(prev, -1));

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

  const transferOwnership = useCallback(
    async (oraganizationId: string, newOwnerId: string) => {
      if (!canCallApi("transferOwnership")) {
        toast.error("You do not have permission to transfer ownership.");
        return;
      }
      setTransferOwner(true);

      try {
        const response = await organizationApi.transferOwnerShip(
          oraganizationId,
          newOwnerId
        );

        const { previousOwner, newOwner } = response;

        setMembers((prev) =>
          prev.map((member) => {
            if (member.userId === previousOwner.id) {
              return { ...member, role: previousOwner.role };
            }
            if (member.userId === newOwner.id) {
              return { ...member, role: newOwner.role };
            }
            return member;
          })
        );

        setUser((prev) => {
          if (!prev) return prev;

          const updatedOrganizations = prev.organizations.map((org) => {
            if (org.id === oraganizationId) {
              if (org.role === "OWNER" && prev.id === previousOwner.id) {
                return { ...org, role: previousOwner.role };
              }
              // If current user is now the new owner
              if (prev.id === newOwner.id) {
                return { ...org, role: newOwner.role };
              }
            }
            return org;
          });

          return {
            ...prev,
            organizations: updatedOrganizations,
          };
        });

        toast.success("transfer owner successfully");
        return response;
      } catch (error: any) {
        const errorMessage =
          error.response?.data?.message || "Failed to transfer ownership";
        toast.error(errorMessage);
        throw error;
      } finally {
        setTransferOwner(false);
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
    transferOwnership,
    transferOwner,
  };
};

export default useMember;
