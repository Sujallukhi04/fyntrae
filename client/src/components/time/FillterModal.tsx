import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

interface Tag {
  id: string;
  name: string;
}
interface Project {
  id: string;
  name: string;
}
interface Task {
  id: string;
  name: string;
  projectId?: string;
}

interface FilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: () => void;
  tags: Tag[];
  projectsWithTasks: Project[];
  tasks: Task[];
  billable: string;
  setBillable: (val: string) => void;
  selectedTag: string;
  setSelectedTag: (val: string) => void;
  selectedProject: string;
  setSelectedProject: (val: string) => void;
  selectedTask: string;
  setSelectedTask: (val: string) => void;
}

const FilterModal: React.FC<FilterModalProps> = ({
  isOpen,
  onClose,
  onApply,
  tags,
  projectsWithTasks,
  tasks,
  billable,
  setBillable,
  selectedTag,
  setSelectedTag,
  selectedProject,
  setSelectedProject,
  selectedTask,
  setSelectedTask,
}) => (
  <Dialog open={isOpen} onOpenChange={onClose}>
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Filter Time Entries</DialogTitle>
      </DialogHeader>

      <div className="grid gap-4 py-2">
        {/* Billable Filter */}
        <div className="grid gap-1 w-full">
          <Label htmlFor="billable">Billable</Label>
          <Select value={billable} onValueChange={setBillable}>
            <SelectTrigger id="billable" className="w-full">
              <SelectValue placeholder="Select billable status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="true">Billable</SelectItem>
              <SelectItem value="false">Non-Billable</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Project Filter */}
        <div className="grid gap-1">
          <Label htmlFor="project">Project</Label>
          <Select value={selectedProject} onValueChange={setSelectedProject}>
            <SelectTrigger id="project" className="w-full">
              <SelectValue placeholder="Select a project" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Projects</SelectItem>
              {projectsWithTasks.map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Task Filter */}
        <div className="grid gap-1">
          <Label htmlFor="task">Task</Label>
          <Select value={selectedTask} onValueChange={setSelectedTask}>
            <SelectTrigger id="task" className="w-full">
              <SelectValue placeholder="Select a task" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Tasks</SelectItem>
              {tasks.map((task) => (
                <SelectItem key={task.id} value={task.id}>
                  {task.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Tag Filter */}
        <div className="grid gap-1">
          <Label htmlFor="tag">Tag</Label>
          <Select value={selectedTag} onValueChange={setSelectedTag}>
            <SelectTrigger id="tag" className="w-full">
              <SelectValue placeholder="Select a tag" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Tags</SelectItem>
              {tags.map((tag) => (
                <SelectItem key={tag.id} value={tag.id}>
                  {tag.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <DialogFooter>
        <Button type="button" onClick={onApply}>
          Apply Filters
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);

export default FilterModal;
