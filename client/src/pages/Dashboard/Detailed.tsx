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
import type { Client, Member } from "@/types/oraganization";
import ChartFilterModal from "@/components/reporting/ChartFilterModal";
import { DownloadModal } from "@/components/modals/shared/DownloadModal";
import { toast } from "sonner";
import { generateCustomReportPDF } from "@/utils/DetailedPdf";
import { exportToExcel } from "@/utils/exportDTime";
import { useOrgAccess } from "@/providers/OrgAccessProvider";

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
    fetchTimeData,
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
  const { canCallApi } = useOrgAccess();

  const [modalState, setModalState] = useState<TimeProps>({
    type: null,
    data: null,
  });
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);
  const [exportData, setExportData] = useState<any>(null);

  const [selectedExportType, setSelectedExportType] = useState<string | null>(
    null
  );

  const refreshTimeEntries = useCallback(async () => {
    if (!user?.currentTeamId) return;

    const formattedDate = format(date, "yyyy-MM-dd");
    const pageSize = timeEntriesPagination?.pageSize || 10;
    const totalEntries = timeEntriesPagination?.total || 0;
    const currentEntries = timeEntries.length;

    if (currentEntries === 0 || totalEntries > pageSize * currentPage) {
      setSelectedEntries([]);
      await getTimeEntries(user.currentTeamId, {
        page: currentPage,
        limit: pageSize,
        date: formattedDate,
        all: true,
        projectIds,
        memberIds,
        clientIds,
        tagIds,
        taskIds,
        billable,
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
    projectIds,
    memberIds,
    clientIds,
    tagIds,
    taskIds,
    billable,
  ]);

  useEffect(() => {
    const loadData = async () => {
      if (!user?.currentTeamId) return;

      const orgId = user.currentTeamId;

      if (canCallApi("viewClients")) {
        try {
          const clientData = await fetchClients(orgId);
          setClients(clientData.clients);
        } catch (error) {
          setClients([]);
        }
      }

      if (canCallApi("viewMembers")) {
        try {
          const memberData = await fetchMembers(orgId);
          setMembers(memberData.members);
        } catch (error) {
          setMembers([]);
        }
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
    setSelectedEntries([]);

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

  useEffect(() => {
    if (!user?.currentTeamId) return;
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

  const handleExportOption = async (type: string) => {
    if (!user?.currentTeamId || !date) return;

    setSelectedExportType(type);

    try {
      const response = await fetchTimeData(user.currentTeamId, {
        date: format(date, "yyyy-MM-dd"),
        projectIds,
        memberIds,
        clientIds,
        tagIds,
        billable,
        taskIds,
      });

      setExportData(response);
      setIsDownloadModalOpen(true);
    } catch (error) {
      setIsDownloadModalOpen(false);
      setExportData(null);
    }
  };

  const handleDownload = async () => {
    if (!exportData || !exportData.data || exportData.data.length === 0) {
      toast.error("No data available for download.");
      return;
    }

    const data = exportData.data;

    switch (selectedExportType) {
      case "pdf":
        generateCustomReportPDF(
          data,
          format(date, "yyyy-MM-dd"),
          organization?.currency,
          organization?.timeFormat || "24h",
          organization?.numberFormat || "1,000.00",
          organization?.intervalFormat || "12h"
        );
        break;

      case "excel":
      case "csv":
      case "ods": {
        exportToExcel(
          data,
          "detailed_report",
          selectedExportType === "excel" ? "xlsx" : selectedExportType,
          organization?.currency || "USD"
        );
        break;
      }

      default:
        toast.error("Unsupported export format.");
    }

    setIsDownloadModalOpen(false);
    setExportData(null);
    setSelectedExportType(null);
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
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full md:w-auto">
                <Download className="h-5 w-5 mr-2" />
                Export
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-38 p-1 flex flex-col space-y-1">
              {["PDF", "Excel", "CSV", "ODS"].map((type) => (
                <Button
                  key={type}
                  variant="ghost"
                  className="justify-start w-full"
                  onClick={() => handleExportOption(type.toLowerCase())}
                >
                  Export as {type}
                </Button>
              ))}
            </PopoverContent>
          </Popover>
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
                  disabled={{ after: new Date() }}
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

        <DownloadModal
          isOpen={isDownloadModalOpen}
          onClose={() => {
            setIsDownloadModalOpen(false);
            setExportData(null);
          }}
          isLoading={loading.report}
          onDownload={handleDownload}
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
