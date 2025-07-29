import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useOrganization } from "@/providers/OrganizationProvider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Minus, Plus, CreditCard, TriangleAlert, Settings } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useNavigate, useParams } from "react-router";
import useAuthUser from "@/hooks/useAuthUser";
import type { OrganizationUpdateData } from "@/types/oraganization";
import { toast } from "sonner";
import { LoaderMain } from "@/components/Loader";
import GeneralModal from "@/components/modals/shared/Normalmodal";

// Configuration constants
const CURRENCY_OPTIONS = [
  { value: "INR", label: "INR - Indian Rupee" },
  { value: "USD", label: "USD - US Dollar" },
  { value: "EUR", label: "EUR - Euro" },
  { value: "GBP", label: "GBP - British Pound" },
];

const FORMAT_OPTIONS = {
  numberFormat: [
    { value: "1,000.00", label: "1,111.11" },
    { value: "1.000,00", label: "1.111,11" },
    { value: "1 000.00", label: "1 111.11" },
  ],
  dateFormat: [
    { value: "MM/DD/YYYY", label: "MM/DD/YYYY" },
    { value: "DD/MM/YYYY", label: "DD/MM/YYYY" },
    { value: "YYYY-MM-DD", label: "YYYY-MM-DD" },
  ],
  timeFormat: [
    { value: "12h", label: "12-hour clock" },
    { value: "24h", label: "24-hour clock" },
  ],
  intervalFormat: [
    { value: "12h", label: "12h 3m" },
    { value: "decimal", label: "12.5h" },
  ],
};

const SECTION_TYPES = {
  MAIN: "orgMain",
  BILLABLE: "orgBillable",
  FORMAT: "orgFormat",
} as const;

type SectionType = (typeof SECTION_TYPES)[keyof typeof SECTION_TYPES];

interface LoaderState {
  nameLoading: boolean;
  currencyLoading: boolean;
  dateFormatLoading: boolean;
}

interface FormData {
  name: string;
  currency: "INR" | "USD" | "EUR" | "GBP";
  dateFormat: "MM/DD/YYYY" | "DD/MM/YYYY" | "YYYY-MM-DD";
  timeFormat: "12h" | "24h";
  intervalFormat: "12h" | "decimal";
  numberFormat: "1,000.00" | "1.000,00" | "1 000.00";
  billableRates: number;
  employeesCanSeeBillableRates: boolean;
}
// Reusable components
const SectionHeader = ({
  title,
  description,
}: {
  title: string;
  description: string;
}) => (
  <div className="md:w-[35%]">
    <h1 className="text-lg font-bold">{title}</h1>
    <h1 className="text-sm">{description}</h1>
  </div>
);

const SectionCard = ({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <Card className={`md:w-[65%] pt-6 pb-5 ${className}`}>
    <CardContent className="px-0">{children}</CardContent>
  </Card>
);

const FormField = React.memo(
  ({
    label,
    children,
    className = "px-6",
  }: {
    label: string;
    children: React.ReactNode;
    className?: string;
  }) => (
    <div className={`space-y-2 ${className}`}>
      <Label>{label}</Label>
      {children}
    </div>
  )
);

const SelectField = ({
  label,
  value,
  options,
  onChange,
  className = "px-6",
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
  className?: string;
}) => (
  <FormField label={label} className={className}>
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-full">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  </FormField>
);

const SaveButton = ({
  isLoading,
  onClick,
  label = "Save",
}: {
  isLoading: boolean;
  onClick: () => void;
  label?: string;
}) => (
  <div className="flex justify-end px-6">
    <Button disabled={isLoading} onClick={onClick} className="w-fit">
      {isLoading ? "Saving..." : label}
    </Button>
  </div>
);

const TeamSetting = () => {
  const { orgId } = useParams();
  const { user } = useAuthUser();
  const navigate = useNavigate();

  const {
    organization,
    isLoading: isLoadingOrganization,
    error: organizationError,
    updateOrganization,
    deleteOrganization,
    isDeleting,
  } = useOrganization();

  const [showBillableRateDialog, setShowBillableRateDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [loader, setLoader] = useState<LoaderState>({
    nameLoading: false,
    currencyLoading: false,
    dateFormatLoading: false,
  });

  const [formData, setFormData] = useState<FormData>({
    name: "",
    currency: "INR",
    dateFormat: "MM/DD/YYYY",
    timeFormat: "12h",
    intervalFormat: "12h",
    numberFormat: "1,000.00",
    billableRates: 0,
    employeesCanSeeBillableRates: false,
  });

  useEffect(() => {
    if (organization) {
      setFormData({
        name: organization.name || "",
        currency: organization.currency || "INR",
        dateFormat: organization.dateFormat || "MM/DD/YYYY",
        timeFormat: organization.timeFormat || "12h",
        intervalFormat: organization.intervalFormat || "12h",
        numberFormat: organization.numberFormat || "1,000.00",
        billableRates: organization.billableRates ?? 0,
        employeesCanSeeBillableRates:
          organization.employeesCanSeeBillableRates || false,
      });
    }
  }, [organization]);

  const handleInputChange = useCallback(
    (field: keyof FormData, value: string | number | boolean) => {
      setFormData((prev) => ({
        ...prev,
        [field]: value,
      }));
    },
    []
  );

  const handleNumericInputChange = useCallback(
    (field: keyof FormData, value: string) => {
      // Remove any non-numeric characters except decimal point
      let numericValue = value.replace(/[^0-9.]/g, "");

      // Ensure only one decimal point
      const decimalCount = (numericValue.match(/\./g) || []).length;
      if (decimalCount > 1) {
        const parts = numericValue.split(".");
        numericValue = parts[0] + "." + parts.slice(1).join("");
      }

      // Limit to 2 decimal places
      const parts = numericValue.split(".");
      if (parts[1] && parts[1].length > 2) {
        numericValue = parts[0] + "." + parts[1].substring(0, 2);
      }

      // Convert to number, default to 0 if empty or invalid
      const numberValue = numericValue === "" ? 0 : Number(numericValue);

      setFormData((prev) => ({ ...prev, [field]: numberValue }));
    },
    []
  );

  const setLoaderState = useCallback(
    (section: SectionType, loading: boolean) => {
      setLoader((prev) => ({
        ...prev,
        nameLoading:
          section === SECTION_TYPES.MAIN ? loading : prev.nameLoading,
        dateFormatLoading:
          section === SECTION_TYPES.FORMAT ? loading : prev.dateFormatLoading,
        currencyLoading:
          section === SECTION_TYPES.BILLABLE ? loading : prev.currencyLoading,
      }));
    },
    []
  );

  const validateSectionData = (section: SectionType): string | null => {
    const allowedCurrencies = ["INR", "USD", "EUR", "GBP"];
    const allowedDateFormats = ["MM/DD/YYYY", "DD/MM/YYYY", "YYYY-MM-DD"];
    const allowedTimeFormats = ["12h", "24h"];
    const allowedIntervalFormats = ["12h", "decimal"];
    const allowedNumberFormats = ["1,000.00", "1.000,00", "1 000.00"];

    switch (section) {
      case SECTION_TYPES.MAIN:
        if (!formData.name?.trim()) return "Organization name is required.";
        if (!allowedCurrencies.includes(formData.currency))
          return "Invalid currency format.";
        break;

      case SECTION_TYPES.FORMAT:
        if (!allowedDateFormats.includes(formData.dateFormat))
          return "Invalid date format.";
        if (!allowedTimeFormats.includes(formData.timeFormat))
          return "Invalid time format.";
        if (!allowedIntervalFormats.includes(formData.intervalFormat))
          return "Invalid interval format.";
        if (!allowedNumberFormats.includes(formData.numberFormat))
          return "Invalid number format.";
        break;

      case SECTION_TYPES.BILLABLE:
        const rate = Number(formData.billableRates);
        if (isNaN(rate)) return "Billable rate must be a number.";
        if (rate < 0) return "Billable rate cannot be negative.";
        if (typeof formData.employeesCanSeeBillableRates !== "boolean")
          return "Invalid value for 'employeesCanSeeBillableRates'.";
        break;
    }

    return null;
  };

  const buildUpdateData = useCallback(
    (section: SectionType): OrganizationUpdateData => {
      if (!organization) throw new Error("Organization not found");

      const baseData = {
        name: organization.name,
        currency: organization.currency,
        dateFormat: organization.dateFormat,
        timeFormat: organization.timeFormat,
        intervalFormat: organization.intervalFormat,
        numberFormat: organization.numberFormat,
        billableRates: Number(organization.billableRates ?? 0), // Ensure it's a number
        employeesCanSeeBillableRates: organization.employeesCanSeeBillableRates,
      };

      switch (section) {
        case SECTION_TYPES.MAIN:
          return {
            ...baseData,
            name: formData.name,
            currency: formData.currency,
          };
        case SECTION_TYPES.FORMAT:
          return {
            ...baseData,
            dateFormat: formData.dateFormat,
            timeFormat: formData.timeFormat,
            intervalFormat: formData.intervalFormat,
            numberFormat: formData.numberFormat,
          };
        case SECTION_TYPES.BILLABLE:
          return {
            ...baseData,
            billableRates: Number(formData.billableRates), // Convert to number
            employeesCanSeeBillableRates: formData.employeesCanSeeBillableRates,
          };
        default:
          return baseData;
      }
    },
    [organization, formData]
  );

  const handleSave = useCallback(
    async (section: SectionType) => {
      if (!organization?.id) {
        toast.error("Organization not found");
        return;
      }

      const validationError = validateSectionData(section);
      if (validationError) {
        toast.error(validationError);
        return;
      }

      setLoaderState(section, true);

      try {
        const updateData = buildUpdateData(section);
        await updateOrganization(organization.id, updateData);
      } catch (error) {
        console.error("Error updating organization:", error);
      } finally {
        setLoaderState(section, false);
      }
    },
    [organization?.id, buildUpdateData, updateOrganization, setLoaderState]
  );

  const handleDeleteOrganization = useCallback(() => {
    setShowDeleteDialog(true);
  }, []);

  const confirmSaveBillableRate = useCallback(async () => {
    await handleSave(SECTION_TYPES.BILLABLE);
    setShowBillableRateDialog(false);
  }, [handleSave]);

  const confirmDeleteOrganization = useCallback(async () => {
    if (!organization?.id) {
      toast.error("Organization not found");
      return;
    }

    try {
      await deleteOrganization(organization.id);
      setShowDeleteDialog(false);
      navigate("/", { replace: true });
    } catch (error) {
      console.error("Error deleting organization:", error);
    }
  }, [organization?.id, deleteOrganization, navigate]);

  const handleBillableRateChange = useCallback((increment: number) => {
    setFormData((prev) => {
      let next = Number(prev.billableRates) + increment;
      if (next < 0) next = 0;
      next = Math.round(next * 100) / 100;
      return { ...prev, billableRates: next };
    });
  }, []);

  useEffect(() => {
    if ((organization && orgId !== organization.id) || organizationError) {
      navigate("/", { replace: true });
    }
  }, [orgId, organization, navigate, organizationError]);

  if (isLoadingOrganization) {
    return <LoaderMain />;
  }

  if (!organization || orgId !== organization.id) {
    return null;
  }

  return (
    <div className="mx-auto max-w-6xl py-2 w-full space-y-4">
      <div className="flex flex-col gap-3 py-2">
        <div className="flex flex-col items-start px-5 md:flex-row md:items-center md:justify-between gap-2 w-full">
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-muted-foreground" />
            <h1 className="font-semibold">Organization Settings</h1>
          </div>
        </div>
        <Separator />
      </div>

      {/* Organization Name Section */}
      <div className="flex gap-6 md:gap-12 w-full md:flex-row flex-col px-5">
        <SectionHeader
          title="Organization Name"
          description="The organization's name and owner information."
        />
        <SectionCard>
          <div className="space-y-6">
            <div className="flex items-center justify-between px-6">
              <div>
                <Label className="text-sm font-medium">
                  Organization Owner
                </Label>
                <div className="flex items-center space-x-3 mt-2">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src="/placeholder.svg" />
                    <AvatarFallback className="bg-blue-500 text-white">
                      {user?.name?.charAt(0)?.toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{user?.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {user?.email}
                    </p>
                  </div>
                </div>
              </div>
              <Button variant="outline" size="sm">
                <CreditCard className="h-4 w-4 mr-2" />
                Go to Billing
              </Button>
            </div>

            <FormField label="Organization Name">
              <Input
                id="org-name"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder="Enter organization name"
              />
            </FormField>

            <SelectField
              label="Currency"
              value={formData.currency}
              options={CURRENCY_OPTIONS}
              onChange={(value) => handleInputChange("currency", value)}
            />

            <Separator className="my-5" />
            <SaveButton
              isLoading={loader.nameLoading}
              onClick={() => handleSave(SECTION_TYPES.MAIN)}
            />
          </div>
        </SectionCard>
      </div>

      <Separator />

      {/* Billable Rate Section */}
      <div className="flex gap-6 md:gap-12 w-full md:flex-row flex-col px-5">
        <SectionHeader
          title="Billable Rate"
          description="Configure the default billable rate for the organization."
        />
        <SectionCard>
          <div className="space-y-6">
            <FormField label="Organization Billable Rate">
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBillableRateChange(-10)}
                >
                  <Minus className="h-4 w-4" />
                </Button>

                <div className="flex-1 relative">
                  <Input
                    type="number"
                    step="10"
                    min={0}
                    value={formData.billableRates}
                    onChange={(e) =>
                      handleNumericInputChange("billableRates", e.target.value)
                    }
                    className="text-center pr-12 bg-muted"
                    placeholder="0.00"
                  />
                  <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-muted-foreground">
                    {organization?.currency}
                  </span>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBillableRateChange(10)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </FormField>

            <div className="flex items-center space-x-2 px-6">
              <Checkbox
                id="show-rates"
                checked={formData.employeesCanSeeBillableRates}
                onCheckedChange={(checked) =>
                  handleInputChange("employeesCanSeeBillableRates", checked)
                }
              />
              <Label htmlFor="show-rates">
                Show Billable Rates to Employees
              </Label>
            </div>

            <Separator className="my-5" />

            <div className="flex justify-end px-6">
              <GeneralModal
                open={showBillableRateDialog}
                onOpenChange={setShowBillableRateDialog}
                title="Update Organization Billable Rate"
                description={`The organization billable rate will be updated to ${formData.currency} ${formData.billableRates}. Do you want to update all existing time entries where the organization rate applies?`}
                onConfirm={confirmSaveBillableRate}
                loading={loader.currencyLoading}
                confirmLabel="Save Changes"
                cancelLabel="Cancel"
                triggerButtonLabel="Save"
              />
            </div>
          </div>
        </SectionCard>
      </div>

      <Separator />

      {/* Format Settings Section */}
      <div className="flex gap-6 md:gap-12 w-full md:flex-row flex-col px-5">
        <SectionHeader
          title="Format Settings"
          description="Configure the default format settings for the organization."
        />
        <SectionCard>
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-6 px-6">
              <SelectField
                label="Number Format"
                value={formData.numberFormat}
                options={FORMAT_OPTIONS.numberFormat}
                onChange={(value) => handleInputChange("numberFormat", value)}
                className=""
              />

              <SelectField
                label="Date Format"
                value={formData.dateFormat}
                options={FORMAT_OPTIONS.dateFormat}
                onChange={(value) => handleInputChange("dateFormat", value)}
                className=""
              />

              <SelectField
                label="Time Format"
                value={formData.timeFormat}
                options={FORMAT_OPTIONS.timeFormat}
                onChange={(value) => handleInputChange("timeFormat", value)}
                className=""
              />

              <SelectField
                label="Time Duration Format"
                value={formData.intervalFormat}
                options={FORMAT_OPTIONS.intervalFormat}
                onChange={(value) => handleInputChange("intervalFormat", value)}
                className=""
              />
            </div>

            <Separator className="my-4" />
            <SaveButton
              isLoading={loader.dateFormatLoading}
              onClick={() => handleSave(SECTION_TYPES.FORMAT)}
            />
          </div>
        </SectionCard>
      </div>

      <Separator />

      {/* Delete Organization Section */}
      <div className="flex gap-6 md:gap-12 w-full md:flex-row flex-col px-5">
        <SectionHeader
          title="Delete Organization"
          description="Permanently delete this organization."
        />
        <Card className="md:w-[65%]">
          <CardContent>
            <Alert className="mb-4">
              <AlertDescription>
                Once a organization is deleted, all of its resources and data
                will be permanently deleted. Before deleting this organization,
                please download any data or information regarding this
                organization that you wish to retain.
              </AlertDescription>
            </Alert>
            <AlertDialog
              open={showDeleteDialog}
              onOpenChange={setShowDeleteDialog}
            >
              <AlertDialogTrigger asChild>
                <Button
                  onClick={handleDeleteOrganization}
                  className="w-fit cursor-pointer hover:bg-red-500/50 bg-red-500/80 text-white"
                >
                  DELETE ORGANIZATION
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle className="flex gap-3 items-center">
                    <span className="bg-red-400/20 rounded-full p-2 items-center justify-center">
                      <TriangleAlert
                        color="red"
                        className="flex items-center"
                      />
                    </span>
                    Delete Organization
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete "{organization?.name}"? This
                    action cannot be undone. All data, projects, and team
                    members associated with this organization will be
                    permanently removed.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={confirmDeleteOrganization}
                    disabled={isDeleting}
                    className="bg-red-500 text-white hover:bg-red-600"
                  >
                    {isDeleting
                      ? "Deleting Organization..."
                      : "Delete Organization"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TeamSetting;
