import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Minus, Plus, User } from "lucide-react";
import { type OrganizationMember } from "@/types/project";
import { toast } from "sonner";

interface AddProjectMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (memberId: string, billableRate: number) => void;
  organizationMembers: OrganizationMember[];
  loading?: boolean;
  currency?: string;

  // Enhanced Props for Edit Mode
  mode?: "add" | "edit";
  initialMemberId?: string;
  initialBillableRate?: number | null;
  initialMemberName?: string;
}

const AddProjectMemberModal: React.FC<AddProjectMemberModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  organizationMembers,
  loading = false,
  currency = "USD",
  mode = "add",
  initialMemberId = "",
  initialBillableRate = 0,
  initialMemberName = "",
}) => {
  const [selectedMemberId, setSelectedMemberId] = useState<string>("");
  const [billableRate, setBillableRate] = useState<number>(0);

  // Reset form when modal opens/closes or mode changes
  useEffect(() => {
    if (isOpen) {
      if (mode === "edit") {
        setSelectedMemberId(initialMemberId);
        setBillableRate(initialBillableRate ?? 0);
      } else {
        setSelectedMemberId("");
        setBillableRate(0);
      }
    }
  }, [isOpen, mode, initialMemberId, initialBillableRate]);

  const handleSubmit = () => {
    if (!selectedMemberId) {
      toast.error("Please select a member.");
      return;
    }

    if (isNaN(billableRate) || billableRate < 0) {
      toast.error("Billable rate must be a non-negative number.");
      return;
    }
    onSubmit(selectedMemberId, billableRate);
    handleClose();
  };

  const handleClose = () => {
    setSelectedMemberId("");
    setBillableRate(0);
    onClose();
  };

  const incrementRate = () => setBillableRate((prev) => prev + 100);
  const decrementRate = () =>
    setBillableRate((prev) => Math.max(0, prev - 100));

  // Find the selected member for display
  const selectedMember = organizationMembers.find(
    (member) => member.id === selectedMemberId
  );

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md bg-background border-border">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-foreground">
            {mode === "edit" ? "Edit Project Member" : "Add Project Member"}
          </DialogTitle>
          <DialogDescription></DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Member Selection */}
          <div className="space-y-2">
            <Label htmlFor="member-select" className="text-sm font-medium">
              Select Member
            </Label>
            <Select
              value={selectedMemberId}
              onValueChange={setSelectedMemberId}
              disabled={mode === "edit"} // Disable selection when editing
            >
              <SelectTrigger className="w-full bg-background border-border">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <SelectValue placeholder="Select a member...">
                    {mode === "edit" && initialMemberName
                      ? initialMemberName
                      : selectedMember?.user.name || "Select a member..."}
                  </SelectValue>
                </div>
              </SelectTrigger>
              <SelectContent>
                {organizationMembers.map((member) => (
                  <SelectItem key={member.id} value={member.id}>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">
                        {member.user.name}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Billable Rate */}
          <div className="space-y-2">
            <Label htmlFor="billable-rate" className="text-sm font-medium">
              Billable Rate
            </Label>

            <div className="relative w-full max-w-[180px] h-10">
              {/* Minus Button */}
              <button
                type="button"
                onClick={decrementRate}
                disabled={billableRate <= 0}
                className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground disabled:opacity-50"
              >
                <Minus className="h-4 w-4" />
              </button>

              {/* Input Field */}
              <Input
                id="billable-rate"
                type="text"
                value={`${billableRate} ${currency}`}
                onChange={(e) => {
                  const numericValue = parseFloat(
                    e.target.value.replace(/[^\d.]/g, "")
                  );
                  setBillableRate(isNaN(numericValue) ? 0 : numericValue);
                }}
                className="w-full h-full text-center bg-background border border-border px-8"
              />

              {/* Plus Button */}
              <button
                type="button"
                onClick={incrementRate}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        <DialogFooter className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={loading}
            className="bg-background border-border hover:bg-muted"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!selectedMemberId || loading}
            className="bg-primary hover:bg-primary/90"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {mode === "add" ? "Save Changes" : "Add Project Member"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddProjectMemberModal;
