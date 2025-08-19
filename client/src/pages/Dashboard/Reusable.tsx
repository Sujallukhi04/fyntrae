import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import React from "react";

export const SectionHeader = ({
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

export const SectionCard = ({
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

export const FormField = React.memo(
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

export const SelectField = ({
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

export const SaveButton = ({
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
