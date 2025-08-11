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
  data: {
    name: string;
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
  };
}

const externalLabelsPlugin = {
  id: "externalLabelsPlugin",
  afterDraw(chart: any) {
    const { ctx, chartArea, data } = chart;
    const meta = chart.getDatasetMeta(0);
    const centerX = (chartArea.left + chartArea.right) / 2;
    const centerY = (chartArea.top + chartArea.bottom) / 2;

    // Scale factor (assumes base size was 200px; adapt if needed)
    const scale = chart.width / 200;

    meta.data.forEach((arc: any, index: number) => {
      const angle = (arc.startAngle + arc.endAngle) / 2;
      const total = data.datasets[0].data.reduce(
        (a: number, b: number) => a + b,
        0
      );
      const percentage = ((data.datasets[0].data[index] / total) * 100).toFixed(
        2
      );
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
      ctx.fillText(`${percentage}%`, labelX, pullY);
    });
  },
};

Chart.register(externalLabelsPlugin);

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
    const formatDuration = (seconds: number): string => {
      const h = Math.floor(seconds / 3600);
      const m = Math.floor((seconds % 3600) / 60);
      return `${h}h ${m.toString().padStart(2, "0")}m`;
    };

    const formatCost = (cost: number): string => `${Math.round(cost)} INR`;

    const formatDate = (dateString: string): string => {
      const date = parseISO(dateString);
      return format(
        new Date(
          Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
        ),
        "yyyy-MM-dd"
      );
    };

    const dailyTimeChartRef = useRef<Chart<"bar"> | null>(null);
    const dailyTimeCanvasRef = useRef<HTMLCanvasElement | null>(null);
    const pieCanvasRef = useRef<HTMLCanvasElement | null>(null);
    const pieChartInstance = useRef<Chart<"doughnut"> | null>(null);

    const projects = timeTrackingData.data.data.grouped_data;
    const projectNames = projects.map((proj) => proj.name || "No Project");

    const projectSeconds = projects.map((proj) => proj.seconds);
    const bluePalette = generateBlueTones(projects.length);
    const groupLevels = timeTrackingData.data.properties.group.split(",");
    const formatGroupLabel = (str: string) =>
      str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    const level1Group = formatGroupLabel(groupLevels[0]);
    const level2Group = groupLevels[1]
      ? formatGroupLabel(groupLevels[1])
      : null;

    useEffect(() => {
      if (dailyTimeCanvasRef.current && !dailyTimeChartRef.current) {
        const historyData = timeTrackingData.data.history_data.grouped_data;
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
              x: { grid: { display: false } },
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
                display: true,
                color: "#1f2937",
                anchor: "end",
                align: "top",
                offset: 4,
                formatter: (value) => {
                  const hours = Math.floor(value);
                  const minutes = Math.round((value - hours) * 60);
                  return `${hours}h ${minutes.toString().padStart(2, "0")}m`;
                },
                font: { weight: "semibold", size: 12 },
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
              legend: { display: false },
              datalabels: { display: false },
              externalLabelsPlugin: true,
            },
          },
        });
      }

      return () => {
        dailyTimeChartRef.current?.destroy();
        dailyTimeChartRef.current = null;
        pieChartInstance.current?.destroy();
        pieChartInstance.current = null;
      };
    }, []);

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
          timeTrackingData.data.properties.start
        )} - ${formatDate(timeTrackingData.data.properties.end)}`;
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
          formatDuration(timeTrackingData.data.data.seconds),
          cardX + cardPadding,
          cardY + 14
        );
        doc.text(
          formatCost(timeTrackingData.data.data.cost),
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

        cursorY += cardHeight - 5;

        const pieSize = 80;
        const startY = cursorY;
        const leftX = 10;
        const rightX = leftX + pieSize + 10;
        let currentY = startY + pieSize / 2 - 15;

        const pieCanvas = pieCanvasRef.current;
        if (!pieCanvas) throw new Error("Pie canvas not found");
        const pieImg = pieCanvas.toDataURL("image/png", 1.0);

        doc.addImage(pieImg, "PNG", leftX, startY, pieSize, pieSize);

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
          doc.text(formatDuration(proj.seconds), col2X, currentY);
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
        doc.text(formatDuration(totalSeconds), col2X, currentY);
        doc.text(formatCost(totalCost), col3X, currentY);

        doc.setFont("helvetica", "bold");

        // Calculate table height
        const tableHeight = (projects.length + 2) * rowHeight; // +2 for header and total

        // Final vertical position: leave space after whichever is taller
        const finalY = Math.max(startY + pieSize, currentY);

        // Add space before next section (optional 10px padding)
        currentY = finalY;

        projects.forEach((proj) => {
          const groupedData = proj.grouped_data;
          if (!Array.isArray(groupedData) || groupedData.length === 0) return;

          const rows = groupedData.map((item) => [
            item.name,
            formatDuration(item.seconds),
            (item.seconds / 3600).toFixed(2),
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

        doc.save(
          `${timeTrackingData.data.name.replace(/\s+/g, "_")}_report.pdf`
        );
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
