import { Request, Response } from "express";
import { ErrorHandler } from "../utils/errorHandler";
import {
  addProjectMemberSchema,
  createProjectSchema,
  updateProjectMemberSchema,
} from "../utils/index";
import { db } from "../prismaClient";
import { assertActivePermissionedMember } from "../helper/organization";
import { Role } from "@prisma/client";

const PERMISSIONED_ROLES: Role[] = [Role.OWNER, Role.ADMIN, Role.MANAGER];

export const createProject = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { orgId } = req.params;

    if (!userId) throw new ErrorHandler("User not authenticated", 401);
    if (!orgId) throw new ErrorHandler("Organization ID is required", 400);

    await assertActivePermissionedMember(userId, orgId, PERMISSIONED_ROLES);

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

    const member = await db.member.findUnique({
      where: {
        userId_organizationId: {
          userId,
          organizationId: orgId,
        },
      },
    });

    if (!member || !member.isActive) {
      throw new ErrorHandler("Access denied. Not a valid member", 403);
    }

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

    await assertActivePermissionedMember(userId, orgId, [
      Role.OWNER,
      Role.ADMIN,
      Role.MANAGER,
      Role.EMPLOYEE,
    ]);

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
    await assertActivePermissionedMember(
      userId,
      organizationId,
      PERMISSIONED_ROLES
    );

    const validated = createProjectSchema.safeParse(req.body);
    if (!validated.success) {
      const message = validated.error.errors[0].message;
      throw new ErrorHandler(message, 400);
    }

    const existingProject = await db.project.findUnique({
      where: { id: projectId },
    });

    if (!existingProject) {
      throw new ErrorHandler("Project not found", 404);
    }

    const data = validated.data;

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
    await assertActivePermissionedMember(
      userId,
      organizationId,
      PERMISSIONED_ROLES
    );

    const existingProject = await db.project.findUnique({
      where: { id: projectId },
    });

    if (!existingProject) {
      throw new ErrorHandler("Project not found", 404);
    }

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
    await assertActivePermissionedMember(
      userId,
      organizationId,
      PERMISSIONED_ROLES
    );

    const existingProject = await db.project.findUnique({
      where: { id: projectId },
    });

    if (!existingProject) {
      throw new ErrorHandler("Project not found", 404);
    }

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

export const getClientsByOrganizationId = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { organizationId } = req.params;
  const userId = req.user?.id;

  if (!organizationId)
    throw new ErrorHandler("Organization ID is required", 400);
  if (!userId) throw new ErrorHandler("User not authenticated", 401);

  await assertActivePermissionedMember(
    userId,
    organizationId,
    PERMISSIONED_ROLES
  );

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

    // Check permissions
    await assertActivePermissionedMember(
      userId,
      organizationId,
      PERMISSIONED_ROLES
    );

    const validated = addProjectMemberSchema.safeParse(req.body);
    if (!validated.success) {
      throw new ErrorHandler(validated.error.errors[0].message, 400);
    }

    const { memberId, billableRate } = validated.data;

    const project = await db.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new ErrorHandler("Project not found", 404);
    }

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

    await assertActivePermissionedMember(
      userId,
      organizationId,
      PERMISSIONED_ROLES
    );

    // Check if user is member of organization
    const member = await db.member.findUnique({
      where: {
        userId_organizationId: {
          userId,
          organizationId,
        },
      },
    });

    if (!member || !member.isActive) {
      throw new ErrorHandler("Access denied", 403);
    }

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

    // Check permissions
    await assertActivePermissionedMember(
      userId,
      organizationId,
      PERMISSIONED_ROLES
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

    // Check permissions
    await assertActivePermissionedMember(
      userId,
      organizationId,
      PERMISSIONED_ROLES
    );

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
    if (!organizationId)
      throw new ErrorHandler("organizationId is required", 400);

    await assertActivePermissionedMember(
      userId,
      organizationId,
      PERMISSIONED_ROLES
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
    });

    res.status(200).json({ members });
  } catch (error) {
    throw new ErrorHandler(
      error instanceof Error ? error.message : "Internal Server Error",
      500
    );
  }
};
