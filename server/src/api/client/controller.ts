import { Request, Response } from "express";
import { ErrorHandler } from "../../utils/errorHandler";
import { db } from "../../prismaClient";
import {
  assertActivePermissionedMember,
  assertAPIPermission,
  assertClientAccess,
  hasPermission,
  isUserActiveMember,
} from "../../helper/organization";
import { Role } from "@prisma/client";
import { catchAsync } from "../../utils/catchAsync";

export const createClient = catchAsync(async (req: Request, res: Response) => {
  const { organizationId } = req.params;
  const { name } = req.body;
  const userId = req.user?.id;

  if (!organizationId || !name) {
    throw new ErrorHandler("Organization ID and name are required", 400);
  }

  // Centralized permission check
  await assertAPIPermission(userId, organizationId, "CLIENT", "CREATE");

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
});

export const getClients = catchAsync(async (req: Request, res: Response) => {
  const { organizationId } = req.params;
  const userId = req.user?.id;

  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const skip = (page - 1) * limit;
  const type = (req.query.type as "archived" | "active") || "active";
  const allData = req.query.all === "true";

  if (!organizationId || !userId) {
    throw new ErrorHandler("Organization ID and user ID are required", 400);
  }
  // Centralized permission check
  await assertAPIPermission(userId, organizationId, "CLIENT", "VIEW");

  const isArchived = type === "archived";

  const where = {
    organizationId,
    archivedAt: isArchived ? { not: null } : null,
  };

  if (allData) {
    const clients = await db.client.findMany({
      where: { organizationId },
      orderBy: { createdAt: "desc" },
    });

    res.status(200).json({
      message: `${
        type === "archived" ? "Archived" : "Active"
      } clients retrieved successfully`,
      clients,
      pagination: null,
    });
  } else {
    const [clients, totalCount] = await Promise.all([
      db.client.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      db.client.count({ where }),
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
  }
});

export const editClient = catchAsync(async (req: Request, res: Response) => {
  const { clientId, organizationId } = req.params;
  const { name } = req.body;
  const userId = req.user?.id;

  if (!userId) throw new ErrorHandler("User ID is required", 400);

  if (!clientId || !name) {
    throw new ErrorHandler("Client ID and name are required", 400);
  }

  // Centralized client access check
  const { client } = await assertClientAccess(
    userId,
    organizationId,
    clientId,
    "UPDATE"
  );

  const nameConflict = await db.client.findFirst({
    where: {
      name,
      organizationId,
      id: { not: clientId },
    },
  });

  if (nameConflict) {
    throw new ErrorHandler("Client with this name already exists", 400);
  }

  const updatedClient = await db.client.update({
    where: { id: clientId },
    data: { name },
  });

  res.status(200).json({
    message: "Client updated successfully",
    client: updatedClient,
  });
});

export const archiveClient = catchAsync(async (req: Request, res: Response) => {
  const { clientId } = req.params;
  const { organizationId } = req.body;
  const userId = req.user?.id;

  if (!userId) {
    throw new ErrorHandler("User ID is required", 400);
  }

  if (!clientId || !organizationId) {
    throw new ErrorHandler("Client ID and organization ID are required", 400);
  }

  // Centralized client access check
  const { client } = await assertClientAccess(
    userId,
    organizationId,
    clientId,
    "ARCHIVE"
  );

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
});

export const unArchiveClient = catchAsync(
  async (req: Request, res: Response) => {
    const { clientId } = req.params;
    const { organizationId } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      throw new ErrorHandler("User ID is required", 400);
    }

    if (!clientId || !organizationId) {
      throw new ErrorHandler("Client ID and organization ID are required", 400);
    }

    // Centralized client access check
    const { client } = await assertClientAccess(
      userId,
      organizationId,
      clientId,
      "ARCHIVE"
    );

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
  }
);

export const deleteClient = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const userId = req.user?.id;
    const { clientId, organizationId } = req.params;

    if (!userId) {
      throw new ErrorHandler("User ID is required", 400);
    }

    if (!clientId || !organizationId) {
      throw new ErrorHandler("Client ID and organization ID are required", 400);
    }

    // Centralized client access check
    await assertClientAccess(userId, organizationId, clientId, "DELETE");

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
  }
);
