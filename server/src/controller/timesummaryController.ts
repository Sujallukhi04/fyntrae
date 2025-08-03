import { Request, Response } from "express";
import { ErrorHandler } from "../utils/errorHandler";
import { assertAPIPermission } from "../helper/organization";
import { generateTimeSummaryGroupData } from "../helper/time";

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

export const getTimeSummaryGrouped = async (req: Request, res: Response) => {
  const { organizationId } = req.params;
  const userId = req.user?.id;

  if (!userId || !organizationId)
    throw new ErrorHandler("User ID and Organization ID are required", 400);

  try {
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
  } catch (error) {
    throw new ErrorHandler(
      error instanceof Error ? error.message : "Internal Server Error",
      error instanceof Error ? 500 : 400
    );
  }
};

export const exportTimeSummary = async (req: Request, res: Response) => {
  const { organizationId } = req.params;
  const userId = req.user?.id;

  if (!userId || !organizationId)
    throw new ErrorHandler("User ID and Organization ID are required", 400);

  try {
    // const filters = parseQueryFilters(req.query);
    // const reportData = await generateReportData(
    //   organizationId,
    //   filters,
    //   userId,
    //   member
    // );
    // res.json({ success: true, data: reportData });
  } catch (error) {
    throw new ErrorHandler(
      error instanceof Error ? error.message : "Internal Server Error",
      error instanceof Error ? 500 : 500
    );
  }
};
