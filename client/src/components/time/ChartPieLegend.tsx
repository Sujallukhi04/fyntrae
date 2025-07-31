import { Pie, PieChart, Cell } from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

const COLORS = [
  "#3B82F6", // blue-500
  "#60A5FA", // blue-400
  "#93C5FD", // blue-300
  "#BFDBFE", // blue-200
  "#DBEAFE", // blue-100
  "#F472B6", // pink-400
  "#FBBF24", // yellow-400
  "#34D399", // green-400
  "#A78BFA", // purple-400
  "#F87171", // red-400
  // ...add more as needed
];

const chartData = [
  { browser: "Chrome", visitors: 275, fill: "#3B82F6" }, // blue-500
  { browser: "Safari", visitors: 200, fill: "#60A5FA" }, // blue-400
  { browser: "Firefox", visitors: 187, fill: "#93C5FD" }, // blue-300
  { browser: "Edge", visitors: 173, fill: "#BFDBFE" }, // blue-200
  { browser: "Other", visitors: 90, fill: "#DBEAFE" }, // blue-100
];

const chartConfig = {
  visitors: { label: "Visitors" },
  Chrome: { label: "Chrome", color: "#3B82F6" },
  Safari: { label: "Safari", color: "#60A5FA" },
  Firefox: { label: "Firefox", color: "#93C5FD" },
  Edge: { label: "Edge", color: "#BFDBFE" },
  Other: { label: "Other", color: "#DBEAFE" },
};

export function ChartPieLegend() {
  return (
    <Card className="flex flex-col">
      <CardContent className=" pb-0">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[300px]"
        >
          <PieChart>
            <Pie data={chartData} dataKey="visitors" />
            <ChartLegend
              content={<ChartLegendContent nameKey="browser" />}
              className="-translate-y-2 flex-wrap gap-2 *:basis-1/4 *:justify-center"
            />
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
