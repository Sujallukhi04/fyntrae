import { timeApi } from "@/lib/api";
import { useOrganization } from "@/providers/OrganizationProvider";
import type { ProjectWithTasks, Tag, TimeEntry } from "@/types/project";
import { useCallback, useState } from "react";
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

  const updatePagination = useCallback((increment: number) => {
    setTimeEntriesPagination((prev) => {
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

  const addTimeEntryToList = useCallback(
    (timeEntry: TimeEntry, selectedDate?: Date) => {
      if (selectedDate) {
        const entryDate = new Date(timeEntry.start);
        const selected = new Date(selectedDate);
        const isSameDate = entryDate.toDateString() === selected.toDateString();

        if (!isSameDate) return;
      }

      setTimeEntries((prev) => {
        const pageSize = timeEntriesPagination?.pageSize || 10;

        // Insert the new entry in chronological order (newest first)
        const updatedTimeEntries = [...prev];
        const newEntryStart = new Date(timeEntry.start);

        // Find the correct position to insert (newest first order)
        let insertIndex = 0;
        for (let i = 0; i < updatedTimeEntries.length; i++) {
          const existingEntryStart = new Date(updatedTimeEntries[i].start);
          if (newEntryStart >= existingEntryStart) {
            insertIndex = i;
            break;
          }
          insertIndex = i + 1;
        }

        // Insert at the correct position
        updatedTimeEntries.splice(insertIndex, 0, timeEntry);

        // Remove excess entries if page size is exceeded
        if (updatedTimeEntries.length > pageSize) {
          updatedTimeEntries.splice(pageSize);
        }

        return updatedTimeEntries;
      });

      updatePagination(1);
    },
    [timeEntriesPagination?.pageSize, updatePagination]
  );

  const removeTimeEntriesFromList = useCallback(
    (entryIds: string | string[]) => {
      const idsArray = Array.isArray(entryIds) ? entryIds : [entryIds];

      setTimeEntries((prev) =>
        prev.filter((entry) => !idsArray.includes(entry.id))
      );

      updatePagination(-idsArray.length);
    },
    [updatePagination]
  );

  const updateTimeEntryInList = useCallback(
    (timeEntryId: string, updatedEntry: TimeEntry | Partial<TimeEntry>) => {
      setTimeEntries((prev) =>
        prev.map((entry) =>
          entry.id === timeEntryId ? { ...entry, ...updatedEntry } : entry
        )
      );
    },
    []
  );

  const handleError = useCallback((error: any, defaultMessage: string) => {
    const errorMessage = error.response?.data?.message || defaultMessage;
    toast.error(errorMessage);
  }, []);

  const getRunningTimer = useCallback(
    async (organizationId: string) => {
      try {
        setIsLoading(true);
        const response = await timeApi.getRunningTimer(organizationId);
        setRunningTimer(response.timer || null);
        return response.timer;
      } catch (error: any) {
        handleError(error, "Failed to fetch running timer");
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [setRunningTimer, handleError]
  );

  const getTimeEntries = useCallback(
    async (
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
        handleError(error, "Failed to fetch time entries");
        throw error;
      } finally {
        setGetTimeEntriesLoading(false);
      }
    },
    [handleError]
  );

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
      handleError(error, "Failed to start timer");
      throw error;
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
      addTimeEntryToList(response.data, selectedDate);
      toast.success("Timer stopped successfully");
      return response.data;
    } catch (error: any) {
      handleError(error, "Failed to stop timer");
      throw error;
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

      addTimeEntryToList(response.data, selectedDate);
      toast.success("Time entry created successfully");
      return response.data;
    } catch (error: any) {
      handleError(error, "Failed to create time entry");
      throw error;
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

      updateTimeEntryInList(timeEntryId, response.data);
      toast.success("Time entry updated successfully");
      return response.data;
    } catch (error: any) {
      handleError(error, "Failed to update time entry");
      throw error;
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

      removeTimeEntriesFromList(timeEntryId);
      toast.success("Time entry deleted successfully");
      return response;
    } catch (error: any) {
      handleError(error, "Failed to delete time entry");
      throw error;
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

      // Update multiple entries
      data.timeEntryIds.forEach((id) => {
        updateTimeEntryInList(id, data.updates);
      });

      toast.success("Time entries updated successfully");
      return response;
    } catch (error: any) {
      handleError(error, "Failed to update time entries");
      throw error;
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

      removeTimeEntriesFromList(timeEntryIds);
      toast.success("Time entries deleted successfully");
      return response;
    } catch (error: any) {
      handleError(error, "Failed to delete time entries");
      throw error;
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
      handleError(error, "Failed to create tag");
      throw error;
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
      handleError(error, "Failed to delete tag");
      throw error;
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
