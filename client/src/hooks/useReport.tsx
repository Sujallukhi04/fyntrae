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
  } | null>({
    total: 0,
    page: 1,
    pageSize: 10,
    totalPages: 0,
  });

  const [reportLoading, setIsLoadingReports] = useState({
    fetch: false,
    publicReport: false,
    create: false,
    update: false,
    delete: false,
  });

  // Utility function to update pagination
  const updatePagination = useCallback((increment: number) => {
    setReportsPagination((prev) => {
      if (!prev) return null;

      const newTotal = Math.max(0, prev.total + increment);
      const newTotalPages = Math.max(1, Math.ceil(newTotal / prev.pageSize));
      const currentPage = prev.page || 1;
      const newPage = Math.min(currentPage, newTotalPages);

      return {
        ...prev,
        total: newTotal,
        totalPages: newTotalPages,
        page: newPage,
      };
    });
  }, []);

  // Utility function to add report to list with pagination
  const addReportToList = useCallback(
    (report: any) => {
      setReports((prev) => {
        const pageSize = reportsPagination?.pageSize || 10;
        const updatedReports = [report, ...prev];

        if (updatedReports.length > pageSize) {
          updatedReports.pop();
        }

        return updatedReports;
      });
    },
    [reportsPagination?.pageSize]
  );

  // Utility function to remove report from list
  const removeReportFromList = useCallback((reportId: string) => {
    setReports((prev) => prev.filter((report) => report.id !== reportId));
  }, []);

  // Utility function to update report in list
  const updateReportInList = useCallback(
    (reportId: string, updatedReport: any) => {
      setReports((prev) =>
        prev.map((report) =>
          report.id === reportId ? { ...report, ...updatedReport } : report
        )
      );
    },
    []
  );

  // Common error handler
  const handleError = useCallback((error: any, defaultMessage: string) => {
    const errorMessage = error.response?.data?.message || defaultMessage;
    toast.error(errorMessage);
  }, []);

  const getReports = useCallback(
    async (
      organizationId: string,
      params?: {
        page?: number;
        pageSize?: number;
      }
    ) => {
      try {
        setIsLoadingReports((prev) => ({ ...prev, fetch: true }));
        const response = await reportApi.getReports(organizationId, params);

        setReports(response.data || []);
        setReportsPagination(response.pagination || null);
        return response;
      } catch (error: any) {
        handleError(error, "Failed to fetch reports");
      } finally {
        setIsLoadingReports((prev) => ({ ...prev, fetch: false }));
      }
    },
    [handleError]
  );

  const createReport = useCallback(
    async (
      organizationId: string,
      data: {
        name: string;
        description: string;
        isPublic: boolean;
        publicUntil?: string;
        projects?: string | null;
        tasks?: string | null;
        tags?: string | null;
        clients?: string | null;
        billable?: string | null;
        members?: string | null;
        groups?: string | null;
        startDate: string;
        endDate: string;
      }
    ) => {
      try {
        setIsLoadingReports((prev) => ({ ...prev, create: true }));
        const response = await reportApi.createReport(organizationId, data);

        addReportToList(response.data);
        updatePagination(1);
        toast.success("Report created successfully");
        return response.data;
      } catch (error: any) {
        handleError(error, "Failed to create report");
        throw error;
      } finally {
        setIsLoadingReports((prev) => ({ ...prev, create: false }));
      }
    },
    [addReportToList, updatePagination, handleError]
  );

  const updateReport = useCallback(
    async (
      organizationId: string,
      reportId: string,
      data: {
        name: string;
        description?: string;
        isPublic: boolean;
        publicUntil?: string;
      }
    ) => {
      try {
        setIsLoadingReports((prev) => ({ ...prev, update: true }));
        const response = await reportApi.editReport(
          organizationId,
          reportId,
          data
        );

        updateReportInList(reportId, response.data);
        toast.success("Report updated successfully");
        return response.data;
      } catch (error: any) {
        handleError(error, "Failed to update report");
        throw error;
      } finally {
        setIsLoadingReports((prev) => ({ ...prev, update: false }));
      }
    },
    [updateReportInList, handleError]
  );

  const deleteReport = useCallback(
    async (organizationId: string, reportId: string) => {
      try {
        setIsLoadingReports((prev) => ({ ...prev, delete: true }));
        await reportApi.deleteReport(organizationId, reportId);

        removeReportFromList(reportId);
        updatePagination(-1);
        toast.success("Report deleted successfully");
      } catch (error: any) {
        handleError(error, "Failed to delete report");
        throw error;
      } finally {
        setIsLoadingReports((prev) => ({ ...prev, delete: false }));
      }
    },
    [removeReportFromList, updatePagination, handleError]
  );

  const getReportBySecretId = useCallback(
    async (secretId: string) => {
      try {
        setIsLoadingReports((prev) => ({ ...prev, publicReport: true }));
        const response = await reportApi.getReportByScrectId(secretId);
        return response;
      } catch (error: any) {
        handleError(error, "Failed to fetch report");
        throw error;
      } finally {
        setIsLoadingReports((prev) => ({ ...prev, publicReport: false }));
      }
    },
    [handleError]
  );

  return {
    reports,
    reportsPagination,
    reportLoading,
    getReports,
    createReport,
    updateReport,
    deleteReport,
    getReportBySecretId,
  };
};

export default useReport;
