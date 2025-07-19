import { TaskApi } from "@/lib/api";
import type { Tasks } from "@/types/project";
import React from "react";
import { useState } from "react";
import { toast } from "sonner";

const useTaks = () => {
  const [tasks, setTasks] = useState<Tasks[]>([]);
  const [createTaskLoading, setCreateTaskLoading] = useState<boolean>(false);
  const [editTaskLoading, setEditTaskLoading] = useState<boolean>(false);
  const [deleteTaskLoading, setDeleteTaskLoading] = useState<boolean>(false);
  const [getTasksLoading, setGetTasksLoading] = useState<boolean>(false);
  const [changeTaskStatusLoading, setChangeTaskStatusLoading] =
    useState<boolean>(false);

  // Get tasks for a project
  const getTasks = async (projectId: string, organizationId: string) => {
    setGetTasksLoading(true);
    try {
      const response = await TaskApi.getProjectTasks(projectId, organizationId);
      setTasks(response.tasks || []);
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message || "Failed to unarchive project";
      toast.error(errorMessage);
    } finally {
      setGetTasksLoading(false);
    }
  };

  // Create a new task
  const createTask = async (
    projectId: string,
    organizationId: string,
    data: { name: string; estimatedTime?: number }
  ) => {
    try {
      setCreateTaskLoading(true);
      const response = await TaskApi.createTask(
        projectId,
        organizationId,
        data
      );
      setTasks((prev) => [response.task, ...prev]);
      toast.success("Task created successfully");
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message || "Failed to create task";
      toast.error(errorMessage);
    } finally {
      setCreateTaskLoading(false);
    }
  };

  // Update a task
  const updateTask = async (
    taskId: string,
    projectId: string,
    organizationId: string,
    data: { name: string; estimatedTime?: number }
  ) => {
    try {
      setEditTaskLoading(true);
      const response = await TaskApi.updateTask(
        taskId,
        projectId,
        organizationId,
        data
      );
      setTasks((prev) =>
        prev.map((task) => (task.id === taskId ? response.task : task))
      );
      toast.success("Task updated successfully");
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message || "Failed to update task";
      toast.error(errorMessage);
    } finally {
      setEditTaskLoading(false);
    }
  };

  // Delete a task
  const deleteTask = async (
    taskId: string,
    projectId: string,
    organizationId: string
  ) => {
    try {
      setDeleteTaskLoading(true);
      await TaskApi.deleteTask(taskId, projectId, organizationId);
      setTasks((prev) => prev.filter((task) => task.id !== taskId));
      toast.success("Task deleted successfully");
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message || "Failed to delete task";
      toast.error(errorMessage);
    } finally {
      setDeleteTaskLoading(false);
    }
  };

  const updatetaskStatus = async (
    taskId: string,
    projectId: string,
    organizationId: string,
    status: "ACTIVE" | "DONE"
  ) => {
    try {
      setChangeTaskStatusLoading(true);
      const response = await TaskApi.updateTaskStatus(
        taskId,
        projectId,
        organizationId,
        status
      );
      setTasks((prev) =>
        prev.map((task) => (task.id === taskId ? response.task : task))
      );
      toast.success("Task status updated successfully");
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message || "Failed to update task status";
      toast.error(errorMessage);
    } finally {
      setChangeTaskStatusLoading(false);
    }
  };
  return {
    tasks,
    createTaskLoading,
    editTaskLoading,
    deleteTaskLoading,
    getTasksLoading,
    changeTaskStatusLoading,
    getTasks,
    createTask,
    updateTask,
    deleteTask,
    updatetaskStatus,
  };
};

export default useTaks;
