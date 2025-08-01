import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  DollarSign,
  Tag,
  Trash2,
  CalendarIcon,
  Download,
  Pencil,
  IndianRupee,
  Euro,
  PoundSterling,
  ChartNoAxesColumnDecreasing,
  ChevronRight,
  Filter,
} from "lucide-react";

import { useEffect, useState } from "react";
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
import useProjectMember from "@/hooks/useProjectMember";
import FilterModal from "@/components/time/FillterModal";
import useTimesummary from "@/hooks/useTimesummary";
import type { Client, Member } from "@/types/oraganization";
import ChartFilterModal from "@/components/time/ChartFilterModal";

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

const Detailed = () => {
  const [date, setDate] = useState<Date>(new Date());
  const [selectedEntries, setSelectedEntries] = useState<string[]>([]);
  const [projectsWithTasks, setProjectsWithTasks] = useState<
    ProjectWithTasks[]
  >([]);
  const [currentPage, setCurrentPage] = useState(1);
  const { organization, runningTimer } = useOrganization();
  const { user } = useAuth();
  const [projectIds, setProjectIds] = useState<string[]>([]);
  const [memberIds, setMemberIds] = useState<string[]>([]);
  const [clientIds, setClientIds] = useState<string[]>([]);
  const [tagIds, setTagIds] = useState<string[]>([]);
  const [billable, setBillable] = useState<boolean | undefined>(undefined);
  const [taskIds, setTaskIds] = useState<string[]>([]);
  const [openFilter, setOpenFilter] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [tags, setTags] = useState<TagType[]>([]);
  const {
    fetchProjectWiTasks,
    fetchTags,
    loading,
    fetchClients,
    fetchMembers,
  } = useTimesummary();
  const {
    getTimeEntriesLoading,
    timeEntries = [],
    getTimeEntries,
    timeEntriesPagination,
    updateTimeEntry,
    deleteTimeEntry,
    deleteTimeEntryLoading,
    updateTimeEntryLoading,
    bulkUpdateTimeEntries,
    bulkDeleteTimeEntries,
    bulkUpdateLoading,
    bulkDeleteLoading,
  } = useTime();

  const [modalState, setModalState] = useState<TimeProps>({
    type: null,
    data: null,
  });

  const allTasks = projectsWithTasks.flatMap((p) =>
    (p.tasks || []).map((t) => ({ ...t, projectId: p.id }))
  );

  useEffect(() => {
    const loadData = async () => {
      if (!user?.currentTeamId) return;

      const orgId = user.currentTeamId;

      try {
        const clientData = await fetchClients(orgId);
        setClients(clientData.clients);
      } catch (error) {
        setClients([]);
      }

      try {
        const memberData = await fetchMembers(orgId);
        setMembers(memberData.members);
      } catch (error) {
        setMembers([]);
      }

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

  useEffect(() => {
    if (!user?.currentTeamId) return;
    const formattedDate = format(date, "yyyy-MM-dd");

    getTimeEntries(user.currentTeamId, {
      page: currentPage,
      limit: 10,
      date: formattedDate,
      projectIds,
      memberIds,
      clientIds,
      tagIds,
      taskIds,
      billable,
      all: true,
    });
  }, [
    user?.currentTeamId,
    currentPage,
    date,
    projectIds,
    memberIds,
    clientIds,
    tagIds,
    billable,
    taskIds,
  ]);

  useEffect(() => {
    if (user?.currentTeamId) {
      Promise.all([
        fetchProjectWiTasks(user.currentTeamId),
        fetchTags(user.currentTeamId),
      ])
        .then(([projects, fetchedTags]) => {
          setProjectsWithTasks(projects.data || []);
          setTags(fetchedTags.tags || []);
        })
        .catch((error) => console.log(error, "fetch projects and tags"));
    }
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
      <div className="flex flex-col gap-3  pt-1">
        <div className="flex flex-col items-start px-5 md:flex-row md:items-center md:justify-between gap-2 w-full">
          <div>
            <h1 className="text-md font-semibold flex items-center gap-2">
              <ChartNoAxesColumnDecreasing className="h-5 w-5 text-muted-foreground" />
              <span className="text-muted-foreground">Reporting</span>
              <span className="text-muted-foreground text-lg">
                <ChevronRight className="size-5" />
              </span>

              {/* This part needs to be a flex row with centered items */}
              <span className="flex items-center gap-2">
                <span className="text-foreground">Detailed</span>
              </span>
            </h1>
          </div>
          <Button className="w-full md:w-auto" variant="outline">
            <Download className=" h-8 w-8" />
            Export
          </Button>
        </div>
        <Separator />
      </div>

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
      <div className="px-5 mt-5 space-y-4">
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

          <div className="flex items-center gap-2">
            {selectedEntries.length > 0 && (
              <>
                <Button
                  onClick={() =>
                    setModalState({ type: "edit-bulk", data: null })
                  }
                  variant="outline"
                  className="h-8 px-3 text-sm"
                  disabled={bulkUpdateLoading}
                >
                  <Pencil className="w-4 h-4 mr-1" />
                  Update
                </Button>
                <Button
                  variant="outline"
                  onClick={handleDeleteBulkEntries}
                  className="cursor-pointer text-white h-8 px-3 text-sm"
                  disabled={bulkDeleteLoading}
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Delete
                </Button>
              </>
            )}
            <Button
              variant="outline"
              onClick={() => setOpenFilter(true)}
              className="h-8 px-3 text-sm"
            >
              <Filter className="w-4 h-4 mr-1" />
              Filter
            </Button>
          </div>
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
          showMember={true}
          members={members}
        />

        <ChartFilterModal
          open={openFilter}
          onClose={() => setOpenFilter(false)}
          clients={clients}
          members={members}
          projects={projectsWithTasks}
          tags={tags}
          selected={{
            projectIds,
            memberIds,
            clientIds,
            tagIds,
            billable,
            taskIds,
          }}
          onApply={({
            projectIds,
            memberIds,
            clientIds,
            tagIds,
            billable,
            taskIds,
          }) => {
            setProjectIds(projectIds);
            setMemberIds(memberIds);
            setClientIds(clientIds);
            setTagIds(tagIds);
            setBillable(billable);
            setTaskIds(taskIds);
          }}
        />
      </div>
    </div>
  );
};

export default Detailed;
