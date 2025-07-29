import { useState, useCallback } from "react";
import { ProjectMemberApi } from "@/lib/api";
import { toast } from "sonner";
import type { OrganizationMember, ProjectMember } from "@/types/project";

const useProjectMember = () => {
  const [projectMembers, setProjectMembers] = useState<ProjectMember[]>([]);
  const [organizationMembers, setOrganizationMembers] = useState<
    OrganizationMember[]
  >([]);
  const [isLoading, setIsLoading] = useState(false);
  const [addMemberLoading, setAddMemberLoading] = useState(false);
  const [updateMemberLoading, setUpdateMemberLoading] = useState(false);
  const [removeMemberLoading, setRemoveMemberLoading] = useState(false);

  // Get project members
  const getProjectMembers = useCallback(
    async (projectId: string, organizationId: string) => {
      try {
        setIsLoading(true);
        const response = await ProjectMemberApi.getProjectMembers(
          projectId,
          organizationId
        );
        setProjectMembers(response.projectMembers || []);
        return response;
      } catch (error: any) {
        const errorMessage =
          error.response?.data?.message || "Failed to fetch project members";
        toast.error(errorMessage);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Get organization members (for adding to project)
  const getOrganizationMembers = useCallback(
    async (organizationId: string, projectId?: string) => {
      try {
        const response = await ProjectMemberApi.getOrganizationMembers(
          organizationId,
          projectId
        );
        setOrganizationMembers(response.members || []);
        return response;
      } catch (error: any) {
        const errorMessage =
          error.response?.data?.message ||
          "Failed to fetch organization members";
        toast.error(errorMessage);
        throw error;
      }
    },
    []
  );

  // Add member to project
  const addProjectMember = useCallback(
    async (
      projectId: string,
      organizationId: string,
      memberId: string,
      billableRate?: number
    ) => {
      try {
        setAddMemberLoading(true);
        const response = await ProjectMemberApi.addProjectMember(
          projectId,
          organizationId,
          {
            memberId,
            billableRate,
          }
        );

        // Update local state
        setProjectMembers((prev) => [...prev, response.projectMember]);

        setOrganizationMembers((prev) =>
          prev.filter((member) => member.id !== memberId)
        );

        toast.success("Member added to project successfully");
        return response;
      } catch (error: any) {
        const errorMessage =
          error.response?.data?.message || "Failed to add member to project";
        toast.error(errorMessage);
        throw error;
      } finally {
        setAddMemberLoading(false);
      }
    },
    []
  );

  // Update project member
  const updateProjectMember = useCallback(
    async (
      projectId: string,
      organizationId: string,
      memberId: string,
      billableRate: number | null
    ) => {
      try {
        setUpdateMemberLoading(true);
        const response = await ProjectMemberApi.updateProjectMember(
          projectId,
          organizationId,
          memberId,
          { billableRate }
        );

        // Update local state
        setProjectMembers((prev) =>
          prev.map((member) =>
            member.memberId === memberId ? response.projectMember : member
          )
        );
        toast.success("Project member updated successfully");
        return response;
      } catch (error: any) {
        const errorMessage =
          error.response?.data?.message || "Failed to update project member";
        toast.error(errorMessage);
        throw error;
      } finally {
        setUpdateMemberLoading(false);
      }
    },
    []
  );

  // Remove member from project
  const removeProjectMember = useCallback(
    async (projectId: string, organizationId: string, memberId: string) => {
      try {
        setRemoveMemberLoading(true);
        await ProjectMemberApi.removeProjectMember(
          projectId,
          organizationId,
          memberId
        );

        // Update local state
        setProjectMembers((prev) =>
          prev.filter((member) => member.memberId !== memberId)
        );
        toast.success("Member removed from project successfully");
      } catch (error: any) {
        const errorMessage =
          error.response?.data?.message ||
          "Failed to remove member from project";
        toast.error(errorMessage);
        throw error;
      } finally {
        setRemoveMemberLoading(false);
      }
    },
    []
  );

  return {
    projectMembers,
    organizationMembers,
    isLoading,
    addMemberLoading,
    updateMemberLoading,
    removeMemberLoading,
    getProjectMembers,
    getOrganizationMembers,
    addProjectMember,
    updateProjectMember,
    removeProjectMember,
    setProjectMembers,
    setOrganizationMembers,
  };
};

export default useProjectMember;
