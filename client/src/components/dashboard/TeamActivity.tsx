import React from "react";
import { Users } from "lucide-react";
import { Separator } from "../ui/separator";
import type { RunningTimeEntry } from "@/types/project";

const TeamActivity = ({
  runningEntries = [],
}: {
  runningEntries: RunningTimeEntry[];
}) => {
  const visibleEntries = runningEntries.slice(0, 5); // Show top 5

  return (
    <div className="space-y-2 h-full">
      <h2 className="flex items-center text-sm font-medium text-muted-foreground gap-2">
        <Users className="h-4 w-4" />
        <span>Team Activity</span>
      </h2>

      <div className="bg-muted/50 border border-zinc-800 rounded-md py-3 max-h-[290px] h-full overflow-hidden space-y-3">
        {visibleEntries.map((entry, idx) => (
          <React.Fragment key={entry.id}>
            <div className="px-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-white truncate">
                  {entry.name}
                </p>
                {!entry.runningEntry.end && (
                  <div className="flex items-center gap-1.5 text-green-500 text-xs font-medium">
                    <span className="relative flex items-center justify-center w-3 h-3">
                      <span className="absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75 animate-ping" />
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
                    </span>
                    <span>working</span>
                  </div>
                )}
              </div>

              {entry.runningEntry?.description && (
                <p className="text-xs text-muted-foreground font-semibold mt-1 truncate">
                  {entry.runningEntry.description}
                </p>
              )}
            </div>

            {idx !== visibleEntries.length && (
              <Separator className="bg-muted/50" />
            )}
          </React.Fragment>
        ))}

        {visibleEntries.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-3">
            No active members.
          </p>
        )}
      </div>
    </div>
  );
};

export default TeamActivity;
