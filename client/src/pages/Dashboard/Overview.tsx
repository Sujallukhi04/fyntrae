import { useEffect, useState } from "react";
import {
  ChartNoAxesColumnDecreasing,
  ChevronRight,
  Download,
  User,
  FolderOpen,
  Building2,
} from "lucide-react";

import ChartAreaInteractive from "@/components/chart-area-interactive";
import TimeEntryGroup from "@/components/time/TimeEntryGroup";
import { ChartPieLegend } from "@/components/time/ChartPieLegend";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Card } from "@/components/ui/card";
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
import type { ProjectWithTasks, Tag } from "@/types/project";

// Grouping options with icons
const groupOptions = [
  { label: "Members", value: "members", icon: User },
  { label: "Clients", value: "clients", icon: FolderOpen },
  { label: "Projects", value: "projects", icon: FolderOpen },
];

const Overview = () => {
  const { user } = useAuth();
  const {
    loading,
    fetchClients,
    fetchMembers,
    fetchProjectWiTasks,
    fetchTags,
  } = useTimesummary();

  const [clients, setClients] = useState<Client[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [projects, setProjects] = useState<ProjectWithTasks[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);

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

              <Select value={groupBy1} onValueChange={setGroupBy1}>
                <SelectTrigger className="w-[140px] h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {groupOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      <div className="flex items-center gap-2">
                        <opt.icon className="w-4 h-4" />
                        {opt.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <span className="text-sm font-medium text-muted-foreground">
                and
              </span>

              <Select value={groupBy2} onValueChange={setGroupBy2}>
                <SelectTrigger className="w-[140px] h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {groupOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      <div className="flex items-center gap-2">
                        <opt.icon className="w-4 h-4" />
                        {opt.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Time Entries */}
            <TimeEntryGroup />
          </div>

          {/* Right: Chart */}
          <div className="lg:w-[40%] w-full">
            <ChartPieLegend />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Overview;
