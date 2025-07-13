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
import { Edit, Archive, Undo2, MoreVertical } from "lucide-react";
import type { Project } from "@/types/project";
import PaginationControls from "@/components/PaginationControl";
import NoData from "@/components/NoData";

interface ProjectTableProps {
  projects: Project[];
  pagination: any;
  isLoading: boolean;
  onPageChange: (page: number) => void;
  onEdit: (project: Project) => void;
  onArchive?: (project: Project) => void;
  onUnarchive?: (project: Project) => void;
  isEditLoading?: boolean;
  isArchiveLoading?: boolean;
  isUnarchiveLoading?: boolean;
  archived?: boolean;
}

const formatTime = (minutes: number) => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}:${m < 10 ? "0" : ""}${m}`;
};

const ProjectTable: React.FC<ProjectTableProps> = ({
  projects,
  pagination,
  isLoading,
  onPageChange,
  onEdit,
  onArchive,
  onUnarchive,
  isEditLoading,
  isArchiveLoading,
  isUnarchiveLoading,
  archived = false,
}) => {
  return (
    <>
      <div className="rounded-md bg-muted/40 border border-muted">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Total Time</TableHead>
              <TableHead>Progress</TableHead>
              <TableHead>Billable Rate</TableHead>
              <TableHead>Status</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7}>Loading...</TableCell>
              </TableRow>
            ) : projects.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7}>
                  <NoData message="No projects found." />
                </TableCell>
              </TableRow>
            ) : (
              projects.map((project) => {
                // Example calculations
                const totalMinutes = project.spentTime ?? 0;
                const estimatedMinutes = (project.estimatedTime ?? 0) * 60;
                const progressPercent = estimatedMinutes
                  ? Math.round((totalMinutes / estimatedMinutes) * 100)
                  : 0;
                return (
                  <TableRow key={project.id}>
                    {/* Name with color dot and task count */}
                    <TableCell>
                      <span
                        className="inline-block w-3 h-3 rounded-full mr-2 align-middle"
                        style={{ background: project.color || "#888" }}
                      />
                      <span className="font-semibold">{project.name}</span>
                      <span className="ml-2 text-xs text-muted-foreground">
                        {project.taskCount ? `${project.taskCount} Tasks` : ""}
                      </span>
                    </TableCell>
                    {/* Client */}
                    <TableCell>{project.client?.name || "--"}</TableCell>
                    {/* Total Time */}
                    <TableCell>
                      {totalMinutes > 0 ? formatTime(totalMinutes) : "--"}
                    </TableCell>
                    {/* Progress bar and percent */}
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <div className="w-32 h-2 bg-muted rounded overflow-hidden">
                          <div
                            className="h-2"
                            style={{
                              width: `${Math.min(progressPercent, 100)}%`,
                              background:
                                progressPercent > 100 ? "#e53e3e" : "#38a169",
                            }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {progressPercent}% of {project.estimatedTime ?? "--"}h
                        </span>
                      </div>
                    </TableCell>
                    {/* Billable Rate */}
                    <TableCell>
                      {project.billable
                        ? `${project.billableRate ?? 0},00 USD`
                        : "--"}
                    </TableCell>
                    {/* Status */}
                    <TableCell>
                      <span className="flex items-center gap-1">
                        <input
                          type="checkbox"
                          checked={!archived}
                          readOnly
                          className="accent-primary"
                        />
                        <span>{archived ? "Archived" : "Active"}</span>
                      </span>
                    </TableCell>
                    {/* Actions */}
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem
                            onClick={() => onEdit(project)}
                            disabled={isEditLoading}
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          {!archived && onArchive && (
                            <DropdownMenuItem
                              onClick={() => onArchive(project)}
                              disabled={isArchiveLoading}
                            >
                              <Archive className="mr-2 h-4 w-4" />
                              Archive
                            </DropdownMenuItem>
                          )}
                          {archived && onUnarchive && (
                            <DropdownMenuItem
                              onClick={() => onUnarchive(project)}
                              disabled={isUnarchiveLoading}
                            >
                              <Undo2 className="mr-2 h-4 w-4" />
                              Unarchive
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
      {!isLoading && pagination && (
        <PaginationControls
          currentPage={pagination.page}
          totalPages={pagination.totalPages}
          totalItems={pagination.total}
          itemType="projects"
          onPageChange={onPageChange}
        />
      )}
    </>
  );
};

export default ProjectTable;
