import React, { useEffect, useState } from "react";
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
import { Switch } from "@/components/ui/switch";
import { CalendarIcon } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn, formatDate } from "@/lib/utils";
import { toast } from "sonner";
import { useOrganization } from "@/providers/OrganizationProvider";

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    description: string;
    isPublic: boolean;
    publicUntil?: Date;
  }) => void;
  loading?: boolean;
  mode: "add" | "edit";
  initialData?: {
    name: string;
    description: string;
    isPublic: boolean;
    publicUntil?: string;
  };
}

export const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  loading = false,
  mode,
  initialData,
}) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [publicUntil, setPublicUntil] = useState<Date | null>(null);
  const { organization } = useOrganization();

  useEffect(() => {
    if (isOpen && initialData) {
      setName(initialData.name);
      setDescription(initialData.description);
      setIsPublic(initialData.isPublic);
      setPublicUntil(
        initialData.publicUntil ? new Date(initialData.publicUntil) : null
      );
    }

    if (isOpen && !initialData) {
      setName("");
      setDescription("");
      setIsPublic(false);
      setPublicUntil(null);
    }
  }, [isOpen, initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedName = name.trim();
    if (!trimmedName) {
      toast.error("Report name is required.");
      return;
    }

    if (isPublic) {
      if (!publicUntil) {
        toast.error("Please select a public expiry date.");
        return;
      }

      const now = new Date();
      if (publicUntil < now) {
        toast.error("Expiry date must be in the future.");
        return;
      }
    }

    onSubmit({
      name: trimmedName,
      description: description.trim(),
      isPublic,
      publicUntil: publicUntil ?? undefined,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md w-full">
        <DialogHeader>
          <DialogTitle>
            {mode === "add" ? "Create Report" : "Edit Report"}
          </DialogTitle>
          <DialogDescription />
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Report name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Report description"
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="isPublic">Make Public</Label>
            <Switch
              id="isPublic"
              checked={isPublic}
              onCheckedChange={(checked) => setIsPublic(checked)}
            />
          </div>

          {isPublic && (
            <div className="space-y-2">
              <Label>Public Expiry Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !publicUntil && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {publicUntil
                      ? formatDate(
                          publicUntil,
                          organization?.dateFormat || "MM/DD/YYYY"
                        )
                      : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={publicUntil ?? undefined}
                    onSelect={setPublicUntil}
                    disabled={(date) => date < new Date()}
                    initialFocus
                    required
                  />
                </PopoverContent>
              </Popover>
            </div>
          )}

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={loading}>
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={loading}>
              {mode === "add" ? "Create" : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
