import { Request, Response } from "express";
import { ErrorHandler } from "../utils/errorHandler";
import { db } from "../prismaClient";
import {
  assertActivePermissionedMember,
  hasPermission,
  isUserActiveMember,
} from "../helper/organization";
import { Role } from "@prisma/client";

const PERMISSIONED_ROLES: Role[] = [Role.OWNER, Role.ADMIN, Role.MANAGER];

const EDIT_ROLES: Role[] = [Role.OWNER, Role.ADMIN];

export const createClient = async (req: Request, res: Response) => {
  try {
    const { organizationId } = req.params;
    const { name } = req.body;
    const userId = req.user?.id;

    await assertActivePermissionedMember(userId, organizationId, EDIT_ROLES);

    if (!organizationId || !name) {
      throw new ErrorHandler("Organization ID and name are required", 400);
    }

    const organization = await db.organizations.findUnique({
      where: { id: organizationId },
      select: { id: true, name: true },
    });

    if (!organization) {
      throw new ErrorHandler("Organization not found", 404);
    }

    const newClient = await db.client.create({
      data: {
        name,
        organizationId: organization.id,
      },
    });

    res.status(201).json({
      message: "Client created successfully",
      client: newClient,
    });
  } catch (error) {
    throw new ErrorHandler(
      error instanceof Error ? error.message : "Internal Server Error",
      500
    );
  }
};

export const getClients = async (req: Request, res: Response) => {
  try {
    const { organizationId } = req.params;
    const userId = req.user?.id;

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;
    const type = (req.query.type as "archived" | "active") || "active";

    await assertActivePermissionedMember(
      userId,
      organizationId,
      PERMISSIONED_ROLES
    );

    const isArchived = type === "archived";

    const [clients, totalCount] = await Promise.all([
      db.client.findMany({
        where: {
          organizationId,
          archivedAt: isArchived ? { not: null } : null,
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      db.client.count({
        where: {
          organizationId,
          archivedAt: isArchived ? { not: null } : null,
        },
      }),
    ]);

    res.status(200).json({
      message: `${
        type === "archived" ? "Archived" : "Active"
      } clients retrieved successfully`,
      clients,
      pagination: {
        total: totalCount,
        page,
        pageSize: limit,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    throw new ErrorHandler(
      error instanceof Error ? error.message : "Internal Server Error",
      500
    );
  }
};

export const editClient = async (req: Request, res: Response) => {
  try {
    const { clientId, organizationId } = req.params;
    const { name } = req.body;
    const userId = req.user?.id;

    await assertActivePermissionedMember(userId, organizationId, EDIT_ROLES);

    if (!clientId || !name) {
      throw new ErrorHandler("Client ID and name are required", 400);
    }

    const client = await db.client.findUnique({
      where: { id: clientId },
      select: { id: true, name: true, organizationId: true },
    });

    if (!client) {
      throw new ErrorHandler("Client not found", 404);
    }

    if (client.organizationId !== organizationId) {
      throw new ErrorHandler(
        "Client does not belong to this organization",
        403
      );
    }

    const updatedClient = await db.client.update({
      where: { id: clientId },
      data: { name },
    });

    res.status(200).json({
      message: "Client updated successfully",
      client: updatedClient,
    });
  } catch (error) {
    throw new ErrorHandler(
      error instanceof Error ? error.message : "Internal Server Error",
      500
    );
  }
};

export const archiveClient = async (req: Request, res: Response) => {
  try {
    const { clientId } = req.params;
    const { organizationId } = req.body;
    const userId = req.user?.id;

    await assertActivePermissionedMember(userId, organizationId, EDIT_ROLES);

    if (!clientId || !organizationId) {
      throw new ErrorHandler("Client ID and organization ID are required", 400);
    }

    const client = await db.client.findUnique({
      where: { id: clientId },
      select: { id: true, organizationId: true, archivedAt: true },
    });

    if (!client) {
      throw new ErrorHandler("Client not found", 404);
    }

    if (client.organizationId !== organizationId) {
      throw new ErrorHandler(
        "Client does not belong to this organization",
        403
      );
    }

    if (client?.archivedAt) {
      throw new ErrorHandler("Client is already archived", 400);
    }

    const archivedClient = await db.client.update({
      where: { id: clientId },
      data: { archivedAt: new Date() },
    });

    res.status(200).json({
      message: "Client archived successfully",
      client: archivedClient,
    });
  } catch (error) {
    throw new ErrorHandler(
      error instanceof Error ? error.message : "Internal Server Error",
      500
    );
  }
};

export const unArchiveClient = async (req: Request, res: Response) => {
  try {
    const { clientId } = req.params;
    const { organizationId } = req.body;
    const userId = req.user?.id;

    await assertActivePermissionedMember(userId, organizationId, EDIT_ROLES);

    if (!clientId || !organizationId) {
      throw new ErrorHandler("Client ID and organization ID are required", 400);
    }

    const client = await db.client.findUnique({
      where: { id: clientId },
      select: { id: true, organizationId: true, archivedAt: true },
    });

    if (!client) {
      throw new ErrorHandler("Client not found", 404);
    }

    if (client.organizationId !== organizationId) {
      throw new ErrorHandler(
        "Client does not belong to this organization",
        403
      );
    }

    if (!client.archivedAt) {
      throw new ErrorHandler("Client is not archived", 400);
    }

    const unArchivedClient = await db.client.update({
      where: { id: clientId },
      data: { archivedAt: null },
    });

    res.status(200).json({
      message: "Client unarchived successfully",
      client: unArchivedClient,
    });
  } catch (error) {
    throw new ErrorHandler(
      error instanceof Error ? error.message : "Internal Server Error",
      500
    );
  }
};

export const deleteClient = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { clientId, organizationId } = req.params;

    await assertActivePermissionedMember(userId, organizationId, EDIT_ROLES);

    if (!clientId || !organizationId) {
      throw new ErrorHandler("Client ID and organization ID are required", 400);
    }

    // Check if client exists and belongs to organization
    const client = await db.client.findUnique({
      where: { id: clientId },
      select: { id: true, organizationId: true },
    });

    if (!client) {
      throw new ErrorHandler("Client not found", 404);
    }

    if (client.organizationId !== organizationId) {
      throw new ErrorHandler(
        "Client does not belong to this organization",
        403
      );
    }

    // Check if client is used in any project
    const usedInProject = await db.project.findFirst({
      where: { clientId: clientId },
      select: { id: true },
    });

    if (usedInProject) {
      throw new ErrorHandler(
        "Cannot delete client: client is used in a project",
        400
      );
    }

    await db.client.delete({
      where: { id: clientId },
    });

    res.status(200).json({
      message: "Client deleted successfully",
      clientId,
    });
  } catch (error) {
    throw new ErrorHandler(
      error instanceof Error ? error.message : "Internal Server Error",
      500
    );
  }
};
