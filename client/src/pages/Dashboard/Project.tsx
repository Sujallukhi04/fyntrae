import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FolderOpen, FolderPlus } from "lucide-react";
import { useAuth } from "@/providers/AuthProvider";
import useProject from "@/hooks/useProject";
import type { Project, ProjectData } from "@/types/project";
import ProjectTable from "@/components/project/ProjectTable";
import AddEditProjectModal from "@/components/project/AddEditProjectModal";
import { useOrganization } from "@/providers/OrganizationProvider";
import { Separator } from "@/components/ui/separator";
import { useOrgAccess } from "@/providers/OrgAccessProvider";

interface ProjectState {
  type: "add" | "edit" | null;
  data: Project | null;
}

const ProjectPage = () => {
  const [activeTab, setActiveTab] = useState<"active" | "archived">("active");
  const [activeCurrentPage, setActiveCurrentPage] = useState(1);
  const [archivedCurrentPage, setArchivedCurrentPage] = useState(1);
  const [clients, setClients] = useState<
    { id: string; name: string; archivedAt: string }[]
  >([]);
  const [activeLoaded, setActiveLoaded] = useState(false);
  const [archivedLoaded, setArchivedLoaded] = useState(false);
  const { canCallApi } = useOrgAccess();

  const { organization } = useOrganization();
  const { user } = useAuth();
  const {
    projects,
    archivedProjects,
    isLoading,
    getProjects,
    createProject,
    updateProject,
    archiveProject,
    deleteProject,
    unarchiveProject,
    getClientsByOrganizationId,
    getClientsLoading,
    projectPagination,
    archivedProjectPagination,
    createProjectLoading,
    editProjectLoading,
    sendArchiveProjectLoading,
    unarchiveProjectLoading,
    deleteProjectLoading,
  } = useProject();

  const [modalState, setModalState] = useState<ProjectState>({
    type: null,
    data: null,
  });

  useEffect(() => {
    if (!user?.currentTeamId || !canCallApi("viewProjects")) return;

    const fetchData = async () => {
      if (activeTab === "active" && !activeLoaded) {
        await getProjects(user.currentTeamId, "active", {
          page: activeCurrentPage,
          pageSize: 10,
        });
        setActiveLoaded(true);
      }

      if (activeTab === "archived" && !archivedLoaded) {
        await getProjects(user.currentTeamId, "archived", {
          page: archivedCurrentPage,
          pageSize: 10,
        });
        setArchivedLoaded(true);
      }
    };

    fetchData();
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

  useEffect(() => {
    if (!user?.currentTeamId || !canCallApi("viewClients")) return;
    getClientsByOrganizationId(user.currentTeamId).then((data) => {
      setClients(data || []);
    });
  }, [user?.currentTeamId]);

  const refreshProjects = useCallback(async () => {
    if (!user?.currentTeamId || !canCallApi("viewProjects")) return;
    const pageSize =
      activeTab === "active"
        ? projectPagination?.pageSize || 10
        : archivedProjectPagination?.pageSize || 10;

    const totalProjects =
      activeTab === "active"
        ? projectPagination?.total || 0
        : archivedProjectPagination?.total || 0;

    const total =
      activeTab === "active" ? projects.length : archivedProjects.length;

    const currentPage =
      activeTab === "active" ? activeCurrentPage : archivedCurrentPage;

    if (total === 0 || totalProjects > pageSize * currentPage) {
      if (activeTab === "active") {
        await getProjects(user.currentTeamId, "active", {
          page: activeCurrentPage,
          pageSize,
        });
        setActiveLoaded(true);
      } else {
        await getProjects(user.currentTeamId, "archived", {
          page: archivedCurrentPage,
          pageSize,
        });
        setArchivedLoaded(true);
      }
    }
  }, [
    user?.currentTeamId,
    activeTab,
    projectPagination?.pageSize,
    projectPagination?.total,
    archivedProjectPagination?.pageSize,
    archivedProjectPagination?.total,
    projects.length,
    archivedProjects.length,
    activeCurrentPage,
    archivedCurrentPage,
    getProjects,
  ]);

  const handleCreateProject = useCallback(
    async (data: ProjectData) => {
      if (!user?.currentTeamId) return;
      await createProject(user.currentTeamId, data);
      setModalState({ type: null, data: null });
    },
    [user?.currentTeamId, createProject]
  );

  const handleEditProject = useCallback(
    async (data: ProjectData) => {
      if (!user?.currentTeamId || !modalState.data) return;
      await updateProject(modalState.data.id, user.currentTeamId, data);
      setModalState({ type: null, data: null });
    },
    [user?.currentTeamId, updateProject, modalState.data]
  );

  const handleArchiveProject = useCallback(
    async (projectId: string) => {
      if (!user?.currentTeamId) return;
      await archiveProject(projectId, user.currentTeamId);

      const isActiveTab = activeTab === "active";
      const currentPage = isActiveTab ? activeCurrentPage : archivedCurrentPage;
      const currnetData = isActiveTab ? projects : archivedProjects;

      if (currnetData.length === 1 && currentPage > 1) {
        const newPage = Math.max(currentPage - 1, 1);
        if (isActiveTab) {
          setActiveCurrentPage(newPage);
        } else {
          setArchivedCurrentPage(newPage);
        }
      }

      await refreshProjects();
    },
    [user?.currentTeamId, archiveProject, refreshProjects]
  );

  const handleUnarchiveProject = useCallback(
    async (projectId: string) => {
      if (!user?.currentTeamId) return;
      await unarchiveProject(projectId, user.currentTeamId);

      const isActiveTab = activeTab === "active";
      const currentPage = isActiveTab ? activeCurrentPage : archivedCurrentPage;
      const currnetData = isActiveTab ? projects : archivedProjects;

      if (currnetData.length === 1 && currentPage > 1) {
        const newPage = Math.max(currentPage - 1, 1);
        if (isActiveTab) {
          setActiveCurrentPage(newPage);
        } else {
          setArchivedCurrentPage(newPage);
        }
      }

      await refreshProjects();
    },
    [user?.currentTeamId, unarchiveProject, refreshProjects]
  );

  const handleDeleteProject = useCallback(
    async (projectId: string) => {
      if (!user?.currentTeamId) return;
      try {
        await deleteProject(projectId, user.currentTeamId);

        const isActiveTab = activeTab === "active";
        const currentPage = isActiveTab
          ? activeCurrentPage
          : archivedCurrentPage;
        const currnetData = isActiveTab ? projects : archivedProjects;

        if (currnetData.length === 1 && currentPage > 1) {
          const newPage = Math.max(currentPage - 1, 1);
          if (isActiveTab) {
            setActiveCurrentPage(newPage);
          } else {
            setArchivedCurrentPage(newPage);
          }
        }
        await refreshProjects();
      } catch (error) {}
    },
    [
      user?.currentTeamId,
      deleteProject,
      activeTab,
      activeCurrentPage,
      archivedCurrentPage,
      projects,
      archivedProjects,
      refreshProjects,
    ]
  );

  return (
    <div className=" py-2 w-full space-y-4">
      <div className="flex flex-col gap-3  pt-1 ">
        <div className="flex flex-col items-start px-5 md:flex-row md:items-center md:justify-between gap-2 w-full">
          <div className="flex items-center gap-2">
            <FolderOpen className="h-5 w-5 text-muted-foreground" />
            <span className="font-semibold ">Projects</span>
          </div>
          {canCallApi("createProject") ? (
            <Button
              className="w-full md:w-auto"
              variant="outline"
              onClick={() => setModalState({ type: "add", data: null })}
            >
              <FolderPlus className=" h-8 w-8" />
              Create Project
            </Button>
          ) : (
            <div className="h-9 w-9" />
          )}
        </div>
        <Separator />
      </div>

      <AddEditProjectModal
        isOpen={modalState.type === "add"}
        onClose={() => setModalState({ type: null, data: null })}
        onSubmit={handleCreateProject}
        loading={createProjectLoading}
        clients={getClientsLoading ? [] : clients}
        numberFormat={organization?.numberFormat}
        currency={organization?.currency}
      />

      {/* Edit Project Modal */}
      <AddEditProjectModal
        isOpen={modalState.type === "edit"}
        onClose={() => setModalState({ type: null, data: null })}
        onSubmit={handleEditProject}
        loading={editProjectLoading}
        mode="edit"
        initialData={modalState.data || undefined}
        clients={getClientsLoading ? [] : clients}
        numberFormat={organization?.numberFormat}
        currency={organization?.currency}
      />

      <Tabs
        value={activeTab}
        onValueChange={(tab: string) =>
          setActiveTab(tab as "active" | "archived")
        }
        className="space-y-4 px-5 pt-3"
      >
        <TabsList className="bg-muted/50">
          <TabsTrigger value="active">All</TabsTrigger>
          <TabsTrigger value="archived">Archived</TabsTrigger>
        </TabsList>

        {/* All Projects Tab */}
        <TabsContent value="active" className="space-y-4">
          <ProjectTable
            projects={projects}
            pagination={projectPagination}
            isLoading={isLoading}
            onPageChange={setActiveCurrentPage}
            onEdit={(project) => setModalState({ type: "edit", data: project })}
            onArchive={(project) => handleArchiveProject(project.id)}
            onDelete={handleDeleteProject}
            isDeleteLoading={deleteProjectLoading}
            isEditLoading={editProjectLoading}
            isArchiveLoading={sendArchiveProjectLoading}
          />
        </TabsContent>

        {/* Archived Projects Tab */}
        <TabsContent value="archived" className="space-y-4">
          <ProjectTable
            projects={archivedProjects}
            pagination={archivedProjectPagination}
            isLoading={isLoading}
            onPageChange={setArchivedCurrentPage}
            onEdit={(project) => setModalState({ type: "edit", data: project })}
            onUnarchive={(project) => handleUnarchiveProject(project.id)}
            isEditLoading={editProjectLoading}
            onDelete={handleDeleteProject}
            isDeleteLoading={deleteProjectLoading}
            isUnarchiveLoading={unarchiveProjectLoading}
            archived={true}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProjectPage;
