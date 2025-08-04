import { timeApi } from "@/lib/api";
import { useOrganization } from "@/providers/OrganizationProvider";
import type { ProjectWithTasks, Tag, TimeEntry } from "@/types/project";
import { useState } from "react";
import { toast } from "sonner";

const useTime = () => {
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const { setRunningTimer } = useOrganization();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [getTimeEntriesLoading, setGetTimeEntriesLoading] =
    useState<boolean>(false);
  const [startTimerLoading, setStartTimerLoading] = useState<boolean>(false);
  const [stopTimerLoading, setStopTimerLoading] = useState<boolean>(false);
  const [createTimeEntryLoading, setCreateTimeEntryLoading] =
    useState<boolean>(false);
  const [updateTimeEntryLoading, setUpdateTimeEntryLoading] =
    useState<boolean>(false);
  const [deleteTimeEntryLoading, setDeleteTimeEntryLoading] =
    useState<boolean>(false);
  const [bulkUpdateLoading, setBulkUpdateLoading] = useState<boolean>(false);
  const [bulkDeleteLoading, setBulkDeleteLoading] = useState<boolean>(false);
  const [createTagLoading, setCreateTagLoading] = useState<boolean>(false);
  const [deleteTagLoading, setDeleteTagLoading] = useState<boolean>(false);

  const [timeEntriesPagination, setTimeEntriesPagination] = useState<{
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

  const getRunningTimer = async (organizationId: string) => {
    try {
      setIsLoading(true);
      const response = await timeApi.getRunningTimer(organizationId);
      setRunningTimer(response.timer || null);
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message || "Failed to fetch running timer";
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const getTimeEntries = async (
    organizationId: string,
    params?: {
      page?: number;
      limit?: number;
      date?: string;
      projectIds?: string[];
      memberIds?: string[];
      taskIds?: string[];
      billable?: boolean;
      tagIds?: string[];
      clientIds?: string[];
      all?: boolean;
    }
  ) => {
    try {
      setGetTimeEntriesLoading(true);
      const response = await timeApi.getTimeEntries(organizationId, params);
      setTimeEntries(response.data || []);
      setTimeEntriesPagination(response.pagination || null);

      return response;
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message || "Failed to fetch time entries";
      toast.error(errorMessage);
    } finally {
      setGetTimeEntriesLoading(false);
    }
  };

  const startTimer = async (
    organizationId: string,
    data: {
      description?: string;
      projectId?: string;
      taskId?: string;
      clientId?: string;
      billable?: boolean;
      tagIds?: string[];
    }
  ) => {
    try {
      setStartTimerLoading(true);
      const response = await timeApi.startTimer(organizationId, data);
      setRunningTimer(response.data);
      toast.success("Timer started successfully");
      return response;
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message || "Failed to start timer";
      toast.error(errorMessage);
    } finally {
      setStartTimerLoading(false);
    }
  };

  const stopTimer = async (
    organizationId: string,
    timeEntryId: string,
    selectedDate: Date
  ) => {
    try {
      setStopTimerLoading(true);
      const response = await timeApi.stopTimer(organizationId, timeEntryId);
      setRunningTimer(null);

      const newEntry = response.data;

      const entryDate = new Date(newEntry.start);
      const selected = new Date(selectedDate);
      const isSameDate = entryDate.toDateString() === selected.toDateString();

      if (isSameDate) {
        setTimeEntries((prev) => {
          const pageSize = timeEntriesPagination?.pageSize || 10;
          const updatedTimeEntries = [newEntry, ...prev];

          if (updatedTimeEntries.length > pageSize) {
            updatedTimeEntries.pop();
          }

          return updatedTimeEntries;
        });

        setTimeEntriesPagination((prev) => {
          if (!prev) return null;
          const newTotal = prev.total + 1;
          return {
            ...prev,
            total: newTotal,
            totalPages: Math.ceil(newTotal / prev.pageSize),
          };
        });
      }

      toast.success("Timer stopped successfully");
      return response.data;
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message || "Failed to stop timer";
      toast.error(errorMessage);
    } finally {
      setStopTimerLoading(false);
    }
  };

  const createTimeEntry = async (
    organizationId: string,
    data: {
      description?: string;
      start: Date;
      end: Date;
      projectId?: string | null;
      taskId?: string | null;
      billable: boolean;
      tagIds?: string[];
    },
    selectedDate: Date
  ) => {
    try {
      setCreateTimeEntryLoading(true);
      const response = await timeApi.createTimeEntry(organizationId, data);

      const newEntry = response.data;

      const entryDate = new Date(newEntry.start);
      const selected = new Date(selectedDate);
      const isSameDate = entryDate.toDateString() === selected.toDateString();

      if (isSameDate) {
        setTimeEntries((prev) => {
          const pageSize = timeEntriesPagination?.pageSize || 10; // Default page size
          const updatedTimeEntries = [newEntry, ...prev]; // Add new entry at the beginning

          // Remove the last entry if the page size is exceeded
          if (updatedTimeEntries.length > pageSize) {
            updatedTimeEntries.pop();
          }

          return updatedTimeEntries;
        });

        setTimeEntriesPagination((prev) => {
          if (!prev) return null;
          const newTotal = prev.total + 1;
          return {
            ...prev,
            total: newTotal,
            totalPages: Math.ceil(newTotal / prev.pageSize),
          };
        });
      }

      toast.success("Time entry created successfully");
      return response.data;
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message || "Failed to create time entry";
      toast.error(errorMessage);
    } finally {
      setCreateTimeEntryLoading(false);
    }
  };

  const updateTimeEntry = async (
    organizationId: string,
    timeEntryId: string,
    data: {
      description?: string;
      start: Date;
      end: Date;
      projectId: string | null;
      taskId: string | null;
      billable: boolean;
      tagIds?: string[];
    }
  ) => {
    try {
      setUpdateTimeEntryLoading(true);
      const response = await timeApi.updateTimeEntry(
        organizationId,
        timeEntryId,
        data
      );

      setTimeEntries((prev) =>
        prev.map((entry) => (entry.id === timeEntryId ? response.data : entry))
      );

      toast.success("Time entry updated successfully");
      return response.data;
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message || "Failed to update time entry";
      toast.error(errorMessage);
    } finally {
      setUpdateTimeEntryLoading(false);
    }
  };

  const deleteTimeEntry = async (
    organizationId: string,
    timeEntryId: string
  ) => {
    try {
      setDeleteTimeEntryLoading(true);
      const response = await timeApi.deleteTimeEntry(
        organizationId,
        timeEntryId
      );

      setTimeEntries((prev) =>
        prev.filter((entry) => entry.id !== timeEntryId)
      );

      setTimeEntriesPagination((prev) => {
        if (!prev) return null;

        const newTotal = Math.max(0, prev.total - 1);
        const newTotalPages = Math.max(1, Math.ceil(newTotal / prev.pageSize));
        const currentPage = prev.page || 1; // Fallback to page 1 if undefined
        const newPage = Math.min(currentPage, newTotalPages);

        return {
          ...prev,
          total: newTotal,
          totalPages: newTotalPages,
          page: newPage,
        };
      });

      toast.success("Time entry deleted successfully");
      return response;
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message || "Failed to delete time entry";
      toast.error(errorMessage);
    } finally {
      setDeleteTimeEntryLoading(false);
    }
  };

  const bulkUpdateTimeEntries = async (
    organizationId: string,
    data: {
      timeEntryIds: string[];
      updates: {
        description?: string;
        projectId: string | null;
        taskId: string | null;
        billable: boolean;
        tagIds?: string[];
      };
    }
  ) => {
    try {
      setBulkUpdateLoading(true);
      const response = await timeApi.bulkUpdateTimeEntries(
        organizationId,
        data
      );

      setTimeEntries((prev) =>
        prev.map((entry) =>
          data.timeEntryIds.includes(entry.id)
            ? { ...entry, ...data.updates }
            : entry
        )
      );

      toast.success("Time entries updated successfully");
      return response;
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message || "Failed to update time entries";
      toast.error(errorMessage);
    } finally {
      setBulkUpdateLoading(false);
    }
  };

  const bulkDeleteTimeEntries = async (
    organizationId: string,
    timeEntryIds: string[]
  ) => {
    try {
      setBulkDeleteLoading(true);
      const response = await timeApi.bulkDeleteTimeEntries(
        organizationId,
        timeEntryIds
      );

      setTimeEntries((prev) =>
        prev.filter((entry) => !timeEntryIds.includes(entry.id))
      );

      setTimeEntriesPagination((prev) => {
        if (!prev) return null;

        const newTotal = Math.max(0, prev.total - timeEntryIds.length);
        const newTotalPages = Math.max(1, Math.ceil(newTotal / prev.pageSize));
        const currentPage = prev.page || 1; // Fallback to page 1 if undefined
        const newPage = Math.min(currentPage, newTotalPages);

        return {
          ...prev,
          total: newTotal,
          totalPages: newTotalPages,
          page: newPage,
        };
      });

      toast.success("Time entries deleted successfully");
      return response;
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message || "Failed to delete time entries";
      toast.error(errorMessage);
    } finally {
      setBulkDeleteLoading(false);
    }
  };

  const createTag = async (organizationId: string, name: string) => {
    try {
      setCreateTagLoading(true);

      const response = await timeApi.createTag(organizationId, name);
      toast.success("Tag created successfully");

      return response.tag;
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message || "Failed to create tag";
      toast.error(errorMessage);
    } finally {
      setCreateTagLoading(false);
    }
  };

  const deleteTag = async (organizationId: string, tagId: string) => {
    try {
      setDeleteTagLoading(true);
      const response = await timeApi.deleteTag(organizationId, tagId);
      toast.success("Tag deleted successfully");
      return response;
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message || "Failed to delete tag";
      toast.error(errorMessage);
    } finally {
      setDeleteTagLoading(false);
    }
  };

  return {
    timeEntries,
    isLoading,
    startTimerLoading,
    stopTimerLoading,
    createTimeEntryLoading,
    updateTimeEntryLoading,
    deleteTimeEntryLoading,
    bulkUpdateLoading,
    bulkDeleteLoading,
    timeEntriesPagination,
    getTimeEntriesLoading,
    getRunningTimer,
    getTimeEntries,
    startTimer,
    stopTimer,
    createTimeEntry,
    updateTimeEntry,
    deleteTimeEntry,
    bulkUpdateTimeEntries,
    bulkDeleteTimeEntries,
    createTag,
    createTagLoading,
    deleteTagLoading,
    deleteTag,
  };
};

export default useTime;
