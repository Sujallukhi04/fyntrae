import React from "react";
import { CalendarDays } from "lucide-react";
import { Separator } from "../ui/separator";
import { format, differenceInCalendarDays } from "date-fns";

const formatTime = (seconds: number) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h}h ${m.toString().padStart(2, "0")}min`;
};

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
}: {
  dailySummary: { date: string; totalTime: number }[];
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
                {formatTime(entry.totalTime)}
              </span>
            </div>
            {idx !== sortedData.length - 1 && (
              <Separator className="bg-muted/50" />
            )}
          </React.Fragment>
        ))}

        {sortedData.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-3">
            No data for the last 7 days.
          </p>
        )}
      </div>
    </div>
  );
};

export default Last7Days;
