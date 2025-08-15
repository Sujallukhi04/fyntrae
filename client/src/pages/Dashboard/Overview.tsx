import { useEffect, useRef, useState } from "react";
import {
  ChartNoAxesColumnDecreasing,
  ChevronRight,
  Download,
  User,
  FolderOpen,
  Building2,
  CheckCircle2,
  Tag,
  Folder,
  Currency,
  Save,
} from "lucide-react";

import ChartAreaInteractive from "@/components/reporting/chart-area-interactive";
import TimeEntryGroup from "@/components/reporting/TimeEntryGroup";
import { ChartPieLegend } from "@/components/reporting/ChartPieLegend";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import useTimesummary from "@/hooks/useTimesummary";
import { useAuth } from "@/providers/AuthProvider";

import type { Client, Member } from "@/types/oraganization";
import type { ProjectWithTasks, Report, Tag as TagType } from "@/types/project";
import { format, set } from "date-fns";
import ChartFilterModal from "@/components/reporting/ChartFilterModal";
import { useOrgAccess } from "@/providers/OrgAccessProvider";
import { toast } from "sonner";
import { ReportModal } from "@/components/report/AddEditReport";
import useReport from "@/hooks/useReport";
import { useOrganization } from "@/providers/OrganizationProvider";
import TimeTrackingPdfButton from "@/components/export/ReportPDF";
import { DownloadModal } from "@/components/modals/shared/DownloadModal";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { downloadCSV, downloadODS, downloadXLSX } from "@/utils/exportUtils";

// Grouping options with icons
const groupOptions = [
  { label: "Members", value: "members", icon: User },
  { label: "Clients", value: "clients", icon: Folder },
  { label: "Projects", value: "projects", icon: FolderOpen },
  { label: "Tasks", value: "tasks", icon: CheckCircle2 },
  { label: "Billable", value: "billable", icon: Currency },
];

const Overview = () => {
  const { user } = useAuth();
  const {
    loading,
    fetchClients,
    fetchMembers,
    fetchProjectWiTasks,
    fetchTags,
    fetchGroupedSummary,
    fetchReport,
  } = useTimesummary();
  const { organization } = useOrganization();

  const today = new Date();
  const lastWeek = new Date();
  lastWeek.setDate(today.getDate() - 6);

  const [date, setDate] = useState<{ from: Date | null; to: Date | null }>({
    from: lastWeek,
    to: today,
  });
  const [projectIds, setProjectIds] = useState<string[]>([]);
  const [memberIds, setMemberIds] = useState<string[]>([]);
  const [clientIds, setClientIds] = useState<string[]>([]);
  const [tagIds, setTagIds] = useState<string[]>([]);
  const [billable, setBillable] = useState<boolean | undefined>(undefined);
  const [taskIds, setTaskIds] = useState<string[]>([]);
  const [openFilter, setOpenFilter] = useState(false);

  const [clients, setClients] = useState<Client[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [projects, setProjects] = useState<ProjectWithTasks[]>([]);
  const [tags, setTags] = useState<TagType[]>([]);
  const [groupData, setGroupData] = useState<any>(null);
  const [groupData1, setGroupData1] = useState<any>(null);

  const [groupBy1, setGroupBy1] = useState("projects");
  const [groupBy2, setGroupBy2] = useState("members");
  const { role, canCallApi } = useOrgAccess();
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const { createReport, reportLoading } = useReport();

  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);
  const [exportData, setExportData] = useState<any>(null);

  const [selectedExportType, setSelectedExportType] = useState<string | null>(
    null
  );
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const appRef = useRef<{ generatePdf: () => Promise<void> }>(null);

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
        setProjects(projectData.data);
      } catch (error) {
        setProjects([]);
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
    if (!user?.currentTeamId || !date.from || !date.to) return;
    const fetchData = async () => {
      const result = await fetchGroupedSummary({
        organizationId: user.currentTeamId,
        startDate: format(date.from!, "yyyy-MM-dd"),
        endDate: format(date.to!, "yyyy-MM-dd"),
        groups: "date",
        projectIds,
        memberIds,
        clientIds,
        tagIds,
        taskIds,
        billable,
      });

      if (result) {
        setGroupData1(result);
      }
    };

    fetchData();
  }, [
    date.from,
    date.to,
    fetchGroupedSummary,
    user?.currentTeamId,
    projectIds,
    memberIds,
    clientIds,
    tagIds,
    billable,
    taskIds,
  ]);

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.currentTeamId || !date.from || !date.to) return;
      try {
        const result = await fetchGroupedSummary({
          organizationId: user.currentTeamId,
          startDate: format(date.from!, "yyyy-MM-dd"),
          endDate: format(date.to!, "yyyy-MM-dd"),
          projectIds,
          memberIds,
          clientIds,
          tagIds,
          taskIds,
          billable,
          groups: `${groupBy1},${groupBy2}`,
        });
        setGroupData(result);
      } catch (error) {
        console.error(error);
      }
    };

    fetchData();
  }, [
    date.from,
    date.to,
    fetchGroupedSummary,
    user?.currentTeamId,
    projectIds,
    memberIds,
    clientIds,
    tagIds,
    billable,
    taskIds,
    groupBy1,
    groupBy2,
  ]);

  const getAvailableOptions = (currentValue: string, excludeValue: string) => {
    return groupOptions.filter(
      (opt) => opt.value === currentValue || opt.value !== excludeValue
    );
  };

  const handleGroupBy1Change = (value: string) => {
    setGroupBy1(value);
    if (value === groupBy2) {
      const availableOption = groupOptions.find((opt) => opt.value !== value);
      if (availableOption) {
        setGroupBy2(availableOption.value);
      }
    }
  };

  const handleGroupBy2Change = (value: string) => {
    setGroupBy2(value);
    // If the new value conflicts with groupBy1, reset groupBy1
    if (value === groupBy1) {
      // Find the first available option that's not the selected one
      const availableOption = groupOptions.find((opt) => opt.value !== value);
      if (availableOption) {
        setGroupBy1(availableOption.value);
      }
    }
  };

  const handleReportSubmit = async (data: {
    name: string;
    description: string;
    isPublic: boolean;
    publicUntil?: Date;
  }) => {
    if (
      !user?.currentTeamId ||
      !date.from ||
      !date.to ||
      !canCallApi("saveReport")
    )
      return;
    try {
      const formatted = {
        name: data.name.trim(),
        description: data.description.trim(),
        isPublic: data.isPublic,
        publicUntil:
          data.isPublic && data.publicUntil
            ? format(data.publicUntil, "yyyy-MM-dd")
            : undefined,
        projects: projectIds.length ? projectIds.join(",") : null,
        tasks: taskIds.length ? taskIds.join(",") : null,
        tags: tagIds.length ? tagIds.join(",") : null,
        clients: clientIds.length ? clientIds.join(",") : null,
        members: memberIds.length ? memberIds.join(",") : null,
        billable: typeof billable === "boolean" ? String(billable) : undefined,
        groups: `${groupBy1},${groupBy2}`,
        startDate: format(date.from, "yyyy-MM-dd"),
        endDate: format(date.to, "yyyy-MM-dd"),
      };

      await createReport(user.currentTeamId, formatted);

      setIsReportModalOpen(false);
    } catch (error) {
      toast.error("Failed to create report.");
    }
  };

  const handleExportOption = async (type: string) => {
    if (!user?.currentTeamId || !date.from || !date.to) return;

    setSelectedExportType(type);

    if (type === "pdf") {
      try {
        setIsGeneratingPdf(true);
        const response = await fetchReport(user.currentTeamId, {
          startDate: format(date.from, "yyyy-MM-dd"),
          endDate: format(date.to, "yyyy-MM-dd"),
          projectIds,
          memberIds,
          clientIds,
          tagIds,
          billable,
          taskIds,
          groups: `${groupBy1},${groupBy2}`,
        });

        setExportData(response.data);
        setIsDownloadModalOpen(true);
      } catch (error) {
        setIsDownloadModalOpen(false);
        setExportData(null);
        setIsGeneratingPdf(false);
      } finally {
        setIsGeneratingPdf(false);
      }
    } else {
      if (!groupData) {
        toast.error("No data available for export.");
        setExportData(null);
        setIsDownloadModalOpen(false);
        return;
      }
      setExportData(groupData);
      setIsDownloadModalOpen(true);
      setIsGeneratingPdf(false);
    }
  };

  const handleDownload = async () => {
    if (!exportData) {
      toast.error("No data available to download.");
      return;
    }

    const clientHeader = exportData.grouped_type || "Group 1";
    const taskHeader = exportData.grouped_data?.[0]?.grouped_type || "Group 2";

    const groupedData = exportData.grouped_data;

    switch (selectedExportType) {
      case "pdf":
        if (appRef.current?.generatePdf) {
          await appRef.current.generatePdf();
        } else {
          toast.error("PDF generation not available.");
        }
        break;
      case "excel":
        downloadXLSX(
          groupedData,
          clientHeader,
          taskHeader,
          undefined,
          organization?.currency || "USD"
        );
        break;
      case "csv":
        downloadCSV(
          groupedData,
          clientHeader,
          taskHeader,
          undefined,
          organization?.currency || "USD"
        );
        break;
      case "ods":
        downloadODS(
          groupedData,
          clientHeader,
          taskHeader,
          undefined,
          organization?.currency || "USD"
        );
        break;
      default:
        toast.error("Unsupported export format.");
    }

    setIsDownloadModalOpen(false);
    setExportData(null);
    setSelectedExportType(null);
  };

  return (
    <div className="mx-auto max-w-6xl py-2 w-full space-y-4">
      <div className="flex flex-col gap-3 pt-1">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 px-5 w-full">
          {/* Left: Title / Breadcrumb */}
          <div className="w-full md:w-auto">
            <h1 className="text-md font-semibold flex items-center gap-2">
              <ChartNoAxesColumnDecreasing className="h-5 w-5 text-muted-foreground" />
              <span className="text-muted-foreground">Reporting</span>
              <ChevronRight className="size-5 text-muted-foreground" />
              <span className="text-foreground">Detailed</span>
            </h1>
          </div>

          {/* Right: Export Actions */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2 md:gap-3 w-full md:w-auto">
            {/* PDF Export Button (conditionally rendered) */}
            {exportData && selectedExportType === "pdf" && (
              <TimeTrackingPdfButton
                ref={appRef}
                timeTrackingData={exportData}
              />
            )}

            {/* Export Popover */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full md:w-auto">
                  <Download className="h-5 w-5 mr-2" />
                  Export
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-40 p-1 flex flex-col space-y-1">
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

            {/* Save Report (for non-EMPLOYEE roles) */}
            {role !== "EMPLOYEE" && (
              <Button
                className="w-full md:w-auto"
                onClick={() => setIsReportModalOpen(true)}
                variant="outline"
              >
                <Save className="h-5 w-5 mr-2" />
                Save Report
              </Button>
            )}
          </div>
        </div>

        <Separator />

        {/* Chart Area Filters */}
        <div className="px-2">
          <ChartAreaInteractive
            loading={loading.group}
            setFilterOpen={setOpenFilter}
            date={date}
            setDate={setDate}
            groupData={groupData1}
          />
        </div>

        {/* Main Content */}
        <div className="w-full flex flex-col lg:flex-row px-5 gap-5">
          {/* Left: Table + Group by */}
          <div className="w-full lg:w-[60%] space-y-4">
            <div className="flex flex-wrap items-center gap-2 bg-muted/40 p-2 border rounded-md">
              <span className="text-sm font-medium text-muted-foreground">
                Group by
              </span>

              <Select value={groupBy1} onValueChange={handleGroupBy1Change}>
                <SelectTrigger className="w-[140px] h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {getAvailableOptions(groupBy1, groupBy2).map((opt) => (
                    <SelectItem
                      key={opt.value}
                      value={opt.value}
                      disabled={opt.value === groupBy2}
                    >
                      <div className="flex items-center gap-2">
                        <opt.icon className="w-4 h-4" />
                        {opt.label}
                        {opt.value === groupBy2 && (
                          <span className="text-xs text-muted-foreground ml-1">
                            (used in 2nd field)
                          </span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <span className="text-sm font-medium text-muted-foreground">
                and
              </span>

              <Select value={groupBy2} onValueChange={handleGroupBy2Change}>
                <SelectTrigger className="w-[140px] h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {getAvailableOptions(groupBy2, groupBy1).map((opt) => (
                    <SelectItem
                      key={opt.value}
                      value={opt.value}
                      disabled={opt.value === groupBy1}
                    >
                      <div className="flex items-center gap-2">
                        <opt.icon className="w-4 h-4" />
                        {opt.label}
                        {opt.value === groupBy1 && (
                          <span className="text-xs text-muted-foreground ml-1">
                            (used in 1st field)
                          </span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <TimeEntryGroup
              groupedData={groupData?.grouped_data || []}
              groupBy1={groupBy1}
              groupBy2={groupBy2}
              currncy={organization?.currency || "USD"}
              format={organization?.numberFormat || "1,000.00"}
              intervalFormat={organization?.intervalFormat || "12h"}
            />
          </div>

          {/* Right: Chart */}
          <div className="w-full lg:w-[40%]">
            <ChartPieLegend
              groupedData={groupData?.grouped_data || []}
              groupBy={groupBy1}
            />
          </div>
        </div>
      </div>
      <ChartFilterModal
        open={openFilter}
        onClose={() => setOpenFilter(false)}
        clients={clients}
        members={members}
        projects={projects}
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

      <DownloadModal
        isOpen={isDownloadModalOpen}
        onClose={() => {
          setIsDownloadModalOpen(false);
          setExportData(null);
        }}
        isLoading={loading.report}
        onDownload={handleDownload}
      />

      <ReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        onSubmit={handleReportSubmit}
        mode="add"
        loading={reportLoading.create}
      />
    </div>
  );
};

export default Overview;
