import { Request, Response } from "express";
import { ErrorHandler } from "../utils/errorHandler";
import { createProjectSchema } from "../utils/index";
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
      select: { id: true, organizationId: true },
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
    const { projectId, oraganizationId } = req.params;
    const userId = req.user?.id;

    if (!userId) throw new ErrorHandler("User not authenticated", 401);
    if (!projectId || !oraganizationId)
      throw new ErrorHandler("Project ID or oraganization is required", 400);

    // Check permissions
    await assertActivePermissionedMember(
      userId,
      oraganizationId,
      PERMISSIONED_ROLES
    );

    const validated = createProjectSchema.safeParse(req.body);
    if (!validated.success) {
      const message = validated.error.errors[0].message;
      throw new ErrorHandler(message, 400);
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

    const project = await db.project.update({
      where: { id: projectId },
      data: { isArchived: true, archivedAt: new Date() },
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

    const project = await db.project.update({
      where: { id: projectId },
      data: { isArchived: false, archivedAt: null },
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
  const { oraganizationId } = req.params;
  const userId = req.user?.id;

  if (!oraganizationId)
    throw new ErrorHandler("Organization ID is required", 400);
  if (!userId) throw new ErrorHandler("User not authenticated", 401);

  await assertActivePermissionedMember(
    userId,
    oraganizationId,
    PERMISSIONED_ROLES
  );

  const clients = await db.client.findMany({
    where: { organizationId: oraganizationId, archivedAt: null },
    select: {
      id: true,
      name: true,
    },
    orderBy: { createdAt: "desc" },
  });

  res.status(200).json({ clients });
};
