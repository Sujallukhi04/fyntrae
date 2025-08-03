import * as React from "react";
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";
import { Calendar as CalendarIcon, Filter } from "lucide-react";
import { format } from "date-fns";
import type { DateRange } from "react-day-picker";
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
import useTimesummary from "@/hooks/useTimesummary";
import { useAuth } from "@/providers/AuthProvider";

const chartConfig = {
  desktop: {
    label: "Desktop",
    color: "#2563eb",
  },
};

interface ChartAreaInteractiveProps {
  loading: {
    group: boolean;
    clients: boolean;
    members: boolean;
    project: boolean;
    tag: boolean;
  };
  date: {
    from: Date | null;
    to: Date | null;
  };
  setDate: React.Dispatch<
    React.SetStateAction<{ from: Date | null; to: Date | null }>
  >;
  projectIds: string[];
  taskIds: string[];
  tagIds: string[];
  memberIds: string[];
  clientIds: string[];
  billable: boolean | undefined;
  setFilterOpen: (open: boolean) => void;
}

export default function ChartAreaInteractive({
  loading,
  date,
  setDate,
  projectIds,
  taskIds,
  tagIds,
  memberIds,
  clientIds,
  billable,
  setFilterOpen,
}: ChartAreaInteractiveProps) {
  const { user } = useAuth();
  const [groupData, setGroupData] = React.useState<any>(null);

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
        taskIds,
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
    taskIds,
  ]);

  const chartData = React.useMemo(() => {
    if (!groupData?.grouped_data) return [];
    return groupData.grouped_data.map((item: any) => ({
      date: item.key,
      desktop: Math.round(((item.seconds || 0) / 3600) * 100) / 100,
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

  // Handle date selection with proper type conversion
  const handleDateSelect = (selectedDate: DateRange | undefined) => {
    if (selectedDate) {
      setDate({
        from: selectedDate.from || null,
        to: selectedDate.to || null,
      });
    }
  };

  const dateRange: DateRange | undefined =
    date.from && date.to ? { from: date.from, to: date.to } : undefined;

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
                    defaultMonth={date?.from || undefined}
                    selected={dateRange}
                    onSelect={handleDateSelect}
                    numberOfMonths={2}
                    className="rounded-md border"
                  />
                </PopoverContent>
              </Popover>
              <Button variant="outline" onClick={() => setFilterOpen(true)}>
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
    </div>
  );
}
