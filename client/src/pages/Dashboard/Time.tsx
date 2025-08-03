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
import useTimesummary from "@/hooks/useTimesummary";
import TimerHeader from "@/components/time/TimerHeader";
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
  const { organization, runningTimer } = useOrganization();
  const { user } = useAuth();
  const {
    getTimeEntriesLoading,
    timeEntries,
    getTimeEntries,
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
    if (!user?.currentTeamId) return;
    const formattedDate = format(date, "yyyy-MM-dd");

    getTimeEntries(user.currentTeamId, {
      page: currentPage,
      limit: 10,
      date: formattedDate,
    });
  }, [user?.currentTeamId, currentPage, date]);

  useEffect(() => {
    const loadData = async () => {
      if (!user?.currentTeamId) return;

      const orgId = user.currentTeamId;

      try {
        const projectData = await fetchProjectWiTasks(orgId);
        setProjectsWithTasks(projectData.data);
      } catch (error) {
        setProjectsWithTasks([]);
      }

      try {
        const tagData = await fetchTags(orgId);
        setTags(tagData.tags);
      } catch (error) {
        setTags([]);
      }
    };

    if (user?.currentTeamId) loadData();
  }, [user?.currentTeamId]);

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

  const handleBulkUpdate = async (data: {
    description?: string;
    projectId: string | null;
    taskId: string | null;
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
    projectId?: string | null;
    taskId?: string | null;
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
    projectId: string | null;
    taskId: string | null;
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
      <TimerHeader
        onManualEntry={() => setModalState({ type: "add", data: null })}
        getCurrencyIcon={getCurrencyIcon}
        projectsWithTasks={projectsWithTasks}
        tags={tags}
      />

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
