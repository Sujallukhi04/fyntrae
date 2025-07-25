import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { format, parse, set } from "date-fns";
import { Ban, CalendarIcon, Clock, DollarSign, Loader2 } from "lucide-react";
import { TagSelectorPopover } from "./TagSelector";
import ProjectTaskSelector from "./ProjectTaskSelect";
import type { ProjectWithTasks, TimeEntry } from "@/types/project";
import { useOrganization } from "@/providers/OrganizationProvider";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { cn } from "@/lib/utils";
import { Calendar } from "../ui/calendar";
import { toast } from "sonner";

interface Project {
  id: string;
  name: string;
  color?: string;
}

interface Tag {
  id: string;
  name: string;
}

interface TimeEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    description: string;
    projectId?: string;
    taskId?: string;
    start: Date;
    end: Date;
    tagIds: string[];
    billable: boolean;
  }) => Promise<void>;
  loading?: boolean;
  projectWithTasks: ProjectWithTasks[];
  getCurrencyIcon: (
    currency: string | undefined,
    colorClass: string
  ) => React.ReactNode;
  runningTimer: boolean;
  mode: "add" | "edit";
  tagLoading: boolean;
  tags: Tag[];
  initialData?: TimeEntry | null;
}

export const TimeEntryModal: React.FC<TimeEntryModalProps> = ({
  isOpen,
  getCurrencyIcon,
  onClose,
  onSubmit,
  loading = false,
  projectWithTasks,
  tags,
  runningTimer,
  mode,
  initialData,
  tagLoading = false,
}) => {
  const [projectId, setProjectId] = useState("");
  const [startTime, setStartTime] = useState(new Date());
  const [endTime, setEndTime] = useState(new Date());
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [billable, setBillable] = useState(initialData?.billable ?? false);
  const [description, setDescription] = useState("");
  const { organization } = useOrganization();

  useEffect(() => {
    if (initialData) {
      setDescription(initialData.description);
      setProjectId(initialData?.projectId || "");
      setStartTime(initialData.start);
      setEndTime(initialData.end);
      setSelectedTags(initialData.tags);
      setBillable(initialData.billable ?? false);
    }

    if (isOpen && !initialData) {
      setDescription("");
      setProjectId("");
      setStartTime(new Date());
      setEndTime(new Date());
      setSelectedTags([]);
      setBillable(false);
    }
  }, [isOpen, initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (startTime >= endTime) {
      toast.error("Start time must be before end time.");
      return;
    }

    if (endTime > new Date()) {
      toast.error("End time cannot be in the future.");
      return;
    }

    const projectid = projectId.split(":")[0] || "";
    const taskId = projectId.split(":")[1] || "";

    onSubmit({
      description,
      ...(projectId && { projectId: projectid }),
      ...(taskId && { taskId }),
      start: startTime,
      end: endTime,
      tagIds: selectedTags,
      billable,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md w-full">
        <DialogHeader>
          <DialogTitle>
            {mode === "add" ? "Create manual time entry" : "Edit time entry"}
          </DialogTitle>
          <DialogDescription></DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="flex-1 flex flex-col gap-2">
            <Label htmlFor="name">Description</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What did you work on?"
              className="py-4 w-full"
            />
          </div>
          <div className="flex-1 flex flex-col md:flex-row gap-2">
            <div className="flex-1">
              <ProjectTaskSelector
                selectedValue={projectId}
                onChange={setProjectId}
                projectsWithTasks={projectWithTasks}
                runningTimer={!!runningTimer}
                className="min-w-[180px] w-full"
              />
            </div>

            <div className="flex-1 flex gap-2">
              <TagSelectorPopover
                tags={tags}
                selectedTags={selectedTags}
                onTagToggle={(tagId, checked) => {
                  if (checked) {
                    setSelectedTags((prev) => [...prev, tagId]);
                  } else {
                    setSelectedTags((prev) =>
                      prev.filter((id) => id !== tagId)
                    );
                  }
                }}
                onAddTag={() => console.log("Add Tag clicked")}
                onCreateFirstTag={() => console.log("Create First Tag clicked")}
                tagLoading={tagLoading}
                runningTimer={!!runningTimer}
                text="Tags"
              />
              <Select
                value={billable ? "billable" : "Non-Billable"}
                onValueChange={(value) => setBillable(value === "billable")}
              >
                <SelectTrigger className="h-8 px-2 border border-muted rounded-md bg-muted/10 text-sm font-medium w-[140px]">
                  <SelectValue>
                    <div className="flex items-center gap-2">
                      {billable ? (
                        <>
                          {getCurrencyIcon(
                            organization?.currency,
                            billable
                              ? "text-green-600"
                              : "text-muted-foreground"
                          )}
                        </>
                      ) : (
                        <Ban className="h-4 w-4 text-muted-foreground" />
                      )}
                      <span>{billable ? "Billable" : "Non-Billable"}</span>
                    </div>
                  </SelectValue>
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="billable">
                    <div className="flex items-center gap-2">
                      {getCurrencyIcon(
                        organization?.currency,
                        billable ? "text-green-600" : "text-muted-foreground"
                      )}
                      <span>Billable</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="non-billable">
                    <div className="flex items-center gap-2">
                      <Ban className="h-4 w-4 text-muted-foreground" />
                      <span>Non-Billable</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Start Time Picker */}
            <div className="flex flex-col gap-2">
              <Label>Start Time</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !startTime && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(startTime, "PPP p")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto flex flex-col gap-2">
                  <Calendar
                    mode="single"
                    selected={startTime}
                    onSelect={(date) => {
                      if (date) {
                        setStartTime((prev) =>
                          set(prev, {
                            year: date.getFullYear(),
                            month: date.getMonth(),
                            date: date.getDate(),
                          })
                        );
                      }
                    }}
                  />
                  <Input
                    type="time"
                    value={format(startTime, "HH:mm")}
                    className="bg-background appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
                    onChange={(e) => {
                      const [hours, minutes] = e.target.value
                        .split(":")
                        .map(Number);
                      setStartTime((prev) => set(prev, { hours, minutes }));
                    }}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* End Time Picker */}
            <div className="flex flex-col gap-2">
              <Label>End Time</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !endTime && "text-muted-foreground"
                    )}
                  >
                    <Clock className="mr-2 h-4 w-4" />
                    {format(endTime, "PPP p")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto flex flex-col gap-2">
                  <Calendar
                    mode="single"
                    selected={endTime}
                    onSelect={(date) => {
                      if (date) {
                        setEndTime((prev) =>
                          set(prev, {
                            year: date.getFullYear(),
                            month: date.getMonth(),
                            date: date.getDate(),
                          })
                        );
                      }
                    }}
                  />
                  <Input
                    type="time"
                    className="bg-background appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
                    value={format(endTime, "HH:mm")}
                    onChange={(e) => {
                      const [hours, minutes] = e.target.value
                        .split(":")
                        .map(Number);
                      setEndTime((prev) => set(prev, { hours, minutes }));
                    }}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          <DialogFooter className="mt-4">
            <DialogClose asChild>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {mode === "add" ? "Create Time Entry" : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
