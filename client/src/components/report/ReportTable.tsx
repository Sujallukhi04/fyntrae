import React from "react";
import PaginationControls from "../PaginationControl";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Edit, Trash2, MoreVertical, Link, ExternalLink } from "lucide-react";
import NoData from "../NoData";
import { Badge } from "../ui/badge";
import { toast } from "sonner";

interface Report {
  id: string;
  name: string;
  description: string | null;
  isPublic: boolean;
  shareSecret: string | null;
  updatedAt: string;
}

interface ReportTableProps {
  reports: Report[];
  onEdit: (reportId: string) => void;
  onDelete: (reportId: string) => void;
  isLoading: boolean;
  pagination: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  } | null;
  onPageChange: (page: number) => void;
}

const ReportTable: React.FC<ReportTableProps> = ({
  reports,
  onEdit,
  onDelete,
  isLoading,
  pagination,
  onPageChange,
}) => {
  return (
    <>
      {isLoading ? (
        <div className="py-12">
          <p className="text-center text-muted-foreground">
            Loading reports...
          </p>
        </div>
      ) : (
        <div className="rounded-md bg-muted/40 border border-muted">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[25%] text-muted-foreground font-medium">
                  Name
                </TableHead>
                <TableHead className="w-[45%] text-muted-foreground font-medium">
                  Description
                </TableHead>
                <TableHead className="w-[15%] text-muted-foreground font-medium">
                  Visibility
                </TableHead>
                <TableHead className="w-[15%] text-muted-foreground font-medium">
                  Public URL
                </TableHead>
                <TableHead className="w-[10%] text-muted-foreground font-medium"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reports.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5}>
                    <NoData
                      icon={Link}
                      title="No reports found"
                      description="Create a report to see it listed here."
                    />
                  </TableCell>
                </TableRow>
              ) : (
                reports.map((report) => (
                  <TableRow key={report.id}>
                    <TableCell>
                      <span className="font-medium text-sm text-foreground truncate block max-w-[200px]">
                        {report.name}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground truncate block max-w-[280px]">
                        {report.description || "No description"}
                      </span>
                    </TableCell>

                    <TableCell>
                      <Badge
                        variant="outline"
                        className="text-xs text-muted-foreground"
                      >
                        {report.isPublic ? "Public" : "Private"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {report.isPublic && report.shareSecret ? (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 px-2 inline-flex items-center gap-1 text-xs "
                          onClick={() => {
                            const url = `${window.location.origin}/public/${report.shareSecret}`;
                            navigator.clipboard.writeText(url);
                            toast.success("Link copied to clipboard");
                          }}
                        >
                          <ExternalLink className="w-4 h-4" />
                          Copy Link
                        </Button>
                      ) : (
                        <span className="text-sm text-muted-foreground">
                          Not available
                        </span>
                      )}
                    </TableCell>
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
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onEdit(report.id)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-red-500 hover:text-red-500 focus:text-red-500"
                            onClick={() => onDelete(report.id)}
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
      )}
      {!isLoading && pagination && (
        <PaginationControls
          currentPage={pagination.page}
          totalPages={pagination.totalPages}
          totalItems={pagination.total}
          itemType="reports"
          onPageChange={onPageChange}
        />
      )}
    </>
  );
};

export default ReportTable;
