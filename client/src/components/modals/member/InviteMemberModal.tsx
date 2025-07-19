import { AlertDialogHeader } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Dialog } from "@radix-ui/react-dialog";
import { Label } from "@radix-ui/react-dropdown-menu";
import { Loader2 } from "lucide-react";
import { useState } from "react";

interface InviteMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInvite: (email: string, role: string) => Promise<void>;
  isInviting: boolean;
}

export const InviteMemberModal: React.FC<InviteMemberModalProps> = ({
  isOpen,
  onClose,
  onInvite,
  isInviting,
}) => {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("EMPLOYEE");

  const getFormat = (r: string) =>
    r.charAt(0).toUpperCase() + r.slice(1).toLowerCase();

  const handleSubmit = async () => {
    await onInvite(email, role);
    setEmail("");
    setRole("EMPLOYEE");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <AlertDialogHeader>
          <DialogTitle>Invite Member</DialogTitle>
          <DialogDescription>
            Invite a new member to your organization with a specific role.
          </DialogDescription>
        </AlertDialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="Member Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-md bg-background border border-muted-foreground/30 placeholder:text-muted-foreground/60"
            />
          </div>
          <div className="space-y-2">
            <Label>Role</Label>
            <div className="flex flex-col gap-2">
              {["ADMIN", "MANAGER", "EMPLOYEE"].map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  className={`text-left rounded-md border px-4 py-3 transition-colors ${
                    role === r
                      ? "border-primary bg-primary/10"
                      : "border-muted-foreground/20 hover:bg-muted/10"
                  }`}
                >
                  <div className="font-semibold">
                    {r === "ADMIN" ? "Administrator" : getFormat(r)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {r === "ADMIN" &&
                      "Administrator users can perform any action, except accessing the billing dashboard."}
                    {r === "MANAGER" &&
                      "Managers have full access to all projects, time entries, etc. but cannot manage the organization."}
                    {r === "EMPLOYEE" &&
                      "Employees have the ability to read, create, and update their own time entries."}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={onClose} disabled={isInviting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isInviting}>
            {isInviting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Invite
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
