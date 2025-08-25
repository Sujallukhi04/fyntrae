import React from "react";
import { Separator } from "../ui/separator";
import { ChevronRight, Clock } from "lucide-react";
import type { RecentTimeEntry } from "@/types/project";
import NoData from "../NoData";

const RecentTimeEntries = ({
  entries = [],
}: {
  entries: RecentTimeEntry[];
}) => {
  const recentEntries = entries.slice(0, 4);

  return (
    <div className="space-y-2">
      <h2 className="flex items-center text-sm font-medium text-muted-foreground space-x-2">
        <Clock className="h-4 w-4" />
        <span>Recent Time Entries</span>
      </h2>

      <div className="bg-muted/50 border border-zinc-800 rounded-md py-3 h-[290px] space-y-3">
        {recentEntries.map((entry, idx) => (
          <React.Fragment key={idx}>
            <div className="px-3">
              <p className="text-sm font-semibold text-white truncate">
                {entry.description || "No Description"}
              </p>
              {entry.project ? (
                <div className="inline-flex items-center gap-2 px-2 py-1 rounded-full bg-muted/50 max-w-[200px] truncate mt-1">
                  <span
                    className="flex-shrink-0 w-2.5 h-2.5 rounded-full"
                    style={{
                      backgroundColor: entry.color || "#6B7280",
                    }}
                  />
                  <div className="flex items-center gap-1 max-w-[200px] truncate">
                    <span className="text-xs font-medium truncate">
                      {entry.project}
                    </span>
                    {entry.task && (
                      <>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        <span className="text-xs font-medium truncate">
                          {entry.task}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              ) : (
                <div className="inline-flex items-center gap-2 px-2 py-1 rounded-full bg-muted/50 max-w-[200px] truncate mt-1">
                  <span
                    className="flex-shrink-0 w-2.5 h-2.5 rounded-full"
                    style={{
                      backgroundColor: "#6B7280",
                    }}
                  />
                  <div className="flex items-center gap-1 max-w-[200px] truncate">
                    <span className="text-xs font-medium truncate">
                      No Project
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Render Separator only if not last item */}
            {idx !== recentEntries.length && idx < 3 && (
              <Separator className="bg-muted/50" />
            )}
          </React.Fragment>
        ))}

        {recentEntries.length === 0 && (
          <div className="flex w-full h-full flex-col items-center justify-center text-muted-foreground">
            <Clock className="h-8 w-8" />
            <p className="mt-2 text-sm">No Recent time</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecentTimeEntries;
