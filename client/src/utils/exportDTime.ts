import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

// ----------------------------
// Types
// ----------------------------
export interface ExampleEntry {
  description?: string;
  user?: string;
  start?: string;
  end?: string;
  project?: string;
  client?: string;
  task?: string;
  seconds?: number;
  cost?: number;
  billable?: boolean;
  tags?: string[];
}

export type ExportFormat = "xlsx" | "csv" | "ods";

export interface FormattedRow {
  Description: string;
  User: string;
  Start: string;
  End: string;
  Project: string;
  Client: string;
  Task: string;
  Duration: string;
  "Duration (decimal)": number;
  [key: string]: string | number;
  Billable: string;
  Tags: string;
}

// ----------------------------
// Converts seconds to HH:MM:SS
// ----------------------------
export const secondsToHHMMSS = (seconds: number = 0): string => {
  const h = Math.floor(seconds / 3600)
    .toString()
    .padStart(2, "0");
  const m = Math.floor((seconds % 3600) / 60)
    .toString()
    .padStart(2, "0");
  const s = Math.floor(seconds % 60)
    .toString()
    .padStart(2, "0");
  return `${h}:${m}:${s}`;
};

const roundToTwoDecimals = (num: number): number => Math.round(num * 100) / 100;

// ----------------------------
// Formats raw data for export
// ----------------------------
export const formatExampleData = (
  data: ExampleEntry[],
  currency: string = "USD"
): FormattedRow[] => {
  return data.map((entry) => ({
    Description: entry.description ?? "-",
    User: entry.user ?? "",
    Start: entry.start ?? "",
    End: entry.end ?? "",
    Project: entry.project ?? "-",
    Client: entry.client ?? "-",
    Task: entry.task ?? "-",
    Duration: secondsToHHMMSS(entry.seconds ?? 0),
    "Duration (decimal)": +((entry.seconds ?? 0) / 3600).toFixed(2),
    [`Amount (${currency})`]: +(entry.cost ?? 0).toFixed(2),
    Billable: entry.billable ? "Yes" : "No",
    Tags: entry.tags?.join(", ") ?? "",
  }));
};

// ----------------------------
// Adds total row at the bottom
// ----------------------------
export const addExampleTotalRow = (
  rows: FormattedRow[],
  currency: string = "INR",
  data: ExampleEntry[]
): FormattedRow[] => {
  const amountKey = `Amount (${currency})`;
  const totalSeconds = data.reduce((sum, row) => sum + (row.seconds ?? 0), 0);

  const totalCost = rows.reduce((sum, row) => {
    const isBillable = row.Billable === "Yes";
    const cost = (row[amountKey] as number) ?? 0;
    return sum + (isBillable ? cost : 0);
  }, 0);

  return [
    ...rows,
    {
      Description: "Total",
      User: "",
      Start: "",
      End: "",
      Project: "",
      Client: "",
      Task: "",
      Duration: secondsToHHMMSS(totalSeconds),
      "Duration (decimal)": +roundToTwoDecimals(totalSeconds / 3600),
      [amountKey]: +roundToTwoDecimals(totalCost),
      Billable: "",
      Tags: "",
    },
  ];
};

// ----------------------------
// Reusable export function
// ----------------------------
export const exportToExcel = (
  jsonData: ExampleEntry[],
  fileName: string,
  fileType: ExportFormat = "xlsx",
  currency: string = "INR"
): void => {
  const formatted = formatExampleData(jsonData, currency);
  const rowsWithTotal = addExampleTotalRow(formatted, currency, jsonData);

  const worksheet = XLSX.utils.json_to_sheet(rowsWithTotal);

  // Auto column widths
  const columnWidths = Object.keys(rowsWithTotal[0]).map((key) => {
    const maxLength = Math.max(
      key.length,
      ...rowsWithTotal.map((row) =>
        row[key] !== null && row[key] !== undefined
          ? row[key].toString().length
          : 0
      )
    );
    return { wch: maxLength + 2 };
  });
  worksheet["!cols"] = columnWidths;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Example Report");

  const buffer = XLSX.write(workbook, {
    bookType: fileType,
    type: "array",
  });

  const mimeTypes: Record<ExportFormat, string> = {
    xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    csv: "text/csv;charset=utf-8;",
    ods: "application/vnd.oasis.opendocument.spreadsheet",
  };

  const blob = new Blob([buffer], { type: mimeTypes[fileType] });
  saveAs(blob, `${fileName}.${fileType}`);
};
