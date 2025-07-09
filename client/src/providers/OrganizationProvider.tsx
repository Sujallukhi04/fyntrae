import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { organizationApi } from "@/lib/api";
import { useAuth } from "./AuthProvider";
import type {
  Invitation,
  Member,
  Organization,
  OrganizationUpdateData,
  PaginatedResponse,
} from "@/types/oraganization";
import { toast } from "sonner";

interface OrganizationContextType {
  organization: Organization | null;
  isLoading: boolean;
  error: string | null;

  isUpdating: boolean;
  isSwitching: boolean;
  isDeleting: boolean;
  isCreating?: boolean;

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

  const [isUpdating, setIsUpdating] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

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

  const refetch = useCallback(async () => {
    if (user?.currentTeamId) {
      await fetchOrganization(user.currentTeamId);
    }
  }, [user?.currentTeamId, fetchOrganization]);

  useEffect(() => {
    if (user?.currentTeamId) {
      fetchOrganization(user.currentTeamId);
    } else {
      setOrganization(null);
      setIsLoading(false);
    }
  }, [user?.currentTeamId, fetchOrganization]);

  const value = {
    organization,
    isLoading,
    error,
    isUpdating,
    isSwitching,
    isDeleting,
    isCreating,
    switchOrganization,
    updateOrganization,
    deleteOrganization,
    refetch,
    fetchOrganization,
    createOrganization,
  };

  return (
    <OrganizationContext.Provider value={value}>
      {children}
    </OrganizationContext.Provider>
  );
};
