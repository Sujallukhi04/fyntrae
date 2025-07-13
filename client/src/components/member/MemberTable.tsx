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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Edit, RefreshCcw, Trash2, User, MoreVertical } from "lucide-react";
import type { Member } from "@/types/oraganization";

import NoData from "@/components/NoData";

import { MembersSkeleton } from "../modals/Skeleton";
import PaginationControls, { getStatusBadge } from "../PaginationControl";

interface MemberTableProps {
  members: Member[];
  pagination: any;
  isLoading: boolean;
  onPageChange: (page: number) => void;
  onEdit: (member: Member) => void;
  onDeactivate: (member: Member) => void;
  onReinvite: (member: Member) => void;
  onRemove: (member: Member) => void;
  isUpdating: boolean;
  isReactivating: boolean;
}

const MemberTable: React.FC<MemberTableProps> = ({
  members,
  pagination,
  isLoading,
  onPageChange,
  onEdit,
  onDeactivate,
  onReinvite,
  onRemove,
  isUpdating,
  isReactivating,
}) => {
  const getFormat = (role: string) =>
    role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();
  return (
    <>
      {isLoading ? (
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
              {members.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6}>
                    <NoData message="No members found." />
                  </TableCell>
                </TableRow>
              ) : (
                members.map((member) => (
                  <TableRow
                    key={member.id}
                    className="border-muted/50 hover:bg-muted/30 group"
                  >
                    <TableCell className="font-medium">
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-8 w-8">
                          {/* <AvatarImage src={member.user?.avatar} /> */}
                          <AvatarFallback className="bg-muted text-muted-foreground">
                            {member.user?.name?.charAt(0).toUpperCase() || "U"}
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
                    <TableCell>{getFormat(member.role)}</TableCell>
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
                            onClick={() => onEdit(member)}
                            disabled={isUpdating}
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => onDeactivate(member)}
                            disabled={isReactivating || !member.isActive}
                          >
                            <User className="mr-2 h-4 w-4" />
                            Deactivate
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => onReinvite(member)}
                            disabled={isReactivating || member.isActive}
                          >
                            <RefreshCcw className="mr-2 h-4 w-4" />
                            Send Invite
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => onRemove(member)}
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
      {!isLoading && pagination && (
        <PaginationControls
          currentPage={pagination.page}
          totalPages={pagination.totalPages}
          totalItems={pagination.total}
          itemType="members"
          onPageChange={onPageChange}
        />
      )}
    </>
  );
};

export default MemberTable;
