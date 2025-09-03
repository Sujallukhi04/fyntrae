import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface AddTagModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (tagName: string) => Promise<void>;
  loading?: boolean;
}

const AddTagModal: React.FC<AddTagModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  loading,
}) => {
  const [tagName, setTagName] = useState("");

  useEffect(() => {
    if (isOpen) setTagName("");
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tagName.trim()) return;
    await onSubmit(tagName.trim());
    setTagName("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Tags</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Input
              id="tagName"
              placeholder="e.g. Urgent"
              value={tagName}
              onChange={(e) => setTagName(e.target.value)}
              disabled={loading}
              autoFocus
            />
          </div>
          <div className="flex justify-end space-x-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!tagName.trim() || loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Tag
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddTagModal;
