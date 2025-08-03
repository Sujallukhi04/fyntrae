import { reportApi } from "@/lib/api";
import { useCallback, useState } from "react";
import { toast } from "sonner";

const useReport = () => {
  const [reports, setReports] = useState<any[]>([]);
  const [reportsPagination, setReportsPagination] = useState<{
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  } | null>(null);
  const [reportLoading, setIsLoadingReports] = useState({
    fetch: false,
  });

  const getReports = useCallback(
    async (
      organizationId: string,
      params?: {
        page?: number;
        pageSize?: number;
      }
    ) => {
      try {
        setIsLoadingReports({ ...reportLoading, fetch: true });
        const response = await reportApi.getReports(organizationId, params);

        setReports(response.data || []);
        setReportsPagination(response.pagination || null);
      } catch (error: any) {
        const errorMessage =
          error.response?.data?.message || "Failed to fetch reports";
        toast.error(errorMessage);
      } finally {
        setIsLoadingReports({ ...reportLoading, fetch: false });
      }
    },
    []
  );

  return {
    getReports,
    reports,
    reportsPagination,
    setReports,
    reportLoading,
  };
};

export default useReport;
