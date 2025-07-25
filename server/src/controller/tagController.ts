import { Request, Response } from "express";
import { ErrorHandler } from "../utils/errorHandler";
import { assertAPIPermission } from "../helper/organization";
import { db } from "../prismaClient";

export const createTag = async (req: Request, res: Response): Promise<void> => {
  try {
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
  } catch (error) {
    throw new ErrorHandler(
      error instanceof Error ? error.message : "Internal Server Error",
      500
    );
  }
};

export const getAllTags = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
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
  } catch (error) {
    throw new ErrorHandler(
      error instanceof Error ? error.message : "Internal Server Error",
      500
    );
  }
};

export const deleteTag = async (req: Request, res: Response): Promise<void> => {
  try {
    
  } catch (error) {
    throw new ErrorHandler(
      error instanceof Error ? error.message : "Internal Server Error",
      500
    );
  }
};
