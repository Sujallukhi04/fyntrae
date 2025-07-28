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
import { Trash2, MoreVertical } from "lucide-react";
import type { Tag } from "@/types/project";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "../ui/dropdown-menu";

interface TagTableProps {
  tags: Tag[];
  onDelete: (id: string) => void;
  deleteLoading?: boolean;
}

const TagTable: React.FC<TagTableProps> = ({
  tags,
  onDelete,
  deleteLoading,
}) => {
  return (
    <div className="rounded-md bg-muted/40 border border-muted">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-muted-foreground font-medium">
              Name
            </TableHead>
            <TableHead className="w-12" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {tags.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={2}
                className="text-center text-muted-foreground"
              >
                No tags found
              </TableCell>
            </TableRow>
          ) : (
            tags.map((tag) => (
              <TableRow key={tag.id}>
                <TableCell className="font-medium">{tag.name}</TableCell>
                <TableCell>
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
