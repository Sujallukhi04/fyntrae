import React from "react";
import { Separator } from "../ui/separator";
import { ChevronRight, Clock } from "lucide-react";

const entries = [
  {
    description: "Fix homepage bug",
    project: { name: "Website Revamp", color: "#10B981" }, // green dot
    task: { name: "Frontend" },
  },
  {
    description: "Write docs",
    project: { name: "API Service", color: "#3B82F6" }, // blue dot
    task: { name: "Documentation" },
  },
  {
    description: "No Description",
    project: { name: "No Project", color: "#6B7280" }, // gray dot
    task: { name: "General" },
  },
  {
    description: "Client Meeting Notes",
    project: { name: "CRM Overhaul", color: "#EF4444" }, // red dot
    task: { name: "Meetings" },
  },
];

const RecentTimeEntries = () => {
  const recentEntries = entries.slice(0, 4); // Limit to latest 4

  return (
    <div className="space-y-2">
      <h2 className="flex items-center text-sm font-medium text-muted-foreground space-x-2">
        <Clock className="h-4 w-4" />
        <span>Recent Time Entries</span>
      </h2>

      <div className="bg-muted/50 border border-zinc-800 rounded-md py-3 max-h-[290px] h-full space-y-3">
        {recentEntries.map((entry, idx) => (
          <React.Fragment key={idx}>
            <div className="px-3">
              <p className="text-sm font-semibold text-white truncate">
                {entry.description || "No Description"}
              </p>
              {entry.project && (
                <div className="inline-flex items-center gap-2 px-2 py-1 rounded-full bg-muted/50 max-w-[200px] truncate mt-1">
                  <span
                    className="flex-shrink-0 w-2.5 h-2.5 rounded-full"
                    style={{
                      backgroundColor: entry.project.color || "#6B7280",
                    }}
                  />
                  <div className="flex items-center gap-1 max-w-[200px] truncate">
                    <span className="text-xs font-medium truncate">
                      {entry.project.name}
                    </span>
                    {entry.task && (
                      <>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        <span className="text-xs font-medium truncate">
                          {entry.task.name}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Render Separator only if not last item */}
            {idx !== recentEntries.length - 1 && (
              <Separator className="bg-muted/50" />
            )}
          </React.Fragment>
        ))}

        {recentEntries.length === 0 && (
          <p className="text-xs text-muted-foreground text-center">
            No recent entries found.
          </p>
        )}
      </div>
    </div>
  );
};

export default RecentTimeEntries;
