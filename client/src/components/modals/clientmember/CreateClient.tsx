import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

interface AddEditClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (clientName: string) => Promise<void>;
  loading?: boolean;
  mode?: "create" | "edit";
  initialName?: string;
}

const AddEditClientModal: React.FC<AddEditClientModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  loading,
  mode = "create",
  initialName = "",
}) => {
  const [clientName, setClientName] = useState(initialName);

  useEffect(() => {
    if (isOpen) setClientName(initialName);
  }, [isOpen, initialName]);

  const handleSubmit = async () => {
    if (!clientName.trim()) return;
    try {
      await onSubmit(clientName.trim());
      setClientName("");
      onClose();
    } catch (error) {}
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {mode === "edit" ? "Edit Client" : "Add New Client"}
          </DialogTitle>
          <DialogDescription>
            {mode === "edit"
              ? "Update the client name below."
              : "Provide a name for the client you want to create."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="clientName">Client Name</Label>
            <Input
              id="clientName"
              placeholder="e.g. Acme Corp"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              disabled={loading}
            />
          </div>
        </div>

        <div className="flex justify-end space-x-2 pt-6">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!clientName.trim() || loading}
          >
            {loading
              ? mode === "edit"
                ? "Saving..."
                : "Creating..."
              : mode === "edit"
              ? "Save Changes"
              : "Create Client"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddEditClientModal;
