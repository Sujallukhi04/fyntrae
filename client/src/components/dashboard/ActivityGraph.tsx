import React from "react";
import { Separator } from "../ui/separator";
import { BarChart2Icon } from "lucide-react";

const projects = [
  { id: 1, name: "Website Revamp", color: "#10B981", progress: 75 },
  { id: 2, name: "API Service", color: "#3B82F6", progress: 40 },
  { id: 3, name: "No Project", color: "#6B7280", progress: 55 },
  { id: 4, name: "CRM Overhaul", color: "#EF4444", progress: 90 },
  { id: 5, name: "CRM Overhaul", color: "#EF5600", progress: 50 },
];

const ProjectProgress = () => {
  return (
    <div className="space-y-2">
      <h2 className="flex items-center text-sm font-medium text-muted-foreground space-x-2">
        <BarChart2Icon className="h-4 w-4" />
        <span>Project Progress</span>
      </h2>

      <h2 className="text-sm font-medium text-muted-foreground px-3"></h2>

      <div className="bg-muted/50 border border-zinc-800 rounded-md py-4 max-h-[290px] h-full space-y-3.5">
        {projects.map((project, idx) => (
          <React.Fragment key={project.id}>
            <div className="px-3 flex flex-col space-y-1">
              <div className="flex items-center justify-between">
                <div className="inline-flex items-center gap-2 max-w-[180px] truncate">
                  <span
                    className="flex-shrink-0 w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: project.color }}
                  />
                  <span className="text-sm font-semibold truncate">
                    {project.name}
                  </span>
                </div>
                <span className="text-xs font-medium text-muted-foreground">
                  {project.progress}%
                </span>
              </div>

              <div className="w-full bg-zinc-700 rounded-full h-1 overflow-hidden">
                <div
                  className="h-1"
                  style={{
                    width: `${project.progress}%`,
                    backgroundColor: project.color,
                    transition: "width 0.3s ease",
                  }}
                />
              </div>
            </div>

            {/* Separator except last item */}
            {idx !== projects.length && <Separator className="bg-muted/50" />}
          </React.Fragment>
        ))}

        {projects.length === 0 && (
          <p className="text-xs text-muted-foreground text-center">
            No projects found.
          </p>
        )}
      </div>
    </div>
  );
};

export default ProjectProgress;
