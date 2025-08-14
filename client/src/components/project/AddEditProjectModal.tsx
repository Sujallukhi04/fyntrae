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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Circle, Loader2, Minus, Plus } from "lucide-react";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { formatNumber } from "@/lib/utils";
import { toast } from "sonner";

interface AddEditProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    color?: string;
    billable: boolean;
    billableRate: number | null;
    estimatedTime?: number;
    clientId?: string | null;
  }) => void;
  loading?: boolean;
  mode?: "add" | "edit";
  initialData?: {
    name: string;
    color?: string;
    billable?: boolean;
    billableRate?: number | null;
    estimatedTime?: number;
    clientId?: string | null;
  };
  clients?: { id: string; name: string; archivedAt: string }[];
  numberFormat?: string; // e.g. "1,000.00"
  currency?: string;
}

const COLORS = [
  "#F87171",
  "#FBBF24",
  "#34D399",
  "#60A5FA",
  "#A78BFA",
  "#F472B6",
  "#F59E42",
  "#6EE7B7",
  "#818CF8",
  "#F9A8D4",
  "#F43F5E",
  "#FDE68A",
  "#4ADE80",
  "#2563EB",
  "#7C3AED",
  "#EC4899",
  "#EA580C",
  "#2DD4BF",
  "#6366F1",
  "#D946EF",
  "#FACC15",
  "#A3E635",
  "#F3F4F6",
  "#64748B",
];

const AddEditProjectModal: React.FC<AddEditProjectModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  loading,
  mode = "add",
  initialData,
  clients = [],
  numberFormat = "1,000.00",
  currency = "INR",
}) => {
  const [name, setName] = useState(initialData?.name || "");
  const [color, setColor] = useState(initialData?.color || COLORS[0]);
  const [clientId, setClientId] = useState(initialData?.clientId || "");
  const [billable, setBillable] = useState(initialData?.billable ?? false);
  const [billableRate, setBillableRate] = useState<number | null>(() => {
    if (initialData?.billableRate === null) return null;
    if (typeof initialData?.billableRate === "number")
      return initialData.billableRate;
    return 0;
  });

  const [estimatedTime, setEstimatedTime] = useState(
    initialData?.estimatedTime !== undefined ? initialData.estimatedTime : 0
  );
  const [colorPickerOpen, setColorPickerOpen] = useState(false);

  useEffect(() => {
    if (isOpen && initialData) {
      setName(initialData.name || "");
      setColor(initialData.color || COLORS[0]);
      setClientId(initialData.clientId || "");
      setBillable(initialData.billable ?? false);
      setBillableRate(
        initialData.billableRate !== undefined ? initialData.billableRate : 0
      );
      setEstimatedTime(
        initialData.estimatedTime !== undefined ? initialData.estimatedTime : 0
      );
    }
    if (isOpen && !initialData) {
      setName("");
      setColor(COLORS[0]);
      setClientId("");
      setBillable(false);
      setBillableRate(0);
      setEstimatedTime(0);
    }
  }, [isOpen, initialData]);

  const incrementRate = () =>
    setBillableRate((prev) => (typeof prev === "number" ? prev + 100 : 100));

  const decrementRate = () =>
    setBillableRate((prev) =>
      typeof prev === "number" ? Math.max(0, prev - 100) : 0
    );

  const validateForm = () => {
    if (!name.trim()) {
      toast.error("Project name is required");
      return false;
    }

    if (name.length > 255) {
      toast.error("Project name must be less than 255 characters");
      return false;
    }

    if (billable && billableRate !== null && billableRate < 0) {
      toast.error("Rate must be 0 or more");
      return false;
    }

    if (estimatedTime !== undefined && estimatedTime < 0) {
      toast.error("Estimated time cannot be negative");
      return false;
    }

    return true;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    onSubmit({
      name,
      color,
      billable,
      billableRate: billable ? billableRate ?? null : null,
      estimatedTime,
      clientId: clientId?.trim() ? clientId : null,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md w-full">
        <DialogHeader>
          <DialogTitle>
            {mode === "add" ? "Create Project" : "Edit Project"}
          </DialogTitle>
          <DialogDescription>
            {/* Fill out the project details below. */}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Color and Name */}
          <div className="flex md:items-center md:flex-row flex-col gap-4">
            <div className="flex md:flex-row flex-1 gap-3">
              <div className="flex flex-col items-center gap-1.5">
                <Label htmlFor="color">Color</Label>
                <Popover
                  open={colorPickerOpen}
                  onOpenChange={setColorPickerOpen}
                >
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      className="w-10 h-10 rounded-full flex items-center justify-center"
                      style={{
                        background: "transparent",
                        border: `2px solid ${
                          colorPickerOpen ? "#6366F1" : "#444"
                        }`, // dark border
                        padding: "6px", // space between border and inner circle
                        boxSizing: "border-box",
                        transition: "border-color 0.2s, box-shadow 0.2s",
                      }}
                      aria-label="Pick color"
                    >
                      <span
                        className="w-6 h-6 rounded-full block"
                        style={{
                          background: color,
                          boxShadow: "0 0 0 1px #222", // subtle inner shadow for dark
                        }}
                      />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-56 p-3 grid grid-cols-6 gap-2 bg-popover">
                    {COLORS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        className={`w-7 h-7 rounded-full border-2 transition-all ${
                          color === c
                            ? "border-primary scale-110"
                            : "border-muted"
                        }`}
                        style={{ background: c }}
                        onClick={() => {
                          setColor(c);
                          setColorPickerOpen(false);
                        }}
                        aria-label={`Select color ${c}`}
                      />
                    ))}
                  </PopoverContent>
                </Popover>
              </div>
              <div className="flex-1 flex flex-col gap-2">
                <Label htmlFor="name">Project name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="The next big thing"
                  className="py-4 w-full"
                />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="client">Client</Label>
              <Select
                value={clientId ?? "no-client"}
                onValueChange={(val) =>
                  setClientId(val === "no-client" ? "" : val)
                }
              >
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="No Client" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="no-client">No Client</SelectItem>
                  {(mode === "add"
                    ? clients.filter((client) => !client.archivedAt)
                    : clients
                  ).map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex flex-col gap-1">
            {/* Billable */}
            <div className="flex gap-4 items-end">
              <div className="flex flex-col gap-1">
                <Label htmlFor="billable">Billable Default</Label>
                <Select
                  value={
                    !billable
                      ? "non-billable"
                      : billable && billableRate === null
                      ? "default"
                      : "billable"
                  }
                  onValueChange={(val) => {
                    if (val === "non-billable") {
                      setBillable(false);
                      setBillableRate(null);
                    } else if (val === "default") {
                      setBillable(true);
                      setBillableRate(null);
                    } else if (val === "billable") {
                      setBillable(true);
                      setBillableRate(0); // or retain existing value if you want
                    }
                  }}
                >
                  <SelectTrigger className="w-40 h-10 py-4.5 bg-background border rounded-md border-border mt-1">
                    <SelectValue placeholder="Select billing type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="non-billable">Non-billable</SelectItem>
                    <SelectItem value="billable">Billable</SelectItem>
                    <SelectItem value="default">Default Rate</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {/* Billable Rate */}
              {billable && billableRate !== null && (
                <div className="flex flex-col gap-1">
                  <Label htmlFor="billable-rate">Billable Rate</Label>
                  <div className="relative w-[160px] h-10">
                    {/* Minus Button */}
                    <button
                      type="button"
                      onClick={decrementRate}
                      disabled={billableRate ? billableRate <= 0 : true}
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
              )}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Info: New time entries for this project will{" "}
              {billable ? "" : "not "}be marked billable by default.
            </div>
          </div>

          {/* Estimated Time */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="estimatedTime">Time Estimated</Label>
            <div className="relative w-32">
              <Input
                id="estimatedTime"
                type="number"
                min={0}
                value={estimatedTime}
                onChange={(e) => setEstimatedTime(Number(e.target.value))}
                className="pr-12 appearance-none"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">
                hrs
              </span>
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
              {mode === "add" ? "Create Project" : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddEditProjectModal;
