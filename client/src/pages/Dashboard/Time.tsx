import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  Clock,
  DollarSign,
  Play,
  Plus,
  Trash2,
  CalendarIcon,
  Pencil,
  IndianRupee,
  Euro,
  PoundSterling,
  Loader2,
  Square,
} from "lucide-react";

import { useEffect, useRef, useState } from "react";
import { format } from "date-fns";
import { useOrganization } from "@/providers/OrganizationProvider";
import useTime from "@/hooks/useTime";
import type {
  ProjectWithTasks,
  Tag as TagType,
  TimeEntry,
} from "@/types/project";
import ProjectTaskSelector from "@/components/time/ProjectTaskSelect";
import { TagSelectorPopover } from "@/components/time/TagSelector";
import { useAuth } from "@/providers/AuthProvider";
import TimeEntriesTable from "@/components/time/TimeEntriesTable";
import { TimeEntryModal } from "@/components/time/AddEditTimeModal";
import { EditTimeEntryModal } from "@/components/time/EditBulkTime";
import useProjectMember from "@/hooks/useProjectMember";
import useTimesummary from "@/hooks/useTimesummary";

interface TimeProps {
  type: "add" | "edit" | "edit-bulk" | "delete-bulk" | null;
  data: TimeEntry | null;
}
const getCurrencyIcon = (
  currency: string | undefined,
  colorClass = "text-green-500"
) => {
  switch (currency) {
    case "INR":
      return <IndianRupee className={`h-4 w-4 ${colorClass}`} />;
    case "EUR":
      return <Euro className={`h-4 w-4 ${colorClass}`} />;
    case "GBP":
      return <PoundSterling className={`h-4 w-4 ${colorClass}`} />;
    case "USD":
    default:
      return <DollarSign className={`h-4 w-4 ${colorClass}`} />;
  }
};

const formatDuration = (seconds: number) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${hours.toString().padStart(2, "0")}:${minutes
    .toString()
    .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
};

const Time = () => {
  const [date, setDate] = useState<Date>(new Date());
  const [selectedEntries, setSelectedEntries] = useState<string[]>([]);
  const [projectsWithTasks, setProjectsWithTasks] = useState<
    ProjectWithTasks[]
  >([]);
  const [tags, setTags] = useState<TagType[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [description, setDescription] = useState("");
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isBillable, setIsBillable] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const { organization, runningTimer } = useOrganization();
  const { user } = useAuth();
  const { getOrganizationMembers, organizationMembers } = useProjectMember();
  const {
    getTimeEntriesLoading,
    timeEntries,
    getTimeEntries,
    startTimer,
    stopTimer,
    startTimerLoading,
    stopTimerLoading,
    timeEntriesPagination,
    createTimeEntry,
    updateTimeEntry,
    deleteTimeEntry,
    deleteTimeEntryLoading,
    updateTimeEntryLoading,
    createTimeEntryLoading,
    bulkUpdateTimeEntries,
    bulkDeleteTimeEntries,
    bulkUpdateLoading,
    bulkDeleteLoading,
  } = useTime();

  const { fetchProjectWiTasks, fetchTags, loading } = useTimesummary();

  const [modalState, setModalState] = useState<TimeProps>({
    type: null,
    data: null,
  });

  useEffect(() => {
    if (user?.currentTeamId) {
      getOrganizationMembers(user.currentTeamId);
    }
  }, [user?.currentTeamId]);

  useEffect(() => {
    if (!user?.currentTeamId || !organizationMembers.length) return;
    const formattedDate = format(date, "yyyy-MM-dd");

    getTimeEntries(user.currentTeamId, {
      page: currentPage,
      limit: 10,
      date: formattedDate,
    });
  }, [user?.currentTeamId, currentPage, date, organizationMembers]);

  useEffect(() => {
    if (user?.currentTeamId) {
      fetchProjectWiTasks(user?.currentTeamId)
        .then((projects) => setProjectsWithTasks(projects.data))
        .catch((error) => {
          console.error("Failed to fetch projects with tasks:", error);
        });
      fetchTags(user?.currentTeamId)
        .then((fetchedTags) => {
          setTags(fetchedTags.tags);
        })
        .catch((error) => {
          console.error("Failed to fetch tags:", error);
        });
    }
  }, [user?.currentTeamId]);

  useEffect(() => {
    if (runningTimer) {
      // Populate form with running timer data
      setDescription(runningTimer.description || "");

      // Set project and task
      if (runningTimer.projectId) {
        const projectTaskValue = runningTimer.taskId
          ? `${runningTimer.projectId}:${runningTimer.taskId}`
          : runningTimer.projectId;
        setSelectedProject(projectTaskValue);
      } else {
        setSelectedProject("");
      }

      // Set tags
      if (runningTimer.tags && Array.isArray(runningTimer.tags)) {
        const tagIds = runningTimer.tags.map((tag) =>
          typeof tag === "string" ? tag : ""
        );
        setSelectedTags(tagIds);
      } else {
        setSelectedTags([]);
      }

      // Set billable status
      setIsBillable(runningTimer.billable || false);
    } else {
      // Clear form when no timer is running
      setDescription("");
      setSelectedProject("");
      setSelectedTags([]);
      setIsBillable(false);
    }
  }, [runningTimer]);

  useEffect(() => {
    if (runningTimer) {
      const startTime = new Date(runningTimer.start).getTime();

      const updateTimer = () => {
        const now = Date.now();
        const elapsed = Math.floor((now - startTime) / 1000);
        setElapsedTime(elapsed);
      };

      updateTimer(); // Initial update
      intervalRef.current = setInterval(updateTimer, 1000);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    } else {
      setElapsedTime(0);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }
  }, [runningTimer]);

  const handleStartTimer = async () => {
    if (!user?.currentTeamId) return;
    const projectId = selectedProject.split(":")[0] || "";
    const taskId = selectedProject.split(":")[1] || "";
    console.log(projectId, taskId, selectedProject);
    try {
      const result = await startTimer(user.currentTeamId, {
        description,
        ...(projectId && { projectId }),
        ...(taskId && { taskId }),
        tagIds: selectedTags,
        billable: isBillable,
      });
    } catch (error) {}
  };

  const handleStopTimer = async () => {
    if (!user?.currentTeamId || !runningTimer) return;

    try {
      await stopTimer(user.currentTeamId, runningTimer.id, date);
      setDescription("");
      setSelectedProject("");
      setSelectedTags([]);
      setIsBillable(false);
    } catch (error) {}
  };

  const handleSelectEntry = (entryId: string) => {
    setSelectedEntries((prevSelected) =>
      prevSelected.includes(entryId)
        ? prevSelected.filter((id) => id !== entryId)
        : [...prevSelected, entryId]
    );
  };

  const handleSelectAll = () => {
    setSelectedEntries(
      selectedEntries.length === timeEntries.length
        ? []
        : timeEntries.map((entry) => entry.id)
    );
  };
  // Bulk update function
  const handleBulkUpdate = async (data: {
    description?: string;
    projectId?: string;
    taskId?: string;
    billable: boolean;
    tagIds?: string[];
  }) => {
    if (!user?.currentTeamId || selectedEntries.length === 0) return;
    try {
      const response = await bulkUpdateTimeEntries(user?.currentTeamId, {
        timeEntryIds: selectedEntries,
        updates: data,
      });

      setModalState({ type: null, data: null });
      setSelectedEntries([]);
    } catch (error) {}
  };

  const handleCreateTimeEntry = async (data: {
    description?: string;
    projectId?: string;
    taskId?: string;
    start: Date;
    end: Date;
    tagIds: string[];
    billable: boolean;
  }) => {
    if (!user?.currentTeamId) return;

    try {
      await createTimeEntry(
        user.currentTeamId,
        {
          ...data,
          start: data.start,
          end: data.end,
        },
        date
      );
      setModalState({ type: null, data: null });
    } catch (error) {
      console.error("Failed to create time entry:", error);
    }
  };

  const handleUpdateTimeEntry = async (data: {
    description?: string;
    projectId?: string;
    taskId?: string;
    start: Date;
    end: Date;
    tagIds: string[];
    billable: boolean;
  }) => {
    if (!user?.currentTeamId || !modalState.data) return;

    try {
      await updateTimeEntry(user.currentTeamId, modalState.data?.id, {
        ...data,
        start: data.start,
        end: data.end,
      });
      setModalState({ type: null, data: null });
    } catch (error) {
      console.error("Failed to update time entry:", error);
    }
  };

  const handleDeleteTimeEntry = async (entryId: string) => {
    if (!user?.currentTeamId) return;

    try {
      await deleteTimeEntry(user.currentTeamId, entryId);
      setSelectedEntries((prev) => prev.filter((id) => id !== entryId));
    } catch (error) {
      console.error("Failed to delete time entry:", error);
    }
  };

  const handleDeleteBulkEntries = async () => {
    if (!user?.currentTeamId || selectedEntries.length === 0) return;

    try {
      await bulkDeleteTimeEntries(user.currentTeamId, selectedEntries);
      setSelectedEntries([]);
    } catch (error) {
      console.error("Failed to delete time entries:", error);
    }
  };

  return (
    <div className="mx-auto max-w-6xl py-2 w-full space-y-4">
      <div className="flex flex-col gap-2 pb-1 pt-2">
        <div className="flex flex-col items-start px-5 md:flex-row md:items-center md:justify-between gap-2 w-full">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <h1 className=" font-semibold">Time Tracker</h1>
          </div>
        </div>
        <div className="pb-2">
          <div className="px-5 flex items-center justify-between rounded-md gap-4">
            <div className="relative w-full">
              {/* Main Input Field */}
              <Input
                placeholder="What are you working on?"
                className="w-full pr-[270px] py-5.5 pl-4 border border-muted rounded-md font-medium placeholder:text-muted-foreground bg-muted/10 focus:outline-none focus:ring-0 focus:border-muted"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={startTimerLoading || !!runningTimer}
              />

              {/* Overlayed right-side controls */}
              <div className="absolute inset-y-0 right-2 flex items-center gap-2  pl-2">
                {/* Project Selector */}
                <ProjectTaskSelector
                  selectedValue={selectedProject}
                  onChange={setSelectedProject}
                  projectsWithTasks={projectsWithTasks}
                  runningTimer={!!runningTimer}
                />

                <TagSelectorPopover
                  tags={tags}
                  selectedTags={selectedTags}
                  onTagToggle={(tagId, checked) => {
                    if (checked) {
                      setSelectedTags((prev) => [...prev, tagId]);
                    } else {
                      setSelectedTags((prev) =>
                        prev.filter((id) => id !== tagId)
                      );
                    }
                  }}
                  onAddTag={() => console.log("Add Tag clicked")}
                  onCreateFirstTag={() =>
                    console.log("Create First Tag clicked")
                  }
                  tagLoading={loading.tag}
                  runningTimer={!!runningTimer}
                />
                {/* Dollar Button */}
                <Button
                  variant="ghost"
                  className="h-8 w-8 p-0"
                  onClick={() => setIsBillable(!isBillable)}
                  disabled={startTimerLoading || !!runningTimer}
                >
                  {getCurrencyIcon(
                    organization?.currency,
                    isBillable ? "text-green-600" : "text-muted-foreground"
                  )}
                </Button>
                {/* Vertical Separator */}
                <Separator orientation="vertical" className="h-6 mx-1" />

                {/* Timer */}
                <div className="text-md font-semibold min-w-[100px] text-center text-muted-foreground">
                  {formatDuration(elapsedTime)}
                </div>
              </div>
            </div>

            <div className="relative w-14 h-14 shrink-0">
              {runningTimer ? (
                <>
                  {/* Stop button styling */}
                  <span
                    className="absolute inset-0 rounded-full"
                    style={{ backgroundColor: `#EF444420` }}
                  />
                  <span
                    className="absolute inset-[6px] rounded-full"
                    style={{ backgroundColor: "#EF4444" }}
                  />
                  <button
                    className="absolute cursor-pointer inset-0 flex items-center justify-center disabled:opacity-50"
                    aria-label="Stop timer"
                    onClick={handleStopTimer}
                    disabled={stopTimerLoading}
                  >
                    {stopTimerLoading ? (
                      <Loader2 className="w-5 h-5 text-white animate-spin" />
                    ) : (
                      <Square className="w-4 h-4 fill-white text-white" />
                    )}
                  </button>
                </>
              ) : (
                <>
                  {/* Start button styling */}
                  <span
                    className="absolute inset-0 rounded-full"
                    style={{ backgroundColor: `#3B82F620` }}
                  />
                  <span
                    className="absolute inset-[6px] rounded-full"
                    style={{ backgroundColor: "#3B82F6" }}
                  />
                  <button
                    className="absolute cursor-pointer inset-0 flex items-center justify-center disabled:opacity-50"
                    aria-label="Start timer"
                    onClick={handleStartTimer}
                    disabled={startTimerLoading}
                  >
                    {startTimerLoading ? (
                      <Loader2 className="w-5 h-5 text-white animate-spin" />
                    ) : (
                      <Play className="w-5 h-5 fill-white text-white" />
                    )}
                  </button>
                </>
              )}
            </div>

            <div className="flex items-center gap-3">
              <div className="h-8 w-px bg-muted-foreground/20" />
              <Button
                variant="outline"
                className="ml-2 text-sm"
                disabled={startTimerLoading || !!runningTimer}
                onClick={() => setModalState({ type: "add", data: null })}
              >
                <Plus className="h-4 w-4 mr-2 text-muted-foreground" />
                Manual time entry
              </Button>
            </div>
          </div>
        </div>
        <Separator />
      </div>

      <TimeEntryModal
        isOpen={modalState.type === "add"}
        onClose={() => setModalState({ type: null, data: null })}
        onSubmit={handleCreateTimeEntry}
        loading={createTimeEntryLoading}
        tags={tags}
        projectWithTasks={projectsWithTasks}
        runningTimer={!!runningTimer}
        mode="add"
        initialData={null}
        tagLoading={loading.tag}
        getCurrencyIcon={getCurrencyIcon}
      />

      <TimeEntryModal
        isOpen={modalState.type === "edit"}
        onClose={() => setModalState({ type: null, data: null })}
        onSubmit={handleUpdateTimeEntry}
        loading={updateTimeEntryLoading}
        tags={tags}
        projectWithTasks={projectsWithTasks}
        runningTimer={!!runningTimer}
        mode="edit"
        initialData={modalState.data || null}
        tagLoading={loading.tag}
        getCurrencyIcon={getCurrencyIcon}
      />

      <EditTimeEntryModal
        isOpen={modalState.type === "edit-bulk"}
        onClose={() => setModalState({ type: null, data: null })}
        onSubmit={handleBulkUpdate}
        loading={bulkUpdateLoading}
        tags={tags}
        projectWithTasks={projectsWithTasks}
        runningTimer={!!runningTimer}
        tagLoading={loading.tag}
        getCurrencyIcon={getCurrencyIcon}
      />

      {/* Time Entries Table */}
      <div className="px-5 space-y-4">
        <div className="flex items-center justify-between mb-4">
          {/* Left: Date Picker */}
          <div className="flex items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "justify-start text-left font-normal text-sm h-9",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(selected) => {
                    if (selected) setDate(selected);
                  }}
                  initialFocus
                  required={false}
                />
              </PopoverContent>
            </Popover>
          </div>

          {selectedEntries.length > 0 && (
            <div className="flex items-center gap-2">
              <Button
                onClick={() => setModalState({ type: "edit-bulk", data: null })}
                variant="outline"
                className="h-8 px-3 text-sm"
                disabled={selectedEntries.length === 0 || bulkUpdateLoading}
              >
                <Pencil className="w-4 h-4 mr-1" />
                Update
              </Button>
              <Button
                variant="outline"
                onClick={handleDeleteBulkEntries}
                className=" cursor-pointer  text-white h-8 px-3 text-sm"
                disabled={selectedEntries.length === 0 || bulkDeleteLoading}
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Delete
              </Button>
            </div>
          )}
        </div>

        <TimeEntriesTable
          timeEntries={timeEntries}
          projectsWithTasks={projectsWithTasks}
          tags={tags}
          selectedEntries={selectedEntries}
          onSelectEntry={handleSelectEntry}
          onSelectAll={handleSelectAll}
          getCurrencyIcon={getCurrencyIcon}
          onEdit={(entry) => {
            setModalState({ type: "edit", data: entry });
          }}
          onDelete={handleDeleteTimeEntry}
          deleteLoading={deleteTimeEntryLoading}
          isLoading={getTimeEntriesLoading}
          pagination={timeEntriesPagination}
          onPageChange={setCurrentPage}
          runningTimer={!!runningTimer}
        />
      </div>
    </div>
  );
};

export default Time;
