import { Request, Response } from "express";
import { db } from "../prismaClient";
import { ErrorHandler } from "../utils/errorHandler";
import { assertAPIPermission } from "../helper/organization";
import { calculateBillableRate } from "../helper/billableRate";
import {
  bulkDeleteTimeEntriesSchema,
  bulkUpdateTimeEntriesSchema,
  createTimeEntrySchema,
  startTimerSchema,
} from "../utils";

const calculateDuration = (start: Date, end: Date | null) => {
  if (!end) return null;

  const diffInMs = end.getTime() - start.getTime();
  const diffInSeconds = Math.floor(diffInMs / 1000);
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = diffInMs / (1000 * 60 * 60);

  return {
    milliseconds: diffInMs,
    seconds: diffInSeconds,
    minutes: diffInMinutes,
    hours: Number(diffInHours.toFixed(2)),
    formatted: formatDuration(diffInSeconds),
  };
};

const formatDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;

  return `${hours.toString().padStart(2, "0")}:${minutes
    .toString()
    .padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`;
};

const checkOverlappingEntries = async (
  userId: string,
  organizationId: string,
  start: Date,
  end: Date | null,
  excludeEntryId?: string
) => {
  if (!end) return [];

  const whereClause: any = {
    userId,
    organizationId,
    AND: [
      {
        OR: [
          // New entry starts during existing entry
          {
            start: { lte: start },
            end: { gte: start, not: null },
          },
          // New entry ends during existing entry
          {
            start: { lte: end },
            end: { gte: end, not: null },
          },
          // New entry completely contains existing entry
          {
            start: { gte: start },
            end: { lte: end, not: null },
          },
          // Existing entry completely contains new entry
          {
            start: { lte: start },
            end: { gte: end, not: null },
          },
        ],
      },
    ],
  };

  if (excludeEntryId) {
    whereClause.NOT = { id: excludeEntryId };
  }

  return await db.timeEntry.findMany({
    where: whereClause,
    select: {
      id: true,
      description: true,
      start: true,
      end: true,
      project: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });
};

export const createTimeEntry = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { organizationId } = req.params;
    const userId = req.user?.id;

    if (!userId || !organizationId) {
      throw new ErrorHandler("User ID and Organization ID are required", 400);
    }

    const parsed = createTimeEntrySchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ErrorHandler(parsed.error.errors[0].message, 400);
    }
    const data = parsed.data;

    const member = await assertAPIPermission(
      userId,
      organizationId,
      "TIME",
      "CREATE"
    );

    const overlappingEntries = await checkOverlappingEntries(
      userId,
      organizationId,
      data.start,
      data.end
    );
    if (overlappingEntries.length > 0) {
      res.status(409).json({
        success: false,
        message: `Time entry overlaps with ${
          overlappingEntries.length
        } existing ${
          overlappingEntries.length === 1 ? "entry" : "entries"
        }. Please choose a different time slot.`,
        overlappingEntries: overlappingEntries.map((entry) => ({
          id: entry.id,
          description: entry.description,
          start: entry.start,
          end: entry.end,
          project: entry.project,
        })),
      });
      return;
    }

    if (data.projectId) {
      const project = await db.project.findUnique({
        where: { id: data.projectId, organizationId, isArchived: false },
      });
      if (!project) throw new ErrorHandler("Project not found", 404);
    }

    if (data.taskId) {
      const task = await db.task.findFirst({
        where: {
          id: data.taskId,
          organizationId,
          ...(data.projectId && { projectId: data.projectId }),
        },
      });
      if (!task) throw new ErrorHandler("Task not found", 404);
    }

    const billableRate = await calculateBillableRate({
      userId,
      projectId: data.projectId,
      organizationId,
    });

    const duration = calculateDuration(data.start, data.end);

    const timeEntry = await db.$transaction(async (tx) => {
      const newEntry = await tx.timeEntry.create({
        data: {
          description: data.description,
          start: data.start,
          end: data.end,
          duration: duration?.seconds || 0,
          billable: data.billable,
          billableRate,
          userId,
          organizationId,
          memberId: member.id,
          projectId: data.projectId || null,
          taskId: data.taskId || null,
        },
      });

      if (data.tagIds?.length) {
        const validTags = await tx.tag.findMany({
          where: {
            id: { in: data.tagIds },
            organizationId,
          },
        });

        if (validTags.length !== data.tagIds.length) {
          throw new ErrorHandler("Some tags not found", 400);
        }

        await tx.timeEntryTag.createMany({
          data: data.tagIds.map((tagId) => ({
            timeEntryId: newEntry.id,
            tagId,
          })),
        });
      }

      const entryWithRelations = await tx.timeEntry.findUniqueOrThrow({
        where: { id: newEntry.id },
        include: {
          tags: {
            select: {
              tag: {
                select: { id: true },
              },
            },
          },
        },
      });

      return entryWithRelations;
    });

    res.status(201).json({
      success: true,
      data: {
        id: timeEntry.id,
        start: timeEntry.start,
        end: timeEntry.end,
        duration: timeEntry.duration,
        description: timeEntry.description,
        taskId: timeEntry.taskId,
        projectId: timeEntry.projectId,
        organizationId: timeEntry.organizationId,
        userId: timeEntry.userId,
        tags: timeEntry.tags.map((t) => t.tag.id),
        billable: timeEntry.billable,
      },
      message: "Time entry created successfully",
    });
  } catch (error) {
    throw new ErrorHandler(
      error instanceof Error ? error.message : "Internal Server Error",
      500
    );
  }
};

export const startTimer = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { organizationId } = req.params;
    const userId = req.user?.id;

    const parsed = startTimerSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ErrorHandler(parsed.error.errors[0].message, 400);
    }
    const data = parsed.data;

    if (!userId || !organizationId) {
      throw new ErrorHandler("User ID and Organization ID are required", 400);
    }

    const member = await assertAPIPermission(
      userId,
      organizationId,
      "TIME",
      "CREATE"
    );

    const existingEntry = await db.timeEntry.findFirst({
      where: {
        userId,
        organizationId,
        end: null,
      },
    });

    if (existingEntry) {
      throw new ErrorHandler("You already have an active timer running", 400);
    }

    if (data.projectId) {
      const project = await db.project.findFirst({
        where: {
          id: data.projectId,
          organizationId,
          isArchived: false,
        },
      });
      if (!project) {
        throw new ErrorHandler("Project not found or inactive", 404);
      }
    }

    if (data.taskId) {
      const task = await db.task.findFirst({
        where: {
          id: data.taskId,
          organizationId,
          ...(data.projectId && { projectId: data.projectId }),
        },
      });
      if (!task) {
        throw new ErrorHandler("Task not found", 404);
      }
    }

    const billableRate = data.billable
      ? await calculateBillableRate({
          userId,
          projectId: data.projectId,
          organizationId,
        })
      : null;

    const timeEntry = await db.$transaction(async (tx) => {
      const newEntry = await tx.timeEntry.create({
        data: {
          description: data.description,
          start: new Date(),
          end: null,
          duration: 0,
          billable: data.billable,
          billableRate,
          userId,
          organizationId,
          memberId: member.id,
          projectId: data.projectId || null,
          taskId: data.taskId || null,
        },
      });

      if (data.tagIds?.length) {
        const validTags = await tx.tag.findMany({
          where: {
            id: { in: data.tagIds },
            organizationId,
          },
        });

        if (validTags.length !== data.tagIds.length) {
          throw new ErrorHandler("Some tags not found", 400);
        }

        await tx.timeEntryTag.createMany({
          data: data.tagIds.map((tagId) => ({
            timeEntryId: newEntry.id,
            tagId,
          })),
        });
      }

      const entryWithRelations = await tx.timeEntry.findUniqueOrThrow({
        where: { id: newEntry.id },
        include: {
          tags: {
            select: {
              tag: {
                select: { id: true },
              },
            },
          },
        },
      });

      return entryWithRelations;
    });

    res.status(201).json({
      success: true,
      data: {
        id: timeEntry.id,
        start: timeEntry.start,
        end: timeEntry.end,
        duration: timeEntry.duration,
        description: timeEntry.description,
        taskId: timeEntry.taskId,
        projectId: timeEntry.projectId,
        organizationId: timeEntry.organizationId,
        userId: timeEntry.userId,
        tags: timeEntry.tags.map((t) => t.tag.id),
        billable: timeEntry.billable,
      },
      message: "Timer started successfully",
    });
  } catch (error) {
    throw new ErrorHandler(
      error instanceof Error ? error.message : "Internal Server Error",
      500
    );
  }
};

export const stopTimer = async (req: Request, res: Response): Promise<void> => {
  try {
    const { organizationId, timeEntryId } = req.params;
    const userId = req.user?.id;

    if (!userId || !organizationId || !timeEntryId) {
      throw new ErrorHandler(
        "User ID, Organization ID, and Time Entry ID are required",
        400
      );
    }

    const member = await assertAPIPermission(
      userId,
      organizationId,
      "TIME",
      "CREATE"
    );

    const existingTimeEntry = await db.timeEntry.findFirst({
      where: {
        id: timeEntryId,
        organizationId,
        userId,
        end: null,
      },
    });

    if (!existingTimeEntry) {
      throw new ErrorHandler("Running time entry not found", 404);
    }

    const endTime = new Date();
    const duration = calculateDuration(existingTimeEntry.start, endTime);

    const updateTimeEntry = await db.timeEntry.update({
      where: { id: existingTimeEntry.id },
      data: {
        end: endTime,
        duration: duration?.seconds || 0,
      },
      include: {
        tags: {
          select: {
            tag: {
              select: { id: true },
            },
          },
        },
      },
    });

    res.status(201).json({
      success: true,
      data: {
        id: updateTimeEntry.id,
        start: updateTimeEntry.start,
        end: updateTimeEntry.end,
        duration: updateTimeEntry.duration,
        description: updateTimeEntry.description,
        taskId: updateTimeEntry.taskId,
        projectId: updateTimeEntry.projectId,
        organizationId: updateTimeEntry.organizationId,
        userId: updateTimeEntry.userId,
        tags: updateTimeEntry.tags.map((t) => t.tag.id),
        billable: updateTimeEntry.billable,
      },
      message: "Timer stopped successfully",
    });
  } catch (error) {
    throw new ErrorHandler(
      error instanceof Error ? error.message : "Internal Server Error",
      500
    );
  }
};

export const getRunningTimer = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { organizationId } = req.params;
    const userId = req.user?.id;

    if (!userId || !organizationId) {
      throw new ErrorHandler("User ID and Organization ID are required", 400);
    }

    const member = await assertAPIPermission(
      userId,
      organizationId,
      "TIME",
      "CREATE"
    );

    const runningEntry = await db.timeEntry.findFirst({
      where: {
        userId,
        organizationId,
        end: null,
      },
      include: {
        tags: {
          select: {
            tag: {
              select: { id: true },
            },
          },
        },
      },
    });

    if (!runningEntry) {
      throw new ErrorHandler("No running timer found", 404);
    }

    res.status(200).json({
      success: true,
      data: {
        id: runningEntry.id,
        start: runningEntry.start,
        end: runningEntry.end,
        duration: runningEntry.duration,
        description: runningEntry.description,
        taskId: runningEntry.taskId,
        projectId: runningEntry.projectId,
        organizationId: runningEntry.organizationId,
        userId: runningEntry.userId,
        tags: runningEntry.tags.map((t) => t.tag.id),
        billable: runningEntry.billable,
      },
      message: "Running timer retrieved successfully",
    });
  } catch (error) {
    throw new ErrorHandler(
      error instanceof Error ? error.message : "Internal Server Error",
      500
    );
  }
};

export const updateTimeEntry = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { organizationId, timeEntryId } = req.params;
    const userId = req.user?.id;

    if (!userId || !organizationId || !timeEntryId) {
      throw new ErrorHandler(
        "User ID, Organization ID, and Time Entry ID are required",
        400
      );
    }

    const parsed = createTimeEntrySchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ErrorHandler(parsed.error.errors[0].message, 400);
    }

    const data = parsed.data;

    const member = await assertAPIPermission(
      userId,
      organizationId,
      "TIME",
      "CREATE"
    );

    const existingEntry = await db.timeEntry.findUnique({
      where: { id: timeEntryId, organizationId, userId },
    });

    if (!existingEntry) {
      throw new ErrorHandler("Time entry not found", 404);
    }

    const finalStart = data.start || existingEntry.start;
    const finalEnd = data.end !== undefined ? data.end : existingEntry.end;

    if (finalEnd && finalStart) {
      const overlappingEntries = await checkOverlappingEntries(
        userId,
        organizationId,
        finalStart,
        finalEnd,
        timeEntryId
      );

      if (overlappingEntries.length > 0) {
        res.status(409).json({
          success: false,
          message: `Time entry overlaps with ${
            overlappingEntries.length
          } existing ${
            overlappingEntries.length === 1 ? "entry" : "entries"
          }. Please choose a different time slot.`,
          overlappingEntries: overlappingEntries.map((entry) => ({
            id: entry.id,
            description: entry.description,
            start: entry.start,
            end: entry.end,
            project: entry.project,
          })),
        });
        return;
      }
    }

    if (data.projectId) {
      const project = await db.project.findFirst({
        where: {
          id: data.projectId,
          organizationId,
        },
      });

      if (!project) {
        throw new ErrorHandler("Project not found", 404);
      }

      if (project.isArchived && existingEntry.projectId !== data.projectId) {
        throw new ErrorHandler("Cannot assign an archived project", 400);
      }
    }

    if (data.taskId) {
      const task = await db.task.findFirst({
        where: {
          id: data.taskId,
          organizationId,
          ...(data.projectId && { projectId: data.projectId }),
        },
      });
      if (!task) {
        throw new ErrorHandler("Task not found", 404);
      }
    }

    let billableRate = existingEntry.billableRate;

    const newDuration = finalEnd
      ? calculateDuration(finalStart, finalEnd)
      : null;

    const updatedTimeEntry = await db.$transaction(async (tx) => {
      const entry = await tx.timeEntry.update({
        where: { id: timeEntryId },
        data: {
          ...(data.description && { description: data.description }),
          ...(data.start && { start: data.start }),
          ...(data.end !== undefined && { end: data.end }),
          ...(data.billable !== undefined && { billable: data.billable }),
          ...(data.projectId !== undefined && { projectId: data.projectId }),
          ...(data.taskId !== undefined && { taskId: data.taskId }),
          duration: newDuration?.seconds || 0,
          billableRate,
        },
      });

      if (data.tagIds) {
        const currentTags = await tx.timeEntryTag.findMany({
          where: { timeEntryId },
          select: { tagId: true },
        });

        const currentTagIds = currentTags.map((t) => t.tagId);
        const newTagIds = data.tagIds.filter(
          (tagId) => !currentTagIds.includes(tagId)
        );

        const removedTagIds = currentTagIds.filter(
          (tagId) => !data.tagIds.includes(tagId)
        );

        if (newTagIds.length) {
          const validTags = await tx.tag.findMany({
            where: {
              id: { in: newTagIds },
              organizationId,
            },
          });

          if (validTags.length !== newTagIds.length) {
            throw new ErrorHandler("Some tags not found", 400);
          }

          await tx.timeEntryTag.createMany({
            data: newTagIds.map((tagId) => ({
              timeEntryId: entry.id,
              tagId,
            })),
          });
        }

        if (removedTagIds.length) {
          await tx.timeEntryTag.deleteMany({
            where: {
              timeEntryId: entry.id,
              tagId: { in: removedTagIds },
            },
          });
        }
      }

      const entryWithRelations = await tx.timeEntry.findUniqueOrThrow({
        where: { id: entry.id },
        include: {
          tags: {
            select: {
              tag: {
                select: { id: true },
              },
            },
          },
        },
      });

      return entryWithRelations;
    });

    res.status(200).json({
      success: true,
      data: {
        id: updatedTimeEntry.id,
        start: updatedTimeEntry.start,
        end: updatedTimeEntry.end,
        duration: updatedTimeEntry.duration,
        description: updatedTimeEntry.description,
        taskId: updatedTimeEntry.taskId,
        projectId: updatedTimeEntry.projectId,
        organizationId: updatedTimeEntry.organizationId,
        userId: updatedTimeEntry.userId,
        tags: updatedTimeEntry.tags.map((t) => t.tag.id),
        billable: updatedTimeEntry.billable,
      },
      message: "Time entry updated successfully",
    });
  } catch (error) {
    throw new ErrorHandler(
      error instanceof Error ? error.message : "Internal Server Error",
      500
    );
  }
};

export const deleteTimeEntry = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { organizationId, timeEntryId } = req.params;
    const userId = req.user?.id;

    if (!userId || !organizationId || !timeEntryId) {
      throw new ErrorHandler(
        "User ID, Organization ID, and Time Entry ID are required",
        400
      );
    }

    const member = await assertAPIPermission(
      userId,
      organizationId,
      "TIME",
      "CREATE"
    );

    const existingEntry = await db.timeEntry.findUnique({
      where: { id: timeEntryId, organizationId, userId },
    });

    if (!existingEntry) {
      throw new ErrorHandler("Time entry not found", 404);
    }

    await db.timeEntry.delete({
      where: { id: timeEntryId },
    });

    res.status(200).json({
      success: true,
      message: "Time entry deleted successfully",
    });
  } catch (error) {
    throw new ErrorHandler(
      error instanceof Error ? error.message : "Internal Server Error",
      500
    );
  }
};

export const bulkUpdateTimeEntries = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { organizationId } = req.params;
    const userId = req.user?.id;

    if (!userId || !organizationId) {
      throw new ErrorHandler("User ID and Organization ID are required", 400);
    }

    const parsed = bulkUpdateTimeEntriesSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ErrorHandler(parsed.error.errors[0].message, 400);
    }

    const data = parsed.data;

    const member = await assertAPIPermission(
      userId,
      organizationId,
      "TIME",
      "CREATE"
    );

    const timeEntries = await db.timeEntry.findMany({
      where: {
        id: { in: data.timeEntryIds },
        organizationId,
        userId,
      },
    });

    if (timeEntries.length !== data.timeEntryIds.length) {
      throw new ErrorHandler(
        "Some time entries not found or access denied",
        404
      );
    }

    if (data.updates.projectId) {
      const project = await db.project.findFirst({
        where: {
          id: data.updates.projectId,
          organizationId,
        },
      });
      if (!project) {
        throw new ErrorHandler("Project not found", 404);
      }
    }

    if (data.updates.taskId) {
      const task = await db.task.findFirst({
        where: {
          id: data.updates.taskId,
          organizationId,
          ...(data.updates.projectId && { projectId: data.updates.projectId }),
        },
      });
      if (!task) {
        throw new ErrorHandler("Task not found", 404);
      }
    }

    await db.$transaction(async (tx) => {
      await tx.timeEntry.updateMany({
        where: {
          id: { in: data.timeEntryIds },
        },
        data: {
          ...(data.updates.description && {
            description: data.updates.description,
          }),
          ...(data.updates.billable !== undefined && {
            billable: data.updates.billable,
          }),
          ...(data.updates.projectId !== undefined && {
            projectId: data.updates.projectId,
          }),
          ...(data.updates.taskId !== undefined && {
            taskId: data.updates.taskId,
          }),
        },
      });

      if (data.updates.tagIds) {
        await tx.timeEntryTag.deleteMany({
          where: { timeEntryId: { in: data.timeEntryIds } },
        });

        if (data.updates.tagIds.length > 0) {
          const tagData = data.timeEntryIds.flatMap((timeEntryId) =>
            data.updates.tagIds!.map((tagId) => ({
              timeEntryId,
              tagId,
            }))
          );
          await tx.timeEntryTag.createMany({
            data: tagData,
          });
        }
      }
    });

    res.status(200).json({
      success: true,
      message: `${data.timeEntryIds.length} time entries updated successfully`,
    });
  } catch (error) {
    throw new ErrorHandler(
      error instanceof Error ? error.message : "Internal Server Error",
      500
    );
  }
};

export const bulkDeleteTimeEntries = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { organizationId } = req.params;
    const userId = req.user?.id;

    if (!userId || !organizationId) {
      throw new ErrorHandler("User ID and Organization ID are required", 400);
    }

    const parsed = bulkDeleteTimeEntriesSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ErrorHandler(parsed.error.errors[0].message, 400);
    }

    const data = parsed.data;

    await assertAPIPermission(userId, organizationId, "TIME", "CREATE");

    const timeEntries = await db.timeEntry.findMany({
      where: {
        id: { in: data.timeEntryIds },
        organizationId,
        userId,
      },
    });

    if (timeEntries.length !== data.timeEntryIds.length) {
      throw new ErrorHandler(
        "Some time entries not found or access denied",
        404
      );
    }

    await db.timeEntry.deleteMany({
      where: {
        id: { in: data.timeEntryIds },
      },
    });

    res.status(200).json({
      success: true,
      message: `${data.timeEntryIds.length} time entries deleted successfully`,
    });
  } catch (error) {
    throw new ErrorHandler(
      error instanceof Error ? error.message : "Internal Server Error",
      500
    );
  }
};

export const getTimeEntries = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { organizationId } = req.params;
    const userId = req.user?.id;
    const { page = "1", limit = "10", date } = req.query;
    const pageNumber = parseInt(page as string, 10);
    const limitNumber = parseInt(limit as string, 10);
    const skip = (pageNumber - 1) * limitNumber;

    if (!userId || !organizationId) {
      throw new ErrorHandler("User ID and Organization ID are required", 400);
    }

    await assertAPIPermission(userId, organizationId, "TIME", "CREATE");

    const whereClause: any = {
      organizationId,
      userId,
      end: { not: null },
    };

    if (date) {
      const selectedDate = new Date(date as string);
      selectedDate.setUTCHours(0, 0, 0, 0);

      const nextDay = new Date(selectedDate);
      nextDay.setUTCDate(selectedDate.getUTCDate() + 1);

      whereClause.start = {
        gte: selectedDate,
        lt: nextDay,
      };
    }

    const [entries, totalCount] = await Promise.all([
      db.timeEntry.findMany({
        where: whereClause,
        orderBy: { start: "desc" },
        skip,
        take: limitNumber,
        include: {
          tags: {
            select: {
              tag: {
                select: { id: true, name: true },
              },
            },
          },
        },
      }),
      db.timeEntry.count({ where: whereClause }),
    ]);

    res.status(200).json({
      success: true,
      data: entries.map((entry) => ({
        id: entry.id,
        start: entry.start,
        end: entry.end,
        duration: entry.duration,
        description: entry.description,
        taskId: entry.taskId,
        projectId: entry.projectId,
        organizationId: entry.organizationId,
        userId: entry.userId,
        tags: entry.tags.map((t) => t.tag.id),
        billable: entry.billable,
      })),
      pagination: {
        total: totalCount,
        page: pageNumber,
        pageSize: limitNumber,
        totalPages: Math.ceil(totalCount / limitNumber),
      },
    });
  } catch (error) {
    throw new ErrorHandler(
      error instanceof Error ? error.message : "Internal Server Error",
      500
    );
  }
};

export const getAllProjectWithTasks = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { organizationId } = req.params;
    const userId = req.user?.id;

    if (!userId || !organizationId) {
      throw new ErrorHandler("User ID and Organization ID are required", 400);
    }

    await assertAPIPermission(userId, organizationId, "TIME", "CREATE");

    const projects = await db.project.findMany({
      where: { organizationId, isArchived: false },
      include: {
        tasks: {
          where: { status: "ACTIVE" },
          select: { id: true, name: true },
        },
      },
    });

    res.status(200).json({
      success: true,
      data: projects.map((project) => ({
        id: project.id,
        name: project.name,
        color: project.color,
        tasks: project.tasks.map((task) => ({
          id: task.id,
          name: task.name,
        })),
      })),
      message: "Projects and tasks retrieved successfully",
    });
  } catch (error) {
    throw new ErrorHandler(
      error instanceof Error ? error.message : "Internal Server Error",
      500
    );
  }
};
