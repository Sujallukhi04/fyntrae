import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Edit, Trash2, MoreVertical, ChevronRight, Clock } from "lucide-react";
import NoData from "@/components/NoData";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import type {
  OrganizationMember,
  ProjectWithTasks,
  Tag,
  TimeEntry,
} from "@/types/project";
import { Checkbox } from "../ui/checkbox";
import { useOrganization } from "@/providers/OrganizationProvider";
import PaginationControls from "../PaginationControl";
import { TimeEntriesTableSkeleton } from "../modals/Skeleton";

interface TimeEntriesTableProps {
  timeEntries: TimeEntry[];
  projectsWithTasks: ProjectWithTasks[];
  tags?: Tag[];
  selectedEntries: string[];
  onSelectEntry: (id: string) => void;
  onSelectAll: () => void;
  onEdit: (entry: TimeEntry) => void;
  onDelete: (id: string) => void;
  isLoading: boolean;
  deleteLoading: boolean;
  members?: OrganizationMember[];
  pagination: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  } | null;
  onPageChange: (page: number) => void;
  getCurrencyIcon: (
    currency: string | undefined,
    className?: string
  ) => React.ReactNode;
  runningTimer: boolean;
  showMember?: boolean;
}

const formatEntryDuration = (seconds: number) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${hours}h ${minutes}m`;
};

const TimeEntriesTable: React.FC<TimeEntriesTableProps> = ({
  timeEntries,
  projectsWithTasks,
  selectedEntries,
  onSelectEntry,
  onSelectAll,
  onEdit,
  onDelete,
  isLoading,
  pagination,
  onPageChange,
  getCurrencyIcon,
  deleteLoading,
  tags = [],
  runningTimer,
  members = [],
  showMember = false,
}) => {
  const { organization } = useOrganization();
  // Helper to get project and task names
  const getProjectTask = (projectId?: string, taskId?: string) => {
    const project = projectsWithTasks.find((p) => p.id === projectId);
    const task = project?.tasks?.find((t) => t.id === taskId);
    return { project, task };
  };

  return (
    <>
      {isLoading ? (
        <TimeEntriesTableSkeleton />
      ) : (
        <div className="rounded-md bg-muted/40 border border-muted">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={
                      selectedEntries.length === timeEntries.length &&
                      timeEntries.length > 0
                    }
                    onCheckedChange={onSelectAll}
                    aria-label="Select all"
                  />
                </TableHead>
                <TableHead className="w-[25%] text-muted-foreground font-medium">
                  Description
                </TableHead>

                <TableHead className="w-[25%] text-muted-foreground font-medium">
                  Project
                </TableHead>

                <TableHead className="w-[15%] text-muted-foreground font-medium">
                  Tags
                </TableHead>
                <TableHead className="w-[12%] text-muted-foreground font-medium">
                  Time
                </TableHead>
                <TableHead className="w-[10%] text-muted-foreground font-medium">
                  Billable
                </TableHead>
                <TableHead className="w-[10%] text-muted-foreground font-medium">
                  Duration
                </TableHead>
                <TableHead className="w-[5%] text-muted-foreground font-medium" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8}>
                    <div className="flex items-center justify-center py-12">
                      Loading...
                    </div>
                  </TableCell>
                </TableRow>
              ) : timeEntries.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8}>
                    <NoData
                      icon={Clock}
                      title="No time entries found"
                      description="Start tracking your time to see entries here."
                    />
                  </TableCell>
                </TableRow>
              ) : (
                timeEntries.map((entry) => {
                  const { project, task } = getProjectTask(
                    entry?.projectId || "",
                    entry?.taskId || ""
                  );
                  return (
                    <TableRow
                      key={entry.id}
                      className={cn(
                        "cursor-pointer hover:bg-muted/50",
                        selectedEntries.includes(entry.id) && "bg-muted/60"
                      )}
                    >
                      <TableCell>
                        <Checkbox
                          checked={selectedEntries.includes(entry.id)}
                          onCheckedChange={() => onSelectEntry(entry.id)}
                          aria-label={`Select entry ${entry.id}`}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 max-w-[200px]">
                          <span className="font-medium truncate text-sm text-foreground">
                            {entry.description || "No description"}
                          </span>
                          {showMember && (
                            <Badge variant="secondary" className="text-xs">
                              {
                                members.find((m) => m.user.id === entry.userId)
                                  ?.user.name
                              }
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {project ? (
                          <div className="inline-flex items-center gap-2 px-2 py-1 rounded-full bg-muted/50 max-w-[200px] truncate">
                            <span
                              className="flex-shrink-0 w-2.5 h-2.5 rounded-full"
                              style={{
                                backgroundColor: project.color || "#6B7280",
                              }}
                            />
                            <div className="flex items-center gap-1 max-w-[200px] truncate">
                              <span className="text-sm font-medium truncate">
                                {project.name}
                              </span>
                              {task && (
                                <>
                                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                  <span className="text-sm font-medium truncate">
                                    {task.name}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-2 px-2 py-1 rounded-full bg-muted/50 max-w-[200px] truncate">
                            <span className="w-2.5 h-2.5 rounded-full bg-gray-400" />
                            <span className="text-sm font-medium truncate text-muted-foreground">
                              No Project
                            </span>
                          </div>
                        )}
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center gap-2 flex-wrap">
                          {entry.tags && entry.tags.length > 0 ? (
                            <>
                              {entry.tags.slice(0, 1).map((tag, index) => {
                                const tagObj = tags.find(
                                  (t) =>
                                    t.id === (typeof tag === "string" && tag)
                                );

                                return (
                                  <Badge
                                    key={index}
                                    variant="secondary"
                                    className="text-xs"
                                  >
                                    {tagObj
                                      ? tagObj.name
                                      : typeof tag === "string" && tag}
                                  </Badge>
                                );
                              })}
                              {entry.tags.length > 1 && (
                                <Badge
                                  variant="outline"
                                  className="text-xs text-muted-foreground border-dashed"
                                >
                                  +{entry.tags.length - 1} more
                                </Badge>
                              )}
                            </>
                          ) : (
                            <Badge variant="secondary" className="text-xs">
                              No Tags
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground font-medium">
                        {entry.start && entry.end && (
                          <>
                            {format(new Date(entry.start), "HH:mm")} -{" "}
                            {format(new Date(entry.end), "HH:mm")}
                          </>
                        )}
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center gap-1">
                          {getCurrencyIcon(
                            organization?.currency,
                            entry.billable
                              ? "text-green-600"
                              : "text-muted-foreground"
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium text-sm">
                        {formatEntryDuration(entry.duration)}
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
                            <DropdownMenuItem
                              onClick={() => onEdit(entry)}
                              disabled={runningTimer}
                            >
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-red-500 hover:text-red-500 focus:text-red-500"
                              onClick={() => onDelete(entry.id)}
                              disabled={deleteLoading}
                            >
                              <Trash2 className="mr-2 h-4 w-4 text-red-500" />
                              Delete
                            </DropdownMenuItem>
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
      )}
      {!isLoading && pagination && (
        <PaginationControls
          currentPage={pagination.page}
          totalPages={pagination.totalPages}
          totalItems={pagination.total}
          itemType="time entries"
          onPageChange={onPageChange}
        />
      )}
    </>
  );
};

export default TimeEntriesTable;
