import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

import type { Client, Member } from "@/types/oraganization";
import type { ProjectWithTasks, Tag } from "@/types/project";
import { cn } from "@/lib/utils";
import {
  Briefcase,
  Check,
  CheckCircle2,
  CircleCheck,
  Folder,
  TagIcon,
  Users2,
} from "lucide-react";
import { Input } from "../ui/input";

interface Props {
  open: boolean;
  onClose: () => void;
  clients: Client[];
  members: Member[];
  projects: ProjectWithTasks[];
  tags: Tag[];
  selected: {
    projectIds: string[];
    memberIds: string[];
    clientIds: string[];
    tagIds: string[];
    billable: boolean | undefined;
    taskIds: string[];
  };
  onApply: (filters: Props["selected"]) => void;
}

export default function ChartFilterModal({
  open,
  onClose,
  clients,
  members,
  projects,
  tags,
  selected,
  onApply,
}: Props) {
  const [filters, setFilters] = React.useState(selected);

  React.useEffect(() => {
    setFilters(selected);
  }, [selected, open]);

  const toggleItem = (key: keyof typeof filters, id: string) => {
    setFilters((prev) => {
      const existing = prev[key] as string[];
      const updated = existing.includes(id)
        ? existing.filter((i) => i !== id)
        : [...existing, id];
      return { ...prev, [key]: updated };
    });
  };

  const handleApply = () => {
    onApply(filters);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl p-6">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">
            Filter Time Data
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ">
          <div className="space-y-1">
            <Label className="text-sm text-muted-foreground">Members</Label>
            <FilterPopover
              label="Members"
              values={filters.memberIds}
              options={members.map((m) => ({
                id: m.id,
                name: m.user.name,
              }))}
              onToggle={(id) => toggleItem("memberIds", id)}
              icon={<Users2 className="w-4 h-4" />}
            />
          </div>

          <div className="space-y-1">
            <Label className="text-sm text-muted-foreground">Projects</Label>
            <FilterPopover
              label="Projects"
              values={filters.projectIds}
              options={projects.map((p) => ({ id: p.id, name: p.name }))}
              onToggle={(id) => toggleItem("projectIds", id)}
              icon={<Folder className="w-4 h-4" />}
            />
          </div>

          <div className="space-y-1">
            <Label className="text-sm text-muted-foreground">Clients</Label>
            <FilterPopover
              label="Clients"
              values={filters.clientIds}
              options={clients.map((c) => ({ id: c.id, name: c.name }))}
              onToggle={(id) => toggleItem("clientIds", id)}
              icon={<Folder className="w-4 h-4" />}
            />
          </div>

          {/* Tags */}
          <div className="space-y-1">
            <Label className="text-sm text-muted-foreground">Tags</Label>
            <FilterPopover
              label="Tags"
              values={filters.tagIds}
              options={tags.map((t) => ({ id: t.id, name: t.name }))}
              onToggle={(id) => toggleItem("tagIds", id)}
              icon={<TagIcon className="w-4 h-4" />}
            />
          </div>

          <div className="space-y-1">
            <Label className="text-sm text-muted-foreground">Tasks</Label>
            <ProjectTaskSelector
              projects={projects}
              selectedTaskIds={filters.taskIds}
              onToggleTask={(id) => toggleItem("taskIds", id)}
            />
          </div>

          {/* Billable */}
          <div className="space-y-1 w-full">
            <Label className="text-sm text-muted-foreground">Billable</Label>
            <Select
              onValueChange={(val) => {
                if (val === "all") {
                  setFilters((prev) => ({ ...prev, billable: undefined }));
                } else {
                  setFilters((prev) => ({
                    ...prev,
                    billable: val === "true",
                  }));
                }
              }}
              value={
                filters.billable === undefined
                  ? "all"
                  : filters.billable
                  ? "true"
                  : "false"
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Billable Filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="true">Billable</SelectItem>
                <SelectItem value="false">Non-Billable</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter className="mt-6 flex justify-between items-center">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleApply}>Apply Filters</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface FilterPopoverProps {
  label: string;
  values: string[];
  options: { id: string; name: string }[];
  onToggle: (id: string) => void;
  icon?: React.ReactNode;
  placeholder?: string;
}

export function FilterPopover({
  label,
  values,
  options,
  onToggle,
  icon,
  placeholder,
}: FilterPopoverProps) {
  const [search, setSearch] = React.useState("");

  const filteredOptions = options.filter((opt) =>
    opt.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="w-full justify-between text-sm px-3 py-2 gap-2"
        >
          <div className="flex items-center gap-2 truncate">
            {icon}
            <span>{label}</span>
          </div>
          {values.length > 0 && (
            <span className="ml-auto bg-muted text-muted-foreground text-xs px-2 py-0.5 rounded-full">
              {values.length}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-1.5">
        <Input
          placeholder={placeholder || `Search for a ${label.toLowerCase()}...`}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="mb-2 h-8 text-sm"
        />
        <ScrollArea className=" pr-1">
          {filteredOptions.length === 0 ? (
            <div className="text-sm text-muted-foreground px-2 py-4 text-center">
              No results found
            </div>
          ) : (
            filteredOptions.map((opt) => {
              const selected = values.includes(opt.id);
              return (
                <button
                  key={opt.id}
                  onClick={() => onToggle(opt.id)}
                  className={cn(
                    "w-full flex items-center gap-2 mb-1 px-2 py-2 text-sm rounded-md cursor-pointer transition-colors",
                    selected
                      ? "bg-muted text-foreground"
                      : "hover:bg-accent hover:text-accent-foreground  text-muted-foreground"
                  )}
                >
                  <div className="w-5 h-5 flex items-center justify-center rounded-full ">
                    <CircleCheck className="w-5 h-5 " />
                  </div>
                  <span className="truncate">{opt.name}</span>
                </button>
              );
            })
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}

interface ProjectTaskSelectorProps {
  projects: {
    id: string;
    name: string;
    color?: string;
    tasks: { id: string; name: string }[];
  }[];
  selectedTaskIds: string[];
  onToggleTask: (taskId: string) => void;
}

function ProjectTaskSelector({
  projects,
  selectedTaskIds,
  onToggleTask,
}: ProjectTaskSelectorProps) {
  const [search, setSearch] = React.useState("");

  // Flatten all tasks for search
  const allTasks = projects.flatMap((project) =>
    project.tasks.map((task) => ({
      ...task,
      projectId: project.id,
      projectName: project.name,
      projectColor: project.color,
    }))
  );

  // Filter tasks by search
  const filteredTasks = search
    ? allTasks.filter(
        (task) =>
          task.name.toLowerCase().includes(search.toLowerCase()) ||
          task.projectName.toLowerCase().includes(search.toLowerCase())
      )
    : allTasks;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="w-full justify-between text-sm px-3 py-2 gap-2"
        >
          <div className="flex items-center gap-2 truncate">
            <CheckCircle2 className="w-4 h-4" />
            <span>Tasks</span>
          </div>
          {selectedTaskIds.length > 0 && (
            <span className="ml-auto bg-muted text-muted-foreground text-xs px-2 py-0.5 rounded-full">
              {selectedTaskIds.length}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-58 p-2">
        <Input
          placeholder="Search for a task or project..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="mb-2 h-8 text-sm"
        />
        <ScrollArea className="max-h-64 pr-1">
          {filteredTasks.length === 0 ? (
            <div className="text-sm text-muted-foreground px-2 py-4 text-center">
              No tasks found
            </div>
          ) : (
            filteredTasks.map((task) => {
              const selected = selectedTaskIds.includes(task.id);
              return (
                <button
                  key={task.id}
                  type="button"
                  onClick={() => onToggleTask(task.id)}
                  className={cn(
                    "w-full flex items-center gap-2 mb-1 px-2 py-2 text-sm rounded-md cursor-pointer transition-colors",
                    selected
                      ? "bg-muted text-foreground"
                      : "hover:bg-accent hover:text-accent-foreground text-muted-foreground"
                  )}
                >
                  <Checkbox checked={selected} className="" />
                  <span className="truncate">{task.name}</span>
                  <span className="ml-auto text-xs text-muted-foreground">
                    {task.projectName}
                  </span>
                </button>
              );
            })
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
