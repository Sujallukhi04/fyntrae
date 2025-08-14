import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatNumber } from "@/lib/utils";
import { useOrganization } from "@/providers/OrganizationProvider";
import { toast } from "sonner";

interface UpdateRateModalProps {
  isOpen: boolean;
  onClose: () => void;
  isLoading: boolean;
  onSubmit: () => void;
  name: string;
  forthing: string;
  rate: number;
}

export function UpdateRateModal({
  isOpen,
  onClose,
  isLoading,
  onSubmit,
  name,
  forthing,
  rate,
}: UpdateRateModalProps) {
  const { organization } = useOrganization();
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md text-center">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold">
            Update {forthing} Billable Rate
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground mt-2">
            The billable rate of <strong>{name}</strong> will be updated to{" "}
            <strong>
              {formatNumber(
                rate,
                organization?.numberFormat || "1,000.00",
                organization?.currency || "USD"
              )}
            </strong>
            <br />
            Do you want to update all existing time entries, where the{" "}
            {forthing} billable rate applies as well?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-4">
          <Button onClick={onSubmit} disabled={isLoading}>
            {isLoading ? "Updating..." : "Yes, update existing time entries"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
