import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  DollarSign,
  Trash2,
  CalendarIcon,
  Pencil,
  IndianRupee,
  Euro,
  PoundSterling,
} from "lucide-react";

import { useCallback, useEffect, useState } from "react";
import { format } from "date-fns";
import { useOrganization } from "@/providers/OrganizationProvider";
import useTime from "@/hooks/useTime";
import type {
  ProjectWithTasks,
  Tag as TagType,
  TimeEntry,
} from "@/types/project";

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

const Time = () => {
  const [date, setDate] = useState<Date>(new Date());
  const [selectedEntries, setSelectedEntries] = useState<string[]>([]);
  const [projectsWithTasks, setProjectsWithTasks] = useState<
    ProjectWithTasks[]
  >([]);
  const [tags, setTags] = useState<TagType[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const { runningTimer } = useOrganization();
  const { user } = useAuth();
  const {
    getTimeEntriesLoading,
    startTimer,
    stopTimer,
    startTimerLoading,
    stopTimerLoading,
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

    setSelectedEntries([]);
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

  const refreshTimeEntries = useCallback(async () => {
    if (!user?.currentTeamId) return;

    const formattedDate = format(date, "yyyy-MM-dd");
    const pageSize = timeEntriesPagination?.pageSize || 10;
    const totalEntries = timeEntriesPagination?.total || 0;
    const currentEntries = timeEntries.length;

    // Always refresh if we have no entries or if there are more entries to load
    if (currentEntries === 0 || totalEntries > pageSize * currentPage) {
      setSelectedEntries([]);
      await getTimeEntries(user.currentTeamId, {
        page: currentPage,
        limit: pageSize,
        date: formattedDate,
      });
    }
  }, [
    user?.currentTeamId,
    date,
    timeEntriesPagination?.pageSize,
    timeEntriesPagination?.total,
    timeEntries.length,
    currentPage,
    getTimeEntries,
  ]);

  const handleBulkUpdate = async (data: {
    description?: string;
    projectId: string | null;
    taskId: string | null;
    billable: boolean;
    tagIds?: string[];
  }) => {
    if (!user?.currentTeamId || selectedEntries.length === 0) return;
    try {
      await bulkUpdateTimeEntries(user?.currentTeamId, {
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
      await updateTimeEntry(
        user.currentTeamId,
        modalState.data?.id,
        {
          ...data,
          start: data.start,
          end: data.end,
        },
        date
      );
      setModalState({ type: null, data: null });
      const updatedDate = format(data.start, "yyyy-MM-dd");
      const selectedDate = format(date, "yyyy-MM-dd");

      const shouldRefetch = updatedDate !== selectedDate;

      if (shouldRefetch || (timeEntries.length === 1 && currentPage > 1)) {
        const newPage =
          timeEntries.length === 1 && currentPage > 1
            ? Math.max(currentPage - 1, 1)
            : currentPage;
        setCurrentPage(newPage);
        await refreshTimeEntries();
      }
    } catch (error) {
      console.error("Failed to update time entry:", error);
    }
  };

  const handleDeleteTimeEntry = async (entryId: string) => {
    if (!user?.currentTeamId) return;

    try {
      await deleteTimeEntry(user.currentTeamId, entryId);
      setSelectedEntries((prev) => prev.filter((id) => id !== entryId));

      if (timeEntries.length === 1 && currentPage > 1) {
        const newPage = Math.max(currentPage - 1, 1);
        setCurrentPage(newPage);
      }

      await refreshTimeEntries();
    } catch (error) {
      console.error("Failed to delete time entry:", error);
    }
  };

  const handleDeleteBulkEntries = async () => {
    if (!user?.currentTeamId || selectedEntries.length === 0) return;

    try {
      await bulkDeleteTimeEntries(user.currentTeamId, selectedEntries);
      setSelectedEntries([]);

      const currentTimeentrys = timeEntries.length - selectedEntries.length;

      if (currentTimeentrys === 0 && currentPage > 1) {
        const newPage = Math.max(currentPage - 1, 1);
        setCurrentPage(newPage);
      }

      await refreshTimeEntries();
    } catch (error) {
      console.error("Failed to delete time entries:", error);
    }
  };

  const handleTimerStart = async (data: {
    description?: string;
    projectId?: string;
    taskId?: string;
    tagIds: string[];
    billable: boolean;
  }) => {
    if (!user?.currentTeamId) return;

    try {
      await startTimer(user.currentTeamId, data);
      // Refresh is handled by the timer start logic, but you could add it here too
    } catch (error) {
      console.error("Failed to start timer:", error);
    }
  };

  const handleTimerStop = async () => {
    if (!user?.currentTeamId || !runningTimer) return;

    try {
      await stopTimer(user.currentTeamId, runningTimer.id, date);
    } catch (error) {
      console.error("Failed to stop timer:", error);
    }
  };

  return (
    <div className="mx-auto max-w-6xl py-2 w-full space-y-4">
      <TimerHeader
        onManualEntry={() => setModalState({ type: "add", data: null })}
        getCurrencyIcon={getCurrencyIcon}
        projectsWithTasks={projectsWithTasks}
        tags={tags}
        onStart={handleTimerStart}
        onStop={handleTimerStop}
        startTimerLoading={startTimerLoading}
        stopTimerLoading={stopTimerLoading}
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
                  disabled={{ after: new Date() }}
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
