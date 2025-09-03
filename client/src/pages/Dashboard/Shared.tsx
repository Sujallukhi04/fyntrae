import { ReportModal } from "@/components/report/AddEditReport";
import ReportTable from "@/components/report/ReportTable";
import { Separator } from "@/components/ui/separator";
import useReport from "@/hooks/useReport";
import { useAuth } from "@/providers/AuthProvider";
import { format } from "date-fns";
import { ChartNoAxesColumnDecreasing, ChevronRight } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

const Shared = () => {
  const {
    getReports,
    reports,
    reportsPagination,
    reportLoading,
    updateReport,
    deleteReport,
  } = useReport();
  const { user } = useAuth();
  const [currentPage, setCurrentPage] = useState(1);
  const [editModalState, setEditModalState] = useState<{
    isOpen: boolean;
    report: any | null;
  }>({ isOpen: false, report: null });

  useEffect(() => {
    if (!user?.currentTeamId) return;
    getReports(user?.currentTeamId, { page: currentPage, pageSize: 10 });
  }, [user?.currentTeamId, currentPage]);

  const refreshReports = useCallback(async () => {
    if (!user?.currentTeamId) return;

    const pageSize = reportsPagination?.pageSize || 10;
    const totalReports = reportsPagination?.total || 0;
    const currentReports = reports.length;

    if (currentReports === 0 || totalReports > pageSize * currentPage) {
      await getReports(user.currentTeamId, {
        page: currentPage,
        pageSize: pageSize,
      });
    }
  }, [
    user?.currentTeamId,
    reportsPagination?.pageSize,
    reportsPagination?.total,
    reports.length,
    currentPage,
    getReports,
  ]);

  const handleEdit = async (data: {
    name: string;
    description?: string;
    isPublic: boolean;
    publicUntil?: Date;
  }) => {
    if (!user?.currentTeamId) return;
    try {
      await updateReport(user.currentTeamId, editModalState.report.id, {
        name: data.name,
        description: data.description || "",
        isPublic: data.isPublic,
        publicUntil:
          data.isPublic && data.publicUntil
            ? format(data.publicUntil, "yyyy-MM-dd")
            : undefined,
      });

      setEditModalState({ isOpen: false, report: null });

      if (reports.length === 1 && currentPage > 1) {
        const newPage = Math.max(currentPage - 1, 1);
        setCurrentPage(newPage);
      }

      await refreshReports();
    } catch (error) {}
  };

  const handleDelete = async (reportId: string) => {
    if (!user?.currentTeamId) return;
    try {
      await deleteReport(user.currentTeamId, reportId);

      if (reports.length === 1 && currentPage > 1) {
        const newPage = Math.max(currentPage - 1, 1);
        setCurrentPage(newPage);
      }

      await refreshReports();
    } catch (error) {}
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
            onEdit={(report) => setEditModalState({ isOpen: true, report })}
            onDelete={handleDelete}
            editLoading={reportLoading.update}
            deleteLoading={reportLoading.delete}
          />
        </div>
      </div>

      <ReportModal
        isOpen={editModalState.isOpen}
        onClose={() => setEditModalState({ isOpen: false, report: null })}
        onSubmit={handleEdit}
        loading={reportLoading.update}
        mode="edit"
        initialData={
          editModalState.report
            ? {
                name: editModalState.report.name,
                description: editModalState.report.description || "",
                isPublic: editModalState.report.isPublic,
                publicUntil: editModalState.report.publicUntil,
              }
            : undefined
        }
      />
    </>
  );
};

export default Shared;
