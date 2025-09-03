import { formatRateNumber, formatTime, formatTimeDuration } from "@/lib/utils";
import jsPDF from "jspdf";
import "jspdf-autotable";

interface TimeEntry {
  description?: string;
  task?: string;
  project?: string;
  client?: string;
  user?: string;
  start: string | Date;
  end: string | Date;
  seconds: number;
  billable?: boolean;
  tags?: string[];
  cost: number;
}

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

export function generateCustomReportPDF(
  timeEntries: TimeEntry[],
  date: string,
  currency: string = "USD",
  format: "12h" | "24h",
  numberFormat: "1,000.00" | "1.000,00" | "1 000.00" | "1,00,000.00",
  intervalFormat: "12h" | "decimal"
): void {
  const doc = new jsPDF();

  // === Header ===
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(33, 33, 33);
  doc.text("Detailed Report", 14, 20);

  doc.setFontSize(11);
  doc.setTextColor(100);
  doc.text(date, 14, 26);

  // === Summary Card with Rounded Border ===
  const totalSeconds = timeEntries.reduce((acc, item) => acc + item.seconds, 0);
  const totalCost = timeEntries.reduce((acc, item) => {
    return acc + (item.billable ? item.cost : 0);
  }, 0);
  const durationStr = formatTimeDuration(totalSeconds, intervalFormat);
  const costStr = `${formatRateNumber(totalCost, numberFormat)} ${
    currency || "INR"
  }`;

  doc.setDrawColor(220);
  doc.setFillColor(245, 245, 245);
  doc.roundedRect(14, 35, 180, 20, 1, 1, "FD");

  doc.setFontSize(12);
  doc.setTextColor(90);
  doc.text("Duration", 20, 44);
  doc.text("Total cost", 55, 44);

  doc.setFontSize(15);
  doc.setTextColor(0);
  doc.setFont("helvetica", "bold");
  doc.text(durationStr, 20, 50);
  doc.text(costStr, 55, 50);

  const tableData = timeEntries.map((entry) => {
    const lines: string[] = [];

    // Description or dash
    lines.push(entry.description?.trim() || "-");

    if (entry.task) lines.push(`Task: ${entry.task}`);
    if (entry.project) lines.push(`Project: ${entry.project}`);
    if (entry.client) lines.push(`Client: ${entry.client}`);

    return [
      lines.join("\n"), // use new line for multiline cell
      entry.user || "-",
      formatTimeRange(entry.start, entry.end),
      secondsToHHMMSS(entry.seconds),
      entry.billable ? "Yes" : "No",
      entry.tags?.join(", ") || "-",
    ];
  });

  //@ts-ignore
  doc.autoTable({
    startY: 60,
    margin: { left: 14, right: 14 },
    head: [["Time Entry", "User", "Time", "Duration", "Billable", "Tags"]],
    body: tableData,
    styles: {
      fontSize: 10,
      cellPadding: 2,
      overflow: "linebreak",
      halign: "left",
      valign: "top",
    },
    columnStyles: {
      0: { fontSize: 9 },
      5: { cellWidth: 40 },
    },
    headStyles: {
      fillColor: [255, 255, 255],
      textColor: 33,
      fontStyle: "bold",
      lineWidth: 0.5,
      lineColor: [200, 200, 200],
    },
    alternateRowStyles: {
      fillColor: [250, 250, 250],
    },
    theme: "grid",
    didDrawPage: (data: any) => {
      const pageHeight = doc.internal.pageSize.height;
      doc.setFontSize(9);
      doc.setTextColor(150);
      doc.text(
        //@ts-ignore
        `Page ${doc.internal.getCurrentPageInfo().pageNumber}`,
        14,
        pageHeight - 10
      );

      // Rounded border around table
      const table = data.table;
      if (
        table &&
        table.margin &&
        typeof table.margin.left === "number" &&
        typeof table.startY === "number" &&
        typeof table.width === "number" &&
        typeof table.height === "number"
      ) {
        const x = table.margin.left;
        const y = table.startY;
        const width = table.width;
        const height = table.height;

        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(0.5);
        doc.roundedRect(x, y, width, height, 4, 4, "S");
      }
    },
  });

  doc.save("detailed_report.pdf");

  function formatTimeRange(start: string | Date, end: string | Date): string {
    const startTime = formatTime(start, format);
    const endTime = formatTime(end, format);
    return `${startTime} - ${endTime}`;
  }
}
