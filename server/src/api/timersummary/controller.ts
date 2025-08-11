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
      select: { currency: true },
    });

    if (!organization) {
      throw new ErrorHandler("Organization not found", 404);
    }

    const responseData = {
      name: "report",
      description: "",

      currency: organization.currency,
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
        cost: ((entry.billableRate ?? 0) * (entry.duration ?? 0)) / 3600,
      })),
    });
  }
);
