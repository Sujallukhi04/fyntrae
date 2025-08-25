import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { organizationApi, timeApi } from "@/lib/api";
import { useAuth } from "./AuthProvider";
import type {
  Invitation,
  Member,
  Organization,
  OrganizationUpdateData,
  PaginatedResponse,
} from "@/types/oraganization";
import { toast } from "sonner";
import type { TimeEntry } from "@/types/project";
import { useSocket } from "./SocketProvider";

interface OrganizationContextType {
  organization: Organization | null;
  isLoading: boolean;
  error: string | null;

  isUpdating: boolean;
  isSwitching: boolean;
  isDeleting: boolean;
  isCreating?: boolean;
  isLoadingTimer: boolean;
  runningTimer: TimeEntry | null;
  updateRunningTimer: (timer: TimeEntry | null) => void;
  clearRunningTimer: () => void;
  setRunningTimer: (timer: TimeEntry | null) => void;

  switchOrganization: (organizationId: string) => Promise<void>;
  updateOrganization: (
    organizationId: string,
    data: OrganizationUpdateData
  ) => Promise<any>;
  deleteOrganization: (organizationId: string) => Promise<void>;
  createOrganization: (data: { name: string }) => Promise<any>;
  refetch: () => Promise<void>;
  fetchOrganization: (organizationId: string) => Promise<void>;
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(
  undefined
);

export const useOrganization = () => {
  const context = useContext(OrganizationContext);
  if (!context) {
    throw new Error(
      "useOrganization must be used within an OrganizationProvider"
    );
  }
  return context;
};

export const OrganizationProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user, refetch: refetchUser, setUser } = useAuth();

  const [organization, setOrganization] = useState<Organization | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [runningTimer, setRunningTimer] = useState<TimeEntry | null>(null);
  const [isLoadingTimer, setIsLoadingTimer] = useState(false);

  const [isUpdating, setIsUpdating] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const { socket } = useSocket();

  const updateRunningTimer = useCallback((timer: TimeEntry | null) => {
    setRunningTimer(timer);
  }, []);

  const clearRunningTimer = useCallback(() => {
    setRunningTimer(null);
  }, []);

  const fetchRunningTimer = useCallback(async (organizationId: string) => {
    if (!organizationId) return;

    try {
      setIsLoadingTimer(true);
      const response = await timeApi.getRunningTimer(organizationId);
      const timer = response.data || null;
      setRunningTimer(timer);
    } catch (error: any) {
      console.error("Error fetching running timer:", error);
      setRunningTimer(null);
    } finally {
      setIsLoadingTimer(false);
    }
  }, []);

  const fetchOrganization = useCallback(async (organizationId: string) => {
    if (!organizationId) {
      setOrganization(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const response = await organizationApi.getCurrentOrganization(
        organizationId
      );
      setOrganization(response.organization);
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        "Failed to fetch organization";
      setError(errorMessage);
      setOrganization(null);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateOrganization = useCallback(
    async (oraganizationId: string, data: OrganizationUpdateData) => {
      setIsUpdating(true);

      try {
        const response = await organizationApi.updateOrganization(
          oraganizationId,
          data
        );

        setOrganization(response.organization);
        setUser((prevUser) => {
          if (!prevUser) return prevUser;
          return {
            ...prevUser,
            organizations: prevUser.organizations.map((org) =>
              org.id === response.organization.id
                ? {
                    ...org,
                    name: response.organization.name,
                    role: org.role,
                  }
                : org
            ),
            currentTeam:
              prevUser.currentTeamId === response.organization.id
                ? {
                    id: response.organization.id,
                    name: response.organization.name,
                  }
                : prevUser.currentTeam,
          };
        });
        toast.success("Organization updated successfully");
        return response;
      } catch (error: any) {
        const errorMessage =
          error.response?.data?.message || "Failed to update organization";
        toast.error(errorMessage);
        throw error;
      } finally {
        setIsUpdating(false);
      }
    },
    [setUser]
  );

  const switchOrganization = useCallback(
    async (organizationId: string) => {
      try {
        setIsSwitching(true);
        setError(null);

        // Call the switch organization API
        const response = await organizationApi.switchOrganization(
          organizationId
        );

        // Refetch user data to get updated currentTeamId
        setUser(response.user);

        toast.success("Organization switched successfully");
      } catch (err: any) {
        const errorMessage =
          err.response?.data?.message ||
          err.message ||
          "Failed to switch organization";
        toast.error(errorMessage);
        throw err;
      } finally {
        setIsSwitching(false);
      }
    },
    [setUser]
  );

  const deleteOrganization = useCallback(async (organizationId: string) => {
    if (!organizationId) {
      toast.error("Organization ID is required");
      return;
    }

    setIsDeleting(true);
    setError(null);

    try {
      const response = await organizationApi.deleteOrganization(organizationId);
      setUser(response.user);
      setOrganization(null);
      toast.success("Organization deleted successfully");
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || "Failed to delete organization";
      toast.error(errorMessage);
    } finally {
      setIsDeleting(false);
    }
  }, []);

  const createOrganization = useCallback(
    async (data: { name: string }) => {
      try {
        setIsCreating(true);
        setError(null);

        const response = await organizationApi.createOrganization(data);
        if (response.user) {
          setUser(response.user);
        }
        toast.success("Organization created successfully");
        return response;
      } catch (error: any) {
        const errorMessage =
          error.response?.data?.message || "Failed to create organization";
        toast.error(errorMessage);
        throw error;
      } finally {
        setIsCreating(false);
      }
    },
    [setUser]
  );

  useEffect(() => {
    if (!socket || !user?.currentTeamId) return;

    const handleTimerStarted = (data: TimeEntry) => {
      if (data.userId === user.id) {
        fetchRunningTimer(user.currentTeamId);
      }
    };

    const handleTimerStopped = (data: TimeEntry) => {
      if (data.userId === user.id) {
        fetchRunningTimer(user.currentTeamId);
      }
    };

    socket.on("timer:started", handleTimerStarted);
    socket.on("timer:stopped", handleTimerStopped);

    return () => {
      socket.off("timer:started", handleTimerStarted);
      socket.off("timer:stopped", handleTimerStopped);
    };
  }, [socket, user?.currentTeamId, user?.id]);

  const refetch = useCallback(async () => {
    if (user?.currentTeamId) {
      await fetchOrganization(user.currentTeamId);
      await fetchRunningTimer(user.currentTeamId);
    }
  }, [user?.currentTeamId, fetchOrganization, fetchRunningTimer]);

  useEffect(() => {
    if (user === undefined) return;
    if (user?.currentTeamId) {
      Promise.all([
        fetchOrganization(user.currentTeamId),
        fetchRunningTimer(user.currentTeamId),
      ]).finally(() => setIsLoading(false));
    } else {
      setOrganization(null);
      setIsLoading(false);
      clearRunningTimer();
    }
  }, [
    user?.currentTeamId,
    fetchOrganization,
    fetchRunningTimer,
    clearRunningTimer,
  ]);

  const value = {
    organization,
    runningTimer,
    isLoading,
    error,
    isUpdating,
    isSwitching,
    isLoadingTimer,
    isDeleting,
    isCreating,
    switchOrganization,
    updateOrganization,
    deleteOrganization,
    refetch,
    fetchOrganization,
    createOrganization,
    updateRunningTimer,
    clearRunningTimer,
    setRunningTimer,
  };

  return (
    <OrganizationContext.Provider value={value}>
      {children}
    </OrganizationContext.Provider>
  );
};
