import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

export interface GroupedData {
  key?: string | null;
  name: string;
  seconds: number;
  cost: number;
  grouped_type: string | null;
  grouped_data: GroupedData[] | null;
}

// Convert seconds to HH:MM:SS
export const secondsToHHMMSS = (seconds: number): string => {
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

// Flatten nested grouped data for export
export const flattenForExport = (
  data: GroupedData[],
  clientHeader: string,
  taskHeader: string,
  parentKey = "",
  topClient = ""
): Array<Record<string, string | number>> => {
  let rows: Array<Record<string, string | number>> = [];

  for (const group of data) {
    const currentClient = !parentKey ? group.name : topClient;
    const task = parentKey ? group.name : "-";

    if (!group.grouped_data || group.grouped_data.length === 0) {
      rows.push({
        [clientHeader]: currentClient,
        [taskHeader]: task,
        Duration: secondsToHHMMSS(group.seconds),
        "Duration (decimal)": +(group.seconds / 3600).toFixed(2),
        "Amount (INR)": +group.cost.toFixed(2),
      });
    }

    if (group.grouped_data) {
      rows = rows.concat(
        flattenForExport(
          group.grouped_data,
          clientHeader,
          taskHeader,
          group.name,
          currentClient
        )
      );
    }
  }

  return rows;
};

// Add total summary row
export const addTotalRow = (
  rows: Array<Record<string, string | number>>,
  clientHeader: string,
  taskHeader: string
): Array<Record<string, string | number>> => {
  const totalSeconds = rows.reduce(
    (sum, row) => sum + (row["Duration (decimal)"] as number) * 3600,
    0
  );
  const totalCost = rows.reduce(
    (sum, row) => sum + (row["Amount (INR)"] as number),
    0
  );

  return [
    ...rows,
    {
      [clientHeader]: "Total",
      [taskHeader]: "",
      Duration: secondsToHHMMSS(totalSeconds),
      "Duration (decimal)": +(totalSeconds / 3600).toFixed(2),
      "Amount (INR)": +totalCost.toFixed(2),
    },
  ];
};

// 🔧 Auto column width helper
const getAutoColumnWidths = (
  rows: Array<Record<string, string | number>>
): XLSX.ColInfo[] => {
  const headers = Object.keys(rows[0] || {});
  return headers.map((header) => {
    const maxLength = Math.max(
      header.length,
      ...rows.map((row) =>
        row[header] !== null && row[header] !== undefined
          ? row[header].toString().length
          : 0
      )
    );
    return { wch: maxLength + 2 }; // +2 for padding
  });
};

// Download XLSX file
export const downloadXLSX = (
  data: GroupedData[],
  clientHeader: string,
  taskHeader: string,
  filename = "report.xlsx"
): void => {
  let rows = flattenForExport(data, clientHeader, taskHeader);
  rows = addTotalRow(rows, clientHeader, taskHeader);

  const worksheet = XLSX.utils.json_to_sheet(rows);
  worksheet["!cols"] = getAutoColumnWidths(rows); // 📏 set column widths

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Time Report");

  const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
  const blob = new Blob([excelBuffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  saveAs(blob, filename);
};

// Download CSV file
export const downloadCSV = (
  data: GroupedData[],
  clientHeader: string,
  taskHeader: string,
  filename = "report.csv"
): void => {
  let rows = flattenForExport(data, clientHeader, taskHeader);
  rows = addTotalRow(rows, clientHeader, taskHeader);

  const worksheet = XLSX.utils.json_to_sheet(rows);
  // Note: !cols is ignored in CSV
  const csvOutput = XLSX.utils.sheet_to_csv(worksheet);
  const blob = new Blob([csvOutput], { type: "text/csv;charset=utf-8;" });
  saveAs(blob, filename);
};

// Download ODS file
export const downloadODS = (
  data: GroupedData[],
  clientHeader: string,
  taskHeader: string,
  filename = "report.ods"
): void => {
  let rows = flattenForExport(data, clientHeader, taskHeader);
  rows = addTotalRow(rows, clientHeader, taskHeader);

  const worksheet = XLSX.utils.json_to_sheet(rows);
  worksheet["!cols"] = getAutoColumnWidths(rows); // 📏 set column widths

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Time Report");

  const odsBuffer = XLSX.write(workbook, { bookType: "ods", type: "array" });
  const blob = new Blob([odsBuffer], {
    type: "application/vnd.oasis.opendocument.spreadsheet",
  });
  saveAs(blob, filename);
};
