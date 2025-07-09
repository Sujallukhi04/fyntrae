import {
  AlertTriangle,
  Ban,
  CircleCheck,
  Clock,
  Trash2,
  XCircle,
} from "lucide-react";
import { CustomAlertDialog } from "./CustomAlertDialog";
import GeneralModal from "./Normalmodal";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import type { Member } from "@/types/oraganization";
import { Label } from "@radix-ui/react-dropdown-menu";
import { Input } from "../ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { useState } from "react";

interface DeleteInviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  isLoading: boolean;
  email: string;
}

export const DeleteInviteModal: React.FC<DeleteInviteModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  isLoading,
  email,
}) => (
  <CustomAlertDialog
    open={isOpen}
    onOpenChange={onClose}
    icon={<Trash2 className="h-6 w-6 text-red-600" />}
    title="Delete Invitation"
    description={
      <>
        Are you sure you want to delete the invitation for{" "}
        <span className="font-semibold text-foreground">{email}</span>? This
        action cannot be undone.
      </>
    }
    isLoading={isLoading}
    cancelText="Cancel"
    confirmText="Delete"
    onCancel={onClose}
    onConfirm={onConfirm}
  >
    <div className="bg-red-600/10 border border-red-600/20 rounded-md p-3">
      <p className="text-sm font-medium text-red-700 mb-2">
        This will permanently:
      </p>
      <ul className="text-sm text-red-600 space-y-1">
        <li>• Remove the invitation from the system</li>
        <li>• Prevent the user from joining with this invitation</li>
        <li>• Cannot be undone - you'll need to send a new invitation</li>
      </ul>
    </div>
  </CustomAlertDialog>
);

interface DeactivateMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  isLoading: boolean;
  member: Member | null;
}

export const DeactivateMemberModal: React.FC<DeactivateMemberModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  isLoading,
  member,
}) => (
  <GeneralModal
    open={isOpen}
    onOpenChange={onClose}
    title={member?.isActive ? "Deactivate Member" : "Activate Member"}
    description={
      member?.isActive
        ? `Are you sure you want to deactivate ${
            member?.user?.name || member?.user?.email
          }? They will lose access to the organization but their data will be preserved.`
        : `Are you sure you want to activate ${
            member?.user?.name || member?.user?.email
          }? They will regain access to the organization.`
    }
    onConfirm={onConfirm}
    onCancel={onClose}
    loading={isLoading}
    confirmLabel={member?.isActive ? "Deactivate" : "Activate"}
    cancelLabel="Cancel"
    triggerButtonLabel=""
    triggerButtonClassName="hidden"
  />
);

interface ResendInviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  isLoading: boolean;
  email: string;
}

export const ResendInviteModal: React.FC<ResendInviteModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  isLoading,
  email,
}) => (
  <GeneralModal
    open={isOpen}
    onOpenChange={onClose}
    title="Resend Invitation"
    description={`Are you sure you want to resend the invitation to ${email}? This will generate a new invitation link and extend the expiration date.`}
    onConfirm={onConfirm}
    onCancel={onClose}
    loading={isLoading}
    confirmLabel="Resend"
    cancelLabel="Cancel"
    triggerButtonLabel=""
    triggerButtonClassName="hidden"
  />
);

interface ReinviteMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  isLoading: boolean;
  email: string;
}

export const ReinviteMemberModal: React.FC<ReinviteMemberModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  isLoading,
  email,
}) => (
  <GeneralModal
    open={isOpen}
    onOpenChange={onClose}
    title="Reinvite Member"
    description={`This member is currently inactive. Do you want to resend an invitation to ${
      email || "this member"
    } to rejoin the organization?`}
    onConfirm={onConfirm}
    onCancel={onClose}
    loading={isLoading}
    confirmLabel="Send Reinvite"
    cancelLabel="Cancel"
    triggerButtonLabel=""
    triggerButtonClassName="hidden"
  />
);

interface DeleteMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  isLoading: boolean;
  member: Member | null;
}

export const DeleteMemberModal: React.FC<DeleteMemberModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  isLoading,
  member,
}) => (
  <CustomAlertDialog
    open={isOpen}
    onOpenChange={onClose}
    icon={<AlertTriangle className="h-6 w-6 text-red-600" />}
    title="Remove Member"
    description={
      <>
        Are you sure you want to permanently remove{" "}
        <span className="font-semibold text-foreground">
          {member?.user?.name ?? member?.user?.email}
        </span>{" "}
        from this organization? This action cannot be undone.
      </>
    }
    isLoading={isLoading}
    cancelText="Cancel"
    confirmText="Remove Permanently"
    onCancel={onClose}
    onConfirm={onConfirm}
  >
    <div className="bg-red-600/10 border border-red-600/20 rounded-md p-3">
      <p className="text-sm font-medium text-red-700 mb-2">This action will:</p>
      <ul className="text-sm text-red-600 space-y-1">
        <li>• Remove all their access to the organization</li>
        <li>• Delete their time entries and project assignments</li>
        <li>• Remove them from all teams and projects</li>
        <li>• Permanently delete all their data</li>
      </ul>
    </div>
  </CustomAlertDialog>
);

interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemType: string;
  onPageChange: (page: number) => void;
}

export const PaginationControls: React.FC<PaginationControlsProps> = ({
  currentPage,
  totalPages,
  totalItems,
  itemType,
  onPageChange,
}) => (
  <div className="flex items-center justify-end md:justify-between">
    <div className="hidden md:flex md:items-center md:space-x-2">
      <p className="text-sm text-muted-foreground">
        Total {totalItems} {itemType}
      </p>
    </div>
    <div className="flex items-center space-x-2">
      <p className="text-sm text-muted-foreground">
        Page {totalPages === 0 ? 0 : currentPage} of {totalPages}
      </p>
      <div className="flex items-center space-x-1">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
        >
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages || totalPages === 0}
        >
          Next
        </Button>
      </div>
    </div>
  </div>
);

export const getStatusBadge = (status: string | boolean) => {
  if (status === "Active" || status === true) {
    return (
      <Badge variant="outline" className=" text-green-500 ">
        <CircleCheck className="w-4 h-4 mr-1" />
        Active
      </Badge>
    );
  } else if (status === "Inactive" || status === false) {
    return (
      <Badge variant="outline" className=" text-red-500 ">
        <XCircle className="w-3 h-3 mr-1" />
        Inactive
      </Badge>
    );
  } else if (status === "PENDING") {
    return (
      <Badge variant="outline" className=" text-yellow-500 ">
        <Clock className="w-3 h-3 mr-1" />
        Pending
      </Badge>
    );
  } else if (status === "EXPIRED") {
    return (
      <Badge variant="outline" className=" text-gray-600 ">
        <Ban className="w-3 h-3 mr-1" />
        Expired
      </Badge>
    );
  }
  return null;
};

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
        <DialogHeader>
          <DialogTitle>Invite Member</DialogTitle>
          <DialogDescription>
            Invite a new member to your organization with a specific role.
          </DialogDescription>
        </DialogHeader>
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
            {isInviting ? "Inviting..." : "Invite"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
