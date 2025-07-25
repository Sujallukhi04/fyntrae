import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import type { Tasks, TaskData } from "@/types/project";

interface AddEditTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: TaskData) => Promise<void>;
  loading?: boolean;
  mode: "add" | "edit";
  initialData?: Tasks | null;
}

const AddEditTaskModal: React.FC<AddEditTaskModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  loading = false,
  mode,
  initialData,
}) => {
  const [formData, setFormData] = useState<TaskData>({
    name: "",
    estimatedTime: undefined,
  });

  const [errors, setErrors] = useState<{
    name?: string;
    estimatedTime?: string;
  }>({});

  useEffect(() => {
    if (mode === "edit" && initialData) {
      setFormData({
        name: initialData.name,
        estimatedTime: initialData.estimatedTime || undefined,
      });
    } else {
      setFormData({
        name: "",
        estimatedTime: undefined,
      });
    }
    setErrors({});
  }, [mode, initialData, isOpen]);

  const validateForm = () => {
    const newErrors: typeof errors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Task name is required";
    } else if (formData.name.trim().length > 255) {
      newErrors.name = "Task name must be less than 255 characters";
    }

    if (formData.estimatedTime !== undefined && formData.estimatedTime < 0) {
      newErrors.estimatedTime = "Estimated time cannot be negative";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      await onSubmit(formData);
      onClose();
    } catch (error) {
      console.error("Failed to submit task:", error);
    }
  };

  const handleInputChange = <K extends keyof TaskData>(
    field: K,
    value: TaskData[K]
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: undefined,
      }));
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {mode === "add" ? "Add New Task" : "Edit Task"}
            </DialogTitle>
            <DialogDescription>
              {mode === "add"
                ? "Create a new task for this project."
                : "Update the task details."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="taskName">Task Name *</Label>
              <Input
                id="taskName"
                placeholder="Enter task name"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                className={errors.name ? "border-red-500" : ""}
              />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="estimatedTime">Estimated Time (hours)</Label>
              <Input
                id="estimatedTime"
                type="number"
                min="0"
                placeholder="Enter estimated time in hours"
                value={formData.estimatedTime || ""}
                onChange={(e) =>
                  handleInputChange(
                    "estimatedTime",
                    e.target.value ? Number(e.target.value) : undefined
                  )
                }
                className={errors.estimatedTime ? "border-red-500" : ""}
              />
              {errors.estimatedTime && (
                <p className="text-sm text-red-500">{errors.estimatedTime}</p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {mode === "add" ? "Create Task" : "Update Task"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddEditTaskModal;
