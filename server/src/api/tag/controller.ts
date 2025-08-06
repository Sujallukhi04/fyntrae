import { Request, Response } from "express";
import { ErrorHandler } from "../../utils/errorHandler";
import { assertAPIPermission } from "../../helper/organization";
import { db } from "../../prismaClient";
import { catchAsync } from "../../utils/catchAsync";

export const createTag = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const { organizationId } = req.params;
    const { name } = req.body;
    const userId = req.user?.id;

    if (!name) {
      throw new Error("Tag name is required");
    }

    if (!organizationId || !userId) {
      throw new Error("Organization ID is required");
    }

    const member = await assertAPIPermission(
      userId,
      organizationId,
      "TAG",
      "CREATE"
    );

    const existingTag = await db.tag.findFirst({
      where: {
        name: name.trim(),
        organizationId,
      },
    });

    if (existingTag) {
      throw new Error("Tag with this name already exists");
    }

    const tag = await db.tag.create({
      data: {
        name: name.trim(),
        organizationId,
      },
    });

    res.status(201).json({
      success: true,
      message: "Tag created successfully",
      tag,
    });
  }
);

export const getAllTags = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const { organizationId } = req.params;
    const userId = req.user?.id;

    if (!organizationId || !userId) {
      throw new Error("Organization ID is required");
    }

    const member = await assertAPIPermission(
      userId,
      organizationId,
      "TAG",
      "VIEW"
    );

    const tags = await db.tag.findMany({
      where: { organizationId },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.status(200).json({
      success: true,
      message: "Tags retrieved successfully",
      tags,
    });
  }
);

export const deleteTag = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const { organizationId, tagId } = req.params;
    const userId = req.user?.id;
    if (!organizationId || !tagId || !userId) {
      throw new Error("Organization ID and Tag ID are required");
    }

    const member = await assertAPIPermission(
      userId,
      organizationId,
      "TAG",
      "CREATE"
    );

    const tag = await db.tag.findUnique({
      where: { id: tagId, organizationId },
    });

    if (!tag) {
      throw new Error("Tag not found");
    }

    const existsIntimeEntry = await db.timeEntry.findFirst({
      where: {
        tags: {
          some: {
            tagId: tagId,
          },
        },
        organizationId,
      },
    });

    if (existsIntimeEntry) {
      throw new Error(
        "Cannot delete tag as it is associated with time entries"
      );
    }

    await db.tag.delete({
      where: { id: tagId },
    });

    res.status(200).json({
      success: true,
      message: "Tag deleted successfully",
    });
  }
);
