import { LoaderMain } from "@/components/Loader";
import useProject from "@/hooks/useProject";
import { useAuth } from "@/providers/AuthProvider";
import type { Project, ProjectData, Tasks } from "@/types/project";
import { useEffect, useState } from "react";
import { useParams } from "react-router";
import { Button } from "@/components/ui/button";
import { ChevronRight, FolderOpen, Pencil } from "lucide-react";
import useProjectMember from "@/hooks/useProjectMember";
import { Separator } from "@/components/ui/separator";
import AddEditProjectModal from "@/components/project/AddEditProjectModal";
import { useOrganization } from "@/providers/OrganizationProvider";
import AddProjectMemberModal from "@/components/project/AddProjectMemberModal";

import TasksTable from "@/components/project/TaskTable";
import ProjectMembersTable from "@/components/project/ProjectMembersTable";
import useTaks from "@/hooks/useTaks";
import AddEditTaskModal from "@/components/project/AddEditTaskModal";
import { toast } from "sonner";

interface EditMemberState {
  isOpen: boolean;
  memberId: string;
  memberName: string;
  billableRate: number | null;
}

interface TaskModalState {
  isOpen: boolean;
  mode: "add" | "edit";
  task: Tasks | null;
}

const ProjectIdPage = () => {
  const { id } = useParams();
  const {
    getProjectById,
    getProjectLoading,
    updateProject,
    editProjectLoading,
    getClientsByOrganizationId,

    getClientsLoading,
  } = useProject();
  const { organization } = useOrganization();
  const { user } = useAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [clients, setClients] = useState<
    { id: string; name: string; archivedAt: string }[]
  >([]);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
  const [editMemberState, setEditMemberState] = useState<EditMemberState>({
    isOpen: false,
    memberId: "",
    memberName: "",
    billableRate: null,
  });

  const [taskModalState, setTaskModalState] = useState<TaskModalState>({
    isOpen: false,
    mode: "add",
    task: null,
  });

  const {
    projectMembers,
    organizationMembers,
    isLoading,
    addMemberLoading,
    getProjectMembers,
    getOrganizationMembers,
    addProjectMember,
    updateProjectMember,
    updateMemberLoading,
    removeProjectMember,
    removeMemberLoading,
  } = useProjectMember();

  const {
    getTasks,
    createTask,
    updateTask,
    deleteTask,
    updatetaskStatus,
    tasks,
    getTasksLoading,
    createTaskLoading,
    editTaskLoading,
    deleteTaskLoading,
    changeTaskStatusLoading,
  } = useTaks();

  useEffect(() => {
    const fetchProject = async () => {
      if (!user?.currentTeamId || !id) return;
      try {
        const response = await getProjectById(id, user.currentTeamId);
        setProject(response);
      } catch (error) {
        console.error("Failed to fetch project:", error);
      }
    };
    fetchProject();
  }, [id, user?.currentTeamId]);

  useEffect(() => {
    if (project?.id && user?.currentTeamId) {
      getProjectMembers(project?.id, user.currentTeamId);
      getOrganizationMembers(user.currentTeamId, project?.id);
    }
  }, [project?.id, user?.currentTeamId]);

  useEffect(() => {
    if (!user?.currentTeamId) return;
    getClientsByOrganizationId(user.currentTeamId).then((data) => {
      setClients(data || []);
    });
  }, [user?.currentTeamId]);

  const closeTaskModal = () => {
    setTaskModalState({
      isOpen: false,
      mode: "add",
      task: null,
    });
  };

  const handleAddProjectMember = async (
    memberId: string,
    billableRate: number
  ) => {
    if (!user?.currentTeamId || !project?.id)
      return toast.error("Missing team or project info");

    if (!memberId) return toast.error("Member is required");
    if (isNaN(billableRate) || billableRate < 0)
      return toast.error("Invalid billable rate");

    try {
      await addProjectMember(
        project.id,
        user.currentTeamId,
        memberId,
        billableRate
      );
      setIsAddMemberModalOpen(false);
    } catch (error) {
      console.error("Failed to add project member:", error);
    }
  };

  const handleEditProjectMember = async (
    memberId: string,
    billableRate: number
  ) => {
    if (!user?.currentTeamId || !project?.id)
      return toast.error("Missing team or project info");

    if (!memberId) return toast.error("Member is required");
    if (isNaN(billableRate) || billableRate < 0)
      return toast.error("Invalid billable rate");

    const sanitizedRate = billableRate === 0 ? null : billableRate;

    try {
      await updateProjectMember(
        project.id,
        user.currentTeamId,
        memberId,
        sanitizedRate
      );
      setEditMemberState({
        isOpen: false,
        memberId: "",
        memberName: "",
        billableRate: null,
      });
    } catch (error) {
      console.error("Failed to update project member:", error);
    }
  };

  const openEditMemberModal = (member: any) => {
    setEditMemberState({
      isOpen: true,
      memberId: member.memberId,
      memberName: member.user.name,
      billableRate: member.billableRate,
    });
  };

  const closeEditMemberModal = () => {
    setEditMemberState({
      isOpen: false,
      memberId: "",
      memberName: "",
      billableRate: null,
    });
  };

  const handleEditProject = async (data: ProjectData) => {
    if (!user?.currentTeamId || !project?.id)
      return toast.error("Missing team or project info");

    try {
      const updatedProject = await updateProject(
        project.id,
        user.currentTeamId,
        data
      );
      if (updatedProject) {
        setProject(updatedProject);
        setIsEditModalOpen(false);
      }
    } catch (error) {
      console.error("Failed to update project:", error);
    }
  };

  const handleRemoveProjectMember = async (memberId: string) => {
    if (!user?.currentTeamId || !project?.id) return;

    try {
      await removeProjectMember(project.id, user.currentTeamId, memberId);

      await getOrganizationMembers(user.currentTeamId, project.id);
    } catch (error) {
      console.error("Failed to remove project member:", error);
    }
  };

  const handleToggleTaskStatus = async (
    taskId: string,
    currentStatus: "ACTIVE" | "DONE"
  ) => {
    if (!user?.currentTeamId || !project?.id)
      return toast.error("Missing team or project info");

    if (!taskId) return toast.error("Task ID is required");

    const newStatus = currentStatus === "ACTIVE" ? "DONE" : "ACTIVE";

    try {
      await updatetaskStatus(taskId, project.id, user.currentTeamId, newStatus);
    } catch (error) {
      console.error("Failed to update task status:", error);
    }
  };

  const handleAddTaskmodal = () => {
    setTaskModalState({
      isOpen: true,
      mode: "add",
      task: null,
    });
  };

  const handleEditTaskmodal = (task: Tasks) => {
    setTaskModalState({
      isOpen: true,
      mode: "edit",
      task,
    });
  };

  const handleTaskSubmit = async (data: {
    name: string;
    estimatedTime?: number;
  }) => {
    if (!user?.currentTeamId || !project?.id) {
      toast.error("Missing team or project info");
      return;
    }

    if (!data.name?.trim()) {
      toast.error("Task name is required");
      return;
    }
    if (typeof data.estimatedTime !== "undefined") {
      if (isNaN(data.estimatedTime) || data.estimatedTime < 0) {
        toast.error("Estimated time must be a positive number");
        return;
      }
    }

    try {
      if (taskModalState.mode === "add") {
        await createTask(project.id, user.currentTeamId, data);
      } else if (taskModalState.task) {
        await updateTask(
          taskModalState.task.id,
          project.id,
          user.currentTeamId,
          data
        );
      }
      setTaskModalState({
        isOpen: false,
        mode: "add",
        task: null,
      });
    } catch (error) {
      console.error("Failed to submit task:", error);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!user?.currentTeamId || !project?.id)
      return toast.error("Missing team or project info");
    if (!taskId) return toast.error("Task ID is required");
    try {
      await deleteTask(taskId, project.id, user.currentTeamId);
    } catch (error) {}
  };

  useEffect(() => {
    const fetchTasks = async () => {
      if (!user?.currentTeamId || !project?.id) return;
      await getTasks(project.id, user.currentTeamId);
    };

    fetchTasks();
  }, [project?.id, user?.currentTeamId]);

  if (getProjectLoading) {
    return <LoaderMain />;
  }

  if (!project) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <div className="text-center">
          <h2 className="text-xl font-semibold">Project not found</h2>
          <p className="text-muted-foreground">
            The project you're looking for doesn't exist or you don't have
            access.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl py-2 w-full space-y-6">
      {/* Project Header */}
      <div className="flex flex-col gap-3 pt-1 ">
        <div className="flex flex-col items-start px-6 md:flex-row md:items-center md:justify-between gap-2 w-full">
          {/* Left Section: Title + Breadcrumb */}
          <div>
            <h1 className="text-md font-semibold flex items-center gap-2">
              <FolderOpen className="h-5 w-5 text-muted-foreground" />
              <span className="text-muted-foreground">Project</span>
              <span className="text-muted-foreground text-lg">
                <ChevronRight className="size-5" />
              </span>

              {/* This part needs to be a flex row with centered items */}
              <span className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: project?.color }}
                />
                <span className="text-foreground">{project?.name}</span>
              </span>
            </h1>
          </div>

          {/* Right Section: Edit Button */}
          <Button
            variant="outline"
            className="w-full md:w-auto flex items-center gap-2"
            onClick={() => setIsEditModalOpen(true)}
          >
            <Pencil className="h-4 w-4" />
            Edit Project
          </Button>
        </div>
        <Separator className="" />
      </div>

      {/* Edit Project Modal */}
      <AddEditProjectModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSubmit={handleEditProject}
        loading={editProjectLoading}
        mode="edit"
        initialData={project}
        clients={getClientsLoading ? [] : clients}
        numberFormat={organization?.numberFormat}
        currency={organization?.currency}
      />

      <AddEditTaskModal
        isOpen={taskModalState.isOpen}
        onClose={closeTaskModal}
        onSubmit={handleTaskSubmit}
        loading={createTaskLoading || editTaskLoading}
        mode={taskModalState.mode}
        initialData={taskModalState.task}
      />

      {/* Add Member Modal */}
      <AddProjectMemberModal
        isOpen={isAddMemberModalOpen}
        onClose={() => setIsAddMemberModalOpen(false)}
        onSubmit={handleAddProjectMember}
        organizationMembers={organizationMembers}
        loading={addMemberLoading}
        currency={organization?.currency || "USD"}
        mode="add"
      />

      {/* Edit Member Modal */}
      <AddProjectMemberModal
        isOpen={editMemberState.isOpen}
        onClose={closeEditMemberModal}
        onSubmit={handleEditProjectMember}
        organizationMembers={organizationMembers}
        loading={updateMemberLoading}
        currency={organization?.currency || "USD"}
        mode="edit"
        initialMemberId={editMemberState.memberId}
        initialBillableRate={editMemberState.billableRate}
        initialMemberName={editMemberState.memberName}
      />

      {/* Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-3 px-6">
        {/* Tasks Section - 1/2 width on large screens */}
        <TasksTable
          tasks={tasks}
          isLoading={getTasksLoading}
          onAddTask={handleAddTaskmodal}
          onEditTask={handleEditTaskmodal}
          onDeleteTask={handleDeleteTask}
          onToggleStatus={handleToggleTaskStatus}
          deleteLoading={deleteTaskLoading}
          statusLoading={changeTaskStatusLoading}
        />

        {/* Members Section - 1/2 width on large screens */}
        <ProjectMembersTable
          projectMembers={projectMembers}
          isLoading={isLoading}
          onAddMember={() => setIsAddMemberModalOpen(true)}
          onEditMember={openEditMemberModal}
          onRemoveMember={handleRemoveProjectMember}
          updateMemberLoading={updateMemberLoading}
          removeMemberLoading={removeMemberLoading}
        />
      </div>
    </div>
  );
};

export default ProjectIdPage;
