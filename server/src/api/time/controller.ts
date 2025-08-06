import { Request, Response } from "express";
import { db } from "../../prismaClient";
import { ErrorHandler } from "../../utils/errorHandler";
import {
  assertAPIPermission,
  getOrganization,
} from "../../helper/organization";
import {
  calculateBillableRate,
  getLocalDateRangeInUTC,
  recalculateProjectSpentTime,
  recalculateTaskSpentTime,
} from "../../helper/billableRate";
import {
  bulkDeleteTimeEntriesSchema,
  bulkUpdateTimeEntriesSchema,
  createTimeEntrySchema,
  startTimerSchema,
  updatesTimeEntrySchema,
} from "../../schemas/time";
import { catchAsync } from "../../utils/catchAsync";

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

export const createTimeEntry = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const { organizationId } = req.params;
    const userId = req.user?.id;

    if (!userId || !organizationId) {
      throw new ErrorHandler("User ID and Organization ID are required", 400);
    }

    const parsed = createTimeEntrySchema.parse(req.body);

    const data = parsed;

    const member = await assertAPIPermission(
      userId,
      organizationId,
      "TIME",
      "CREATE"
    );

    // const overlappingEntries = await checkOverlappingEntries(
    //   userId,
    //   organizationId,
    //   data.start,
    //   data.end
    // );
    // if (overlappingEntries.length > 0) {
    //   res.status(409).json({
    //     success: false,
    //     message: `Time entry overlaps with ${
    //       overlappingEntries.length
    //     } existing ${
    //       overlappingEntries.length === 1 ? "entry" : "entries"
    //     }. Please choose a different time slot.`,
    //     overlappingEntries: overlappingEntries.map((entry) => ({
    //       id: entry.id,
    //       description: entry.description,
    //       start: entry.start,
    //       end: entry.end,
    //       project: entry.project,
    //     })),
    //   });
    //   return;
    // }

    if (data.projectId) {
      const project = await db.project.findUnique({
        where: { id: data.projectId, organizationId, isArchived: false },
      });
      if (!project) throw new ErrorHandler("Project not found", 404);
      if (data.taskId) {
        const task = await db.task.findFirst({
          where: {
            id: data.taskId,
            organizationId,
            projectId: data.projectId,
          },
        });
        if (!task) throw new ErrorHandler("Task not found", 404);
      }
    }

    const billableRate = data.billable
      ? await calculateBillableRate({
          userId,
          projectId: data.projectId,
          organizationId,
        })
      : null;

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

    if (timeEntry.projectId) {
      await recalculateProjectSpentTime(timeEntry.projectId);
    }

    if (timeEntry.taskId) {
      await recalculateTaskSpentTime(timeEntry.taskId);
    }

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
  }
);

export const startTimer = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const { organizationId } = req.params;
    const userId = req.user?.id;

    const parsed = startTimerSchema.parse(req.body);

    const data = parsed;

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

      const isProjectMember = await db.projectMember.findFirst({
        where: { projectId: data.projectId, userId },
      });
      if (!isProjectMember) {
        throw new ErrorHandler("You are not a member of this project", 403);
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
          projectId: data?.projectId || null,
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
  }
);

export const stopTimer = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
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

    if (updateTimeEntry.projectId) {
      await recalculateProjectSpentTime(updateTimeEntry.projectId);
    }

    if (updateTimeEntry.taskId) {
      await recalculateTaskSpentTime(updateTimeEntry.taskId);
    }

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
  }
);

export const getRunningTimer = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
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
  }
);

export const updateTimeEntry = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const { organizationId, timeEntryId } = req.params;
    const userId = req.user?.id;

    if (!userId || !organizationId || !timeEntryId) {
      throw new ErrorHandler(
        "User ID, Organization ID, and Time Entry ID are required",
        400
      );
    }

    const parsed = updatesTimeEntrySchema.parse(req.body);

    const data = parsed;

    const org = await getOrganization(organizationId);
    if (!org) throw new ErrorHandler("Organization not found", 404);

    const existingEntry = await db.timeEntry.findUnique({
      where: { id: timeEntryId, organizationId },
    });

    if (!existingEntry || existingEntry.organizationId !== organizationId) {
      throw new ErrorHandler("Time entry not found", 404);
    }

    if (existingEntry.userId !== userId) {
      await assertAPIPermission(userId, organizationId, "TIME", "UPDATE");
    } else {
      await assertAPIPermission(userId, organizationId, "TIME", "CREATE");
    }

    const finalStart = data.start || existingEntry.start;
    const finalEnd = data.end !== undefined ? data.end : existingEntry.end;

    // if (finalEnd && finalStart) {
    //   const overlappingEntries = await checkOverlappingEntries(
    //     userId,
    //     organizationId,
    //     finalStart,
    //     finalEnd,
    //     timeEntryId
    //   );

    //   if (overlappingEntries.length > 0) {
    //     res.status(409).json({
    //       success: false,
    //       message: `Time entry overlaps with ${
    //         overlappingEntries.length
    //       } existing ${
    //         overlappingEntries.length === 1 ? "entry" : "entries"
    //       }. Please choose a different time slot.`,
    //       overlappingEntries: overlappingEntries.map((entry) => ({
    //         id: entry.id,
    //         description: entry.description,
    //         start: entry.start,
    //         end: entry.end,
    //         project: entry.project,
    //       })),
    //     });
    //     return;
    //   }
    // }

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

      const isCurrentProject = existingEntry.projectId === data.projectId;

      const isProjectMember = await db.projectMember.findFirst({
        where: {
          projectId: data.projectId,
          userId: existingEntry.userId,
        },
      });

      const currentUser = existingEntry.userId === userId;

      if (!isCurrentProject && !isProjectMember) {
        throw new ErrorHandler(
          `${currentUser ? "You are" : "user not"} a member of this project`,
          403
        );
      }

      if (data.taskId) {
        const task = await db.task.findFirst({
          where: {
            id: data.taskId,
            organizationId,
            projectId: data.projectId,
          },
          include: {
            project: true,
          },
        });

        if (!task) {
          throw new ErrorHandler("Task not found", 404);
        }
      }
    }

    let billableRate = existingEntry.billableRate;

    const isBillable = data.billable ?? existingEntry.billable;

    if (isBillable === false) {
      billableRate = null;
    } else if (
      isBillable === true &&
      (existingEntry.billableRate === null ||
        existingEntry.billableRate === undefined)
    ) {
      billableRate = await calculateBillableRate({
        userId: existingEntry.userId,
        projectId: data.projectId ?? existingEntry.projectId ?? undefined,
        organizationId,
      });
    }
    const newDuration = finalEnd
      ? calculateDuration(finalStart, finalEnd)
      : null;

    const updatedTimeEntry = await db.$transaction(async (tx) => {
      const entry = await tx.timeEntry.update({
        where: { id: timeEntryId },
        data: {
          description: data.description,
          start: data.start,
          end: data.end,
          billable: data.billable,
          projectId: data.projectId,
          taskId: data.taskId,
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

    if (updatedTimeEntry.projectId) {
      await recalculateProjectSpentTime(updatedTimeEntry.projectId);
    }

    if (updatedTimeEntry.taskId) {
      await recalculateTaskSpentTime(updatedTimeEntry.taskId);
    }

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
  }
);

export const deleteTimeEntry = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const { organizationId, timeEntryId } = req.params;
    const userId = req.user?.id;

    if (!userId || !organizationId || !timeEntryId) {
      throw new ErrorHandler(
        "User ID, Organization ID, and Time Entry ID are required",
        400
      );
    }

    const org = await getOrganization(organizationId);
    if (!org) throw new ErrorHandler("Organization not found", 404);

    const existingEntry = await db.timeEntry.findUnique({
      where: { id: timeEntryId, organizationId },
    });

    if (!existingEntry) {
      throw new ErrorHandler("Time entry not found", 404);
    }

    if (existingEntry.userId !== userId) {
      await assertAPIPermission(userId, organizationId, "TIME", "UPDATE");
    } else {
      await assertAPIPermission(userId, organizationId, "TIME", "CREATE");
    }

    await db.timeEntry.delete({
      where: { id: timeEntryId },
    });

    if (existingEntry.projectId) {
      await recalculateProjectSpentTime(existingEntry.projectId);
    }
    if (existingEntry.taskId) {
      await recalculateTaskSpentTime(existingEntry.taskId);
    }

    res.status(200).json({
      success: true,
      message: "Time entry deleted successfully",
    });
  }
);

export const bulkUpdateTimeEntries = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const { organizationId } = req.params;
    const userId = req.user?.id;

    if (!userId || !organizationId) {
      throw new ErrorHandler("User ID and Organization ID are required", 400);
    }

    const parsed = bulkUpdateTimeEntriesSchema.parse(req.body);

    const data = parsed;

    const org = await getOrganization(organizationId);
    if (!org) throw new ErrorHandler("Organization not found", 404);

    const timeEntries = await db.timeEntry.findMany({
      where: {
        id: { in: data.timeEntryIds },
        organizationId,
      },
    });

    if (timeEntries.length !== data.timeEntryIds.length) {
      throw new ErrorHandler(
        "Some time entries not found or access denied",
        404
      );
    }

    const userOwnsAllEntries = timeEntries.every((e) => e.userId === userId);

    if (!userOwnsAllEntries) {
      await assertAPIPermission(userId, organizationId, "TIME", "UPDATE");
    } else {
      await assertAPIPermission(userId, organizationId, "TIME", "CREATE");
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

      if (project.isArchived) {
        const allAlreadyAssigned = timeEntries.every(
          (entry) => entry.projectId === data.updates.projectId
        );
        if (!allAlreadyAssigned) {
          throw new ErrorHandler("Cannot assign archived project", 400);
        }
      }

      const allHasAccess = await Promise.all(
        timeEntries.map(async (entry) => {
          console.log(entry.projectId, data.updates.projectId);
          if (entry.projectId && entry.projectId === data.updates.projectId)
            return true;

          const isProjectMember = await db.projectMember.findFirst({
            where: {
              userId: entry.userId,
              projectId: data.updates.projectId!,
            },
          });

          return Boolean(isProjectMember);
        })
      );

      console.log(allHasAccess);

      if (allHasAccess.includes(false)) {
        throw new ErrorHandler(
          "One or more entries cannot be moved to this project due to membership restrictions",
          403
        );
      }

      if (data.updates.taskId) {
        const task = await db.task.findFirst({
          where: {
            id: data.updates.taskId,
            organizationId,
            projectId: data.updates.projectId,
          },
        });

        if (!task) {
          throw new ErrorHandler("Task not found in this project", 404);
        }
      }
    }

    const billableRatesMap: Record<string, number | null> = {};

    if (data.updates.billable === true) {
      for (const entry of timeEntries) {
        if (entry.billableRate == null) {
          const rate = await calculateBillableRate({
            userId: entry.userId,
            projectId: data.updates.projectId ?? entry.projectId ?? undefined,
            organizationId,
          });
          billableRatesMap[entry.id] = rate;
        }
      }
    }

    await db.$transaction(async (tx) => {
      for (const entry of timeEntries) {
        await tx.timeEntry.update({
          where: { id: entry.id },
          data: {
            description: data.updates.description,
            billable: data.updates.billable,
            billableRate:
              data.updates.billable === false
                ? null
                : billableRatesMap[entry.id] ?? entry.billableRate,
            projectId: data.updates.projectId,
            taskId: data.updates.taskId,
          },
        });
      }

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

    const affectedProjectIds = [
      ...new Set([
        ...timeEntries.map((e) => e.projectId).filter(Boolean),
        ...(data.updates.projectId ? [data.updates.projectId] : []),
      ]),
    ];
    const affectedTaskIds = [
      ...new Set([
        ...timeEntries.map((e) => e.taskId).filter(Boolean),
        ...(data.updates.taskId ? [data.updates.taskId] : []),
      ]),
    ];

    for (const projectId of affectedProjectIds) {
      if (projectId) await recalculateProjectSpentTime(projectId);
    }
    for (const taskId of affectedTaskIds) {
      if (taskId) await recalculateTaskSpentTime(taskId);
    }

    res.status(200).json({
      success: true,
      message: `${data.timeEntryIds.length} time entries updated successfully`,
    });
  }
);

export const bulkDeleteTimeEntries = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const { organizationId } = req.params;
    const userId = req.user?.id;

    if (!userId || !organizationId) {
      throw new ErrorHandler("User ID and Organization ID are required", 400);
    }

    const parsed = bulkDeleteTimeEntriesSchema.parse(req.body);

    const data = parsed;

    const org = await getOrganization(organizationId);
    if (!org) throw new ErrorHandler("Organization not found", 404);

    const timeEntries = await db.timeEntry.findMany({
      where: {
        id: { in: data.timeEntryIds },
        organizationId,
      },
    });

    if (timeEntries.length !== data.timeEntryIds.length) {
      throw new ErrorHandler(
        "Some time entries not found or access denied",
        404
      );
    }

    const userOwnsAllEntries = timeEntries.every((e) => e.userId === userId);

    if (!userOwnsAllEntries) {
      await assertAPIPermission(userId, organizationId, "TIME", "UPDATE");
    } else {
      await assertAPIPermission(userId, organizationId, "TIME", "CREATE");
    }

    await db.timeEntry.deleteMany({
      where: {
        id: { in: data.timeEntryIds },
      },
    });

    const affectedProjectIds = [
      ...new Set(timeEntries.map((e) => e.projectId).filter(Boolean)),
    ];
    const affectedTaskIds = [
      ...new Set(timeEntries.map((e) => e.taskId).filter(Boolean)),
    ];

    for (const projectId of affectedProjectIds) {
      if (projectId) {
        await recalculateProjectSpentTime(projectId);
      }
    }
    for (const taskId of affectedTaskIds) {
      if (taskId) {
        await recalculateTaskSpentTime(taskId);
      }
    }

    res.status(200).json({
      success: true,
      message: `${data.timeEntryIds.length} time entries deleted successfully`,
    });
  }
);

export const getTimeEntries = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const { organizationId } = req.params;
    const userId = req.user?.id;
    const {
      page = "1",
      limit = "10",
      all = "false",
      date,
      tags,
      clients,
      members,
      tasks,
      projects,
      billable,
    } = req.query;

    const pageNumber = parseInt(page as string, 10);
    const limitNumber = parseInt(limit as string, 10);
    const skip = (pageNumber - 1) * limitNumber;

    if (!userId || !organizationId) {
      throw new ErrorHandler("User ID and Organization ID are required", 400);
    }

    const member = await assertAPIPermission(
      userId,
      organizationId,
      "TIME",
      "CREATE"
    );

    const isEmployee = member.role === "EMPLOYEE";
    const fetchAll = all === "true" && !isEmployee;

    let projectIds = projects
      ? Array.isArray(projects)
        ? projects
        : (projects as string).split(",")
      : undefined;

    let tagIds = tags
      ? Array.isArray(tags)
        ? tags
        : (tags as string).split(",")
      : undefined;

    let clientIds = clients
      ? Array.isArray(clients)
        ? clients
        : (clients as string).split(",")
      : undefined;

    let memberIds = members
      ? Array.isArray(members)
        ? members
        : (members as string).split(",")
      : undefined;

    let taskIds = tasks
      ? Array.isArray(tasks)
        ? tasks
        : (tasks as string).split(",")
      : undefined;
    const billableFilter =
      billable !== undefined ? billable === "true" : undefined;

    const whereClause: any = {
      organizationId,
      end: { not: null },
      ...(projectIds && { projectId: { in: projectIds } }),
      ...(taskIds && { taskId: { in: taskIds } }),
      ...(billableFilter !== undefined && { billable: billableFilter }),
    };

    if (!fetchAll) {
      whereClause.memberId = member.id;
    } else if (memberIds) {
      whereClause.memberId = { in: memberIds };
    }

    if (tagIds) {
      whereClause.tags = { some: { tagId: { in: tagIds } } };
    }

    if (clientIds && !isEmployee) {
      whereClause.project = { clientId: { in: clientIds } };
    }

    if (date) {
      const userTimezoneOffset = new Date().getTimezoneOffset() * -1; // Dynamic offset in minutes
      const { startUTC, endUTC } = getLocalDateRangeInUTC(
        date as string,
        userTimezoneOffset
      );

      whereClause.start = {
        gte: startUTC,
        lt: endUTC,
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
  }
);

export const getAllProjectWithTasks = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const { organizationId } = req.params;
    const userId = req.user?.id;

    if (!userId || !organizationId) {
      throw new ErrorHandler("User ID and Organization ID are required", 400);
    }

    await assertAPIPermission(userId, organizationId, "TIME", "CREATE");

    const projects = await db.project.findMany({
      where: {
        organizationId,
        isArchived: false,
      },
      include: {
        tasks: {
          where: { status: "ACTIVE" },
          select: { id: true, name: true },
        },
        members: {
          select: {
            userId: true,
          },
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
        members: project.members.map((member) => member.userId),
      })),
      message: "Projects with tasks and members retrieved successfully",
    });
  }
);
