// components/NoData.tsx
import type { LucideIcon } from "lucide-react";

type NoDataProps = {
  icon: LucideIcon;
  title: string;
  description?: string;
  className?: string;
};

const NoData = ({ icon: Icon, title, description, className }: NoDataProps) => (
  <div
    className={`flex flex-col items-center justify-center ${
      className ? className : "py-24"
    } text-center text-muted-foreground`}
  >
    <Icon className="w-10 h-10 mb-4" />
    <p className="text-base font-medium">{title}</p>
    {description && (
      <p className="text-sm text-muted-foreground">{description}</p>
    )}
  </div>
);

export default NoData;
