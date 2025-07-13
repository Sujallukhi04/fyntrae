import { clientApi } from "@/lib/api";
import type { Client } from "@/types/oraganization";
import { useState } from "react";
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
    } finally {
      setIsLoading(false);
    }
  };

  const createClient = async (organizationId: string, name: string) => {
    try {
      setCreateClientLoading(true);
      const response = await clientApi.createClient(organizationId, name);
      toast.success("Client created successfully");

      setClients((prev) => [...prev, response.client]);

      setClientPagination((prev) => {
        if (!prev) return null;
        const newTotal = prev.total + 1;
        console.log(newTotal, prev.pageSize);
        return {
          ...prev,
          total: newTotal,
          totalPages: Math.ceil(newTotal / prev.pageSize),
        };
      });
      return response.client;
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message || "Failed to create client";
      toast.error(errorMessage);
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
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message || "Failed to update client";
      toast.error(errorMessage);
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
      setClients((prev) => prev.filter((client) => client.id !== clientId));
      // Add to archived clients
      setArchivedClients((prev) => [...prev, response.client]);

      console.log(clients);

      setClientPagination((prev) => {
        if (!prev) return null;
        const newTotal = prev.total - 1;
        return {
          ...prev,
          total: newTotal,
          totalPages: Math.max(1, Math.ceil(newTotal / prev.pageSize)),
        };
      });

      setArchivedPagination((prev) => {
        if (!prev) return null;
        const newTotal = prev.total + 1;
        return {
          ...prev,
          total: newTotal,
          totalPages: Math.ceil(newTotal / prev.pageSize),
        };
      });
      toast.success("Client archived successfully");

      return response.client;
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message || "Failed to archive client";
      toast.error(errorMessage);
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
      setArchivedClients((prev) =>
        prev.filter((client) => client.id !== clientId)
      );
      // Add to active clients
      setClients((prev) => [...prev, response.client]);

      // Update paginations

      console.log(archivedPagination);
      setArchivedPagination((prev) => {
        if (!prev) return null;
        const newTotal = prev.total - 1;
        return {
          ...prev,
          total: newTotal,
          totalPages: Math.ceil(newTotal / prev.pageSize),
        };
      });

      setClientPagination((prev) => {
        if (!prev) return null;
        const newTotal = prev.total + 1;
        return {
          ...prev,
          total: newTotal,
          totalPages: Math.ceil(newTotal / prev.pageSize),
        };
      });
      toast.success("Client unarchived successfully");

      return response.client;
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message || "Failed to unarchive client";
      toast.error(errorMessage);
    } finally {
      setUnarchiveClientLoading(false);
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
    unarchiveClientLoading,
    sendArchiveClientLoading,
    editClientLoading,
    createClientLoading,
    clientPagination,
    archivedPagination,
  };
};

export default useClient;
