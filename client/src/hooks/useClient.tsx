import { clientApi } from "@/lib/api";
import type { Client } from "@/types/oraganization";
import { useCallback, useState } from "react";
import { toast } from "sonner";

const useClient = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [archivedClients, setArchivedClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [createClientLoading, setCreateClientLoading] =
    useState<boolean>(false);
  const [editClientLoading, setEditClientLoading] = useState<boolean>(false);
  const [sendArchiveClientLoading, setSendArchiveClientLoading] =
    useState<boolean>(false);
  const [unarchiveClientLoading, setUnarchiveClientLoading] =
    useState<boolean>(false);
  const [deleteClientLoading, setClientDeleteLoading] =
    useState<boolean>(false);

  const [clientPagination, setClientPagination] = useState<{
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
  const [archivedPagination, setArchivedPagination] = useState<{
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

  const updatePagination = useCallback(
    (
      setPagination: React.Dispatch<React.SetStateAction<any>>,
      increment: number // +1 for add, -1 for remove
    ) => {
      setPagination((prev: any) => {
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
    },
    []
  );

  // Utility function to add client to list with pagination
  const addClientToList = useCallback(
    (
      setClientList: React.Dispatch<React.SetStateAction<Client[]>>,
      client: Client,
      pagination: any
    ) => {
      setClientList((prev) => {
        const pageSize = pagination?.pageSize || 10;
        const updatedClients = [client, ...prev];

        if (updatedClients.length > pageSize) {
          updatedClients.pop();
        }

        return updatedClients;
      });
    },
    []
  );

  // Utility function to remove client from list
  const removeClientFromList = useCallback(
    (
      setClientList: React.Dispatch<React.SetStateAction<Client[]>>,
      clientId: string
    ) => {
      setClientList((prev) => prev.filter((client) => client.id !== clientId));
    },
    []
  );

  const getClients = async (
    organizationId: string,
    type: "active" | "archived",
    params?: { page?: number; pageSize?: number }
  ) => {
    try {
      setIsLoading(true);
      const response = await clientApi.getClients(organizationId, {
        ...params,
        type,
      });

      if (type === "active") {
        setClients(response.clients || []);
        setClientPagination(response.pagination || null);
      } else {
        setArchivedClients(response.clients || []);
        setArchivedPagination(response.pagination || null);
      }
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message || "Failed to fetch members";
      toast.error(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const createClient = async (organizationId: string, name: string) => {
    try {
      setCreateClientLoading(true);
      const response = await clientApi.createClient(organizationId, name);
      toast.success("Client created successfully");

      addClientToList(setClients, response.client, clientPagination);
      updatePagination(setClientPagination, 1);

      return response.client;
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message || "Failed to create client";
      toast.error(errorMessage);
      throw error;
    } finally {
      setCreateClientLoading(false);
    }
  };

  const editClient = async (
    organizationId: string,
    clientId: string,
    name: string
  ) => {
    try {
      setEditClientLoading(true);
      const response = await clientApi.editClient(
        organizationId,
        clientId,
        name
      );

      setClients((prev) =>
        prev.map((client) =>
          client.id === clientId ? response.client : client
        )
      );

      toast.success("Client updated successfully");
      return response.client;
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message || "Failed to update client";
      toast.error(errorMessage);
      throw error;
    } finally {
      setEditClientLoading(false);
    }
  };

  const sendArchiveClient = async (
    clientId: string,
    organizationId: string
  ) => {
    try {
      setSendArchiveClientLoading(true);
      const response = await clientApi.sendArchive(clientId, organizationId);

      removeClientFromList(setClients, clientId);
      addClientToList(setArchivedClients, response.client, archivedPagination);
      updatePagination(setClientPagination, -1);
      updatePagination(setArchivedPagination, 1);

      toast.success("Client archived successfully");

      return response.client;
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message || "Failed to archive client";
      toast.error(errorMessage);
      throw error;
    } finally {
      setSendArchiveClientLoading(false);
    }
  };

  const unarchiveClient = async (clientId: string, organizationId: string) => {
    try {
      setUnarchiveClientLoading(true);
      const response = await clientApi.unArchiveClient(
        clientId,
        organizationId
      );
      removeClientFromList(setArchivedClients, clientId);
      addClientToList(setClients, response.client, clientPagination);
      updatePagination(setArchivedPagination, -1);
      updatePagination(setClientPagination, 1);

      toast.success("Client unarchived successfully");

      return response.client;
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message || "Failed to unarchive client";
      toast.error(errorMessage);
      throw error;
    } finally {
      setUnarchiveClientLoading(false);
    }
  };

  const deleteClient = async (clientId: string, organizationId: string) => {
    try {
      setClientDeleteLoading(true);
      const response = await clientApi.deleteClient(clientId, organizationId);

      // Remove from both lists (could be in either active or archived)
      removeClientFromList(setClients, clientId);
      removeClientFromList(setArchivedClients, clientId);

      // Update both paginations (one will have no effect if client wasn't in that list)
      updatePagination(setClientPagination, -1);
      updatePagination(setArchivedPagination, -1);

      toast.success("Client deleted successfully");
      return response.client;
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message || "Failed to unarchive client";
      toast.error(errorMessage);
      throw error;
    } finally {
      setClientDeleteLoading(false);
    }
  };

  return {
    clients,
    archivedClients,
    isLoading,
    getClients,
    createClient,
    editClient,
    sendArchiveClient,
    unarchiveClient,
    deleteClient,
    deleteClientLoading,
    unarchiveClientLoading,
    sendArchiveClientLoading,
    editClientLoading,
    createClientLoading,
    clientPagination,
    archivedPagination,
  };
};

export default useClient;
