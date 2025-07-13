import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Plus } from "lucide-react";
import { useAuth } from "@/providers/AuthProvider";
import useProject from "@/hooks/useProject";
import type { Project } from "@/types/project";
import ProjectTable from "@/components/modals/project/ProjectTable";

const ProjectPage = () => {
  const [activeTab, setActiveTab] = useState<"active" | "archived">("active");
  const [activeCurrentPage, setActiveCurrentPage] = useState(1);
  const [archivedCurrentPage, setArchivedCurrentPage] = useState(1);

  const { user } = useAuth();
  const {
    projects,
    archivedProjects,
    isLoading,
    getProjects,
    createProject,
    updateProject,
    archiveProject,
    unarchiveProject,
    projectPagination,
    archivedProjectPagination,
    createProjectLoading,
    editProjectLoading,
    sendArchiveProjectLoading,
    unarchiveProjectLoading,
  } = useProject();

  const [modalState, setModalState] = useState<{
    type: "add" | "edit" | null;
    data: Project | null;
  }>({ type: null, data: null });

  // Fetch both lists on mount
  useEffect(() => {
    if (!user?.currentTeamId) return;
    getProjects(user.currentTeamId, "active", {
      page: activeCurrentPage,
      pageSize: 10,
    });
    getProjects(user.currentTeamId, "archived", {
      page: archivedCurrentPage,
      pageSize: 10,
    });
    // eslint-disable-next-line
  }, [user?.currentTeamId]);

  // Fetch when page or tab changes
  useEffect(() => {
    if (!user?.currentTeamId) return;
    if (activeTab === "active") {
      getProjects(user.currentTeamId, "active", {
        page: activeCurrentPage,
        pageSize: 10,
      });
    } else {
      getProjects(user.currentTeamId, "archived", {
        page: archivedCurrentPage,
        pageSize: 10,
      });
    }
    // eslint-disable-next-line
  }, [user?.currentTeamId, activeTab, activeCurrentPage, archivedCurrentPage]);

  const handleCreateProject = useCallback(
    async (data) => {
      if (!user?.currentTeamId) return;
      await createProject(user.currentTeamId, data);
      setModalState({ type: null, data: null });
    },
    [user?.currentTeamId, createProject]
  );

  const handleEditProject = useCallback(
    async (data) => {
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
    },
    [user?.currentTeamId, archiveProject]
  );

  const handleUnarchiveProject = useCallback(
    async (projectId: string) => {
      if (!user?.currentTeamId) return;
      await unarchiveProject(projectId, user.currentTeamId);
    },
    [user?.currentTeamId, unarchiveProject]
  );

  return (
    <div className="mx-auto max-w-6xl p-2 w-full space-y-4">
      <div className="flex flex-col gap-3 pb-3 pt-2">
        <div className="flex flex-col items-start md:flex-row md:items-center md:justify-between gap-2 w-full">
          <div>
            <h1 className="text-xl font-semibold">Projects</h1>
            <div className="text-sm text-muted-foreground">
              Manage your projects and their status
            </div>
          </div>
          <Button
            className="w-full md:w-auto"
            onClick={() => setModalState({ type: "add", data: null })}
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Project
          </Button>
        </div>
      </div>

      {/* <AddEditProjectModal
        isOpen={modalState.type === "add"}
        onClose={() => setModalState({ type: null, data: null })}
        onSubmit={handleCreateProject}
        loading={createProjectLoading}
      />

      <AddEditProjectModal
        isOpen={modalState.type === "edit"}
        onClose={() => setModalState({ type: null, data: null })}
        onSubmit={handleEditProject}
        loading={editProjectLoading}
        mode="edit"
        initialData={modalState.data}
      /> */}

      <Tabs
        value={activeTab}
        onValueChange={(tab: string) =>
          setActiveTab(tab as "active" | "archived")
        }
        className="space-y-4"
      >
        <TabsList className="bg-muted/50">
          <TabsTrigger value="active">
            All ({projectPagination?.total || 0})
          </TabsTrigger>
          <TabsTrigger value="archived">
            Archived ({archivedProjectPagination?.total || 0})
          </TabsTrigger>
        </TabsList>

        {/* All Projects Tab */}
        <TabsContent value="active" className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="relative flex-1 max-w-md w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                type="text"
                placeholder="Search projects..."
                className="pl-10 bg-transparent border border-muted-foreground/30 focus:border-primary focus:ring-0"
              />
            </div>
          </div>
          <ProjectTable
            projects={projects}
            pagination={projectPagination}
            isLoading={isLoading}
            onPageChange={setActiveCurrentPage}
            onEdit={(project) => setModalState({ type: "edit", data: project })}
            onArchive={(project) => handleArchiveProject(project.id)}
            isEditLoading={editProjectLoading}
            isArchiveLoading={sendArchiveProjectLoading}
          />
        </TabsContent>

        {/* Archived Projects Tab */}
        <TabsContent value="archived" className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="relative flex-1 max-w-md w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                type="text"
                placeholder="Search archived projects..."
                className="pl-10 bg-transparent border border-muted-foreground/30 focus:border-primary focus:ring-0"
              />
            </div>
          </div>
          <ProjectTable
            projects={archivedProjects}
            pagination={archivedProjectPagination}
            isLoading={isLoading}
            onPageChange={setArchivedCurrentPage}
            onEdit={(project) => setModalState({ type: "edit", data: project })}
            onUnarchive={(project) => handleUnarchiveProject(project.id)}
            isEditLoading={editProjectLoading}
            isUnarchiveLoading={unarchiveProjectLoading}
            archived
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProjectPage;
