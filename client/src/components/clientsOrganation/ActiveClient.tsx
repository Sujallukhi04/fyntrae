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
import { Edit, MoreVertical, Users, Archive, Trash2 } from "lucide-react";
import type { Client } from "@/types/oraganization";

import { ClientsSkeleton } from "@/components/modals/Skeleton";
import NoData from "@/components/NoData";
import PaginationControls, { getStatusBadge } from "../PaginationControl";
import { Avatar, AvatarFallback } from "../ui/avatar";

interface ActiveClientTableProps {
  clients: Client[];
  pagination: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  } | null;
  isLoading: boolean;
  isEditLoading?: boolean;
  isArchiveLoading?: boolean;
  onPageChange: (page: number) => void;
  onEdit?: (client: Client) => void;
  onArchive?: (clientId: string) => void;
  onDelete?: (clientId: string) => void;
  deleteLoading?: boolean;
}

const ActiveClient: React.FC<ActiveClientTableProps> = ({
  clients,
  pagination,
  isLoading,
  isEditLoading,
  isArchiveLoading,
  onPageChange,
  onEdit,
  onArchive,
  onDelete,
  deleteLoading,
}) => {
  return (
    <>
      {isLoading ? (
        <ClientsSkeleton />
      ) : (
        <div className="rounded-md bg-muted/40 border border-muted">
          <Table>
            <TableHeader>
              <TableRow className="border-muted/50 hover:bg-muted/30">
                <TableHead className="text-muted-foreground font-medium w-[50%] min-w-[120px]">
                  Name
                </TableHead>
                <TableHead className="text-muted-foreground font-medium w-[20%] min-w-[80px]">
                  Projects
                </TableHead>
                <TableHead className="text-muted-foreground font-medium w-[25%] min-w-[80px]">
                  Status
                </TableHead>
                <TableHead className="w-[10%] min-w-[50px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {clients.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7}>
                    <NoData
                      icon={Users}
                      title="No clients found"
                      description="Add a client to start tracking their projects and billing."
                    />
                  </TableCell>
                </TableRow>
              ) : (
                clients.map((client) => (
                  <TableRow
                    key={client.id}
                    className="border-muted/50 hover:bg-muted/30 group"
                  >
                    <TableCell className="font-medium">
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-8 w-8">
                          {/* <AvatarImage src={member.user?.avatar} /> */}
                          <AvatarFallback className="bg-muted text-muted-foreground">
                            {client?.name?.charAt(0).toUpperCase() || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-foreground">{client.name}</span>
                      </div>
                    </TableCell>

                    <TableCell className="text-semibold">
                      {client.projectCount || 0} projects
                    </TableCell>
                    <TableCell>{getStatusBadge("Active")}</TableCell>

                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-popover">
                          <DropdownMenuItem
                            onClick={() => onEdit?.(client)}
                            disabled={isEditLoading}
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => onArchive?.(client.id)}
                            disabled={isArchiveLoading}
                          >
                            <Archive className="mr-2 h-4 w-4" />
                            Archive
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => onDelete?.(client.id)}
                            disabled={deleteLoading}
                            className="text-red-500 hover:text-red-500 focus:text-red-500"
                          >
                            <Trash2 className="mr-2 text-red-500 h-4 w-4" />
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
      {!isLoading && pagination && (
        <PaginationControls
          currentPage={pagination.page}
          totalPages={pagination.totalPages}
          totalItems={pagination.total}
          itemType="clients"
          onPageChange={onPageChange}
        />
      )}
    </>
  );
};

export default ActiveClient;
