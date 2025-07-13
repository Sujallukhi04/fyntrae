import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useOrganization } from "@/providers/OrganizationProvider";
import { IndianRupee, Euro, DollarSign } from "lucide-react";
import type { Member } from "@/types/oraganization";

// Types
type RoleType = "OWNER" | "ADMIN" | "MANAGER" | "EMPLOYEE" | "PLACEHOLDER";

interface RoleOption {
  value: RoleType;
  label: string;
  desc: string;
}

interface FormState {
  role: RoleType;
  billableRate: string;
  isBillableRateDefault: boolean;
}

interface UpdateUserProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  selectedMember: Member | null;
  formState: FormState;
  handleChange: <K extends keyof FormState>(
    key: K,
    value: FormState[K]
  ) => void;
  loading?: boolean;
}

const roles: RoleOption[] = [
  {
    value: "OWNER",
    label: "Owner",
    desc: "The owner has full access of the organization. The owner is the only role that can: delete the organization, transfer the ownership to another user and access to the billing settings",
  },
  {
    value: "ADMIN",
    label: "Administrator",
    desc: "Administrator users can perform any action, except accessing the billing dashboard.",
  },
  {
    value: "MANAGER",
    label: "Manager",
    desc: "Managers have full access to all projects, time entries, etc. but cannot manage the organization.",
  },
  {
    value: "EMPLOYEE",
    label: "Employee",
    desc: "Employees have the ability to read, create, and update their own time entries.",
  },
  {
    value: "PLACEHOLDER",
    label: "Placeholder",
    desc: "Placeholder users can not do anything in the organization. They are not billed and can be used to remove users from the organization without deleting their time entries.",
  },
];

const UpdateUser: React.FC<UpdateUserProps> = ({
  isOpen,
  onClose,
  onSave,
  selectedMember,
  formState,
  handleChange,
  loading = false,
}) => {
  const selectedRole = roles.find((r) => r.value === formState.role);
  const { organization } = useOrganization();

  if (!selectedMember) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Update Member</DialogTitle>
          <DialogDescription>
            Modify this team member's role and billable rate.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Member Info */}
          <div className="flex items-center space-x-3 p-3 rounded-md border bg-muted/20">
            <Avatar className="h-10 w-10">
              {/* <AvatarImage src={selectedMember?.avatar} /> */}
              <AvatarFallback>
                {selectedMember?.user.name?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{selectedMember?.user?.name}</p>
              <p className="text-sm text-muted-foreground">
                {selectedMember?.user.email}
              </p>
            </div>
          </div>

          {/* Role Selection */}
          <div className="space-y-2">
            <Label>Role</Label>
            <Select
              value={formState.role}
              onValueChange={(val) => handleChange("role", val as RoleType)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                {roles.map((role) => (
                  <SelectItem key={role.value} value={role.value}>
                    {role.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedRole && (
              <p className="text-xs text-muted-foreground mt-1">
                {selectedRole.desc}
              </p>
            )}
          </div>

          <Separator className="my-2" />

          {/* Billable Rate */}
          <div className="space-y-3">
            <Label>Billable</Label>
            <Select
              value={formState.isBillableRateDefault ? "default" : "custom"}
              onValueChange={(val) => {
                const isDefault = val === "default";
                handleChange("isBillableRateDefault", isDefault);
                if (isDefault) handleChange("billableRate", "");
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select rate type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">Default Rate</SelectItem>
                <SelectItem value="custom">Custom Rate</SelectItem>
              </SelectContent>
            </Select>

            {!formState.isBillableRateDefault && (
              <div className="space-y-2">
                <Label htmlFor="rate">Billable Rate</Label>
                <div className="relative w-full">
                  <Input
                    id="rate"
                    type="number"
                    placeholder="0.00"
                    value={formState.billableRate}
                    onChange={(e) =>
                      handleChange("billableRate", e.target.value)
                    }
                    className="w-full pr-16"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground flex items-center gap-1 pointer-events-none">
                    {organization?.currency}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex justify-end space-x-2 pt-6">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={onSave} disabled={loading}>
            {loading ? "Updating..." : "Update Member"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UpdateUser;
