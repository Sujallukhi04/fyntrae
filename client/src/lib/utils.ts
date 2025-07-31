import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(value: number, format: string, currency: string) {
  // For simplicity, infer the format using a few basic patterns
  const usesComma = format.includes(",");
  const decimalPlaces = format.split(".")[1]?.length ?? 0;

  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: decimalPlaces,
    maximumFractionDigits: decimalPlaces,
    useGrouping: usesComma,
    style: "currency",
    currencyDisplay: "narrowSymbol",
    currency,
  }).format(value);
}

export const formatDurationFromSeconds = (seconds: number) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h}h ${m.toString().padStart(2, "0")}min`;
};

export const formatCost = (cost: number) => {
  return cost > 0 ? `${cost.toLocaleString("en-IN")} INR` : "--";
};
