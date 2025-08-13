import React from "react";
import { Users } from "lucide-react";
import { Separator } from "../ui/separator";

const teamMembers = [
  {
    name: "Sujal",
    status: "working",
    description: "Fix login bug",
    color: "#22c55e",
  },
  {
    name: "Het",
    status: "idle",
    description: "",
    color: "#6B7280",
  },
  {
    name: "Priya",
    status: "working",
    description: "Prepare client deck",
    color: "#3B82F6",
  },
  {
    name: "Ravi",
    status: "offline",
    description: "",
    color: "#EF4444",
  },
  {
    name: "Aisha",
    status: "working",
    description: "Code review",
    color: "#10B981",
  },
  {
    name: "John",
    status: "idle",
    description: "",
    color: "#6B7280",
  },
];

const TeamActivity = () => {
  const visibleMembers = teamMembers.slice(0, 5); // 👈 limit to top 5

  return (
    <div className="space-y-2 h-full">
      <h2 className="flex items-center text-sm font-medium text-muted-foreground gap-2">
        <Users className="h-4 w-4" />
        <span>Team Activity</span>
      </h2>

      <div className="bg-muted/50 border border-zinc-800 rounded-md py-3 max-h-[290px] h-full overflow-hidden space-y-3">
        {visibleMembers.map((member, idx) => (
          <React.Fragment key={idx}>
            <div className="px-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-white truncate">
                  {member.name}
                </p>
                {member.status === "working" && (
                  <div className="flex items-center gap-1.5 text-green-500 text-xs font-medium">
                    <span className="relative flex items-center justify-center w-3 h-3">
                      <span className="absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75 animate-ping" />
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
                    </span>
                    <span>working</span>
                  </div>
                )}
              </div>

              {member.description && (
                <p className="text-xs text-muted-foreground font-semibold mt-1 truncate">
                  {member.description}
                </p>
              )}
            </div>

            {idx !== visibleMembers.length - 1 && (
              <Separator className="bg-muted/50" />
            )}
          </React.Fragment>
        ))}

        {visibleMembers.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-3">
            No active members.
          </p>
        )}
      </div>
    </div>
  );
};

export default TeamActivity;
