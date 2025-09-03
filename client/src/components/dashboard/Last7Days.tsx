import React from "react";
import { CalendarDays, Clock } from "lucide-react";
import { Separator } from "../ui/separator";
import { differenceInCalendarDays } from "date-fns";
import { formatTimeDuration } from "@/lib/utils";

const getLabel = (dateStr: string) => {
  const entryDate = new Date(dateStr);
  const today = new Date();
  const diff = differenceInCalendarDays(today, entryDate);

  switch (diff) {
    case 0:
      return "Today";
    case 1:
      return "Yesterday";
    default:
      return `${diff} days ago`;
  }
};

const Last7Days = ({
  dailySummary = [],
  intervalFormat,
}: {
  dailySummary: { date: string; totalTime: number }[];
  intervalFormat: "12h" | "decimal";
}) => {
  const sortedData = [...dailySummary]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 7);

  return (
    <div className="space-y-2">
      <h2 className="flex items-center text-sm font-medium text-muted-foreground gap-2">
        <CalendarDays className="w-4 h-4" />
        <span>Last 7 Days</span>
      </h2>

      <div className="bg-muted/50 border border-zinc-800 rounded-md text-sm max-h-[290px] h-full">
        {sortedData.map((entry, idx) => (
          <React.Fragment key={entry.date}>
            <div className="flex justify-between items-center px-3 py-2.5">
              <span className="text-white">{getLabel(entry.date)}</span>
              <span className="text-muted-foreground">
                {formatTimeDuration(entry.totalTime, intervalFormat)}
              </span>
            </div>
            {idx !== sortedData.length - 1 && (
              <Separator className="bg-muted/50" />
            )}
          </React.Fragment>
        ))}

        {sortedData.length === 0 && (
          <div className="flex w-full h-full flex-col items-center justify-center text-muted-foreground">
            <Clock className="h-8 w-8" />
            <p className="mt-2 text-sm">No Recent time entry</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Last7Days;
