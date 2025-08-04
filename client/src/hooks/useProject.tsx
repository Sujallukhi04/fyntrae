import { projectApi } from "@/lib/api";
import type { Project } from "@/types/project";
import { useState } from "react";
import { toast } from "sonner";

const useProject = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [archivedProjects, setArchivedProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [createProjectLoading, setCreateProjectLoading] =
    useState<boolean>(false);
  const [editProjectLoading, setEditProjectLoading] = useState<boolean>(false);
  const [sendArchiveProjectLoading, setSendArchiveProjectLoading] =
    useState<boolean>(false);
  const [unarchiveProjectLoading, setUnarchiveProjectLoading] =
    useState<boolean>(false);
  const [getClientsLoading, setGetClientsLoading] = useState<boolean>(false);
  const [getProjectLoading, setGetProjectLoading] = useState<boolean>(false);
  const [deleteProjectLoading, setDeleteProjectLoading] =
    useState<boolean>(false);

  const [projectPagination, setProjectPagination] = useState<{
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  } | null>(null);
  const [archivedProjectPagination, setArchivedProjectPagination] = useState<{
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  } | null>(null);

  const updatePagination = (prev: any, change: number) => {
    if (!prev) return null;

    const newTotal = Math.max(0, prev.total + change); // Ensure total is not negative
    const newTotalPages = Math.max(1, Math.ceil(newTotal / prev.pageSize)); // Ensure at least one page exists
    const currentPage = prev.page || 1; // Fallback to page 1 if undefined
    const newPage = Math.min(currentPage, newTotalPages); // Adjust current page if it exceeds the new total pages

    return {
      ...prev,
      total: newTotal,
      totalPages: newTotalPages,
      page: newPage,
    };
  };

  // Get projects (active or archived)
  const getProjects = async (
    organizationId: string,
    type: "active" | "archived",
    params?: { page?: number; pageSize?: number }
  ) => {
    setIsLoading(true);
    try {
      const response = await projectApi.getAllProjects(organizationId, {
        ...params,
        type,
      });

      if (type === "active") {
        setProjects(response.projects || []);
        setProjectPagination(response.pagination || null);
      } else {
        setArchivedProjects(response.projects || []);
        setArchivedProjectPagination(response.pagination || null);
      }
    } catch (error) {
      console.log(error);
      toast.error("Failed to fetch projects");
    } finally {
      setIsLoading(false);
    }
  };

  // Create project
  const createProject = async (
    organizationId: string,
    data: {
      name: string;
      color?: string;
      billable?: boolean;
      billableRate?: number | null;
      estimatedTime?: number;
      clientId?: string | null;
    }
  ) => {
    const pageSize = projectPagination?.pageSize || 10;
    try {
      setCreateProjectLoading(true);
      const response = await projectApi.createProject(organizationId, data);

      setProjects((prev) => {
        const updatedProjects = [response.project, ...prev];
        if (updatedProjects.length > pageSize) {
          updatedProjects.pop();
        }
        return updatedProjects;
      });

      setProjectPagination((prev) => updatePagination(prev, 1));
      toast.success("Project created successfully");
      return response.project;
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message || "Failed to create project";
      toast.error(errorMessage);
    } finally {
      setCreateProjectLoading(false);
    }
  };

  // Update project
  const updateProject = async (
    projectId: string,
    organizationId: string,
    data: {
      name: string;
      color?: string;
      billable?: boolean;
      billableRate?: number | null;
      estimatedTime?: number;
      clientId?: string | null;
    }
  ) => {
    try {
      setEditProjectLoading(true);
      const response = await projectApi.updateProject(
        projectId,
        organizationId,
        data
      );

      setProjects((prev) =>
        prev.map((proj) => (proj.id === projectId ? response.project : proj))
      );

      setArchivedProjects((prev) =>
        prev.map((proj) =>
          proj.id === projectId ? { ...proj, ...response.project } : proj
        )
      );

      toast.success("Project updated successfully");
      return response.project;
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message || "Failed to update project";
      toast.error(errorMessage);
    } finally {
      setEditProjectLoading(false);
    }
  };

  // Archive project
  const archiveProject = async (projectId: string, organizationId: string) => {
    try {
      setSendArchiveProjectLoading(true);
      const response = await projectApi.archiveProject(
        projectId,
        organizationId
      );
      // Remove from active, add to archived
      setProjects((prev) => prev.filter((proj) => proj.id !== projectId));
      setArchivedProjects((prev) => {
        const updatedProjects = [response.project, ...prev];
        const pageSize = archivedProjectPagination?.pageSize || 10;

        // If the page size exceeds the limit, remove the last project
        if (updatedProjects.length > pageSize) {
          updatedProjects.pop();
        }
        return updatedProjects;
      });

      setProjectPagination((prev) => updatePagination(prev, -1));
      setArchivedProjectPagination((prev) => updatePagination(prev, 1));

      toast.success("Project archived successfully");
      return response.project;
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message || "Failed to archive project";
      toast.error(errorMessage);
    } finally {
      setSendArchiveProjectLoading(false);
    }
  };

  // Unarchive project
  const unarchiveProject = async (
    projectId: string,
    organizationId: string
  ) => {
    try {
      setUnarchiveProjectLoading(true);
      const response = await projectApi.unarchiveProject(
        projectId,
        organizationId
      );
      // Remove from archived, add to active
      setArchivedProjects((prev) =>
        prev.filter((proj) => proj.id !== projectId)
      );
      setProjects((prev) => {
        const updatedProjects = [response.project, ...prev];
        const pageSize = projectPagination?.pageSize || 10;

        // If the page size exceeds the limit, remove the last project
        if (updatedProjects.length > pageSize) {
          updatedProjects.pop();
        }
        return updatedProjects;
      });

      setArchivedProjectPagination((prev) => updatePagination(prev, -1));
      setProjectPagination((prev) => updatePagination(prev, 1));

      toast.success("Project unarchived successfully");
      return response.project;
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message || "Failed to unarchive project";
      toast.error(errorMessage);
    } finally {
      setUnarchiveProjectLoading(false);
    }
  };

  // Get project by id
  const getProjectById = async (projectId: string, organizationId: string) => {
    setGetProjectLoading(true);
    try {
      const response = await projectApi.getProjectById(
        projectId,
        organizationId
      );
      return response.project;
    } catch (error) {
      toast.error("Failed to fetch project details");
      return null;
    } finally {
      setGetProjectLoading(false);
    }
  };

  // Get clients for organization (for project assignment)
  const getClientsByOrganizationId = async (organizationId: string) => {
    try {
      setGetClientsLoading(true);
      const response = await projectApi.getClientsByOrganizationId(
        organizationId
      );
      return response.clients;
    } catch (error) {
      return [];
    } finally {
      setGetClientsLoading(false);
    }
  };

  const deleteProject = async (projectId: string, organizationId: string) => {
    try {
      setDeleteProjectLoading(true);

      const projectarchived = archivedProjects.find(
        (proj) => proj.id === projectId
      )?.isArchived;

      const response = await projectApi.deleteProject(
        projectId,
        organizationId
      );
      setProjects((prev) => prev.filter((proj) => proj.id !== projectId));
      setArchivedProjects((prev) =>
        prev.filter((proj) => proj.id !== projectId)
      );

      if (projectarchived) {
        setArchivedProjectPagination((prev) => updatePagination(prev, -1));
      } else {
        setProjectPagination((prev) => updatePagination(prev, -1));
      }

      toast.success("Project deleted successfully");
      return response;
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message || "Failed to delete project";
      toast.error(errorMessage);
    } finally {
      setDeleteProjectLoading(false);
    }
  };

  return {
    getProjects,
    createProject,
    updateProject,
    archiveProject,
    unarchiveProject,
    getProjectById,
    getClientsByOrganizationId,
    setCreateProjectLoading,
    deleteProject,
    deleteProjectLoading,
    isLoading,
    createProjectLoading,
    editProjectLoading,
    sendArchiveProjectLoading,
    unarchiveProjectLoading,
    getProjectLoading,
    getClientsLoading,
    projects,
    archivedProjects,
    projectPagination,
    archivedProjectPagination,
  };
};

export default useProject;
