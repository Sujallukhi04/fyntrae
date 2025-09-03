import React, { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronRight, Clock } from "lucide-react";
import NoData from "../NoData";
import type { TimeEntryGroupProps } from "@/types/project";
import { formatNumber, formatTimeDuration } from "@/lib/utils";

const TimeEntryGroup: React.FC<TimeEntryGroupProps> = ({
  groupedData = [],
  currncy = "USD",
  format,
  intervalFormat,
}) => {
  const [expanded, setExpanded] = useState<string[]>([]);

  const toggleExpand = (key: string) =>
    setExpanded((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );

  const isExpanded = (key: string) => expanded.includes(key);

  const totalSeconds = groupedData.reduce(
    (sum, g) => sum + (g.seconds || 0),
    0
  );
  const totalCost = groupedData.reduce((sum, g) => sum + (g.cost || 0), 0);

  console.log(totalSeconds);

  return (
    <div className="space-y-4">
      <div className="rounded-md bg-muted/40 border border-muted">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[45%]">Name</TableHead>
              <TableHead className="w-[25%]">Duration</TableHead>
              <TableHead className="w-[15%]">Cost</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {groupedData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3}>
                  <NoData
                    icon={Clock}
                    title="No data found"
                    description="No time entries found for the selected filters."
                    className="py-12"
                  />
                </TableCell>
              </TableRow>
            ) : (
              <>
                {groupedData.map((group) => (
                  <React.Fragment key={group.key}>
                    <TableRow
                      className="hover:bg-muted/50 cursor-pointer"
                      onClick={() => toggleExpand(group.key)}
                    >
                      <TableCell className="py-3">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-6 w-6"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleExpand(group.key);
                            }}
                          >
                            {isExpanded(group.key) ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </Button>

                          <span className="font-medium text-sm">
                            {group.name || "Unknown"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm  py-3">
                        {formatTimeDuration(group.seconds, intervalFormat)}
                      </TableCell>
                      <TableCell className="text-sm  py-3">
                        {typeof group.cost === "number" && group.cost > 0
                          ? formatNumber(group.cost, format, currncy)
                          : "--"}
                      </TableCell>
                    </TableRow>

                    {isExpanded(group.key) &&
                      group.grouped_data?.map((sub) => (
                        <TableRow key={sub.key} className="bg-muted/10">
                          <TableCell className="pl-12 text-sm text-muted-foreground py-3">
                            {sub.name || "Unknown"}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground py-3">
                            {formatTimeDuration(sub.seconds, intervalFormat)}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground py-3">
                            {typeof sub.cost === "number" && sub.cost > 0
                              ? formatNumber(sub.cost, format, currncy)
                              : "--"}
                          </TableCell>
                        </TableRow>
                      ))}
                  </React.Fragment>
                ))}

                {/* Total row */}
                <TableRow className="bg-muted/30 font-semibold">
                  <TableCell>Total</TableCell>
                  <TableCell>
                    {formatTimeDuration(totalSeconds, intervalFormat)}
                  </TableCell>
                  <TableCell>
                    {typeof totalCost === "number" && totalCost > 0
                      ? formatNumber(totalCost, format, currncy)
                      : "--"}
                  </TableCell>
                </TableRow>
              </>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default TimeEntryGroup;
