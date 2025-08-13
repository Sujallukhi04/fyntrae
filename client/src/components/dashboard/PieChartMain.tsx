import { Pie, PieChart } from "recharts";
import { Card, CardContent } from "@/components/ui/card";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";
import { generateBlueTones } from "@/lib/utils";

interface ChartPieLegendProps {
  groupedData?: { name: string; seconds: number }[];
  groupBy?: string;
}

// Dummy data for demonstration
const dummyData: { name: string; seconds: number }[] = [
  { name: "Project A", seconds: 5400 }, // 1.5 hours
  { name: "Project B", seconds: 7200 }, // 2 hours
  { name: "Project C", seconds: 3600 }, // 1 hour
];

export function PieChartMain({
  groupedData = [],
  groupBy = "members",
}: ChartPieLegendProps) {
  const isEmpty = groupedData.length === 0;
  const dataToUse = isEmpty ? dummyData : groupedData;

  const blueColors = generateBlueTones(dataToUse.length);

  const chartData = dataToUse.map((item, idx) => ({
    name: item.name || "Unknown",
    value: Math.round(((item.seconds || 0) / 3600) * 100) / 100,
    fill: blueColors[idx],
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
