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
  "Amount (INR)": number;
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

// ----------------------------
// Formats raw data for export
// ----------------------------
export const formatExampleData = (data: ExampleEntry[]): FormattedRow[] => {
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
    "Amount (INR)": +(entry.cost ?? 0).toFixed(2),
    Billable: entry.billable ? "Yes" : "No",
    Tags: entry.tags?.join(", ") ?? "",
  }));
};

// ----------------------------
// Adds total row at the bottom
// ----------------------------
export const addExampleTotalRow = (rows: FormattedRow[]): FormattedRow[] => {
  const totalSeconds = rows.reduce(
    (sum, row) => sum + (row["Duration (decimal)"] ?? 0) * 3600,
    0
  );
  const totalCost = rows.reduce(
    (sum, row) => sum + (row["Amount (INR)"] ?? 0),
    0
  );

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
      "Duration (decimal)": +(totalSeconds / 3600).toFixed(2),
      "Amount (INR)": +totalCost.toFixed(2),
      Billable: "",
      Tags: "",
    },
  ];
};

// ----------------------------
// Reusable export function
// ----------------------------
export const exportToExcel = (
  jsonData: FormattedRow[],
  fileName: string,
  fileType: ExportFormat = "xlsx"
): void => {
  const worksheet = XLSX.utils.json_to_sheet(jsonData);

  // Auto column widths
  const columnWidths = Object.keys(jsonData[0]).map((key) => {
    const maxLength = Math.max(
      key.length,
      ...jsonData.map((row) =>
        row[key as keyof FormattedRow]
          ? row[key as keyof FormattedRow]!.toString().length
          : 0
      )
    );
    return { wch: maxLength + 2 }; // padding
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
