import { Request, Response } from "express";
import { ErrorHandler } from "../utils/errorHandler";
import {
  addProjectMemberSchema,
  createProjectSchema,
  createProjectTaskSchema,
  updateProjectMemberSchema,
  updateTaskSchema,
  updateTaskStatusSchema,
} from "../utils/index";
import { db } from "../prismaClient";
import {
  assertActivePermissionedMember,
  assertAPIPermission,
  assertProjectAccess,
  validateTaskInProject,
} from "../helper/organization";
import { Role } from "@prisma/client";

export const createProject = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { orgId } = req.params;

    if (!userId) throw new ErrorHandler("User not authenticated", 401);
    if (!orgId) throw new ErrorHandler("Organization ID is required", 400);

    // Check permissions
    await assertAPIPermission(userId, orgId, "PROJECT", "CREATE");

    const validated = createProjectSchema.safeParse(req.body);
    if (!validated.success) {
      const message = validated.error.errors[0].message;
      throw new ErrorHandler(message, 400);
    }

    const data = validated.data;

    const existingProject = await db.project.findFirst({
      where: { name: data.name, organizationId: orgId },
    });

    if (existingProject)
      throw new ErrorHandler("Project with this name already exists", 400);

    if (data.clientId) {
      const client = await db.client.findFirst({
        where: {
          id: data.clientId,
          organizationId: orgId,
        },
      });

      if (!client) {
        throw new ErrorHandler("Invalid client ID for this organization", 400);
      }
    }

    const project = await db.project.create({
      data: {
        name: data.name,
        color: data.color,
        billable: data.billable,
        billableRate: data.billable ? data.billableRate : null,
        estimatedTime: data.estimatedTime,
        organizationId: orgId,
        clientId: data.clientId || null,
      },
      include: {
        client: { select: { id: true, name: true, archivedAt: true } },
      },
    });

    res.status(201).json({ message: "Project created successfully", project });
  } catch (error) {
    throw new ErrorHandler(
      error instanceof Error ? error.message : "Internal Server Error",
      500
    );
  }
};

export const getAllProjects = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { orgId } = req.params;
    const { page = 1, pageSize = 10, type = "active" } = req.query;

    if (!userId) throw new ErrorHandler("User not authenticated", 401);
    if (!orgId) throw new ErrorHandler("Organization ID is required", 400);

    const pageNum = Number(page);
    const size = Number(pageSize);
    const isArchived = type === "archived";

    // Check permissions
    const member = await assertAPIPermission(userId, orgId, "PROJECT", "VIEW");

    const whereFilter: any = {
      organizationId: orgId,
      isArchived,
    };

    if (member.role === "EMPLOYEE") {
      const projectMemberships = await db.projectMember.findMany({
        where: { userId },
        select: { projectId: true },
      });

      const projectIds = projectMemberships.map((pm) => pm.projectId);
      whereFilter.id = { in: projectIds };
    }

    const total = await db.project.count({ where: whereFilter });

    const projects = await db.project.findMany({
      where: whereFilter,
      include: {
        client: { select: { id: true, name: true, archivedAt: true } },
      },
      skip: (pageNum - 1) * size,
      take: size,
      orderBy: { createdAt: "desc" },
    });

    res.status(200).json({
      projects,
      pagination: {
        total,
        page: pageNum,
        pageSize: size,
        totalPages: Math.ceil(total / size),
      },
    });
  } catch (error) {
    throw new ErrorHandler(
      error instanceof Error ? error.message : "Internal Server Error",
      500
    );
  }
};

export const getProjectsByOrgId = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { projectId, orgId } = req.params;
    const userId = req.user?.id;

    if (!projectId || !orgId)
      throw new ErrorHandler(
        "Project ID and Organization ID are required",
        400
      );
    if (!userId) throw new ErrorHandler("User not authenticated", 401);

    await assertProjectAccess(userId, orgId, projectId, "VIEW");

    const project = await db.project.findUnique({
      where: { id: projectId },
      include: {
        client: { select: { id: true, name: true, archivedAt: true } },
      },
    });

    if (!project) throw new ErrorHandler("Project not found", 404);

    res.status(200).json({ project });
  } catch (error) {
    throw new ErrorHandler(
      error instanceof Error ? error.message : "Internal Server Error",
      500
    );
  }
};

export const updateProject = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { projectId, organizationId } = req.params;
    const userId = req.user?.id;

    if (!userId) throw new ErrorHandler("User not authenticated", 401);
    if (!projectId || !organizationId)
      throw new ErrorHandler("Project ID or oraganization is required", 400);

    // Check permissions
    await assertProjectAccess(userId, organizationId, projectId, "UPDATE");

    const validated = createProjectSchema.safeParse(req.body);
    if (!validated.success) {
      const message = validated.error.errors[0].message;
      throw new ErrorHandler(message, 400);
    }

    const data = validated.data;

    if (data.name) {
      const nameConflict = await db.project.findFirst({
        where: {
          name: data.name,
          organizationId,
          id: { not: projectId },
        },
      });

      if (nameConflict) {
        throw new ErrorHandler("Project with this name already exists", 400);
      }
    }

    if (data.clientId) {
      const client = await db.client.findFirst({
        where: {
          id: data.clientId,
          organizationId,
        },
      });

      if (!client) {
        throw new ErrorHandler("Invalid client ID for this organization", 400);
      }
    }

    const updatedProject = await db.project.update({
      where: { id: projectId },
      data: {
        name: data.name,
        color: data.color,
        billable: data.billable,
        billableRate: data.billable ? data.billableRate : null,
        estimatedTime: data.estimatedTime,
        clientId: data.clientId || null,
      },
      include: {
        client: { select: { id: true, name: true, archivedAt: true } },
      },
    });

    res.status(200).json({
      message: "Project updated successfully",
      project: updatedProject,
    });
  } catch (error) {
    throw new ErrorHandler(
      error instanceof Error ? error.message : "Internal Server Error",
      500
    );
  }
};

export const archiveProject = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { projectId, organizationId } = req.params;
    const userId = req.user?.id;

    if (!userId) throw new ErrorHandler("User not authenticated", 401);
    if (!projectId || !organizationId)
      throw new ErrorHandler("Project ID or Organization ID is required", 400);

    // Check permissions
    await assertProjectAccess(userId, organizationId, projectId, "ARCHIVE");

    const project = await db.project.update({
      where: { id: projectId },
      data: { isArchived: true, archivedAt: new Date() },
      include: {
        client: { select: { id: true, name: true, archivedAt: true } },
      },
    });

    res.status(200).json({ message: "Project archived successfully", project });
  } catch (error) {
    throw new ErrorHandler(
      error instanceof Error ? error.message : "Internal Server Error",
      500
    );
  }
};

export const unarchiveProject = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { projectId, organizationId } = req.params;

    if (!userId) throw new ErrorHandler("User not authenticated", 401);
    if (!projectId || !organizationId)
      throw new ErrorHandler("Project ID or Organization ID is required", 400);

    // Check permissions
    await assertProjectAccess(userId, organizationId, projectId, "ARCHIVE");

    const project = await db.project.update({
      where: { id: projectId },
      data: { isArchived: false, archivedAt: null },
      include: {
        client: { select: { id: true, name: true, archivedAt: true } },
      },
    });

    res
      .status(200)
      .json({ message: "Project unarchived successfully", project });
  } catch (error) {
    throw new ErrorHandler(
      error instanceof Error ? error.message : "Internal Server Error",
      500
    );
  }
};

export const deleteProject = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { projectId, organizationId } = req.params;
    const userId = req.user?.id;

    if (!userId) throw new ErrorHandler("User not authenticated", 401);
    if (!projectId || !organizationId)
      throw new ErrorHandler("Project ID or Organization ID is required", 400);

    // Check permissions
    await assertProjectAccess(userId, organizationId, projectId, "DELETE");

    // Check if project is used in any task
    const taskExists = await db.task.findFirst({
      where: { projectId },
    });

    if (taskExists) {
      throw new ErrorHandler("Project cannot be deleted as it has tasks", 400);
    }

    await db.$transaction(async (tx) => {
      await tx.projectMember.deleteMany({
        where: { projectId },
      });

      await tx.project.delete({
        where: { id: projectId },
      });
    });

    res.status(200).json({
      message: "Project deleted successfully",
    });
  } catch (error) {
    throw new ErrorHandler(
      error instanceof Error ? error.message : "Internal Server Error",
      500
    );
  }
};

export const getClientsByOrganizationId = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { organizationId } = req.params;
  const userId = req.user?.id;

  if (!organizationId)
    throw new ErrorHandler("Organization ID is required", 400);
  if (!userId) throw new ErrorHandler("User not authenticated", 401);

  await assertAPIPermission(userId, organizationId, "CLIENT", "VIEW");

  const clients = await db.client.findMany({
    where: { organizationId: organizationId },
    select: {
      id: true,
      name: true,
      archivedAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  res.status(200).json({ clients });
};

export const addProjectMember = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { projectId, organizationId } = req.params;

    if (!userId) throw new ErrorHandler("User not authenticated", 401);
    if (!projectId || !organizationId)
      throw new ErrorHandler(
        "Project ID and Organization ID are required",
        400
      );

    // Centralized project access check
    await assertProjectAccess(
      userId,
      organizationId,
      projectId,
      "MANAGE_MEMBERS"
    );

    const validated = addProjectMemberSchema.safeParse(req.body);
    if (!validated.success) {
      throw new ErrorHandler(validated.error.errors[0].message, 400);
    }

    const { memberId, billableRate } = validated.data;

    const member = await db.member.findFirst({
      where: {
        id: memberId,
        organizationId,
        isActive: true,
      },
    });

    if (!member) {
      throw new ErrorHandler("Member not found or inactive", 404);
    }

    const existingProjectMember = await db.projectMember.findUnique({
      where: {
        projectId_memberId: {
          projectId,
          memberId,
        },
      },
    });

    if (existingProjectMember) {
      throw new ErrorHandler("Member already added to this project", 400);
    }

    const projectMember = await db.projectMember.create({
      data: {
        projectId,
        memberId,
        userId: member.userId,
        billableRate: billableRate === 0 ? null : billableRate,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        member: {
          select: {
            role: true,
            isActive: true,
          },
        },
      },
    });

    res.status(201).json({
      message: "Member added to project successfully",
      projectMember,
    });
  } catch (error) {
    throw new ErrorHandler(
      error instanceof Error ? error.message : "Internal Server Error",
      500
    );
  }
};

export const getProjectMembers = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { projectId, organizationId } = req.params;

    if (!userId) throw new ErrorHandler("User not authenticated", 401);
    if (!projectId || !organizationId)
      throw new ErrorHandler(
        "Project ID and Organization ID are required",
        400
      );

    // Centralized project access check
    await assertProjectAccess(
      userId,
      organizationId,
      projectId,
      "VIEW_MEMBERS"
    );

    const projectMembers = await db.projectMember.findMany({
      where: {
        projectId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        member: {
          select: {
            role: true,
            isActive: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.status(200).json({ projectMembers });
  } catch (error) {
    throw new ErrorHandler(
      error instanceof Error ? error.message : "Internal Server Error",
      500
    );
  }
};

export const updateProjectMember = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { projectId, organizationId, memberId } = req.params;

    if (!userId) throw new ErrorHandler("User not authenticated", 401);
    if (!projectId || !organizationId || !memberId)
      throw new ErrorHandler(
        "Project ID, Organization ID and Member ID are required",
        400
      );

    // Centralized project access check
    await assertProjectAccess(
      userId,
      organizationId,
      projectId,
      "MANAGE_MEMBERS"
    );

    const validated = updateProjectMemberSchema.safeParse(req.body);
    if (!validated.success) {
      throw new ErrorHandler(validated.error.errors[0].message, 400);
    }

    const { billableRate } = validated.data;

    const projectMember = await db.projectMember.update({
      where: {
        projectId_memberId: {
          projectId,
          memberId,
        },
      },
      data: {
        billableRate,
        updatedAt: new Date(),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        member: {
          select: {
            role: true,
            isActive: true,
          },
        },
      },
    });

    res.status(200).json({
      message: "Project member updated successfully",
      projectMember,
    });
  } catch (error) {
    throw new ErrorHandler(
      error instanceof Error ? error.message : "Internal Server Error",
      500
    );
  }
};

export const removeProjectMember = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { projectId, organizationId, memberId } = req.params;

    if (!userId) throw new ErrorHandler("User not authenticated", 401);
    if (!projectId || !organizationId || !memberId)
      throw new ErrorHandler(
        "Project ID, Organization ID and Member ID are required",
        400
      );

    // Centralized project access check
    await assertProjectAccess(
      userId,
      organizationId,
      projectId,
      "MANAGE_MEMBERS"
    );

    // Check if member exists in project
    const existingProjectMember = await db.projectMember.findUnique({
      where: {
        projectId_memberId: {
          projectId,
          memberId,
        },
      },
    });

    if (!existingProjectMember) {
      throw new ErrorHandler("Member not found in this project", 404);
    }

    // Remove member from project
    await db.projectMember.delete({
      where: {
        projectId_memberId: {
          projectId,
          memberId,
        },
      },
    });

    res.status(200).json({
      message: "Member removed from project successfully",
    });
  } catch (error) {
    throw new ErrorHandler(
      error instanceof Error ? error.message : "Internal Server Error",
      500
    );
  }
};

export const getMembersByOrganizationId = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { organizationId } = req.params;
    const { projectId } = req.query;
    const userId = req.user?.id;

    if (!userId) throw new ErrorHandler("User not authenticated", 401);
    if (!organizationId || !projectId)
      throw new ErrorHandler("organizationId or ProjectId is required", 400);

    await assertProjectAccess(
      userId,
      organizationId,
      projectId as string,
      "MANAGE_MEMBERS"
    );

    const existingProjectMemberIds = projectId
      ? (
          await db.projectMember.findMany({
            where: { projectId: projectId as string },
            select: { memberId: true },
          })
        ).map((pm) => pm.memberId)
      : [];

    const members = await db.member.findMany({
      where: {
        organizationId,
        isActive: true,
        id: {
          notIn: existingProjectMemberIds,
        },
      },
      select: {
        id: true,
        role: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.status(200).json({ members });
  } catch (error) {
    throw new ErrorHandler(
      error instanceof Error ? error.message : "Internal Server Error",
      500
    );
  }
};

export const getProjectTasks = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { projectId, organizationId } = req.params;
    const { status } = req.query;

    if (!userId) throw new ErrorHandler("User not authenticated", 401);
    if (!projectId || !organizationId)
      throw new ErrorHandler(
        "Project ID and Organization ID are required",
        400
      );

    // Centralized project access check
    await assertProjectAccess(userId, organizationId, projectId, "VIEW");

    const whereFilter: any = {
      projectId,
      organizationId,
    };

    if (status && ["ACTIVE", "DONE"].includes(status as string)) {
      whereFilter.status = status;
    }

    const tasks = await db.task.findMany({
      where: whereFilter,
      orderBy: { createdAt: "desc" },
    });

    res.status(200).json({ tasks });
  } catch (error) {
    throw new ErrorHandler(
      error instanceof Error ? error.message : "Internal Server Error",
      500
    );
  }
};

export const createProjectTask = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { projectId, organizationId } = req.params;
    if (!userId) throw new ErrorHandler("User not authenticated", 401);
    if (!projectId || !organizationId)
      throw new ErrorHandler(
        "Project ID and Organization ID are required",
        400
      );

    // Centralized project access check
    await assertProjectAccess(userId, organizationId, projectId, "ADD_TASKS");

    const validated = createProjectTaskSchema.safeParse(req.body);
    if (!validated.success) {
      const message = validated.error.errors[0].message;
      throw new ErrorHandler(message, 400);
    }

    const { name, estimatedTime } = validated.data;

    const existingTask = await db.task.findFirst({
      where: {
        name,
        projectId,
        organizationId,
      },
    });

    if (existingTask) {
      throw new ErrorHandler("Task with this name already exists", 400);
    }

    const task = await db.task.create({
      data: {
        name,
        projectId,
        organizationId,
        estimatedTime: estimatedTime || null,
        status: "ACTIVE",
      },
    });

    res.status(201).json({
      message: "Task created successfully",
      task,
    });
  } catch (error) {
    throw new ErrorHandler(
      error instanceof Error ? error.message : "Internal Server Error",
      500
    );
  }
};

export const updateProjectTask = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { projectId, organizationId, taskId } = req.params;

    if (!userId) throw new ErrorHandler("User not authenticated", 401);
    if (!projectId || !organizationId || !taskId)
      throw new ErrorHandler(
        "Project ID, Organization ID and Task ID are required",
        400
      );

    const validated = updateTaskSchema.safeParse(req.body);
    if (!validated.success) {
      throw new ErrorHandler(validated.error.errors[0].message, 400);
    }

    const { name, estimatedTime } = validated.data;

    await assertProjectAccess(userId, organizationId, projectId, "ADD_TASKS");

    await validateTaskInProject(taskId, projectId, organizationId);

    if (name) {
      const nameConflict = await db.task.findFirst({
        where: {
          name,
          projectId,
          organizationId,
          id: { not: taskId },
        },
      });

      if (nameConflict) {
        throw new ErrorHandler(
          "Task with this name already exists in project",
          400
        );
      }
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (estimatedTime !== undefined) updateData.estimatedTime = estimatedTime;

    const updatedTask = await db.task.update({
      where: { id: taskId },
      data: updateData,
    });

    res.status(200).json({
      message: "Task updated successfully",
      task: updatedTask,
    });
  } catch (error) {
    throw new ErrorHandler(
      error instanceof Error ? error.message : "Internal Server Error",
      500
    );
  }
};

export const updateTaskStatus = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { projectId, organizationId, taskId } = req.params;

    if (!userId) throw new ErrorHandler("User not authenticated", 401);

    if (!projectId || !organizationId || !taskId)
      throw new ErrorHandler(
        "Project ID, Organization ID and Task ID are required",
        400
      );

    const validated = updateTaskStatusSchema.safeParse(req.body);
    if (!validated.success) {
      throw new ErrorHandler(validated.error.errors[0].message, 400);
    }

    const { status } = validated.data;

    await assertProjectAccess(userId, organizationId, projectId, "ADD_TASKS");

    await validateTaskInProject(taskId, projectId, organizationId);

    const updatedTask = await db.task.update({
      where: { id: taskId },
      data: { status },
    });

    res.status(200).json({
      message: `Task marked as ${status.toLowerCase()}`,
      task: updatedTask,
    });
  } catch (error) {
    throw new ErrorHandler(
      error instanceof Error ? error.message : "Internal Server Error",
      500
    );
  }
};

export const deleteTask = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { taskId, projectId, organizationId } = req.params;

    if (!userId) throw new ErrorHandler("User not authenticated", 401);
    if (!taskId || !projectId || !organizationId)
      throw new ErrorHandler(
        "Task ID, Project ID and Organization ID are required",
        400
      );

    // Use project access for deleting tasks
    await assertProjectAccess(userId, organizationId, projectId, "ADD_TASKS");

    // Validate task belongs to project
    await validateTaskInProject(taskId, projectId, organizationId);

    await db.task.delete({
      where: { id: taskId },
    });

    res.status(200).json({
      message: "Task deleted successfully",
    });
  } catch (error) {
    throw new ErrorHandler(
      error instanceof Error ? error.message : "Internal Server Error",
      500
    );
  }
};
