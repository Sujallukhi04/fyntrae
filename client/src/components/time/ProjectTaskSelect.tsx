import React from "react";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { ChevronRight } from "lucide-react";
import type { ProjectWithTasks } from "@/types/project";
import { useAuth } from "@/providers/AuthProvider";

interface ProjectTaskSelectorProps {
  selectedValue: string;
  onChange: (value: string) => void;
  projectsWithTasks: ProjectWithTasks[];
  runningTimer: boolean;
  className?: string;
}

const ProjectTaskSelector: React.FC<ProjectTaskSelectorProps> = ({
  selectedValue,
  onChange,
  projectsWithTasks,
  runningTimer,
  className = "",
}) => {
  const { user } = useAuth();
  const getSelectedDisplay = () => {
    if (!selectedValue || selectedValue === "no-project") {
      return (
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-muted-foreground" />
          <span className="font-semibold text-sm">No Project</span>
        </div>
      );
    }

    if (selectedValue.includes(":")) {
      const [projectId, taskId] = selectedValue.split(":");
      const project = projectsWithTasks.find((p) => p.id === projectId);
      const task = project?.tasks?.find((t) => t.id === taskId);

      if (project && task) {
        return (
          <div className="flex items-center gap-2">
            <span
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: project.color || "#6B7280" }}
            />
            <span className="flex items-center gap-1 font-semibold text-sm truncate max-w-[120px]">
              <span className="truncate">{project.name}</span>
              <ChevronRight className="size-4 shrink-0" />
              <span className="truncate">{task.name}</span>
            </span>
          </div>
        );
      }
    }

    const project = projectsWithTasks.find((p) => p.id === selectedValue);
    if (project) {
      return (
        <div className="flex items-center gap-2">
          <span
            className="h-3 w-3 rounded-full"
            style={{ backgroundColor: project.color || "#6B7280" }}
          />
          <span className="font-semibold text-sm truncate max-w-[120px]">
            {project.name}
          </span>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-2">
        <span className="h-3 w-3 rounded-full bg-muted-foreground" />
        <span className="font-semibold text-sm">No Project</span>
      </div>
    );
  };

  return (
    <Select
      disabled={runningTimer}
      value={selectedValue || "no-project"}
      onValueChange={(val) => {
        onChange(val === "no-project" ? "" : val);
      }}
    >
      <SelectTrigger
        className={`min-w-[180px] max-w-full w-auto ${className} px-3 border border-muted bg-muted/10 rounded-md text-sm font-medium`}
      >
        <SelectValue>{getSelectedDisplay()}</SelectValue>
      </SelectTrigger>

      <SelectContent className="text-sm">
        <SelectItem value="no-project">
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-muted-foreground" />
            <span className="font-semibold">No Project</span>
          </div>
        </SelectItem>

        {projectsWithTasks
          .filter((project) => {
            const isMember = project.members?.some((m) => m === user?.id);
            const isSelected =
              selectedValue === project.id ||
              selectedValue.startsWith(`${project.id}:`);
            return isMember || isSelected;
          })
          .map((project) => {
            const selectedTaskId = selectedValue.includes(":")
              ? selectedValue.split(":")[1]
              : null;

            const filteredTasks = project.tasks.filter((task) => {
              if (task.status !== "DONE") return true;
              return task.id === selectedTaskId;
            });

            return (
              <div key={project.id}>
                <SelectItem value={project.id}>
                  <div className="flex items-center gap-2">
                    <span
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: project.color || "#6B7280" }}
                    />
                    <span className="font-semibold">{project.name}</span>
                  </div>
                </SelectItem>

                {filteredTasks.map((task) => (
                  <SelectItem
                    key={`${project.id}:${task.id}`}
                    value={`${project.id}:${task.id}`}
                  >
                    <div className="flex items-center gap-2 pl-4">
                      <span className="h-2 w-2 rounded-full bg-muted-foreground" />
                      <span className="font-medium text-muted-foreground">
                        {task.name}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </div>
            );
          })}
      </SelectContent>
    </Select>
  );
};

export default ProjectTaskSelector;
