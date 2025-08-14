import { Pie, PieChart } from "recharts";
import { Card, CardContent } from "@/components/ui/card";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";
import { generateBlueTones } from "@/lib/utils";
import { PieChartIcon } from "lucide-react";

interface ChartPieLegendProps {
  groupedData?: { name: string; seconds: number }[];
}

export function PieChartMain({ groupedData = [] }: ChartPieLegendProps) {
  const dataToUse = groupedData;

  const filteredData = groupedData.filter((item) => item.seconds > 0);

  if (filteredData.length === 0) {
    return (
      <Card className="flex flex-col items-center justify-center h-[300px] text-muted-foreground">
        <CardContent className="flex flex-col items-center justify-center gap-2">
          <PieChartIcon className="w-8 h-8" />
          <p className="text-sm">No data to display</p>
        </CardContent>
      </Card>
    );
  }

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
