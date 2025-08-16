import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Trash2, MoreVertical, Tag } from "lucide-react";
import type { Tag as TagProps } from "@/types/project";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "../ui/dropdown-menu";
import NoData from "../NoData";
import { Skeleton } from "@/components/ui/skeleton";
import { useOrgAccess } from "@/providers/OrgAccessProvider";

interface TagTableProps {
  tags: TagProps[];
  onDelete: (id: string) => void;
  deleteLoading?: boolean;
  loading?: boolean;
}

const TagTable: React.FC<TagTableProps> = ({
  tags,
  onDelete,
  deleteLoading,
  loading,
}) => {
  const { canCallApi } = useOrgAccess();
  return (
    <div className="rounded-md bg-muted/40 border border-muted">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="px-4 text-muted-foreground font-medium">
              Name
            </TableHead>
            <TableHead className="w-12" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            Array.from({ length: 4 }).map((_, index) => (
              <TableRow key={`skeleton-${index}`}>
                <TableCell>
                  <Skeleton className="h-5 w-40 rounded-md my-1" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-6 w-6 rounded-md ml-auto" />
                </TableCell>
              </TableRow>
            ))
          ) : tags.length === 0 ? (
            <TableRow>
              <TableCell colSpan={2}>
                <NoData
                  icon={Tag}
                  title="No Tags Found"
                  description="Tags will appear here when available."
                />
              </TableCell>
            </TableRow>
          ) : (
            tags.map((tag) => (
              <TableRow key={tag.id}>
                <TableCell className="font-medium px-4">{tag.name}</TableCell>
                <TableCell>
                  {canCallApi("editTag") ? (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          className="h-8 w-8 p-0"
                          onClick={(e) => e.stopPropagation()}
                          aria-label="More actions"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          className="text-red-500 hover:text-red-500 focus:text-red-500"
                          onClick={() => onDelete(tag.id)}
                          disabled={deleteLoading}
                        >
                          <Trash2 className="mr-2 h-4 w-4 text-red-500" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  ) : (
                    <div className="h-8 w-8"></div>
                  )}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default TagTable;
