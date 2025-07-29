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
import { Ban, Loader2 } from "lucide-react";
import { TagSelectorPopover } from "./TagSelector";
import ProjectTaskSelector from "./ProjectTaskSelect";
import type { ProjectWithTasks, TimeEntry } from "@/types/project";
import { useOrganization } from "@/providers/OrganizationProvider";

interface Tag {
  id: string;
  name: string;
}

interface TimeEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    description?: string;
    projectId?: string;
    taskId?: string;
    billable: boolean;
    tagIds?: string[];
  }) => Promise<void>;
  loading?: boolean;
  projectWithTasks: ProjectWithTasks[];
  getCurrencyIcon: (
    currency: string | undefined,
    colorClass: string
  ) => React.ReactNode;
  runningTimer: boolean;
  tagLoading: boolean;
  tags: Tag[];
}

export const EditTimeEntryModal: React.FC<TimeEntryModalProps> = ({
  isOpen,
  getCurrencyIcon,
  onClose,
  onSubmit,
  loading = false,
  projectWithTasks,
  tags,
  runningTimer,
  tagLoading = false,
}) => {
  const [projectId, setProjectId] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [billable, setBillable] = useState(false);
  const [description, setDescription] = useState("");
  const { organization } = useOrganization();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const projectid = projectId.split(":")[0] || "";
    const taskId = projectId.split(":")[1] || "";

    onSubmit({
      description,
      ...(projectId && { projectId: projectid }),
      ...(taskId && { taskId }),
      tagIds: selectedTags,
      billable,
    });

    setDescription("");
    setProjectId("");
    setSelectedTags([]);
    setBillable(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md w-full">
        <DialogHeader>
          <DialogTitle>Update Time Entrys</DialogTitle>
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
                  setSelectedTags((prev) => prev.filter((id) => id !== tagId));
                }
              }}
              onAddTag={() => console.log("Add Tag clicked")}
              onCreateFirstTag={() => console.log("Create First Tag clicked")}
              tagLoading={tagLoading}
              runningTimer={!!runningTimer}
              text="Tags"
              className="w-[50%] md:w-auto"
            />
            <Select
              value={billable ? "billable" : "Non-Billable"}
              onValueChange={(value) => setBillable(value === "billable")}
            >
              <SelectTrigger className="h-8 px-2 border border-muted rounded-md bg-muted/10 text-sm font-medium w-[50%] md:w-auto">
                <SelectValue>
                  <div className="flex items-center gap-2">
                    {billable ? (
                      getCurrencyIcon(organization?.currency, "text-green-600")
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
                    {getCurrencyIcon(organization?.currency, "text-green-600")}
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

          <DialogFooter className="mt-4">
            <DialogClose asChild>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
