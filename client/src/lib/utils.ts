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
