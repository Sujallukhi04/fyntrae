import { clsx, type ClassValue } from "clsx";
import { toast } from "sonner";
import { twMerge } from "tailwind-merge";

export type NumberFormat = "1,000.00" | "1.000,00" | "1 000.00" | "1,00,000.00";
export type DateFormat = "MM/DD/YYYY" | "DD/MM/YYYY" | "YYYY-MM-DD";
export type TimeFormat = "12h" | "24h";
export type IntervalFormat = "12h" | "decimal";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(
  value: number,
  format: NumberFormat,
  currency: string
): string {
  if (typeof value !== "number" || isNaN(value)) {
    toast.error("Value must be a valid number");
    return "";
  }

  const formatterMap: Record<
    NumberFormat,
    { locale: string; options: Intl.NumberFormatOptions }
  > = {
    "1,000.00": {
      locale: "en-US",
      options: {
        style: "currency",
        currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
        useGrouping: true,
      },
    },
    "1.000,00": {
      locale: "de-DE",
      options: {
        style: "currency",
        currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
        useGrouping: true,
      },
    },
    "1 000.00": {
      locale: "fr-FR",
      options: {
        style: "currency",
        currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
        useGrouping: true,
      },
    },
    "1,00,000.00": {
      // Indian number format with lakh/crore grouping for INR
      locale: "en-IN",
      options: {
        style: "currency",
        currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
        useGrouping: true,
      },
    },
  };

  const formatConfig = formatterMap[format];
  if (!formatConfig) {
    toast.error("Unsupported number format");
    return "";
  }

  return new Intl.NumberFormat(
    formatConfig.locale,
    formatConfig.options
  ).format(value);
}

export const formatDurationFromSeconds = (seconds: number) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h}h ${m.toString().padStart(2, "0")}min`;
};

export const formatCost = (cost: number) => {
  return cost > 0 ? `${cost.toLocaleString("en-IN")} INR` : "--";
};

export function generateBlueTones(count: number): string[] {
  const baseHue = 210; // blue hue
  const lightnessStart = 35;
  const lightnessEnd = 70;
  const saturation = 85;

  return Array.from({ length: count }, (_, i) => {
    const lightness =
      lightnessStart +
      ((lightnessEnd - lightnessStart) * i) / Math.max(count - 1, 1);
    return `hsl(${baseHue}, ${saturation}%, ${lightness}%)`;
  });
}

export function formatRateNumber(
  value: number,
  format: NumberFormat
): string | undefined {
  if (typeof value !== "number" || isNaN(value)) {
    toast.error("Value must be a valid number");
    return;
  }

  const formatterMap: Record<
    NumberFormat,
    { locale: string; options: Intl.NumberFormatOptions }
  > = {
    "1,000.00": {
      locale: "en-US",
      options: { minimumFractionDigits: 2, maximumFractionDigits: 2 },
    },
    "1.000,00": {
      locale: "de-DE",
      options: { minimumFractionDigits: 2, maximumFractionDigits: 2 },
    },
    "1 000.00": {
      locale: "fr-FR",
      options: { minimumFractionDigits: 2, maximumFractionDigits: 2 },
    },
    "1,00,000.00": {
      locale: "en-IN",
      options: { minimumFractionDigits: 2, maximumFractionDigits: 2 },
    },
  };

  const formatConfig = formatterMap[format];
  if (!formatConfig) {
    toast.error("Unsupported number format");
    return;
  }

  return new Intl.NumberFormat(
    formatConfig.locale,
    formatConfig.options
  ).format(value);
}

export function formatDate(
  dateInput: Date | string,
  format: DateFormat
): string {
  let date: Date;

  if (typeof dateInput === "string") {
    date = new Date(dateInput);
  } else {
    date = dateInput;
  }

  if (!(date instanceof Date) || isNaN(date.getTime())) {
    console.log(date);
    toast.error("Invalid Date");
    return "";
  }
  const pad = (num: number): string => num.toString().padStart(2, "0");

  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1); // Months are 0-based
  const day = pad(date.getDate());

  switch (format) {
    case "MM/DD/YYYY":
      return `${month}/${day}/${year}`;
    case "DD/MM/YYYY":
      return `${day}/${month}/${year}`;
    case "YYYY-MM-DD":
      return `${year}-${month}-${day}`;
    default:
      toast.error("Unsupported date format");
      return "";
  }
}

export function formatTime(
  dateInput: Date | string,
  format: TimeFormat
): string | undefined {
  let date: Date;

  if (typeof dateInput === "string") {
    date = new Date(dateInput);
  } else {
    date = dateInput;
  }

  if (!(date instanceof Date) || isNaN(date.getTime())) {
    toast.error("Invalid Date");
    return;
  }

  const pad = (n: number) => n.toString().padStart(2, "0");
  const hours = date.getHours();
  const minutes = pad(date.getMinutes());

  if (format === "24h") {
    return `${pad(hours)}:${minutes}`;
  } else {
    // 12-hour
    const hour12 = hours % 12 || 12;
    const ampm = hours < 12 ? "AM" : "PM";
    return `${pad(hour12)}:${minutes} ${ampm}`;
  }
}

export function formatTimeDuration(
  totalSeconds: number,
  format: "12h" | "decimal"
): string {
  if (typeof totalSeconds !== "number" || isNaN(totalSeconds)) {
    toast.error("Duration must be a valid number");
    return "0min";
  }

  const hours = Math.floor(totalSeconds / 3600);

  if (format === "12h") {
    let result = "";

    if (hours > 0) result += `${hours}h `;

    // convert remaining seconds to decimal minutes
    const remainingMinutes =
      hours > 0 ? Math.floor((totalSeconds % 3600) / 60) : totalSeconds / 60;
    const roundedMinutes = Math.round(remainingMinutes * 10) / 10; // 1 decimal

    if (roundedMinutes > 0) result += `${roundedMinutes}min`;

    return result.trim() || "0min";
  }

  if (format === "decimal") {
    const decimalHours = (totalSeconds / 3600).toFixed(2);
    return `${decimalHours}h`;
  }

  toast.error("Unsupported interval format");
  return "0min";
}

export const getFormat = (role: string) =>
  role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();
