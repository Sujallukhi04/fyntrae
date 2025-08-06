import { Request, Response } from "express";
import { ErrorHandler } from "../../utils/errorHandler";
import {
  addProjectMemberSchema,
  createProjectSchema,
  createProjectTaskSchema,
  updateProjectMemberSchema,
  updateTaskSchema,
  updateTaskStatusSchema,
} from "../../schemas/project";
import { db } from "../../prismaClient";
import {
  assertAPIPermission,
  assertProjectAccess,
  validateTaskInProject,
} from "../../helper/organization";
import { updateBillableRate } from "../../helper/billableRate";
import { catchAsync } from "../../utils/catchAsync";

export const createProject = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const userId = req.user?.id;
    const { orgId } = req.params;

    if (!userId) throw new ErrorHandler("User not authenticated", 401);
    if (!orgId) throw new ErrorHandler("Organization ID is required", 400);

    // Check permissions
    await assertAPIPermission(userId, orgId, "PROJECT", "CREATE");

    const validated = createProjectSchema.parse(req.body);

    const data = validated;

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
  }
);

export const getAllProjects = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
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
  }
);

export const getProjectsByOrgId = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
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
  }
);

export const updateProject = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const { projectId, organizationId } = req.params;
    const userId = req.user?.id;

    if (!userId) throw new ErrorHandler("User not authenticated", 401);
    if (!projectId || !organizationId)
      throw new ErrorHandler("Project ID or oraganization is required", 400);

    // Check permissions
    await assertProjectAccess(userId, organizationId, projectId, "UPDATE");

    const validated = createProjectSchema.parse(req.body);

    const data = validated;

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
        estimatedTime: data.estimatedTime,
        clientId: data.clientId || null,
      },
      include: {
        client: { select: { id: true, name: true, archivedAt: true } },
      },
    });

    if (data.billableRate !== undefined) {
      await updateBillableRate({
        source: "project",
        sourceId: projectId,
        newRate: data.billable ? data.billableRate : null,
        applyToExisting: true,
        organizationId,
        userId: null,
        projectId,
      });
    }

    const getproject = await db.project.findUnique({
      where: { id: projectId },
      include: {
        client: { select: { id: true, name: true, archivedAt: true } },
      },
    });

    res.status(200).json({
      message: "Project updated successfully",
      project: getproject,
    });
  }
);

export const archiveProject = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
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
  }
);

export const unarchiveProject = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
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
  }
);

export const deleteProject = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
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

    const existingTime = await db.timeEntry.findFirst({
      where: { projectId },
    });

    if (existingTime) {
      throw new ErrorHandler(
        "Project cannot be deleted as it has time entries",
        400
      );
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
  }
);

export const getClientsByOrganizationId = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
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
  }
);

export const addProjectMember = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
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

    const validated = addProjectMemberSchema.parse(req.body);

    const { memberId, billableRate } = validated;

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

    if (projectMember.user?.id) {
      await updateBillableRate({
        source: "project_member",
        sourceId: projectMember.id,
        newRate: projectMember.billableRate,
        applyToExisting: true,
        organizationId,
        userId: projectMember.user.id,
        projectId,
      });
    }

    const getMember = await db.projectMember.findUnique({
      where: {
        projectId_memberId: {
          projectId,
          memberId,
        },
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
      projectMember: getMember,
    });
  }
);

export const getProjectMembers = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
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
  }
);

export const updateProjectMember = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
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

    const validated = updateProjectMemberSchema.parse(req.body);

    const { billableRate } = validated;

    const projectMember = await db.projectMember.update({
      where: {
        projectId_memberId: {
          projectId,
          memberId,
        },
      },
      data: {
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

    if (projectMember.user?.id) {
      await updateBillableRate({
        source: "project_member",
        sourceId: projectMember.id,
        newRate: billableRate,
        applyToExisting: true,
        organizationId,
        userId: projectMember.user.id,
        projectId,
      });
    }

    const getMember = await db.projectMember.findUnique({
      where: {
        projectId_memberId: {
          projectId,
          memberId,
        },
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
      projectMember: getMember,
    });
  }
);

export const removeProjectMember = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
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
  }
);

export const getMembersByOrganizationId = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const { organizationId } = req.params;
    const { projectId } = req.query;
    const userId = req.user?.id;

    if (!userId) throw new ErrorHandler("User not authenticated", 401);
    if (!organizationId)
      throw new ErrorHandler("organizationId or ProjectId is required", 400);

    if (projectId) {
      await assertProjectAccess(
        userId,
        organizationId,
        projectId as string,
        "MANAGE_MEMBERS"
      );
    } else {
      await assertAPIPermission(userId, organizationId, "PROJECT", "VIEW");
    }

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
        ...(projectId && {
          id: {
            notIn: existingProjectMemberIds,
          },
        }),
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
  }
);

export const getProjectTasks = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
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
  }
);

export const createProjectTask = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
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

    const validated = createProjectTaskSchema.parse(req.body);

    const { name, estimatedTime } = validated;

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
  }
);

export const updateProjectTask = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const userId = req.user?.id;
    const { projectId, organizationId, taskId } = req.params;

    if (!userId) throw new ErrorHandler("User not authenticated", 401);
    if (!projectId || !organizationId || !taskId)
      throw new ErrorHandler(
        "Project ID, Organization ID and Task ID are required",
        400
      );

    const validated = updateTaskSchema.parse(req.body);

    const { name, estimatedTime } = validated;

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
  }
);

export const updateTaskStatus = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const userId = req.user?.id;
    const { projectId, organizationId, taskId } = req.params;

    if (!userId) throw new ErrorHandler("User not authenticated", 401);

    if (!projectId || !organizationId || !taskId)
      throw new ErrorHandler(
        "Project ID, Organization ID and Task ID are required",
        400
      );

    const validated = updateTaskStatusSchema.parse(req.body);

    const { status } = validated;

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
  }
);

export const deleteTask = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
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
  }
);
