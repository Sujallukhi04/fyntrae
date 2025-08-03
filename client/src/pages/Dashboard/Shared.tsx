import ReportTable from "@/components/report/ReportTable";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import useReport from "@/hooks/useReport";
import { useAuth } from "@/providers/AuthProvider";
import { useOrganization } from "@/providers/OrganizationProvider";
import { ChartNoAxesColumnDecreasing, ChevronRight } from "lucide-react";
import React, { useEffect, useState } from "react";

const Shared = () => {
  const { getReports, reports, reportsPagination, setReports, reportLoading } =
    useReport();
  const { user } = useAuth();
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    if (!user?.currentTeamId) return;
    getReports(user?.currentTeamId, { page: 1, pageSize: 10 });
  }, [user?.currentTeamId, currentPage]);

  const handleEdit = (reportId: string) => {
    console.log("Edit report:", reportId);
  };

  const handleDelete = (reportId: string) => {
    console.log("Delete report:", reportId);
  };

  return (
    <>
      <div className="mx-auto max-w-6xl py-3.5 w-full space-y-4">
        <div className="flex flex-col gap-4.5 pt-1">
          {/* Header */}
          <div className="flex flex-col items-start px-5 md:flex-row md:items-center md:justify-between gap-2 w-full">
            <div>
              <h1 className="text-md font-semibold flex items-center gap-2">
                <ChartNoAxesColumnDecreasing className="h-5 w-5 text-muted-foreground" />
                <span className="text-muted-foreground">Reporting</span>
                <ChevronRight className="size-5 text-muted-foreground" />
                <span className="text-foreground">Shared</span>
              </h1>
            </div>
          </div>

          <Separator />
        </div>
        <div className="px-5 py-2 space-y-3">
          <ReportTable
            reports={reports}
            isLoading={reportLoading.fetch}
            pagination={reportsPagination}
            onPageChange={(page) => setCurrentPage(page)}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        </div>
      </div>
    </>
  );
};

export default Shared;
