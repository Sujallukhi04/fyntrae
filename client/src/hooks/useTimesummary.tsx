import { useState, useCallback } from "react";
import {
  clientApi,
  organizationApi,
  timeApi,
  timeSummaryApi,
} from "../lib/api";

interface TimeSummaryParams {
  organizationId: string;
  startDate: string;
  endDate: string;
  projectIds?: string[];
  memberIds?: string[];
  taskIds?: string[];
  billable?: boolean;
  tagIds?: string[];
  clientIds?: string[];
  groups?: string;
  tasks?: string[];
}

const useTimesummary = () => {
  const [loading, setLoading] = useState({
    clients: false,
    members: false,
    project: false,
    tag: false,
    group: false,
    report: false,
    timeData: false,
    dashboardData: false,
  });

  const fetchGroupedSummary = useCallback(async (params: TimeSummaryParams) => {
    try {
      setLoading((prev) => ({ ...prev, group: true }));
      const res = await timeSummaryApi.getTimeSummary(
        params.organizationId,
        params
      );
      return res.data;
    } catch (error: any) {
      throw error;
    } finally {
      setLoading((prev) => ({ ...prev, group: false }));
    }
  }, []);

  const fetchClients = useCallback(async (organizationId: string) => {
    try {
      setLoading((prev) => ({ ...prev, clients: true }));

      const response = await clientApi.getClients(organizationId, {
        all: true,
      });

      return response;
    } catch (error: any) {
      throw error;
    } finally {
      setLoading((prev) => ({ ...prev, clients: false }));
    }
  }, []);

  const fetchMembers = useCallback(async (organizationId: string) => {
    try {
      setLoading((prev) => ({ ...prev, members: true }));
      const response = await organizationApi.getOrganizationMembers(
        organizationId,
        { all: true }
      );
      return response;
    } catch (error: any) {
      throw error;
    } finally {
      setLoading((prev) => ({ ...prev, members: false }));
    }
  }, []);

  const fetchProjectWiTasks = useCallback(async (organizationId: string) => {
    try {
      setLoading((prev) => ({ ...prev, project: true }));
      const response = await timeApi.getAllProjectWithTasks(organizationId);
      return response;
    } catch (error: any) {
      throw error;
    } finally {
      setLoading((prev) => ({ ...prev, project: false }));
    }
  }, []);

  const fetchTags = async (organizationId: string) => {
    try {
      setLoading((prev) => ({ ...prev, tag: true }));
      const response = await timeApi.getTags(organizationId);

      return response;
    } catch (error: any) {
      throw error;
    } finally {
      setLoading((prev) => ({ ...prev, tag: false }));
    }
  };

  const fetchReport = useCallback(
    async (
      organizationId: string,
      params: {
        startDate?: string;
        endDate?: string;
        projectIds?: string[];
        memberIds?: string[];
        taskIds?: string[];
        billable?: boolean;
        tagIds?: string[];
        clientIds?: string[];
        tasks?: string[];
        groups?: string | string[];
      }
    ) => {
      try {
        setLoading((prev) => ({ ...prev, report: true }));
        const response = await timeSummaryApi.getReport(organizationId, params);
        return response;
      } catch (error) {
        throw error;
      } finally {
        setLoading((prev) => ({ ...prev, report: false }));
      }
    },
    []
  );

  const fetchTimeData = useCallback(
    async (
      organizationId: string,
      params: {
        date?: string;
        projectIds?: string[];
        memberIds?: string[];
        taskIds?: string[];
        billable?: boolean;
        tagIds?: string[];
        clientIds?: string[];
      }
    ) => {
      try {
        setLoading((prev) => ({ ...prev, timeData: true }));
        const response = await timeSummaryApi.getTimeData(
          organizationId,
          params
        );
        return response;
      } catch (error) {
        throw error;
      } finally {
        setLoading((prev) => ({ ...prev, timeData: false }));
      }
    },
    []
  );

  const fetchDashboardData = useCallback(async (organizationId: string) => {
    try {
      setLoading((prev) => ({ ...prev, dashboardData: true }));
      const response = await timeSummaryApi.getDashBoardData(organizationId);
      return response;
    } catch (error) {
      throw error;
    } finally {
      setLoading((prev) => ({ ...prev, dashboardData: false }));
    }
  }, []);

  return {
    loading,
    fetchGroupedSummary,
    fetchClients,
    fetchMembers,
    fetchProjectWiTasks,
    fetchTags,
    fetchReport,
    fetchTimeData,
    fetchDashboardData,
  };
};

export default useTimesummary;
