import { useEffect, useState } from "react";
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
} from "lucide-react";

import ChartAreaInteractive from "@/components/chart-area-interactive";
import TimeEntryGroup from "@/components/time/TimeEntryGroup";
import { ChartPieLegend } from "@/components/time/ChartPieLegend";
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
import type { ProjectWithTasks, Tag as TagType } from "@/types/project";
import { format } from "date-fns";
import ChartFilterModal from "@/components/time/ChartFilterModal";

// Grouping options with icons
const groupOptions = [
  { label: "Members", value: "members", icon: User },
  { label: "Clients", value: "clients", icon: Folder },
  { label: "Projects", value: "projects", icon: FolderOpen },
  { label: "Tags", value: "tags", icon: Tag },
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
  } = useTimesummary();

  const today = new Date();
  const lastWeek = new Date();
  lastWeek.setDate(today.getDate() - 6);

  const [date, setDate] = useState({
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
  const [groupBy1, setGroupBy1] = useState("projects");
  const [groupBy2, setGroupBy2] = useState("members");

  useEffect(() => {
    const loadData = async () => {
      if (!user?.currentTeamId) return;
      try {
        const clientData = await fetchClients(user.currentTeamId);
        setClients(clientData.clients);

        const memberData = await fetchMembers(user.currentTeamId);
        setMembers(memberData.members);

        const projectData = await fetchProjectWiTasks(user.currentTeamId);
        setProjects(projectData.data);

        const tagData = await fetchTags(user.currentTeamId);
        setTags(tagData.tags);
      } catch (error) {
        console.error(error);
      }
    };

    if (user?.currentTeamId) loadData();
  }, [user?.currentTeamId]);

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
          tasks: taskIds,
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

  // Handle groupBy changes with validation
  const handleGroupBy1Change = (value: string) => {
    setGroupBy1(value);
    // If the new value conflicts with groupBy2, reset groupBy2
    if (value === groupBy2) {
      // Find the first available option that's not the selected one
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

  return (
    <div className="mx-auto max-w-6xl py-2 w-full space-y-4">
      <div className="flex flex-col gap-3 pt-1">
        {/* Header */}
        <div className="flex flex-col items-start px-5 md:flex-row md:items-center md:justify-between gap-2 w-full">
          <div>
            <h1 className="text-md font-semibold flex items-center gap-2">
              <ChartNoAxesColumnDecreasing className="h-5 w-5 text-muted-foreground" />
              <span className="text-muted-foreground">Reporting</span>
              <ChevronRight className="size-5 text-muted-foreground" />
              <span className="text-foreground">Detailed</span>
            </h1>
          </div>
          <Button className="w-full md:w-auto" variant="outline">
            <Download className="h-5 w-5 mr-2" />
            Export
          </Button>
        </div>

        <Separator />

        {/* Chart Area Filters */}
        <div className="px-2">
          <ChartAreaInteractive
            clients={clients}
            members={members}
            projects={projects}
            tags={tags}
            loading={loading}
            setFilterOpen={setOpenFilter}
            date={date}
            setDate={setDate}
            groupBy1={groupBy1}
            setGroupBy1={setGroupBy1}
            groupBy2={groupBy2}
            setGroupBy2={setGroupBy2}
            projectIds={projectIds}
            taskIds={taskIds}
            tagIds={tagIds}
            memberIds={memberIds}
            clientIds={clientIds}
            billable={billable}
          />
        </div>

        {/* Main Content */}
        <div className="w-full flex px-5 gap-5">
          {/* Left: Table + Group by */}
          <div className="lg:w-[60%] w-full space-y-4">
            <div className="flex items-center gap-2 bg-muted/40 p-2 border rounded-md">
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
              members={members}
              projects={projects}
              clients={clients}
              groupBy1={groupBy1}
              groupBy2={groupBy2}
            />
          </div>

          {/* Right: Chart */}
          <div className="lg:w-[40%] w-full">
            <ChartPieLegend
              groupedData={groupData?.grouped_data || []}
              members={members}
              projects={projects}
              clients={clients}
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
    </div>
  );
};

export default Overview;
