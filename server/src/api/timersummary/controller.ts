import { Request, Response } from "express";
import { ErrorHandler } from "../../utils/errorHandler";
import { assertAPIPermission } from "../../helper/organization";
import { generateTimeSummaryGroupData } from "../../helper/time";
import { catchAsync } from "../../utils/catchAsync";
import { exportTimeSummarySchema } from "../../schemas/time";
import { db } from "../../prismaClient";
import { getLocalDateRangeInUTC } from "../../helper/billableRate";

// export const getTimeSummaryGrouped = async (req: Request, res: Response) => {
//   const { organizationId } = req.params;
//   const {
//     startDate,
//     endDate,
//     tags,
//     clients,
//     members,
//     tasks,
//     projects,
//     billable,
//     groups,
//   } = req.query;
//   const userId = req.user?.id;

//   if (!userId || !organizationId)
//     throw new ErrorHandler("User ID and Organization ID are required", 400);

//   try {
//     const member = await assertAPIPermission(
//       userId,
//       organizationId,
//       "TIME_SUMMARY",
//       "VIEW"
//     );

//     const userTimezoneOffset = new Date().getTimezoneOffset() * -1;
//     const offset = Number(userTimezoneOffset) || 0;
//     const isEmployee = member.role === "EMPLOYEE";

//     // Date range filter
//     let utcRange = {};
//     if (startDate && endDate) {
//       const { startUTC } = getLocalDateRangeInUTC(startDate as string, offset);
//       const { endUTC } = getLocalDateRangeInUTC(endDate as string, offset);
//       utcRange = {
//         start: {
//           gte: startUTC,
//           lt: endUTC,
//         },
//       };
//     }

//     let projectIds = projects
//       ? Array.isArray(projects)
//         ? projects
//         : (projects as string).split(",")
//       : undefined;

//     let tagIds = tags
//       ? Array.isArray(tags)
//         ? tags
//         : (tags as string).split(",")
//       : undefined;

//     let clientIds = clients
//       ? Array.isArray(clients)
//         ? clients
//         : (clients as string).split(",")
//       : undefined;

//     let memberIds = members
//       ? Array.isArray(members)
//         ? members
//         : (members as string).split(",")
//       : undefined;

//     let taskIds = tasks
//       ? Array.isArray(tasks)
//         ? tasks
//         : (tasks as string).split(",")
//       : undefined;
//     const billableFilter =
//       billable !== undefined ? billable === "true" : undefined;

//     if (isEmployee) {
//       memberIds = [userId];
//       clientIds = undefined;
//     }

//     // Build Prisma where clause
//     const where: any = {
//       organizationId,
//       ...utcRange,
//       ...(projectIds && { projectId: { in: projectIds } }),
//       ...(memberIds && { memberId: { in: memberIds } }),
//       ...(taskIds && { taskId: { in: taskIds } }),
//       ...(billableFilter !== undefined && { billable: billableFilter }),
//     };

//     if (isEmployee) {
//       where.memberId = member.id;
//     }

//     if (tagIds) {
//       where.tags = { some: { tagId: { in: tagIds } } };
//     }
//     if (clientIds && !isEmployee) {
//       where.project = { clientId: { in: clientIds } };
//     }

//     // Fetch time entries
//     const timeEntries = await db.timeEntry.findMany({
//       where,
//       select: {
//         id: true,
//         projectId: true,
//         start: true,
//         billable: true,
//         duration: true,
//         billableRate: true,
//         memberId: true,
//         taskId: true,
//         description: true,
//         member: {
//           select: {
//             user: {
//               select: {
//                 name: true,
//               },
//             },
//           },
//         },
//         project: {
//           select: {
//             clientId: true,
//             name: true,
//             client: {
//               select: {
//                 name: true,
//               },
//             },
//           },
//         },
//         task: {
//           select: {
//             name: true,
//           },
//         },
//         tags: {
//           select: {
//             tag: {
//               select: {
//                 name: true,
//               },
//             },
//           },
//         },
//       },
//     });

//     let groupKeys: string[];
//     if (groups) {
//       if (Array.isArray(groups)) {
//         groupKeys = (groups as (string | ParsedQs)[]).map(String);
//       } else {
//         groupKeys = String(groups).split(",");
//       }
//     } else {
//       groupKeys = ["projects"];
//     }

//     // Group the data
//     const groupedData = groupByMultiple(timeEntries, groupKeys, offset);

//     // Top-level summary
//     const totalSeconds = timeEntries.reduce(
//       (sum, e) => sum + (e.duration || 0),
//       0
//     );
//     const totalCost = timeEntries.reduce(
//       (sum, e) =>
//         sum +
//         (e.billable && e.billableRate
//           ? Math.round((e.duration / 3600) * e.billableRate)
//           : 0),
//       0
//     );

//     if (
//       groupKeys.length === 1 &&
//       (groupKeys[0] === "date" || groupKeys[0] === "day") &&
//       startDate &&
//       endDate
//     ) {
//       const groupedMap = new Map(
//         (groupedData || []).map((g: any) => [g.key, g])
//       );
//       const allDates = getDateRangeArray(
//         startDate as string,
//         endDate as string
//       );
//       const filledGroupedData = allDates.map((date) => {
//         if (groupedMap.has(date)) {
//           return groupedMap.get(date);
//         }
//         return {
//           key: date,
//           seconds: 0,
//           cost: 0,
//           grouped_type: null,
//           grouped_data: null,
//         };
//       });
//       res.json({
//         data: {
//           seconds: totalSeconds,
//           cost: totalCost,
//           grouped_type: groupKeys[0],
//           grouped_data: filledGroupedData,
//         },
//       });
//       return;
//     }

//     const filteredGroupData = isEmployee
//       ? filterGroupDataForEmployeeRecursive(groupedData, groupKeys[0] || null)
//       : groupedData;

//     res.json({
//       data: {
//         seconds: totalSeconds,
//         cost: totalCost,
//         grouped_type: groupKeys[0] || null,
//         grouped_data: filteredGroupData,
//       },
//     });
//   } catch (error) {
//     throw new ErrorHandler(
//       error instanceof Error ? error.message : "Internal Server Error",
//       error instanceof Error ? 500 : 400
//     );
//   }
// };

export const getTimeSummaryGrouped = catchAsync(
  async (req: Request, res: Response) => {
    const { organizationId } = req.params;
    const userId = req.user?.id;

    if (!userId || !organizationId)
      throw new ErrorHandler("User ID and Organization ID are required", 400);

    const member = await assertAPIPermission(
      userId,
      organizationId,
      "TIME_SUMMARY",
      "VIEW"
    );

    const groupData = await generateTimeSummaryGroupData(
      organizationId,
      req.query,
      userId,
      member
    );

    res.status(200).json({
      data: groupData,
    });
  }
);

export const exportTimeSummary = catchAsync(
  async (req: Request, res: Response) => {
    const { organizationId } = req.params;
    const userId = req.user?.id;

    if (!userId || !organizationId)
      throw new ErrorHandler("User ID and Organization ID are required", 400);

    const member = await assertAPIPermission(
      userId,
      organizationId,
      "TIME_SUMMARY",
      "EXPORT"
    );

    const validatedData = exportTimeSummarySchema.parse(req.query);

    const {
      groups,
      startDate,
      endDate,
      members,
      billable,
      clients,
      tasks,
      projects,
      tags,
    } = validatedData;

    const reportGroupData = await generateTimeSummaryGroupData(
      organizationId,
      {
        startDate: startDate,
        endDate: endDate,
        tags: tags || undefined,
        clients: clients || undefined,
        members: members || undefined,
        tasks: tasks || undefined,
        projects: projects || undefined,
        billable: billable !== undefined ? billable.toString() : undefined,
        groups: groups || undefined,
      },
      userId,
      member
    );

    const historyData = await generateTimeSummaryGroupData(
      organizationId,
      {
        startDate: startDate,
        endDate: endDate,
        tags: tags || undefined,
        clients: clients || undefined,
        members: members || undefined,
        tasks: tasks || undefined,
        projects: projects || undefined,
        billable: billable !== undefined ? billable.toString() : undefined,
        groups: "day",
      },
      userId,
      member
    );

    const organization = await db.organizations.findUnique({
      where: { id: organizationId },
      select: {
        currency: true,
        numberFormat: true,
        intervalFormat: true,
        dateFormat: true,
      },
    });

    if (!organization) {
      throw new ErrorHandler("Organization not found", 404);
    }

    const responseData = {
      name: "report",
      description: "",
      currency: organization.currency,
      numberFormat: organization.numberFormat,
      intervalFormat: organization.intervalFormat,
      dateFormat: organization.dateFormat,
      properties: {
        group: groups,
        history_group: "day",
        start: startDate
          ? new Date(startDate + "T18:30:00Z").toISOString()
          : null,
        end: endDate ? new Date(endDate + "T18:29:59Z").toISOString() : null,
      },
      data: {
        seconds: reportGroupData.seconds,
        cost: reportGroupData.cost,
        grouped_type: reportGroupData.grouped_type,
        grouped_data:
          reportGroupData.grouped_data?.map((item: any, index: number) => ({
            ...item,
          })) || [],
      },
      history_data: {
        seconds: historyData.seconds,
        cost: historyData.cost,
        grouped_type: historyData.grouped_type,
        grouped_data:
          historyData.grouped_data?.map((item: any) => ({
            ...item,
          })) || [],
      },
    };

    res.json({
      success: true,
      data: responseData,
      message: "report retrieved successfully",
    });
  }
);

export const exportDetailedTimeSummary = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const { organizationId } = req.params;
    const userId = req.user?.id;
    const { date, tags, clients, members, tasks, projects, billable } =
      req.query;

    if (!userId || !organizationId) {
      throw new ErrorHandler("User ID and Organization ID are required", 400);
    }

    const member = await assertAPIPermission(
      userId,
      organizationId,
      "TIME_SUMMARY",
      "EXPORT"
    );

    const isEmployee = member.role === "EMPLOYEE";
    const fetchAll = !isEmployee;

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

    const entries = await db.timeEntry.findMany({
      where: whereClause,
      orderBy: { start: "desc" },
      include: {
        project: {
          select: {
            name: true,
            client: {
              select: {
                name: true,
              },
            },
          },
        },
        tags: {
          select: {
            tag: {
              select: { id: true, name: true },
            },
          },
        },
        user: {
          select: {
            name: true,
          },
        },
        task: {
          select: {
            name: true,
          },
        },
      },
    });

    // console.log(entries, "hi");

    res.status(200).json({
      success: true,
      data: entries.map((entry) => ({
        id: entry.id,
        description: entry.description || "-",
        task: entry.task?.name || undefined,
        project: entry.project?.name || undefined,
        client: entry.project?.client?.name || undefined,
        user: entry.user?.name || "-",
        start: entry.start,
        end: entry.end,
        seconds: entry.duration || 0,
        billable: entry.billable ?? false,
        tags: entry.tags.map((t) => t.tag.name),
        cost:
          Math.round(
            (((entry.billableRate ?? 0) * (entry.duration ?? 0)) / 3600) * 100
          ) / 100,
      })),
    });
  }
);

export const getDashboardTimeSummary = catchAsync(
  async (req: Request, res: Response) => {
    const { organizationId } = req.params;
    const userId = req.user?.id;

    if (!userId || !organizationId)
      throw new ErrorHandler("User ID and Organization ID are required", 400);

    const member = await assertAPIPermission(
      userId,
      organizationId,
      "TIME_SUMMARY",
      "VIEW"
    );

    const isEmployee = member.role === "EMPLOYEE";

    // Get timezone offset
    const userTimezoneOffset = new Date().getTimezoneOffset() * -1;
    const offset = Number(userTimezoneOffset) || 0;

    // Get last 7 days range
    const endDate = new Date().toISOString().split("T")[0];
    const startDate = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0];

    // Convert to UTC with timezone offset
    const { startUTC } = getLocalDateRangeInUTC(startDate, offset);
    const { endUTC } = getLocalDateRangeInUTC(endDate, offset);

    const orgMembers = await db.member.findMany({
      where: {
        organizationId,
        ...(isEmployee && { id: member.id }),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    const runningEntries = await db.timeEntry.findMany({
      where: {
        organizationId,
        ...(isEmployee && { memberId: member.id }),
      },
      include: {
        member: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: { start: "desc" },
    });

    const membersWithRunningEntries = orgMembers.map((orgMember) => {
      const latestRunningEntry = runningEntries.find(
        (entry) => entry.memberId === orgMember.id
      );

      return {
        id: orgMember.id,
        name: orgMember.user.name,
        runningEntry: latestRunningEntry
          ? {
              id: latestRunningEntry.id,
              description: latestRunningEntry.description,
              start: latestRunningEntry.start,
              end: latestRunningEntry.end,
            }
          : null,
      };
    });
    // Get last 7 days data
    const timeEntries = await db.timeEntry.findMany({
      where: {
        organizationId,
        ...(isEmployee && { userId }),
        start: {
          gte: startUTC,
          lt: endUTC,
        },
        end: { not: null },
      },
      include: {
        project: { select: { name: true, color: true } },
        task: { select: { name: true } },
        user: { select: { name: true } },
      },
      orderBy: { start: "desc" },
    });

    const projectEntries = await db.timeEntry.findMany({
      where: {
        organizationId,
        ...(isEmployee && { userId }),
        start: {
          gte: startUTC,
          lt: endUTC,
        },
        end: { not: null },
        projectId: { not: null },
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { start: "desc" },
    });

    const projectSummaries = projectEntries.reduce((acc, entry) => {
      if (!entry.project) return acc;

      const projectId = entry.project.id;
      if (!acc[projectId]) {
        acc[projectId] = {
          id: projectId,
          name: entry.project.name,
          totalDuration: 0,
        };
      }

      acc[projectId].totalDuration += entry.duration || 0;
      return acc;
    }, {} as Record<string, any>);

    const sortedProjects = Object.values(projectSummaries).sort(
      (a, b) => b.totalDuration - a.totalDuration
    );

    const dailySummary = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(startUTC);
      date.setDate(date.getDate() + i);
      const dayStart = new Date(date.setHours(0, 0, 0, 0));
      const dayEnd = new Date(date.setHours(23, 59, 59, 999));

      const dayEntries = timeEntries.filter(
        (entry) => entry.start >= dayStart && entry.start <= dayEnd
      );

      return {
        date: date.toISOString().split("T")[0],
        totalTime: dayEntries.reduce(
          (sum, entry) => sum + (entry.duration || 0),
          0
        ),
        billableTime: dayEntries
          .filter((entry) => entry.billable)
          .reduce((sum, entry) => sum + (entry.duration || 0), 0),
        billableAmount: dayEntries
          .filter((entry) => entry.billable)
          .reduce(
            (sum, entry) =>
              sum + ((entry.duration || 0) * (entry.billableRate || 0)) / 3600,
            0
          ),
      };
    });

    // Calculate totals
    const weeklyTotals = {
      totalTime: timeEntries.reduce(
        (sum, entry) => sum + (entry.duration || 0),
        0
      ),
      billableTime: timeEntries
        .filter((entry) => entry.billable)
        .reduce((sum, entry) => sum + (entry.duration || 0), 0),
      billableAmount: timeEntries
        .filter((entry) => entry.billable)
        .reduce(
          (sum, entry) =>
            sum + ((entry.duration || 0) * (entry.billableRate || 0)) / 3600,
          0
        ),
    };

    // Get recent entries
    const recentEntries = timeEntries.slice(0, 5);

    res.status(200).json({
      success: true,
      data: {
        runningEntries: membersWithRunningEntries,
        recentEntries: recentEntries.map((entry) => ({
          id: entry.id,
          description: entry.description,
          project: entry.project?.name,
          color: entry.project?.color,
          task: entry.task?.name,
          user: entry.user?.name,
          start: entry.start,
          end: entry.end,
          duration: entry.duration,
        })),
        dailySummary,
        weeklyTotals,
        projects: sortedProjects.map((project) => ({
          id: project.id,
          name: project.name,
          totalDuration: project.totalDuration,
        })),
        dateRange: {
          start: startDate,
          end: endDate,
        },
      },
    });
  }
);
