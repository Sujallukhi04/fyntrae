import React from "react";
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
import { Button } from "@/components/ui/button";
import { RefreshCcw, Trash2, MoreVertical, Users } from "lucide-react";
import type { Invitation } from "@/types/oraganization";
import PaginationControls, {
  getStatusBadge,
} from "@/components/PaginationControl";
import { InvitationsSkeleton } from "@/components/modals/Skeleton";
import NoData from "@/components/NoData";
import { useOrgAccess } from "@/providers/OrgAccessProvider";

interface InvitationTableProps {
  invitations: Invitation[];
  pagination: any;
  isLoading: boolean;
  onPageChange: (page: number) => void;
  onResend: (invitation: Invitation) => void;
  onDelete: (invitation: Invitation) => void;
  isResending: boolean;
}

const InvitationTable: React.FC<InvitationTableProps> = ({
  invitations,
  pagination,
  isLoading,
  onPageChange,
  onResend,
  onDelete,
  isResending,
}) => {
  const getFormat = (role: string) =>
    role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();
  const canResendInvitation = (invitation: Invitation) =>
    invitation.status === "PENDING" || invitation.status === "EXPIRED";

  const { canCallApi } = useOrgAccess();

  return (
    <>
      {isLoading ? (
        <InvitationsSkeleton />
      ) : (
        <div className="rounded-md bg-muted/40 border border-muted">
          <Table>
            <TableHeader>
              <TableRow className="border-muted/50 hover:bg-muted/30">
                <TableHead className="text-muted-foreground font-medium w-[30%] min-w-[120px]">
                  Email
                </TableHead>
                <TableHead className="text-muted-foreground font-medium w-[20%] min-w-[80px]">
                  Role
                </TableHead>
                <TableHead className="text-muted-foreground font-medium w-[20%] min-w-[80px]">
                  Status
                </TableHead>
                <TableHead className="text-muted-foreground font-medium w-[20%] min-w-[80px]">
                  Expires
                </TableHead>
                <TableHead className="w-[5%] min-w-[50px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {invitations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5}>
                    <NoData
                      icon={Users}
                      title="No invitations found"
                      description="You haven’t invited anyone yet. Send an invitation to add members to your team."
                    />
                  </TableCell>
                </TableRow>
              ) : (
                invitations.map((invitation) => (
                  <TableRow
                    key={invitation.id}
                    className="border-muted/50 hover:bg-muted/30 group"
                  >
                    <TableCell className="font-medium text-foreground">
                      {invitation.email}
                    </TableCell>
                    <TableCell>{getFormat(invitation.role)}</TableCell>
                    <TableCell>{getStatusBadge(invitation.status)}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(invitation.expiresAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {canCallApi("deleteInvite") ? (
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
                              onClick={() => onResend(invitation)}
                              disabled={
                                !canResendInvitation(invitation) || isResending
                              }
                            >
                              <RefreshCcw className="size-4 mr-2" />
                              {isResending ? "Resending..." : "Resend"}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => onDelete(invitation)}
                              className="text-red-500 hover:text-red-500 focus:text-red-500"
                            >
                              <Trash2 className="mr-2 size-4 text-red-500" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      ) : (
                        <div className="h-8 w-8" />
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}
      {!isLoading && pagination && (
        <PaginationControls
          currentPage={pagination.page}
          totalPages={pagination.totalPages}
          totalItems={pagination.total}
          itemType="invitations"
          onPageChange={onPageChange}
        />
      )}
    </>
  );
};

export default InvitationTable;
