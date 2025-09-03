import React, { type ReactNode } from "react";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface PersistentModalProps {
  open: boolean;
  onOpenChange: (val: boolean) => void;
  title: string;
  description?: ReactNode;
  onConfirm: () => Promise<void> | void;
  onCancel?: () => void;
  loading?: boolean;
  confirmLabel?: string;
  cancelLabel?: string;
  triggerButtonLabel?: string;
  triggerButtonClassName?: string;
}

const PersistentModal: React.FC<PersistentModalProps> = ({
  open,
  onOpenChange,
  title,
  description,
  onConfirm,
  onCancel,
  loading = false,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  triggerButtonLabel = "Open Modal",
  triggerButtonClassName = "w-fit",
}) => {
  const handleConfirm = async () => {
    try {
      await onConfirm();
      onOpenChange(false); // Close only after successful confirm
    } catch (error) {
      console.error("Confirm failed:", error);
      // Keep modal open on error
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button className={triggerButtonClassName}>{triggerButtonLabel}</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button disabled={loading} onClick={handleConfirm}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PersistentModal;
