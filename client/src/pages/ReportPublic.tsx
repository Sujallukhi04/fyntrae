import { LoaderMain } from "@/components/Loader";
import ChartAreaInteractive from "@/components/reporting/chart-area-interactive";
import { ChartPieLegend } from "@/components/reporting/ChartPieLegend";
import TimeEntryGroup from "@/components/reporting/TimeEntryGroup";
import { Separator } from "@/components/ui/separator";
import useReport from "@/hooks/useReport";
import { ChartNoAxesColumnDecreasing } from "lucide-react";
import { useEffect, useState } from "react";
import { useParams } from "react-router";
import NotFound from "./NotFound";

const ReportPublic = () => {
  const { reportId } = useParams();
  const { getReportBySecretId, reportLoading } = useReport();

  const [reportData, setReportData] = useState<any>(null);

  useEffect(() => {
    if (reportId) {
      getReportBySecretId(reportId)
        .then((response) => {
          setReportData(response.data); // Store the report data
        })
        .catch((error) => {
          console.error("Error fetching public report:", error);
        });
    }
  }, [reportId]);

  if (reportLoading.publicReport) return <LoaderMain />;

  if (!reportData) {
    return <NotFound />;
  }

  const { name, description, properties, data, history_data } = reportData;

  return (
    <div className="mx-auto max-w-7xl py-4 w-full space-y-4">
      <div className="flex flex-col gap-4 pt-1">
        {/* Header */}
        <div className="flex flex-col items-start px-5 md:flex-row md:items-center md:justify-between gap-2 w-full">
          <div>
            <h1 className="text-md font-semibold flex items-center gap-2">
              <ChartNoAxesColumnDecreasing className="h-6 w-6 text-muted-foreground" />
              <span className="text-muted-foreground">Reporting</span>
            </h1>
          </div>
        </div>

        <Separator />

        {/* Chart Area Filters */}
        <div className="px-2">
          <ChartAreaInteractive
            loading={reportLoading.publicReport}
            date={{
              from: new Date(properties.start),
              to: new Date(properties.end),
            }}
            setDate={() => {}}
            setFilterOpen={() => {}}
            groupData={history_data}
            readonly
          />
        </div>

        {/* Main Content */}
        <div className="w-full flex px-5 gap-5">
          {/* Left: Table + Group by */}
          <div className="lg:w-[60%] w-full space-y-4">
            <div className="flex items-center gap-2 bg-muted/40 p-2 border rounded-md">
              <span className="text-sm font-medium">
                Group by{" "}
                <span className="text-foreground font-semibold">
                  {properties.group.split(",")[0] || "projects"}
                </span>{" "}
                and{" "}
                <span className="text-foreground font-semibold">
                  {properties.group.split(",")[1] || "members"}
                </span>
              </span>
            </div>

            <TimeEntryGroup
              groupedData={data.grouped_data || []}
              groupBy1={properties.group.split(",")[0] || "projects"}
              groupBy2={properties.group.split(",")[1] || "members"}
            />
          </div>

          {/* Right: Chart */}
          <div className="lg:w-[40%] w-full">
            <ChartPieLegend
              groupedData={data.grouped_data || []}
              groupBy={properties.group.split(",")[0] || "projects"}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportPublic;
