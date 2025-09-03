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
import {
  Edit,
  Archive,
  Undo2,
  MoreVertical,
  FolderOpen,
  Trash2,
} from "lucide-react";
import type { Project } from "@/types/project";
import PaginationControls, {
  getStatusBadge,
} from "@/components/PaginationControl";
import NoData from "@/components/NoData";
import { ProjectsSkeleton } from "../modals/Skeleton";
import { useOrganization } from "@/providers/OrganizationProvider";
import {
  formatNumber,
  formatTimeDuration,
} from "@/lib/utils";
import { useNavigate } from "react-router";
import { useOrgAccess } from "@/providers/OrgAccessProvider";

interface ProjectTableProps {
  projects: Project[];
  pagination: any;
  isLoading: boolean;
  onPageChange: (page: number) => void;
  onEdit: (project: Project) => void;
  onArchive?: (project: Project) => void;
  onUnarchive?: (project: Project) => void;
  onDelete: (projectId: string) => void;
  isDeleteLoading?: boolean;
  isEditLoading?: boolean;
  isArchiveLoading?: boolean;
  isUnarchiveLoading?: boolean;
  archived?: boolean;
}

const ProjectTable: React.FC<ProjectTableProps> = ({
  projects,
  pagination,
  isLoading,
  onPageChange,
  onEdit,
  onArchive,
  onUnarchive,
  onDelete,
  isDeleteLoading,
  isEditLoading,
  isArchiveLoading,
  isUnarchiveLoading,
  archived = false,
}) => {
  const { organization } = useOrganization();
  const navigate = useNavigate();
  const { canCallApi } = useOrgAccess();
  return (
    <>
      {isLoading ? (
        <ProjectsSkeleton />
      ) : (
        <div className="rounded-md bg-muted/40 border border-muted">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[25%] text-muted-foreground font-medium">
                  Name
                </TableHead>
                <TableHead className="w-[10%] text-muted-foreground font-medium">
                  Client
                </TableHead>
                <TableHead className="w-[10%] text-muted-foreground font-medium">
                  Total Time
                </TableHead>
                <TableHead className="w-[15%] text-muted-foreground font-medium">
                  Progress
                </TableHead>
                <TableHead className="w-[10%] text-muted-foreground font-medium">
                  Billable Rate
                </TableHead>
                <TableHead className="w-[10%] text-muted-foreground font-medium">
                  Status
                </TableHead>
                <TableHead className="w-[5%] text-muted-foreground font-medium" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {projects.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7}>
                    <NoData
                      icon={FolderOpen}
                      title="No projects found"
                      description="Start by creating a new project to organize your work."
                    />
                  </TableCell>
                </TableRow>
              ) : (
                projects.map((project) => {
                  // Example calculations
                  const estimatedMinutes = (project.estimatedTime ?? 0) * 3600;
                  const progressPercent = estimatedMinutes
                    ? Math.round((project.spentTime / estimatedMinutes) * 100)
                    : 0;
                  return (
                    <TableRow
                      key={project.id}
                      onClick={(e) => {
                        // Only navigate if not clicking dropdown or its children
                        if (
                          !(e.target as HTMLElement).closest(
                            ".dropdown-trigger"
                          )
                        ) {
                          navigate(`/project/${project.id}`);
                        }
                      }}
                      className="cursor-pointer hover:bg-muted/50 "
                    >
                      {/* Name with color dot and task count */}
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {/* Color Dot with Light Outer Circle */}
                          <div className="relative w-5 h-5">
                            <span
                              className="absolute inset-0 rounded-full"
                              style={{
                                backgroundColor: `${project.color}20`,
                              }}
                            />
                            <span
                              className="absolute top-1/4 left-1/4 w-1/2 h-1/2 rounded-full"
                              style={{
                                backgroundColor: project.color || "#888",
                              }}
                            />
                          </div>

                          {/* Name and Optional Subtext */}
                          <div className="flex flex-col">
                            <span className="font-medium max-w-[150px] truncate text-sm text-foreground">
                              {project.name}
                            </span>
                          </div>
                        </div>
                      </TableCell>

                      {/* Client */}
                      <TableCell className="max-w-[50px] truncate font-medium">
                        {project?.client?.name || "--"}
                      </TableCell>
                      {/* Total Time */}
                      <TableCell>
                        {project.spentTime > 0
                          ? formatTimeDuration(
                              project.spentTime,
                              organization?.intervalFormat || "12h"
                            )
                          : "--"}
                      </TableCell>
                      {/* Progress bar and percent */}
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          {project.estimatedTime ? (
                            <>
                              <div className="w-28 h-1 bg-muted rounded overflow-hidden">
                                <div
                                  className="h-1"
                                  style={{
                                    width: `${Math.min(progressPercent, 100)}%`,
                                    background:
                                      progressPercent > 100
                                        ? "#e53e3e"
                                        : "#3B82F6",
                                  }}
                                />
                              </div>
                              <span className="text-xs text-muted-foreground">
                                {progressPercent}% of {project.estimatedTime}h
                              </span>
                            </>
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              --
                            </span>
                          )}
                        </div>
                      </TableCell>
                      {/* Billable Rate */}
                      <TableCell>
                        {project.billable && project.billableRate !== null
                          ? formatNumber(
                              project.billableRate ?? 0,
                              organization?.numberFormat || "1,000.00",
                              organization?.currency || "USD"
                            )
                          : "--"}
                      </TableCell>
                      {/* Status */}

                      <TableCell>{getStatusBadge("Active")}</TableCell>

                      {/* Actions */}
                      <TableCell>
                        {canCallApi("editProject") ? (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                className="h-8 w-8 p-0"
                                disabled={!canCallApi("editProject")}
                                onClick={(e) => e.stopPropagation()} // Prevent row click
                              >
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation(); // Prevent row click
                                  onEdit(project);
                                }}
                                disabled={isEditLoading}
                              >
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              {!archived && onArchive && (
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation(); // Prevent row click
                                    onArchive(project);
                                  }}
                                  disabled={isArchiveLoading}
                                >
                                  <Archive className="mr-2 h-4 w-4" />
                                  Archive
                                </DropdownMenuItem>
                              )}
                              {archived && onUnarchive && (
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onUnarchive(project);
                                  }}
                                  disabled={isUnarchiveLoading}
                                >
                                  <Undo2 className="mr-2 h-4 w-4" />
                                  Unarchive
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onDelete(project?.id);
                                }}
                                className="text-red-500 hover:text-red-500 focus:text-red-500"
                                disabled={isDeleteLoading}
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
                  );
                })
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
          itemType="projects"
          onPageChange={onPageChange}
        />
      )}
    </>
  );
};

export default ProjectTable;
