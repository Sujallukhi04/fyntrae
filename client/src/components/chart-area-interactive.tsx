import * as React from "react";
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";
import { Calendar as CalendarIcon, Filter } from "lucide-react";
import { format } from "date-fns";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import useTimesummary from "@/hooks/useTimesummary"; // <-- import your hook
import { useAuth } from "@/providers/AuthProvider";
import type { Client, Member } from "@/types/oraganization";
import type { ProjectWithTasks, Tag } from "@/types/project";
import ChartFilterModal from "./time/ChartFilterModal";

const chartConfig = {
  desktop: {
    label: "Desktop",
    color: "#2563eb",
  },
};

interface ChartAreaInteractiveProps {
  clients: Client[];
  members: Member[];
  projects: ProjectWithTasks[];
  tags: Tag[];
  loading: {
    group: boolean;
    clients: boolean;
    members: boolean;
    project: boolean;
    tag: boolean;
  };
}

export default function ChartAreaInteractive({
  clients,
  members,
  projects,
  tags,
  loading,
}: ChartAreaInteractiveProps) {
  const { user } = useAuth();
  const today = new Date();
  const lastWeek = new Date();
  lastWeek.setDate(today.getDate() - 6);
  const [groupData, setGroupData] = React.useState<any>(null);
  const [projectIds, setProjectIds] = React.useState<string[]>([]);
  const [memberIds, setMemberIds] = React.useState<string[]>([]);
  const [clientIds, setClientIds] = React.useState<string[]>([]);
  const [tagIds, setTagIds] = React.useState<string[]>([]);
  const [billable, setBillable] = React.useState<boolean | undefined>(
    undefined
  );
  const [taskIds, setTaskIds] = React.useState<string[]>([]);
  const [openFilter, setOpenFilter] = React.useState(false);

  const [date, setDate] = React.useState({
    from: lastWeek,
    to: today,
  });

  const { fetchGroupedSummary } = useTimesummary();

  React.useEffect(() => {
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
        tasks: taskIds,
        billable,
      });

      if (result) {
        setGroupData(result);
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
    taskIds, // Ensure taskIds is included in the dependency array
  ]);

  const chartData = React.useMemo(() => {
    if (!groupData?.grouped_data) return [];
    return groupData.grouped_data.map((item: any) => ({
      date: item.key,
      desktop: Math.round(((item.seconds || 0) / 3600) * 100) / 100, // convert seconds to hours
    }));
  }, [groupData]);

  const formatDateRange = () => {
    if (!date?.from) return "Pick a date range";
    if (!date?.to) return format(date.from, "MMM dd, y");
    return `${format(date.from, "MMM dd, y")} - ${format(
      date.to,
      "MMM dd, y"
    )}`;
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-3">
      <Card className="bg-card rounded-md shadow-none border">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>Total Hours Tracked</CardTitle>
              <CardDescription>
                Showing hours tracked for the selected date range
              </CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="date"
                    variant="outline"
                    className={cn(
                      "w-full sm:w-[300px] justify-start text-left font-normal",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formatDateRange()}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={date?.from}
                    selected={date}
                    onSelect={setDate}
                    numberOfMonths={2}
                    className="rounded-md border"
                  />
                </PopoverContent>
              </Popover>
              <Button variant="outline" onClick={() => setOpenFilter(true)}>
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
          {loading.group ? (
            <div className="flex h-[200px] items-center justify-center text-muted-foreground text-sm">
              Loading...
            </div>
          ) : chartData.length === 0 ? (
            <div className="flex h-[200px] items-center justify-center text-muted-foreground text-sm">
              No time entries found for the selected date range.
            </div>
          ) : (
            <ChartContainer
              config={chartConfig}
              className="aspect-auto h-[250px] w-full"
            >
              <BarChart data={chartData} margin={{ left: 12, right: 12 }}>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  minTickGap={32}
                  tickFormatter={(value) => {
                    const date = new Date(value);
                    return date.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    });
                  }}
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      className="w-[150px]"
                      nameKey="Hours"
                      labelFormatter={(value) => {
                        return new Date(value).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        });
                      }}
                    />
                  }
                />
                <Bar dataKey="desktop" fill="#2563eb" name="Hours" radius={4} />
              </BarChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>

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
}
