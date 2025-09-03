import { Pie, PieChart } from "recharts";
import { Card, CardContent } from "@/components/ui/card";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";
import type { GroupRow } from "@/types/project";
import { generateBlueTones } from "@/lib/utils";

interface ChartPieLegendProps {
  groupedData: GroupRow[];
  groupBy: string;
}

export function ChartPieLegend({ groupedData = [] }: ChartPieLegendProps) {
  const blueColors = generateBlueTones(groupedData.length);
  const chartData = groupedData.map((item, idx) => ({
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
