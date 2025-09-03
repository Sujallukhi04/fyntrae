import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserCircle2, UserPlus } from "lucide-react";
import { useAuth } from "@/providers/AuthProvider";
import useClient from "@/hooks/useClient";
import ActiveClient from "@/components/clientsOrganation/ActiveClient";
import ArchivedClient from "@/components/clientsOrganation/ArchivedClient";
import type { Client as ClientType } from "@/types/oraganization";
import AddEditClientModal from "@/components/clientsOrganation/CreateClient";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { useOrgAccess } from "@/providers/OrgAccessProvider";

const Client = () => {
  const [activeTab, setActiveTab] = useState<"active" | "archived">("active");
  const [activeCurrentPage, setActiveCurrentPage] = useState(1);
  const [archivedCurrentPage, setArchivedCurrentPage] = useState(1);
  const [activeLoaded, setActiveLoaded] = useState(false);
  const [archivedLoaded, setArchivedLoaded] = useState(false);

  const { user } = useAuth();
  const {
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
    clientPagination,
    archivedPagination,
    createClientLoading,
    deleteClient,
    deleteClientLoading,
  } = useClient();

  const { canCallApi } = useOrgAccess();

  const [modalState, setModalState] = useState<{
    type: "add" | "edit" | null;
    data: ClientType | null;
  }>({ type: null, data: null });

  const fetchActiveClients = useCallback(async () => {
    if (!user?.currentTeamId || !canCallApi("viewClients")) return;

    await getClients(user.currentTeamId, "active", {
      page: activeCurrentPage,
      pageSize: 10,
    });
    setActiveLoaded(true);
  }, [user?.currentTeamId, activeCurrentPage, getClients]);

  const fetchArchivedClients = useCallback(async () => {
    if (!user?.currentTeamId || !canCallApi("viewClients")) return;
    await getClients(user.currentTeamId, "archived", {
      page: archivedCurrentPage,
      pageSize: 10,
    });
    setArchivedLoaded(true);
  }, [user?.currentTeamId, archivedCurrentPage, getClients]);

  useEffect(() => {
    if (!user?.currentTeamId) return;

    if (activeTab === "active" && !activeLoaded) {
      fetchActiveClients();
    }
    if (activeTab === "archived" && !archivedLoaded) {
      fetchArchivedClients();
    }
  }, [
    user?.currentTeamId,
    activeTab,
    activeCurrentPage,
    archivedCurrentPage,
    activeLoaded,
    archivedLoaded,
  ]);

  useEffect(() => {
    if (user?.currentTeamId) {
      setActiveLoaded(false);
      setArchivedLoaded(false);
    }
  }, [user?.currentTeamId]);

  useEffect(() => {
    if (user?.currentTeamId) {
      if (activeTab === "active") {
        setActiveLoaded(false);
      } else {
        setArchivedLoaded(false);
      }
    }
  }, [activeCurrentPage, archivedCurrentPage, user?.currentTeamId]);

  const refreshClients = useCallback(async () => {
    if (!user?.currentTeamId) return;

    const isActive = activeTab === "active";
    const pageSize = isActive
      ? clientPagination?.pageSize || 10
      : archivedPagination?.pageSize || 10;
    const totalClients = isActive
      ? clientPagination?.total || 0
      : archivedPagination?.total || 0;
    const currentClients = isActive ? clients.length : archivedClients.length;
    const currentPage = isActive ? activeCurrentPage : archivedCurrentPage;

    // Always refresh if we have no clients or if there are more clients to load
    if (currentClients === 0 || totalClients > pageSize * currentPage) {
      await getClients(user.currentTeamId, activeTab, {
        page: currentPage,
        pageSize: pageSize,
      });

      if (isActive) {
        setActiveLoaded(true);
      } else {
        setArchivedLoaded(true);
      }
    }
  }, [
    user?.currentTeamId,
    activeTab,
    clientPagination?.pageSize,
    clientPagination?.total,
    archivedPagination?.pageSize,
    archivedPagination?.total,
    clients.length,
    archivedClients.length,
    activeCurrentPage,
    archivedCurrentPage,
    getClients,
  ]);

  const createclient = useCallback(async (name: string) => {
    if (!user?.currentTeamId) return;
    if (!name.trim()) {
      toast.error("Client name is required.");
      return;
    }

    if (name.trim().length < 3) {
      toast.error("Client name must be at least 3 characters.");
      return;
    }
    try {
      setModalState({ type: "add", data: null });
      await createClient(user?.currentTeamId, name);
    } catch (error) {}
  }, []);

  const handleDeleteClient = useCallback(
    async (clientId: string) => {
      if (!user?.currentTeamId || !clientId) return;

      try {
        await deleteClient(clientId, user.currentTeamId);

        const isActiveTab = activeTab === "active";
        const currentPage = isActiveTab
          ? activeCurrentPage
          : archivedCurrentPage;
        const currnetData = isActiveTab ? clients : archivedClients;

        if (currnetData.length === 1 && currentPage > 1) {
          const newPage = Math.max(currentPage - 1, 1);
          if (isActiveTab) {
            setActiveCurrentPage(newPage);
          } else {
            setArchivedCurrentPage(newPage);
          }
        }

        await refreshClients();
      } catch (error) {}
    },
    [user?.currentTeamId, deleteClient]
  );

  const handleEditClient = useCallback(
    async (name: string) => {
      if (!user?.currentTeamId || !modalState.data) return;

      if (!name.trim()) {
        toast.error("Client name is required.");
        return;
      }

      if (name.trim().length < 3) {
        toast.error("Client name must be at least 3 characters.");
        return;
      }

      try {
        await editClient(user.currentTeamId, modalState.data.id, name);
        setModalState({ type: null, data: null });
      } catch (error) {}
    },
    [user?.currentTeamId, editClient, modalState.data]
  );

  const handlesendArchiveClient = useCallback(
    async (clientId: string) => {
      if (!user?.currentTeamId || !clientId) return;

      try {
        await sendArchiveClient(clientId, user.currentTeamId);
        const isActiveTab = activeTab === "active";
        const currentPage = isActiveTab
          ? activeCurrentPage
          : archivedCurrentPage;
        const currnetData = isActiveTab ? clients : archivedClients;

        if (currnetData.length === 1 && currentPage > 1) {
          const newPage = Math.max(currentPage - 1, 1);
          if (isActiveTab) {
            setActiveCurrentPage(newPage);
          } else {
            setArchivedCurrentPage(newPage);
          }
        }

        await refreshClients();
      } catch (error: any) {}
    },
    [user?.currentTeamId, sendArchiveClient, modalState]
  );

  const handleUnarchiveClient = useCallback(
    async (clientId: string) => {
      if (!user?.currentTeamId || !clientId) return;

      try {
        await unarchiveClient(clientId, user.currentTeamId);
        const isActiveTab = activeTab === "active";
        const currentPage = isActiveTab
          ? activeCurrentPage
          : archivedCurrentPage;
        const currnetData = isActiveTab ? clients : archivedClients;

        if (currnetData.length === 1 && currentPage > 1) {
          const newPage = Math.max(currentPage - 1, 1);
          if (isActiveTab) {
            setActiveCurrentPage(newPage);
          } else {
            setArchivedCurrentPage(newPage);
          }
        }

        await refreshClients();
      } catch (error: any) {}
    },
    [user?.currentTeamId, unarchiveClient]
  );

  return (
    <div className="mx-auto max-w-6xl py-2 w-full space-y-4">
      <div className="flex flex-col gap-3 pb-1 pt-1">
        <div className="flex flex-col items-start px-5 md:flex-row md:items-center md:justify-between gap-2 w-full">
          <div className="flex items-center gap-2">
            <UserCircle2 className="h-5 w-5 text-muted-foreground" />
            <h1 className=" font-semibold">Clients</h1>
          </div>
          {canCallApi("editClient") ? (
            <Button
              className="w-full md:w-auto"
              variant="outline"
              onClick={() => setModalState({ type: "add", data: null })}
            >
              <UserPlus className="mr-2 h-4 w-4" />
              Create Client
            </Button>
          ) : (
            <div className="w-9 h-9" />
          )}
        </div>
        <Separator />
      </div>

      <AddEditClientModal
        isOpen={modalState.type === "add"}
        onClose={() => setModalState({ type: null, data: null })}
        onSubmit={createclient}
        loading={createClientLoading}
      />

      <AddEditClientModal
        isOpen={modalState.type === "edit"}
        onClose={() => setModalState({ type: null, data: null })}
        onSubmit={handleEditClient}
        loading={editClientLoading}
        mode="edit"
        initialName={modalState.data?.name || ""}
      />

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={(tab: string) =>
          setActiveTab(tab as "active" | "archived")
        }
        className="space-y-3 pt-2 px-5"
      >
        <TabsList className="bg-muted/50">
          <TabsTrigger value="active">All</TabsTrigger>
          <TabsTrigger value="archived">Archived</TabsTrigger>
        </TabsList>

        {/* All Clients Tab */}
        <TabsContent value="active" className="space-y-4">
          {/* <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="relative flex-1 max-w-md w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                type="text"
                placeholder="Search clients..."
                className="pl-10 bg-transparent border border-muted-foreground/30 focus:border-primary focus:ring-0"
              />
            </div>
          </div> */}
          {/* Placeholder for clients list */}
          {canCallApi("viewClients") && (
            <ActiveClient
              clients={clients}
              pagination={clientPagination}
              isLoading={isLoading}
              onPageChange={setActiveCurrentPage}
              onEdit={(client) => setModalState({ type: "edit", data: client })}
              onArchive={handlesendArchiveClient}
              isEditLoading={editClientLoading}
              isArchiveLoading={sendArchiveClientLoading}
              onDelete={handleDeleteClient} // <-- Pass delete handler
              deleteLoading={deleteClientLoading} // <-- Pass loading state
            />
          )}
        </TabsContent>

        {/* Invitations Tab */}
        <TabsContent value="archived" className="space-y-4">
          {/* <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="relative flex-1 max-w-md w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                type="text"
                placeholder="Search Archive clients..."
                className="pl-10 bg-transparent border border-muted-foreground/30 focus:border-primary focus:ring-0"
              />
            </div>
          </div> */}
          {/* Placeholder for invitations list */}
          {canCallApi("viewClients") && (
            <ArchivedClient
              clients={archivedClients}
              pagination={archivedPagination}
              isLoading={isLoading}
              onPageChange={setArchivedCurrentPage}
              onEdit={(client) => setModalState({ type: "edit", data: client })}
              unArchive={handleUnarchiveClient}
              unArchiveLoading={unarchiveClientLoading}
              isEditLoading={editClientLoading}
              onDelete={handleDeleteClient} // <-- Pass delete handler
              deleteLoading={deleteClientLoading} // <-- Pass loading state
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Client;
