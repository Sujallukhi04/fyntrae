import { Pie, PieChart } from "recharts";
import { Card, CardContent } from "@/components/ui/card";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";
import type { Client, Member } from "@/types/oraganization";
import type { ProjectWithTasks } from "@/types/project";

const COLORS = [
  "#3B82F6",
  "#60A5FA",
  "#93C5FD",
  "#BFDBFE",
  "#DBEAFE",
  "#F472B6",
  "#FBBF24",
  "#34D399",
  "#A78BFA",
  "#F87171",
];

interface ChartPieLegendProps {
  groupedData: any[];
  members: Member[];
  projects: ProjectWithTasks[];
  clients: Client[];
  groupBy: string;
}

export function ChartPieLegend({
  groupedData = [],
  members = [],
  projects = [],
  clients = [],
  groupBy = "members",
}: ChartPieLegendProps) {
  const getName = (type: string, id: string) => {
    if (!id || id === "null") return `No ${type}`;

    if (type === "members")
      return members.find((m) => m.id === id)?.user.name || id;
    if (type === "projects")
      return projects.find((p) => p.id === id)?.name || id;
    if (type === "clients") return clients.find((c) => c.id === id)?.name || id;
    if (type === "tags") return projects.find((t) => t.id === id)?.name || id;
    if (type === "tasks") {
      for (const p of projects) {
        const task = p.tasks.find((t) => t.id === id);
        console.log(task);
        if (task) return task.name;
      }
      return id;
    }
    if (type === "billable") return id === "1" ? "Billable" : "Non-Billable";
    return id;
  };

  // Transform API data to chart format
  const chartData = groupedData.map((item, idx) => ({
    name: getName(groupBy, item.key),
    value: Math.round(((item.seconds || 0) / 3600) * 100) / 100,
    fill: COLORS[idx % COLORS.length],
  }));

  const chartConfig = chartData.reduce((config, item) => {
    config[item.name] = { label: item.name, color: item.fill };
    return config;
  }, {} as any);

  return (
    <Card className="flex flex-col">
      <CardContent className="pb-0">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[300px]"
        >
          <PieChart>
            <Pie data={chartData} dataKey="value" nameKey="name" />
            <ChartLegend
              content={<ChartLegendContent nameKey="name" />}
              className="-translate-y-2 flex-wrap gap-2 [&>*]:basis-1/4 [&>*]:justify-center"
            />
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
