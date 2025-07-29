import * as React from "react";
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";
import { Calendar as CalendarIcon } from "lucide-react";
import { addDays, format } from "date-fns";
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

function generateTimeEntryData() {
  const today = new Date();
  const prevMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const data = [];
  let current = new Date(prevMonth);

  while (current <= today) {
    // Random hours between 0 and 8
    const hours = Math.round((Math.random() * 10 + Number.EPSILON) * 100) / 100;
    data.push({
      date: current.toISOString().slice(0, 10),
      desktop: hours,
    });
    current.setDate(current.getDate() + 1);
  }
  return data;
}

const chartData = generateTimeEntryData();

console.log(chartData);

const chartConfig = {
  desktop: {
    label: "Desktop",
    color: "#2563eb",
  },
};

const formatDate = (date, formatStr) => {
  const d = new Date(date);
  if (formatStr === "MMM dd, y") {
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
    });
  }
  return d.toLocaleDateString();
};

export default function ChartAreaInteractive() {
  const today = new Date();
  // Get the first day of the previous month
  const prevMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);

  const [date, setDate] = React.useState({
    from: prevMonth,
    to: today,
  });

  const filteredData = React.useMemo(() => {
    if (!date?.from || !date?.to) return chartData;

    return chartData.filter((item) => {
      const itemDate = new Date(item.date);
      return itemDate >= date.from && itemDate <= date.to;
    });
  }, [date]);

  const formatDateRange = () => {
    if (!date?.from) return "Pick a date range";
    if (!date?.to) return formatDate(date.from, "MMM dd, y");
    return `${formatDate(date.from, "MMM dd, y")} - ${formatDate(
      date.to,
      "MMM dd, y"
    )}`;
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-3">
      <Card className="bg-card shadow-none border">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>Total Hours Tracked</CardTitle>
              <CardDescription>
                Showing hours tracked for the selected date range
              </CardDescription>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              {/* Date Range Picker */}
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
            </div>
          </div>
        </CardHeader>

        <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
          {filteredData.length === 0 ? (
            <div className="flex h-[200px] items-center justify-center text-muted-foreground text-sm">
              No time entries found for the selected date range.
            </div>
          ) : (
            <ChartContainer
              config={chartConfig}
              className="aspect-auto h-[250px] w-full"
            >
              <BarChart data={filteredData} margin={{ left: 12, right: 12 }}>
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
                <Bar dataKey="desktop" fill="#2563eb" name="Hours" />
              </BarChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
