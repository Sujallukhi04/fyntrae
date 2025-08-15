import { Button } from "@/components/ui/button";
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Edit,
  MoreVertical,
  Plus,
  Trash2,
  Users,
  UsersIcon,
} from "lucide-react";
import NoData from "@/components/NoData";
import type { ProjectMember } from "@/types/project";
import { ProjectMembersSkeleton } from "../modals/Skeleton";
import { formatNumber, getFormat } from "@/lib/utils";
import { useOrganization } from "@/providers/OrganizationProvider";

interface ProjectMembersTableProps {
  projectMembers: ProjectMember[];
  isLoading?: boolean;
  onAddMember: () => void;
  onEditMember: (member: ProjectMember) => void;
  onRemoveMember: (memberId: string) => void;
  updateMemberLoading?: boolean;
  removeMemberLoading?: boolean;
}

const ProjectMembersTable: React.FC<ProjectMembersTableProps> = ({
  projectMembers,
  isLoading = false,
  onAddMember,
  onEditMember,
  onRemoveMember,
  updateMemberLoading = false,
  removeMemberLoading = false,
}) => {
  const { organization } = useOrganization();
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <UsersIcon className="h-6 w-6 text-muted-foreground" />
          Project Members
        </h2>
        <Button
          variant="outline"
          className="flex items-center"
          onClick={onAddMember}
        >
          <Plus className="mr-1 h-4 w-4" />
          Add Member
        </Button>
      </div>

      {isLoading ? (
        <ProjectMembersSkeleton />
      ) : (
        <div className="rounded-md border bg-card">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-muted/50">
                <TableHead className="w-[30%]">Name</TableHead>
                <TableHead className="w-[30%]">Billable Rate</TableHead>
                <TableHead className="w-[30%]">Role</TableHead>
                <TableHead className="w-[10%]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {projectMembers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4}>
                    <NoData
                      icon={Users}
                      title="No members added"
                      description="Invite your team to start collaborating on this project."
                    />
                  </TableCell>
                </TableRow>
              ) : (
                projectMembers.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarFallback>
                            {member.user.name?.charAt(0) || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <span className="truncate max-w-[100px]">
                          {member.user.name}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {member.billableRate !== null
                        ? formatNumber(
                            member.billableRate ?? 0,
                            organization?.numberFormat || "1 000.00",
                            organization?.currency || "USD"
                          )
                        : "--"}
                    </TableCell>
                    <TableCell>{getFormat(member?.member.role)}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            className="h-8 w-8 p-0"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem
                            onClick={() => onEditMember(member)}
                            disabled={updateMemberLoading}
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => onRemoveMember(member.memberId)}
                            disabled={removeMemberLoading}
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
    </div>
  );
};

export default ProjectMembersTable;
