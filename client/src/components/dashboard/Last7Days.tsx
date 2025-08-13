import React from "react";
import { CalendarDays } from "lucide-react";
import { Separator } from "../ui/separator";

const data = [
  { label: "Today", time: "0h 00min" },
  { label: "Yesterday", time: "1h 00min" },
  { label: "2 days ago", time: "0h 00min" },
  { label: "3 days ago", time: "0h 00min" },
  { label: "4 days ago", time: "0h 00min" },
  { label: "5 days ago", time: "0h 00min" },
  { label: "6 days ago", time: "1h 01min" },
];

const Last7Days = () => {
  return (
    <div className="space-y-2">
      <h2 className="flex items-center text-sm font-medium text-muted-foreground gap-2">
        <CalendarDays className="w-4 h-4" />
        <span>Last 7 Days</span>
      </h2>

      <div className="bg-muted/50 border border-zinc-800 rounded-md text-sm max-h-[290px] h-full">
        {data.map((entry, idx) => (
          <React.Fragment key={idx}>
            <div className="flex justify-between items-center px-3 py-2.5">
              <span className="text-white">{entry.label}</span>
              <span className="text-muted-foreground">{entry.time}</span>
            </div>
            {idx !== data.length - 1 && <Separator className="bg-muted/50" />}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export default Last7Days;
