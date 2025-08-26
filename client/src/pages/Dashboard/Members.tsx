import React, { useState, useEffect, useCallback, useMemo, act } from "react";
import {
  UserPlus,
  Search,
  AlertTriangle,
  Trash2,
  UsersIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import useMember from "@/hooks/useMember";
import { useAuth } from "@/providers/AuthProvider";
import type { Member, Invitation } from "@/types/oraganization";
import UpdateUser from "@/components/member/UpdateUser";
import MemberTable from "@/components/member/MemberTable";
import InvitationTable from "@/components/member/InvitationTable";
import GeneralModal from "@/components/modals/shared/Normalmodal";
import { CustomAlertDialog } from "@/components/modals/shared/CustomAlertDialog";
import { InviteMemberModal } from "@/components/member/InviteMemberModal";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { UpdateRateModal } from "@/components/modals/shared/UpdateRateModal";
import { useOrgAccess } from "@/providers/OrgAccessProvider";

type RoleType = "OWNER" | "ADMIN" | "MANAGER" | "EMPLOYEE" | "PLACEHOLDER";

interface FormState {
  role: RoleType;
  billableRate: number | null;
  isBillableRateDefault: boolean;
}

const Members: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"all" | "invitations">("all");
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [membersCurrentPage, setMembersCurrentPage] = useState(1);
  const [membersPageSize] = useState(10);
  const [invitationsCurrentPage, setInvitationsCurrentPage] = useState(1);
  const [invitationsPageSize] = useState(10);
  const [memberSearchTerm, setMemberSearchTerm] = useState("");
  const [memberStatusFilter, setMemberStatusFilter] = useState<
    "all" | "active" | "inactive"
  >("all");
  const [invitationSearchTerm, setInvitationSearchTerm] = useState("");
  const [invitationStatusFilter, setInvitationStatusFilter] = useState<
    "all" | "PENDING" | "EXPIRED"
  >("all");
  const [membersLoaded, setMembersLoaded] = useState(false);
  const [invitationsLoaded, setInvitationsLoaded] = useState(false);

  const [modalState, setModalState] = useState<{
    type:
      | "update"
      | "deleteInvite"
      | "deactivate"
      | "resendInvite"
      | "reinvite"
      | "deleteMember"
      | "warning"
      | "confirmOwnershipTransfer"
      | null;
    data: Member | Invitation | null;
  }>({ type: null, data: null });
  const [formState, setFormState] = useState<FormState>({
    role: "EMPLOYEE",
    billableRate: 0,
    isBillableRateDefault: true,
  });

  console.log(formState);

  useEffect(() => {
    if (modalState.type === "update" && modalState.data) {
      const member = modalState.data as Member;
      setFormState({
        role: member.role,
        billableRate: member?.billableRate ? Number(member.billableRate) : null,
        isBillableRateDefault: member.billableRate == null,
      });
    }
  }, [modalState]);

  const {
    members,
    invitations,
    membersPagination,
    invitationsPagination,
    isLoadingMembers,
    isLoadingInvitations,
    isInviting,
    isResendingInvitation,
    isDeletingInvitation,
    isRemovingMember,
    isDeactivatingMember,
    isUpdatingMember,
    getMembers,
    getInvitations,
    inviteUser,
    updateMember,
    resendInvite,
    deleteInvite,
    deleteMember,
    deactiveMember,
    reactivateMember,
    reactiveMember,
    transferOwner,
    transferOwnership,
  } = useMember();

  const { canCallApi } = useOrgAccess();

  const [pendingUpdate, setPendingUpdate] = useState<{
    memberId: string;
    role: string;
    billableRate: number | null;
    memberName?: string;
  } | null>(null);

  const filteredMembers = useMemo(
    () =>
      members
        .filter((member) => {
          if (memberStatusFilter === "active" && !member.isActive) return false;
          if (memberStatusFilter === "inactive" && member.isActive)
            return false;
          return true;
        })
        .filter((member) => {
          const fullName = member.user?.name?.toLowerCase() || "";
          const email = member.user?.email?.toLowerCase() || "";
          return (
            fullName.includes(memberSearchTerm.toLowerCase()) ||
            email.includes(memberSearchTerm.toLowerCase())
          );
        }),
    [members, memberStatusFilter, memberSearchTerm]
  );

  const filteredInvitations = useMemo(
    () =>
      invitations
        .filter((invitation) => {
          if (
            invitationStatusFilter === "PENDING" &&
            invitation.status !== "PENDING"
          )
            return false;
          if (
            invitationStatusFilter === "EXPIRED" &&
            invitation.status !== "EXPIRED"
          )
            return false;
          return true;
        })
        .filter((invitation) =>
          invitation.email
            .toLowerCase()
            .includes(invitationSearchTerm.toLowerCase())
        ),
    [invitations, invitationStatusFilter, invitationSearchTerm]
  );

  const fetchMembers = useCallback(async () => {
    if (!user?.currentTeamId || !canCallApi("viewMembers")) return;
    await getMembers(user.currentTeamId, {
      page: membersCurrentPage,
      pageSize: membersPageSize,
    });
    setMembersLoaded(true);
  }, [user?.currentTeamId, membersCurrentPage, membersPageSize, getMembers]);

  const fetchInvitations = useCallback(async () => {
    if (!user?.currentTeamId || !canCallApi("viewInvite")) return;
    await getInvitations(user.currentTeamId, {
      page: invitationsCurrentPage,
      pageSize: invitationsPageSize,
    });

    setInvitationsLoaded(true);
  }, [
    user?.currentTeamId,
    invitationsCurrentPage,
    invitationsPageSize,
    getInvitations,
  ]);

  useEffect(() => {
    if (!user?.currentTeamId) return;

    if (activeTab === "all" && !membersLoaded) {
      fetchMembers();
    }
    if (activeTab === "invitations" && !invitationsLoaded) {
      fetchInvitations();
    }
  }, [
    user?.currentTeamId,
    activeTab,
    membersCurrentPage,
    invitationsCurrentPage,
    membersLoaded,
    invitationsLoaded,
  ]);

  useEffect(() => {
    if (user?.currentTeamId) {
      setMembersLoaded(false);
      setInvitationsLoaded(false);
    }
  }, [user?.currentTeamId]);

  useEffect(() => {
    if (user?.currentTeamId) {
      if (activeTab === "all") {
        setMembersLoaded(false);
      } else {
        setInvitationsLoaded(false);
      }
    }
  }, [membersCurrentPage, invitationsCurrentPage, user?.currentTeamId]);

  const refreshMembers = useCallback(async () => {
    if (!user?.currentTeamId) return;

    if (activeTab === "all" && canCallApi("viewMembers")) {
      const totalMembers = membersPagination?.total || 0;
      const currentPage = membersCurrentPage;
      const totalFetched = members.length;

      if (totalFetched === 0 || totalMembers > membersPageSize * currentPage) {
        await getMembers(user.currentTeamId, {
          page: currentPage,
          pageSize: membersPageSize,
        });
        setMembersLoaded(true);
      }
    } else if (activeTab === "invitations" && canCallApi("viewInvite")) {
      const totalInvites = invitationsPagination?.total || 0;
      const currentPage = invitationsCurrentPage;
      const totalFetched = invitations.length;

      if (
        totalFetched === 0 ||
        totalInvites > invitationsPageSize * currentPage
      ) {
        await getInvitations(user.currentTeamId, {
          page: currentPage,
          pageSize: invitationsPageSize,
        });
        setInvitationsLoaded(true);
      }
    }
  }, [
    user?.currentTeamId,
    activeTab,
    membersPagination?.total,
    invitationsPagination?.total,
    membersPageSize,
    invitationsPageSize,
    membersCurrentPage,
    invitationsCurrentPage,
    members.length,
    invitations.length,
    getMembers,
    getInvitations,
  ]);

  const handleFormChange = <K extends keyof FormState>(
    key: K,
    value: FormState[K]
  ) => {
    setFormState((prev) => ({ ...prev, [key]: value }));
  };

  const handleInviteMember = useCallback(
    async (email: string, role: string) => {
      if (!user?.currentTeamId) return;

      if (!email || !email.includes("@")) {
        toast.error("Please enter a valid email address.");
        return;
      }

      const validRoles = ["OWNER", "ADMIN", "MANAGER", "EMPLOYEE"];
      if (!validRoles.includes(role)) {
        toast.error("Please select a valid role.");
        return;
      }
      try {
        await inviteUser(user.currentTeamId, { email, role });
        setIsInviteModalOpen(false);
      } catch (error) {
        console.error("Failed to invite member:", error);
      }
    },
    [user?.currentTeamId, inviteUser]
  );

  const handleUpdateMember = useCallback(
    async (memberId: string, role: string, billableRate: number | null) => {
      if (!user?.currentTeamId) return;
      if (!role) {
        toast.error("Please select a valid role.");
        return;
      }

      if (billableRate !== null && (isNaN(billableRate) || billableRate < 0)) {
        toast.error("Billable rate must be a non-negative number.");
        return;
      }

      try {
        await updateMember(user.currentTeamId, memberId, {
          role,
          billableRate,
        });
        setModalState({ type: null, data: null });
        setPendingUpdate(null);
      } catch (error) {
        console.error("Failed to update member:", error);
      }
    },
    [user?.currentTeamId, updateMember]
  );

  const handleResendInvitation = useCallback(async () => {
    if (
      !user?.currentTeamId ||
      !modalState.data ||
      modalState.type !== "resendInvite"
    )
      return;
    try {
      await resendInvite(
        user.currentTeamId,
        (modalState.data as Invitation).id
      );
      setModalState({ type: null, data: null });
    } catch (error) {
      console.error("Failed to resend invitation:", error);
    }
  }, [user?.currentTeamId, modalState, resendInvite]);

  const handleDeleteInvitation = useCallback(async () => {
    if (
      !user?.currentTeamId ||
      !modalState.data ||
      modalState.type !== "deleteInvite"
    )
      return;
    try {
      await deleteInvite(
        user.currentTeamId,
        (modalState.data as Invitation).id
      );

      const isActiveTab = activeTab === "invitations";
      const currentPage = !isActiveTab
        ? membersCurrentPage
        : invitationsCurrentPage;
      const currnetData = !isActiveTab ? members : invitations;

      if (currnetData.length === 1 && currentPage > 1) {
        const newPage = Math.max(currentPage - 1, 1);
        if (isActiveTab) {
          setMembersCurrentPage(newPage);
        } else {
          setInvitationsCurrentPage(newPage);
        }
      }

      await refreshMembers();
      setModalState({ type: null, data: null });
    } catch (error) {
      console.error("Failed to delete invitation:", error);
    }
  }, [user?.currentTeamId, modalState, deleteInvite]);

  const handleDeactivateMember = useCallback(async () => {
    if (
      !user?.currentTeamId ||
      !modalState.data ||
      modalState.type !== "deactivate"
    )
      return;
    try {
      await deactiveMember(user.currentTeamId, (modalState.data as Member).id);
      setModalState({ type: null, data: null });
    } catch (error) {
      console.error("Failed to deactivate member:", error);
    }
  }, [user?.currentTeamId, modalState, deactiveMember]);

  const handleReactivateMember = useCallback(async () => {
    if (
      !user?.currentTeamId ||
      !modalState.data ||
      modalState.type !== "reinvite"
    )
      return;
    try {
      await reactiveMember(user.currentTeamId, (modalState.data as Member).id);
      setModalState({ type: null, data: null });
    } catch (error) {
      console.error("Failed to reactivate member:", error);
    }
  }, [user?.currentTeamId, modalState, reactivateMember]);

  const handleDeleteMember = useCallback(async () => {
    if (
      !user?.currentTeamId ||
      !modalState.data ||
      modalState.type !== "deleteMember"
    )
      return;
    try {
      await deleteMember(user.currentTeamId, (modalState.data as Member).id);

      const isActiveTab = activeTab === "all";
      const currentPage = isActiveTab
        ? membersCurrentPage
        : invitationsCurrentPage;
      const currnetData = isActiveTab ? members : invitations;

      if (currnetData.length === 1 && currentPage > 1) {
        const newPage = Math.max(currentPage - 1, 1);
        if (isActiveTab) {
          setMembersCurrentPage(newPage);
        } else {
          setInvitationsCurrentPage(newPage);
        }
      }
      await refreshMembers();
      setModalState({ type: null, data: null });
    } catch (error) {
      console.error("Failed to delete member:", error);
    }
  }, [user?.currentTeamId, modalState, deleteMember]);

  const handleTranserOwnership = useCallback(async () => {
    if (
      !user?.currentTeamId ||
      !modalState.data ||
      modalState.type !== "confirmOwnershipTransfer"
    )
      return;
    try {
      await transferOwnership(
        user.currentTeamId,
        (modalState.data as Member).userId
      );
      setModalState({ type: null, data: null });
    } catch (error) {
      console.error("Failed to delete member:", error);
    }
  }, [user?.currentTeamId, modalState, transferOwnership]);

  return (
    <div className="mx-auto max-w-6xl py-2 w-full space-y-4">
      <div className="flex flex-col gap-3 pb-1 pt-1">
        <div className="flex flex-col items-start px-5 md:flex-row md:items-center md:justify-between gap-2 w-full">
          <div className="flex items-center gap-2">
            <UsersIcon className="h-5 w-5 text-muted-foreground" />
            <h1 className="font-semibold">Members</h1>
          </div>
          {canCallApi("inviteMember") ? (
            <Button
              onClick={() => setIsInviteModalOpen(true)}
              variant="outline"
              className="w-full md:w-auto"
            >
              <UserPlus className="mr-2 h-4 w-4" />
              Invite Member
            </Button>
          ) : (
            <div className="w-9 h-9" />
          )}
        </div>
        <Separator />
      </div>

      <InviteMemberModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        onInvite={handleInviteMember}
        isInviting={isInviting}
      />

      {modalState.type === "update" && modalState.data && (
        <UpdateUser
          isOpen={true}
          onClose={() => setModalState({ type: null, data: null })}
          onSave={() => {
            const member = modalState.data as Member;
            const memberId = (modalState.data as Member).id;
            const billable = formState.isBillableRateDefault
              ? null
              : Number(formState.billableRate || 0);

            const isChangingToOwner =
              formState.role === "OWNER" && member.role !== "OWNER";
            const currentUserAsMember = members.find(
              (m) => m.user?.id === user?.id
            );
            const isCurrentUserOwner = currentUserAsMember?.role === "OWNER";

            if (isChangingToOwner && isCurrentUserOwner) {
              setPendingUpdate({
                memberId: member.id,
                role: formState.role,
                billableRate: billable,
                memberName: member.user?.name,
              });

              setModalState({
                type: "confirmOwnershipTransfer",
                data: member,
              });
              return;
            }

            if (formState.billableRate !== member.billableRate) {
              setPendingUpdate({
                memberId,
                role: formState.role,
                billableRate: billable,
              });

              setModalState({ type: null, data: null });

              setModalState({
                type: "warning",
                data: member,
              });
            } else {
              handleUpdateMember(memberId, formState.role, billable);
            }
          }}
          selectedMember={modalState.data as Member}
          formState={formState}
          handleChange={handleFormChange}
          loading={isUpdatingMember}
        />
      )}

      {/* delete invite */}
      <CustomAlertDialog
        open={modalState.type === "deleteInvite"}
        onOpenChange={() => setModalState({ type: null, data: null })}
        icon={<Trash2 className="h-6 w-6 text-red-500" />}
        title="Delete Invitation"
        description={
          <>
            Are you sure you want to delete the invitation for{" "}
            <span className="font-semibold text-foreground">
              {(modalState.data as Invitation)?.email}
            </span>
            ? This action cannot be undone.
          </>
        }
        isLoading={isDeletingInvitation}
        cancelText="Cancel"
        confirmText="Delete"
        onCancel={() => setModalState({ type: null, data: null })}
        onConfirm={handleDeleteInvitation}
      >
        <div className="bg-red-600/10 border border-red-600/20 rounded-md p-3">
          <p className="text-sm font-medium text-red-500 mb-2">
            This will permanently:
          </p>
          <ul className="text-sm text-red-600 space-y-1">
            <li>• Remove the invitation from the system</li>
            <li>• Prevent the user from joining with this invitation</li>
            <li>• Cannot be undone - you'll need to send a new invitation</li>
          </ul>
        </div>
      </CustomAlertDialog>

      {/* deactive member */}
      <GeneralModal
        open={modalState.type === "deactivate"}
        onOpenChange={() => setModalState({ type: null, data: null })}
        title={
          (modalState.data as Member)?.isActive
            ? "Deactivate Member"
            : "Activate Member"
        }
        description={
          (modalState.data as Member)?.isActive
            ? `Are you sure you want to deactivate ${
                (modalState.data as Member)?.user?.name ||
                (modalState.data as Member)?.user?.email
              }? They will lose access to the organization but their data will be preserved.`
            : `Are you sure you want to activate ${
                (modalState.data as Member)?.user?.name ||
                (modalState.data as Member)?.user?.email
              }? They will regain access to the organization.`
        }
        onConfirm={handleDeactivateMember}
        onCancel={() => setModalState({ type: null, data: null })}
        loading={isDeactivatingMember}
        confirmLabel={
          (modalState.data as Member)?.isActive ? "Deactivate" : "Activate"
        }
        cancelLabel="Cancel"
        triggerButtonLabel=""
        triggerButtonClassName="hidden"
      />

      {modalState.type === "confirmOwnershipTransfer" && pendingUpdate && (
        <GeneralModal
          open={modalState.type === "confirmOwnershipTransfer"}
          onOpenChange={() => setModalState({ type: null, data: null })}
          title="Transfer Ownership"
          description={
            <>
              Are you sure you want to transfer ownership to{" "}
              <span className="font-semibold text-foreground">
                {pendingUpdate.memberName || "this member"}
              </span>
              ?<br />
              You will lose owner permissions and this action cannot be undone.
            </>
          }
          onConfirm={async () => {
            await handleTranserOwnership();
            setPendingUpdate(null);
          }}
          onCancel={() => {
            setPendingUpdate(null);
            setModalState({ type: null, data: null });
          }}
          loading={transferOwner}
          confirmLabel="Transfer Ownership"
          cancelLabel="Cancel"
          triggerButtonLabel=""
          triggerButtonClassName="hidden"
        />
      )}

      {/* resendinvite */}
      <GeneralModal
        open={modalState.type === "resendInvite"}
        onOpenChange={() => setModalState({ type: null, data: null })}
        title="Resend Invitation"
        description={`Are you sure you want to resend the invitation to ${
          (modalState.data as Invitation)?.email || ""
        }? This will generate a new invitation link and extend the expiration date.`}
        onConfirm={handleResendInvitation}
        onCancel={() => setModalState({ type: null, data: null })}
        loading={isResendingInvitation}
        confirmLabel="Resend"
        cancelLabel="Cancel"
        triggerButtonLabel=""
        triggerButtonClassName="hidden"
      />

      {/* reinviteMember */}
      <GeneralModal
        open={modalState.type === "reinvite"}
        onOpenChange={() => setModalState({ type: null, data: null })}
        title="Reinvite Member"
        description={`This member is currently inactive. Do you want to resend an invitation to ${
          (modalState.data as Member)?.user?.email || "this member"
        } to rejoin the organization?`}
        onConfirm={handleReactivateMember}
        onCancel={() => setModalState({ type: null, data: null })}
        loading={reactivateMember}
        confirmLabel="Send Reinvite"
        cancelLabel="Cancel"
        triggerButtonLabel=""
        triggerButtonClassName="hidden"
      />

      {/* removing member */}
      <CustomAlertDialog
        open={modalState.type === "deleteMember"}
        onOpenChange={() => setModalState({ type: null, data: null })}
        icon={<AlertTriangle className="h-6 w-6 text-red-600" />}
        title="Remove Member"
        description={
          <>
            Are you sure you want to permanently remove{" "}
            <span className="font-semibold text-foreground">
              {(modalState.data as Member)?.user?.name ??
                (modalState.data as Member)?.user?.email}
            </span>{" "}
            from this organization? This action cannot be undone.
          </>
        }
        isLoading={isRemovingMember}
        cancelText="Cancel"
        confirmText="Remove Permanently"
        onCancel={() => setModalState({ type: null, data: null })}
        onConfirm={handleDeleteMember}
      >
        <div className="bg-red-600/10 border border-red-600/20 rounded-md p-3">
          <p className="text-sm font-medium text-red-700 mb-2">
            This action will:
          </p>
          <ul className="text-sm text-red-600 space-y-1">
            <li>• Remove all their access to the organization</li>
            <li>• Delete their time entries and project assignments</li>
            <li>• Remove them from all teams and projects</li>
            <li>• Permanently delete all their data</li>
          </ul>
        </div>
      </CustomAlertDialog>

      {pendingUpdate && (
        <UpdateRateModal
          isOpen={modalState.type === "warning" && !!pendingUpdate}
          onClose={() => setModalState({ type: null, data: null })}
          isLoading={isUpdatingMember}
          onSubmit={async () => {
            if (!pendingUpdate) return;
            await handleUpdateMember(
              pendingUpdate.memberId,
              pendingUpdate.role,
              pendingUpdate.billableRate
            );
          }}
          name={(modalState.data as Member)?.user?.name || "Member"}
          forthing="Member"
          rate={pendingUpdate?.billableRate || 0}
        />
      )}

      <Tabs
        value={activeTab}
        onValueChange={(tab) => setActiveTab(tab as "all" | "invitations")}
        className="space-y-4 px-5 pt-2"
      >
        <TabsList className="bg-muted/50">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="invitations">Invitations</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="relative flex-1 max-w-md w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                type="text"
                placeholder="Search members..."
                className="pl-10 bg-transparent border border-muted-foreground/30 focus:border-primary focus:ring-0"
                value={memberSearchTerm}
                onChange={(e) => setMemberSearchTerm(e.target.value)}
              />
            </div>
            <Select
              value={memberStatusFilter}
              onValueChange={(value) =>
                setMemberStatusFilter(value as "all" | "active" | "inactive")
              }
            >
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {canCallApi("viewMembers") && (
            <MemberTable
              members={filteredMembers}
              pagination={membersPagination}
              isLoading={isLoadingMembers}
              onPageChange={setMembersCurrentPage}
              onEdit={(member) =>
                setModalState({ type: "update", data: member })
              }
              onDeactivate={(member) =>
                setModalState({ type: "deactivate", data: member })
              }
              onReinvite={(member) =>
                setModalState({ type: "reinvite", data: member })
              }
              onRemove={(member) =>
                setModalState({ type: "deleteMember", data: member })
              }
              isUpdating={isUpdatingMember}
              isReactivating={reactivateMember}
            />
          )}
        </TabsContent>

        <TabsContent value="invitations" className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="relative flex-1 max-w-md w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                type="text"
                placeholder="Search invitations..."
                className="pl-10 bg-transparent border border-muted-foreground/30 focus:border-primary focus:ring-0"
                value={invitationSearchTerm}
                onChange={(e) => setInvitationSearchTerm(e.target.value)}
              />
            </div>
            <Select
              value={invitationStatusFilter}
              onValueChange={(value) =>
                setInvitationStatusFilter(
                  value as "all" | "PENDING" | "EXPIRED"
                )
              }
            >
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="EXPIRED">Expired</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {canCallApi("viewInvite") && (
            <InvitationTable
              invitations={filteredInvitations}
              pagination={invitationsPagination}
              isLoading={isLoadingInvitations}
              onPageChange={setInvitationsCurrentPage}
              onResend={(invitation: Invitation) =>
                setModalState({ type: "resendInvite", data: invitation })
              }
              onDelete={(invitation: Invitation) =>
                setModalState({ type: "deleteInvite", data: invitation })
              }
              isResending={isResendingInvitation}
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Members;
