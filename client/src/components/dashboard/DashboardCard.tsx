import React from "react";
import { cn } from "@/lib/utils";

interface DashboardCardProps {
  title: string;
  value: number | string;
  icon?: React.ComponentType<React.SVGProps<SVGSVGElement>>; // lucide-react icons fit here
  className?: string;
}

const DashboardCard = ({
  title,
  value,
  icon: Icon,
  className,
}: DashboardCardProps) => {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-lg border bg-muted/50 p-5",
        "hover:border-muted/50 transition-all duration-200",
        className
      )}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium  mb-2">{title}</p>
          <p className="text-2xl font-semibold">{value}</p>
        </div>
        {Icon && <Icon className="h-6 w-6 text-muted-foreground" />}
      </div>
    </div>
  );
};

export default DashboardCard;
