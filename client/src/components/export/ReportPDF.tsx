import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { Chart, registerables } from "chart.js";
import ChartDataLabels from "chartjs-plugin-datalabels";
import { format, parseISO } from "date-fns";
import {
  formatRateNumber,
  formatTimeDuration,
  formatDate as newFomateDate,
} from "@/lib/utils";

Chart.register(...registerables, ChartDataLabels);

interface GroupedDataItem {
  name: string;
  seconds: number;
  cost: number;
  grouped_data?: {
    name: string;
    seconds: number;
    cost?: number;
  }[];
}

interface HistoryDataItem {
  key: string;
  seconds: number;
}

interface TimeTrackingData {
  name: string;
  currency: string;
  intervalFormat: "12h" | "decimal";
  numberFormat: "1,000.00" | "1.000,00" | "1 000.00" | "1,00,000.00";
  dateFormat: "MM/DD/YYYY" | "DD/MM/YYYY" | "YYYY-MM-DD";
  data: {
    grouped_data: GroupedDataItem[];
    seconds: number;
    cost: number;
  };
  history_data: {
    grouped_data: HistoryDataItem[];
  };
  properties: {
    start: string;
    end: string;
    group: string;
  };
}

const externalLabelsPlugin = {
  id: "externalLabelsPlugin",
  afterDraw(chart: any) {
    const { ctx, chartArea, data } = chart;
    const meta = chart.getDatasetMeta(0);
    const centerX = (chartArea.left + chartArea.right) / 2;
    const centerY = (chartArea.top + chartArea.bottom) / 2;

    const scale = chart.width / 200;
    const total = data.datasets[0].data.reduce(
      (a: number, b: number) => a + b,
      0
    );

    meta.data.forEach((arc: any, index: number) => {
      const value = data.datasets[0].data[index];
      const percentage = (value / total) * 100;

      // ❌ Skip label if too small (e.g., under 4%)
      if (percentage < 4) return;

      const angle = (arc.startAngle + arc.endAngle) / 2;
      const backgroundColor = data.datasets[0].backgroundColor[index];

      const pullOutLength = 15 * scale;
      const horizontalLength = 12 * scale;
      const labelOffset = 3 * scale;
      const fontSize = 8 * scale;
      const lineWidth = 1.2 * scale;

      const arcX = centerX + Math.cos(angle) * arc.outerRadius;
      const arcY = centerY + Math.sin(angle) * arc.outerRadius;
      const pullX =
        centerX + Math.cos(angle) * (arc.outerRadius + pullOutLength);
      const pullY =
        centerY + Math.sin(angle) * (arc.outerRadius + pullOutLength);

      const isRightSide = pullX > centerX;
      const lineEndX = isRightSide
        ? pullX + horizontalLength
        : pullX - horizontalLength;
      const labelX = isRightSide
        ? lineEndX + labelOffset
        : lineEndX - labelOffset;

      // Draw line
      ctx.beginPath();
      ctx.moveTo(arcX, arcY);
      ctx.lineTo(pullX, pullY);
      ctx.lineTo(lineEndX, pullY);
      ctx.strokeStyle = backgroundColor;
      ctx.lineWidth = lineWidth;
      ctx.stroke();

      // Draw label
      ctx.font = `${fontSize}px 'Helvetica Neue', Helvetica, Arial, sans-serif`;
      ctx.fillStyle = "#333";
      ctx.textAlign = isRightSide ? "left" : "right";
      ctx.textBaseline = "middle";
      ctx.fillText(`${percentage.toFixed(2)}%`, labelX, pullY);
    });
  },
};

// Chart.register(externalLabelsPlugin);

const ReportPdf = forwardRef(
  ({ timeTrackingData }: { timeTrackingData: TimeTrackingData }, ref) => {
    useImperativeHandle(ref, () => ({
      generatePdf,
    }));

    const hslToRgb = (
      h: number,
      s: number,
      l: number
    ): [number, number, number] => {
      s /= 100;
      l /= 100;
      const k = (n: number) => (n + h / 30) % 12;
      const a = s * Math.min(l, 1 - l);
      const f = (n: number) =>
        l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
      return [
        Math.round(f(0) * 255),
        Math.round(f(8) * 255),
        Math.round(f(4) * 255),
      ];
    };

    const generateBlueTones = (count: number): [number, number, number][] => {
      const baseHue = 210; // Blue
      const lightnessStart = 45; // Medium lightness start
      const lightnessEnd = 65; // Medium lightness end
      const saturation = 80; // Higher saturation for richer color

      return Array.from({ length: count }, (_, i) => {
        const lightness =
          lightnessStart +
          ((lightnessEnd - lightnessStart) * i) / Math.max(count - 1, 1);
        return hslToRgb(baseHue, saturation, lightness);
      });
    };

    const formatCost = (cost: number): string =>
      `${formatRateNumber(cost, timeTrackingData.numberFormat)} ${
        timeTrackingData.currency || "INR"
      }`;

    const formatDate = (dateString: string): string => {
      const date = parseISO(dateString);
      return newFomateDate(date, timeTrackingData.dateFormat);
    };

    const dailyTimeChartRef = useRef<Chart<"bar"> | null>(null);
    const dailyTimeCanvasRef = useRef<HTMLCanvasElement | null>(null);
    const pieCanvasRef = useRef<HTMLCanvasElement | null>(null);
    const pieChartInstance = useRef<Chart<"doughnut"> | null>(null);

    const projects = timeTrackingData.data.grouped_data;
    const projectNames = projects.map((proj) => proj.name || "No Project");

    const projectSeconds = projects.map((proj) => proj.seconds);
    const bluePalette = generateBlueTones(projects.length);
    const groupLevels = timeTrackingData.properties.group.split(",");
    const formatGroupLabel = (str: string) =>
      str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    const level1Group = formatGroupLabel(groupLevels[0]);
    const level2Group = groupLevels[1]
      ? formatGroupLabel(groupLevels[1])
      : null;

    useEffect(() => {
      if (dailyTimeCanvasRef.current && !dailyTimeChartRef.current) {
        const historyData = timeTrackingData.history_data.grouped_data;
        const labels = historyData.map((d) => d.key);
        const data = historyData.map((d) => d.seconds / 3600);

        dailyTimeChartRef.current = new Chart(dailyTimeCanvasRef.current, {
          type: "bar",
          data: {
            labels,
            datasets: [
              {
                label: "Hours",
                data,
                backgroundColor: "rgba(59, 130, 246, 0.6)",
                borderColor: "rgba(59, 130, 246, 1)",
                borderWidth: 1,
                borderRadius: 4,
                borderSkipped: false,
              },
            ],
          },
          options: {
            responsive: false,
            animation: { duration: 0 },
            scales: {
              y: {
                beginAtZero: true,
                display: true,
                ticks: { display: false },
                border: { display: false },
                grid: {
                  drawBorder: false,
                  drawTicks: false,
                  drawOnChartArea: true,
                  color: (context) =>
                    context.index === context.chart.scales.y.ticks.length - 1
                      ? "rgba(0,0,0,0)"
                      : "rgba(0, 0, 0, 0.1)",
                },
              },
              x: {
                grid: { display: false },
                ticks: {
                  autoSkip: true,
                  maxTicksLimit: 7, // You can adjust this number
                  callback: function (value: any, index: number, ticks: any[]) {
                    const label = this.getLabelForValue(value);
                    return label; // Show formatted date
                  },
                },
              },
            },
            plugins: {
              legend: { display: false },
              title: { display: false },
              tooltip: {
                callbacks: {
                  label: (context) => {
                    const hours = Math.floor(context.parsed.y);
                    const minutes = Math.round((context.parsed.y - hours) * 60);
                    return `${hours}h ${minutes.toString().padStart(2, "0")}m`;
                  },
                },
              },
              datalabels: {
                display: (context) =>
                  context.dataset.data[context.dataIndex] > 0.1,
                color: "#1f2937",
                anchor: "end", // Anchors outside the bar
                align: "end", // Pushes label above the bar
                offset: 2, // Space between bar and label
                rotation: -90, // Keeps label vertical
                clamp: true,
                clip: false,
                font: {
                  weight: "semibold",
                  size: 9,
                },
                formatter: (value) => {
                  if (value <= 0) return "";
                  const hours = Math.floor(value);
                  const minutes = Math.round((value - hours) * 60);
                  return `${hours}h ${minutes.toString().padStart(2, "0")}m`;
                },
              },
            },
          },
        });
      }

      if (pieCanvasRef.current && !pieChartInstance.current) {
        const pieCtx = pieCanvasRef.current.getContext("2d");
        if (!pieCtx) return;

        pieChartInstance.current = new Chart(pieCtx, {
          type: "doughnut",
          data: {
            labels: projectNames,
            datasets: [
              {
                data: projectSeconds,
                backgroundColor: bluePalette.map(
                  (rgb) => `rgb(${rgb[0]},${rgb[1]},${rgb[2]})`
                ),
                borderColor: "#fff",
                borderWidth: 0,
              },
            ],
          },
          options: {
            responsive: false,
            radius: "45%",
            cutout: "55%",
            plugins: {
              datalabels: {
                display: false,
              },
              legend: {
                display: false,
              },
              externalLabelsPlugin: false,
            },
          },
          plugins: [],
        });
      }

      return () => {
        dailyTimeChartRef.current?.destroy();
        dailyTimeChartRef.current = null;
        pieChartInstance.current?.destroy();
        pieChartInstance.current = null;
      };
    }, []);

    const secondsToHHMMSS = (seconds: number = 0): string => {
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

    const waitForNextFrame = () =>
      new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

    const generatePdf = async () => {
      try {
        await waitForNextFrame();

        const doc = new jsPDF({
          orientation: "portrait",
          unit: "mm",
          format: "a4",
        });

        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const marginX = 14;
        const chartWidth = pageWidth - marginX * 2;

        const header = (title: string, subtitle: string) => {
          doc
            .setFont("helvetica", "bold")
            .setFontSize(19)
            .setTextColor(0, 0, 0);
          doc.text(title, marginX, 20);

          doc
            .setFont("helvetica", "normal")
            .setFontSize(11)
            .setTextColor(107, 114, 128);
          doc.text(subtitle, marginX, 26);

          doc.setDrawColor(200);

          return 33;
        };

        const footer = (text = "") => {
          doc.setFontSize(9);
          doc.setTextColor(140);
          doc.text(text, marginX, pageHeight - 10);
        };

        const reportPeriod = `${formatDate(
          timeTrackingData.properties.start
        )} - ${formatDate(timeTrackingData.properties.end)}`;
        let cursorY = header("Report", reportPeriod);

        const dailyTimeCanvas = dailyTimeCanvasRef.current;
        if (!dailyTimeCanvas) throw new Error("Daily time canvas not found");

        const dailyTimeImg = dailyTimeCanvas.toDataURL("image/png", 1.0);
        const dailyTimeChartHeight =
          (chartWidth * dailyTimeCanvas.height) / dailyTimeCanvas.width;

        const cardPadding = 6;
        const cardRadius = 2;
        const cardX = marginX;
        const cardY = cursorY;
        const cardWidth = chartWidth;
        const cardHeight = dailyTimeChartHeight + 25;

        doc
          .setDrawColor(200)
          .setLineWidth(0.3)
          .roundedRect(
            cardX,
            cardY,
            cardWidth,
            cardHeight,
            cardRadius,
            cardRadius
          );

        doc.setFontSize(12);
        doc.setFont("helvetica", "normal");

        const gState = doc.GState({ opacity: 0.6 });
        doc.setGState(gState);
        doc.setTextColor(31, 41, 55);

        doc.text(`Duration`, cardX + cardPadding, cardY + 7);
        doc.text(`Total cost`, cardX + 37, cardY + 7);

        doc.setGState(new doc.GState({ opacity: 1 }));

        doc.setFontSize(15).setTextColor(0);
        doc.text(
          formatTimeDuration(
            timeTrackingData.data.seconds,
            timeTrackingData?.intervalFormat || "12h"
          ),
          cardX + cardPadding,
          cardY + 14
        );
        doc.text(
          formatCost(timeTrackingData.data.cost),
          cardX + 37,
          cardY + 14
        );

        doc.setDrawColor(230);
        doc.line(cardX, cardY + 19, cardX + cardWidth, cardY + 19);

        doc.addImage(
          dailyTimeImg,
          "PNG",
          cardX + cardPadding,
          cardY + 22,
          cardWidth - cardPadding * 2,
          dailyTimeChartHeight
        );

        cursorY += cardHeight;

        const pieSize = 80;
        const startY = cursorY;
        const leftX = 10;
        const rightX = leftX + pieSize + 10;
        let currentY = startY + pieSize / 2 - 15;

        const pieCanvas = pieCanvasRef.current;
        if (!pieCanvas) throw new Error("Pie canvas not found");
        const pieImg = pieCanvas.toDataURL("image/png", 1.0);

        doc.addImage(pieImg, "PNG", leftX, startY, pieSize, pieSize);

        const legendStartX = leftX;
        let legendX = legendStartX + 15;
        let legendY = startY + pieSize - 10;

        const dotRadius = 1.5;
        const dotTextGap = 2;
        const itemSpacingX = 5;
        const rowSpacingY = 7;
        const maxLegendWidth = 70; // Adjust as needed

        // Set font before loop
        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");

        projects.forEach((proj, i) => {
          const label = proj.name;
          const color = bluePalette[i];

          const labelWidth =
            doc.getTextWidth(label) + dotRadius * 2 + dotTextGap;

          // Wrap to next row if current row is full
          if (legendX + labelWidth > legendStartX + maxLegendWidth) {
            legendX = legendStartX + 15;
            legendY += rowSpacingY;
          }

          // Draw dot
          doc.setFillColor(...color);
          doc.circle(legendX + dotRadius, legendY - 1, dotRadius, "F");

          // Draw text
          doc.setTextColor(33, 37, 41);
          doc.text(label, legendX + dotRadius * 2 + dotTextGap, legendY);

          // Advance X for next item
          legendX += labelWidth + itemSpacingX;
        });

        const col1X = rightX;
        const col2X = col1X + 40;
        const col3X = col2X + 35;

        const rowHeight = 8;
        const bottomMargin = 20;

        const drawHeader = () => {
          doc.setFont("helvetica", "normal");
          doc.setFontSize(12);
          doc.text(level1Group, col1X, currentY);
          doc.text("Duration", col2X, currentY);
          doc.text("Cost", col3X, currentY);

          currentY += rowHeight;
          doc.setDrawColor(215, 217, 220);
          doc.setLineWidth(0.3);
          doc.line(col1X - 3, currentY - 5, col3X + 15, currentY - 5);
        };

        drawHeader();

        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);

        projects.forEach((proj, i) => {
          const client = proj.name;
          const color = bluePalette[i];

          // Check if there's space for another row; if not, add page
          if (currentY + rowHeight > pageHeight - bottomMargin) {
            doc.addPage();
            currentY = 20;
            drawHeader();
          }

          const dotRadius = 1.5;
          const dotX = col1X;
          const textOffset = 1.5;

          currentY += 1;

          // Draw colored dot
          doc.setFillColor(...color);
          doc.circle(dotX + textOffset, currentY - 1, dotRadius, "F");

          // Text color & font
          doc.setTextColor(75, 84, 98);
          doc.setFont("helvetica", "normal");

          doc.text(client, dotX + 2 * textOffset + dotRadius, currentY);
          doc.text(
            formatTimeDuration(proj.seconds, timeTrackingData.intervalFormat),
            col2X,
            currentY
          );
          doc.text(formatCost(proj.cost), col3X, currentY);

          currentY += rowHeight;

          if (i < projects.length) {
            doc.setDrawColor(220);
            doc.line(col1X - 3, currentY - 4, col3X + 15, currentY - 4);
          }
        });

        // Handle total row
        if (currentY + rowHeight > pageHeight - bottomMargin) {
          doc.addPage();
          currentY = 20;
        }
        currentY += 1;

        const totalSeconds = projects.reduce((a, p) => a + p.seconds, 0);
        const totalCost = projects.reduce((a, p) => a + p.cost, 0);

        doc.setFont("helvetica", "normal");
        doc.setTextColor(0);
        doc.text("Total", col1X, currentY);
        doc.text(
          formatTimeDuration(totalSeconds, timeTrackingData.intervalFormat),
          col2X,
          currentY
        );
        doc.text(formatCost(totalCost), col3X, currentY);

        doc.setFont("helvetica", "bold");

        const tableHeight = (projects.length + 2) * rowHeight; // your existing table height calc
        const pieChartBottom = startY + pieSize;
        const tableBottom = currentY + tableHeight;
        const padding = 5;
        const finalY = Math.max(pieChartBottom, tableBottom) + padding;

        // Clamp so finalY never goes above startY (or some min)
        const minY = startY;
        const adjustedY = finalY < minY ? minY : finalY;

        currentY = adjustedY;

        projects.forEach((proj) => {
          const groupedData = proj.grouped_data;
          if (!Array.isArray(groupedData) || groupedData.length === 0) return;

          const rows = groupedData.map((item) => [
            item.name,
            secondsToHHMMSS(item.seconds),
            formatTimeDuration(item.seconds, timeTrackingData.intervalFormat),
            formatCost(item.cost || 0),
          ]);

          const estimatedTableHeight = rows.length * 10 + 20; // estimate ~10 per row
          const pageHeight =
            doc.internal.pageSize.height || doc.internal.pageSize.getHeight();
          const bottomMargin = 20;
          const spaceLeft = pageHeight - currentY - bottomMargin;

          // If not enough space, add a new page
          if (spaceLeft < estimatedTableHeight) {
            doc.addPage();
            currentY = 20; // reset top margin
          }

          const label = `${level1Group}: ${proj.name}`;
          doc.setFontSize(11);
          doc.setTextColor(33, 37, 41);
          doc.text(label, 10, currentY);

          currentY += 3;

          // Use AutoTable here
          doc.autoTable({
            startY: currentY,
            margin: { left: 10, right: 10 },
            head: [[level2Group, "Duration", "Duration (h)", "Cost"]],
            body: rows,
            columns: [
              { header: level2Group, dataKey: 0 },
              { header: "Duration", dataKey: 1 },
              { header: "Duration (h)", dataKey: 2 },
              { header: "Cost", dataKey: 3 },
            ],
            styles: {
              fontSize: 9,
              cellPadding: 2,
              textColor: [31, 41, 55],
            },
            headStyles: {
              textColor: [17, 24, 39],
              fillColor: [255, 255, 255],
              fontStyle: "bold",
              halign: "left",
              lineWidth: 0.2, // Border width
              lineColor: [200, 200, 200],
            },
            theme: "grid",
            showHead: "everyPage",
          });

          currentY = doc.lastAutoTable.finalY + 14;
        });

        const pageCount = doc.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
          doc.setPage(i);
          const pageStr = `Page ${i} of ${pageCount}`;
          const textWidth = doc.getTextWidth(pageStr);
          footer("Time Tracking Report");
          doc.text(pageStr, pageWidth - marginX - textWidth, pageHeight - 8);
        }

        doc.save(`${timeTrackingData.name.replace(/\s+/g, "_")}.pdf`);
      } catch (err) {
        console.error("Failed to generate PDF", err);
        alert("Failed to generate PDF. See console for details.");
      }
    };

    return (
      <>
        <div
          className="absolute -left-[99999px] -top-[99999px] w-0 h-0 overflow-hidden"
          aria-hidden
        >
          <canvas ref={dailyTimeCanvasRef} width={800} height={340} />
          <canvas ref={pieCanvasRef} width={800} height={800} />{" "}
        </div>
      </>
    );
  }
);

export default ReportPdf;
