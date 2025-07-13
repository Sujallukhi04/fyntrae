import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, UserPlus } from "lucide-react";
import { useAuth } from "@/providers/AuthProvider";
import useClient from "@/hooks/useClient";
import ActiveClient from "@/components/clientsOrganation/ActiveClient";
import ArchivedClient from "@/components/clientsOrganation/ArchivedClient";
import type { Client } from "@/types/oraganization";
import AddEditClientModal from "@/components/modals/clientmember/CreateClient";

const Client = () => {
  const [activeTab, setActiveTab] = useState<"active" | "archived">("active");
  const [activeCurrentPage, setActiveCurrentPage] = useState(1);
  const [archivedCurrentPage, setArchivedCurrentPage] = useState(1);

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
  } = useClient();
  const [modalState, setModalState] = useState<{
    type: "add" | "edit" | null;
    data: Client | null;
  }>({ type: null, data: null });

  const fetchActiveClients = useCallback(async () => {
    if (!user?.currentTeamId) return;
    await getClients(user.currentTeamId, "active", {
      page: activeCurrentPage,
      pageSize: 10,
    });
  }, [user?.currentTeamId, activeCurrentPage, getClients]);

  const fetchArchivedClients = useCallback(async () => {
    if (!user?.currentTeamId) return;
    await getClients(user.currentTeamId, "archived", {
      page: archivedCurrentPage,
      pageSize: 10,
    });
  }, [user?.currentTeamId, archivedCurrentPage, getClients]);

  useEffect(() => {
    if (!user?.currentTeamId) return;
    fetchActiveClients();
    fetchArchivedClients();
  }, [user?.currentTeamId]);

  useEffect(() => {
    if (!user?.currentTeamId) return;
    if (activeTab === "active") fetchActiveClients();
    if (activeTab === "archived") fetchArchivedClients();
  }, [user?.currentTeamId, activeCurrentPage, archivedCurrentPage]);

  const createclient = useCallback(async (name: string) => {
    if (!user?.currentTeamId) return;
    try {
      setModalState({ type: "add", data: null });
      await createClient(user?.currentTeamId, name);
    } catch (error) {}
  }, []);

  const handleEditClient = useCallback(
    async (name: string) => {
      if (!user?.currentTeamId || !modalState.data) return;
      await editClient(user.currentTeamId, modalState.data.id, name);
      setModalState({ type: null, data: null });
    },
    [user?.currentTeamId, editClient, modalState.data]
  );

  const handlesendArchiveClient = useCallback(
    async (clientId: string) => {
      if (!user?.currentTeamId) return;

      try {
        await sendArchiveClient(clientId, user.currentTeamId);
      } catch (error: any) {}
    },
    [user?.currentTeamId, sendArchiveClient, modalState]
  );

  const handleUnarchiveClient = useCallback(
    async (clientId: string) => {
      if (!user?.currentTeamId) return;

      try {
        await unarchiveClient(clientId, user.currentTeamId);
      } catch (error: any) {}
    },
    [user?.currentTeamId, unarchiveClient]
  );

  return (
    <div className="mx-auto max-w-6xl p-2 w-full space-y-4">
      <div className="flex flex-col gap-3 pb-3 pt-2">
        <div className="flex flex-col items-start md:flex-row md:items-center md:justify-between gap-2 w-full">
          <div>
            <h1 className="text-xl font-semibold">Clients</h1>
            <div className="text-sm text-muted-foreground">
              Manage your clients and their status
            </div>
          </div>
          <Button
            className="w-full md:w-auto"
            onClick={() => setModalState({ type: "add", data: null })}
          >
            <UserPlus className="mr-2 h-4 w-4" />
            Create Client
          </Button>
        </div>
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
        className="space-y-4"
      >
        <TabsList className="bg-muted/50">
          <TabsTrigger value="active">
            All ({clientPagination?.total || 0})
          </TabsTrigger>
          <TabsTrigger value="archived">
            Archived ({archivedPagination?.total || 0})
          </TabsTrigger>
        </TabsList>

        {/* All Clients Tab */}
        <TabsContent value="active" className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="relative flex-1 max-w-md w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                type="text"
                placeholder="Search clients..."
                className="pl-10 bg-transparent border border-muted-foreground/30 focus:border-primary focus:ring-0"
              />
            </div>
          </div>
          {/* Placeholder for clients list */}
          <ActiveClient
            clients={clients}
            pagination={clientPagination}
            isLoading={isLoading}
            onPageChange={setActiveCurrentPage}
            onEdit={(client) => setModalState({ type: "edit", data: client })}
            onArchive={handlesendArchiveClient}
            isEditLoading={editClientLoading}
            isArchiveLoading={sendArchiveClientLoading}
          />
        </TabsContent>

        {/* Invitations Tab */}
        <TabsContent value="archived" className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="relative flex-1 max-w-md w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                type="text"
                placeholder="Search Archive clients..."
                className="pl-10 bg-transparent border border-muted-foreground/30 focus:border-primary focus:ring-0"
              />
            </div>
          </div>
          {/* Placeholder for invitations list */}
          <ArchivedClient
            clients={archivedClients}
            pagination={archivedPagination}
            isLoading={isLoading}
            onPageChange={setArchivedCurrentPage}
            onEdit={(client) => setModalState({ type: "edit", data: client })}
            unArchive={handleUnarchiveClient}
            unArchiveLoading={unarchiveClientLoading}
            isEditLoading={editClientLoading}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Client;
