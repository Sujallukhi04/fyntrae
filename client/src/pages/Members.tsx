import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Users,
  Plus,
  Clock,
  XCircle,
  MoreVertical,
  Ban,
  Edit,
  User,
  Trash2,
  RefreshCcw,
  CircleCheck,
  UserPlus,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import useMember from "@/hooks/useMember";
import { useAuth } from "@/providers/AuthProvider";
import type { Member, Invitation } from "@/types/oraganization";
import {
  InvitationsSkeleton,
  MembersSkeleton,
} from "@/components/modals/Skeleton";
import NoData from "@/components/NoData";
import {
  DeactivateMemberModal,
  DeleteInviteModal,
  DeleteMemberModal,
  getStatusBadge,
  InviteMemberModal,
  PaginationControls,
  ReinviteMemberModal,
  ResendInviteModal,
} from "@/components/modals/MmeberModals";
import UpdateUser from "@/components/modals/UpdateUser";

type RoleType = "OWNER" | "ADMIN" | "MANAGER" | "EMPLOYEE" | "PLACEHOLDER";

interface FormState {
  role: RoleType;
  billableRate: string;
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
  const [modalState, setModalState] = useState<{
    type:
      | "update"
      | "deleteInvite"
      | "deactivate"
      | "resendInvite"
      | "reinvite"
      | "deleteMember"
      | null;
    data: Member | Invitation | null;
  }>({ type: null, data: null });
  const [formState, setFormState] = useState<FormState>({
    role: "EMPLOYEE",
    billableRate: "",
    isBillableRateDefault: true,
  });

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
  } = useMember();

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
    if (!user?.currentTeamId) return;
    await getMembers(user.currentTeamId, {
      page: membersCurrentPage,
      pageSize: membersPageSize,
    });
  }, [user?.currentTeamId, membersCurrentPage, membersPageSize, getMembers]);

  const fetchInvitations = useCallback(async () => {
    if (!user?.currentTeamId) return;
    await getInvitations(user.currentTeamId, {
      page: invitationsCurrentPage,
      pageSize: invitationsPageSize,
    });
  }, [
    user?.currentTeamId,
    invitationsCurrentPage,
    invitationsPageSize,
    getInvitations,
  ]);

  useEffect(() => {
    if (user?.currentTeamId) {
      fetchMembers();
      fetchInvitations();
    }
  }, [user?.currentTeamId, fetchMembers, fetchInvitations]);

  const handleFormChange = <K extends keyof FormState>(
    key: K,
    value: FormState[K]
  ) => {
    setFormState((prev) => ({ ...prev, [key]: value }));
  };

  const handleInviteMember = useCallback(
    async (email: string, role: string) => {
      if (!user?.currentTeamId) return;
      try {
        await inviteUser(user.currentTeamId, { email, role });
        setIsInviteModalOpen(false);
      } catch (error) {
        console.error("Failed to invite member:", error);
      }
    },
    [user?.currentTeamId, inviteUser]
  );

  console.log(modalState);

  const handleUpdateMember = useCallback(
    async (memberId: string, role: string, billableRate: number) => {
      if (!user?.currentTeamId) return;
      try {
        await updateMember(user.currentTeamId, memberId, {
          role,
          billableRate,
        });
        setModalState({ type: null, data: null });
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
      setModalState({ type: null, data: null });
    } catch (error) {
      console.error("Failed to delete member:", error);
    }
  }, [user?.currentTeamId, modalState, deleteMember]);

  const canResendInvitation = (invitation: Invitation) =>
    invitation.status === "PENDING" || invitation.status === "EXPIRED";

  return (
    <div className="mx-auto max-w-6xl p-2 w-full space-y-4">
      <div className="flex flex-col gap-3 pb-3 pt-2">
        <div className="flex flex-col items-start md:flex-row md:items-center md:justify-between gap-2 w-full">
          <div>
            <h1 className="text-xl font-semibold">Members</h1>
            <div className="text-sm text-muted-foreground">
              Manage your team members and their permissions
            </div>
          </div>
          <Button
            onClick={() => setIsInviteModalOpen(true)}
            className="w-full md:w-auto"
          >
            <UserPlus className="mr-2 h-4 w-4" />
            Invite Member
          </Button>
        </div>
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
            const memberId = (modalState.data as Member).id;
            const billable = formState.isBillableRateDefault
              ? null
              : Number(formState.billableRate || 0);
            handleUpdateMember(memberId, formState.role, billable ?? 0);
          }}
          selectedMember={modalState.data as Member}
          formState={formState}
          handleChange={handleFormChange}
          loading={isUpdatingMember}
        />
      )}

      <DeleteInviteModal
        isOpen={modalState.type === "deleteInvite"}
        onClose={() => setModalState({ type: null, data: null })}
        onConfirm={handleDeleteInvitation}
        isLoading={isDeletingInvitation}
        email={(modalState.data as Invitation)?.email || ""}
      />

      <DeactivateMemberModal
        isOpen={modalState.type === "deactivate"}
        onClose={() => setModalState({ type: null, data: null })}
        onConfirm={handleDeactivateMember}
        isLoading={isDeactivatingMember}
        member={modalState.data as Member}
      />

      <ResendInviteModal
        isOpen={modalState.type === "resendInvite"}
        onClose={() => setModalState({ type: null, data: null })}
        onConfirm={handleResendInvitation}
        isLoading={isResendingInvitation}
        email={(modalState.data as Invitation)?.email || ""}
      />

      <ReinviteMemberModal
        isOpen={modalState.type === "reinvite"}
        onClose={() => setModalState({ type: null, data: null })}
        onConfirm={handleReactivateMember}
        isLoading={reactivateMember}
        email={(modalState.data as Member)?.user?.email || ""}
      />

      <DeleteMemberModal
        isOpen={modalState.type === "deleteMember"}
        onClose={() => setModalState({ type: null, data: null })}
        onConfirm={handleDeleteMember}
        isLoading={isRemovingMember}
        member={modalState.data as Member}
      />

      <Tabs
        value={activeTab}
        onValueChange={(tab) => setActiveTab(tab as "all" | "invitations")}
        className="space-y-4"
      >
        <TabsList className="bg-muted/50">
          <TabsTrigger value="all">
            All ({membersPagination?.total || 0})
          </TabsTrigger>
          <TabsTrigger value="invitations">
            Invitations ({invitationsPagination?.total || 0})
          </TabsTrigger>
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
          {isLoadingMembers ? (
            <MembersSkeleton />
          ) : (
            <div className="rounded-md bg-muted/40 border border-muted">
              <Table>
                <TableHeader>
                  <TableRow className="border-muted/50 hover:bg-muted/30">
                    <TableHead className="text-muted-foreground font-medium">
                      Name
                    </TableHead>
                    <TableHead className="text-muted-foreground font-medium">
                      Email
                    </TableHead>
                    <TableHead className="text-muted-foreground font-medium">
                      Role
                    </TableHead>
                    <TableHead className="text-muted-foreground font-medium">
                      Billable Rate
                    </TableHead>
                    <TableHead className="text-muted-foreground font-medium">
                      Status
                    </TableHead>
                    <TableHead className="w-[50px]" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMembers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6}>
                        <NoData message="No members found." />
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredMembers.map((member) => (
                      <TableRow
                        key={member.id}
                        className="border-muted/50 hover:bg-muted/30 group"
                      >
                        <TableCell className="font-medium">
                          <div className="flex items-center space-x-3">
                            <Avatar className="h-8 w-8">
                              {/* <AvatarImage src={member.user?.avatar} /> */}
                              <AvatarFallback className="bg-muted text-muted-foreground">
                                {member.user?.name?.charAt(0).toUpperCase() ||
                                  "U"}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-foreground">
                              {member.user?.name}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {member.user?.email}
                        </TableCell>
                        <TableCell>
                          {member.role.charAt(0).toUpperCase() +
                            member.role.slice(1).toLowerCase()}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {member.billableRate
                            ? `$${member.billableRate}.00`
                            : "--"}
                        </TableCell>
                        <TableCell>{getStatusBadge(member.isActive)}</TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="bg-popover">
                              <DropdownMenuItem
                                onClick={() => {
                                  setFormState({
                                    role: member.role,
                                    billableRate:
                                      member.billableRate?.toString() || "",
                                    isBillableRateDefault: !member.billableRate,
                                  });
                                  setModalState({
                                    type: "update",
                                    data: member,
                                  });
                                }}
                              >
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() =>
                                  setModalState({
                                    type: "deactivate",
                                    data: member,
                                  })
                                }
                                disabled={!reactivateMember || !member.isActive}
                              >
                                <User className="mr-2 h-4 w-4" />
                                Deactivate
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() =>
                                  setModalState({
                                    type: "reinvite",
                                    data: member,
                                  })
                                }
                                disabled={reactivateMember || member.isActive}
                              >
                                <RefreshCcw className="mr-2 h-4 w-4" />
                                Send Invite
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() =>
                                  setModalState({
                                    type: "deleteMember",
                                    data: member,
                                  })
                                }
                                className="text-red-500 hover:text-red-500 focus:text-red-500"
                              >
                                <Trash2 className="mr-2 h-4 w-4 text-red-500" />
                                Remove
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
          {!isLoadingMembers && membersPagination && (
            <PaginationControls
              currentPage={membersPagination.page}
              totalPages={membersPagination.totalPages}
              totalItems={membersPagination.total}
              itemType="members"
              onPageChange={setMembersCurrentPage}
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
          {isLoadingInvitations ? (
            <InvitationsSkeleton />
          ) : (
            <div className="rounded-md bg-muted/40 border border-muted">
              <Table>
                <TableHeader>
                  <TableRow className="border-muted/50 hover:bg-muted/30">
                    <TableHead className="text-muted-foreground font-medium">
                      Email
                    </TableHead>
                    <TableHead className="text-muted-foreground font-medium">
                      Role
                    </TableHead>
                    <TableHead className="text-muted-foreground font-medium">
                      Status
                    </TableHead>
                    <TableHead className="text-muted-foreground font-medium">
                      Expires
                    </TableHead>
                    <TableHead className="w-[50px]" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInvitations.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5}>
                        <NoData message="No invitations found" />
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredInvitations.map((invitation) => (
                      <TableRow
                        key={invitation.id}
                        className="border-muted/50 hover:bg-muted/30 group"
                      >
                        <TableCell className="font-medium text-foreground">
                          {invitation.email}
                        </TableCell>
                        <TableCell>
                          {invitation.role.charAt(0).toUpperCase() +
                            invitation.role.slice(1).toLowerCase()}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(invitation.status)}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {new Date(invitation.expiresAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                              align="end"
                              className="bg-popover"
                            >
                              <DropdownMenuItem
                                onClick={() =>
                                  setModalState({
                                    type: "resendInvite",
                                    data: invitation,
                                  })
                                }
                                disabled={!canResendInvitation(invitation)}
                              >
                                <RefreshCcw className="size-4 mr-2" />
                                {isResendingInvitation
                                  ? "Resending..."
                                  : "Resend"}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() =>
                                  setModalState({
                                    type: "deleteInvite",
                                    data: invitation,
                                  })
                                }
                                className="text-red-500 hover:text-red-500 focus:text-red-500"
                              >
                                <Trash2 className="mr-2 size-4 text-red-500" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
          {!isLoadingInvitations && invitationsPagination && (
            <PaginationControls
              currentPage={invitationsPagination.page}
              totalPages={invitationsPagination.totalPages}
              totalItems={invitationsPagination.total}
              itemType="invitations"
              onPageChange={setInvitationsCurrentPage}
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Members;
