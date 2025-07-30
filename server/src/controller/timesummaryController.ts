import { Request, Response } from "express";
import { ErrorHandler } from "../utils/errorHandler";
import { assertAPIPermission } from "../helper/organization";
import { db } from "../prismaClient";
import { getLocalDateRangeInUTC } from "../helper/billableRate";
import { ParsedQs } from "qs";

function formatDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function getDateRangeArray(start: string, end: string) {
  const arr = [];
  let current = new Date(start);
  const last = new Date(end);
  while (current <= last) {
    arr.push(formatDate(current));
    current.setDate(current.getDate() + 1);
  }
  return arr;
}

function getValueByGroupKey(entry: any, key: string): string | null {
  switch (key) {
    case "members":
      return entry.memberId || null;
    case "tasks":
      return entry.taskId || null;
    case "clients":
      return entry.project?.clientId || null;
    case "billable":
      return entry.billable != null ? String(Number(entry.billable)) : null;
    case "description":
      return entry.description || null;
    case "projects":
      return entry.projectId || null;
    default:
      return entry[key] || null;
  }
}

function groupByMultiple(entries: any[], groupKeys: string[]): any[] | null {
  if (!groupKeys.length) return null;
  const [currentKey, ...restKeys] = groupKeys;
  const grouped: Record<string, any[]> = {};
  for (const entry of entries) {
    const key = getValueByGroupKey(entry, currentKey) ?? "null";
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(entry);
  }
  return Object.entries(grouped).map(([key, groupEntries]) => {
    const grouped_data = restKeys.length
      ? groupByMultiple(groupEntries, restKeys)
      : null;
    return {
      key,
      seconds: groupEntries.reduce((sum, e) => sum + (e.duration || 0), 0),
      cost: groupEntries.reduce(
        (sum, e) =>
          sum +
          (e.billable && e.billableRate
            ? Math.round((e.duration / 3600) * e.billableRate)
            : 0),
        0
      ),
      grouped_type: restKeys[0] || null,
      grouped_data,
    };
  });
}

export const getTimeSummary = async (req: Request, res: Response) => {
  const { organizationId } = req.params;
  const {
    startDate,
    endDate,
    tags,
    clients,
    members,
    tasks,
    projects,
    billable,
  } = req.query;
  const userId = req.user?.id;

  if (!userId || !organizationId)
    throw new ErrorHandler("User ID and Organization ID are required", 400);

  try {
    await assertAPIPermission(userId, organizationId, "TIME_SUMMARY", "VIEW");

    const userTimezoneOffset = new Date().getTimezoneOffset() * -1;

    const offset = Number(userTimezoneOffset) || 0;

    let utcRange = {};
    if (startDate && endDate) {
      const { startUTC } = getLocalDateRangeInUTC(startDate as string, offset);
      const { endUTC } = getLocalDateRangeInUTC(endDate as string, offset);
      utcRange = {
        start: {
          gte: startUTC,
          lt: endUTC,
        },
      };
    }

    const projectIds = projects
      ? Array.isArray(projects)
        ? projects
        : (projects as string).split(",")
      : undefined;
    const tagIds = tags
      ? Array.isArray(tags)
        ? tags
        : (tags as string).split(",")
      : undefined;
    const clientIds = clients
      ? Array.isArray(clients)
        ? clients
        : (clients as string).split(",")
      : undefined;
    const memberIds = members
      ? Array.isArray(members)
        ? members
        : (members as string).split(",")
      : undefined;
    const taskIds = tasks
      ? Array.isArray(tasks)
        ? tasks
        : (tasks as string).split(",")
      : undefined;
    const billableFilter =
      billable !== undefined ? billable === "true" : undefined;

    const where: any = {
      organizationId,
      ...utcRange,
      ...(projectIds && { projectId: { in: projectIds } }),
      ...(memberIds && { memberId: { in: memberIds } }),
      ...(taskIds && { taskId: { in: taskIds } }),
      ...(billableFilter !== undefined && { billable: billableFilter }),
    };

    if (tagIds) {
      where.tags = { some: { tagId: { in: tagIds } } };
    }

    if (clientIds) {
      where.project = { clientId: { in: clientIds } };
    }

    const timeEntries = await db.timeEntry.findMany({
      where,
      select: { start: true, duration: true },
    });

    const summary: Record<string, number> = {};
    for (const entry of timeEntries) {
      const d = new Date(entry.start);
      d.setMinutes(d.getMinutes() - offset);
      const localDate = d.toISOString().slice(0, 10);
      if (!summary[localDate]) summary[localDate] = 0;
      summary[localDate] += entry.duration;
    }

    const allDates = getDateRangeArray(startDate as string, endDate as string);
    const result = allDates.map((date) => ({
      date,
      totalDuration: summary[date] || 0,
    }));

    res.json({ summary: result });
  } catch (error) {
    throw new ErrorHandler(
      error instanceof Error ? error.message : "Internal Server Error",
      error instanceof Error ? 500 : 400
    );
  }
};

export const getTimeSummaryGrouped = async (req: Request, res: Response) => {
  const { organizationId } = req.params;
  const {
    startDate,
    endDate,
    tags,
    clients,
    members,
    tasks,
    projects,
    billable,
    groups, // comma-separated string or array, e.g. "tasks,members"
  } = req.query;
  const userId = req.user?.id;

  if (!userId || !organizationId)
    throw new ErrorHandler("User ID and Organization ID are required", 400);

  try {
    await assertAPIPermission(userId, organizationId, "TIME_SUMMARY", "VIEW");

    const userTimezoneOffset = new Date().getTimezoneOffset() * -1;
    const offset = Number(userTimezoneOffset) || 0;

    // Date range filter
    let utcRange = {};
    if (startDate && endDate) {
      const { startUTC } = getLocalDateRangeInUTC(startDate as string, offset);
      const { endUTC } = getLocalDateRangeInUTC(endDate as string, offset);
      utcRange = {
        start: {
          gte: startUTC,
          lt: endUTC,
        },
      };
    }

    // Parse filters
    const projectIds = projects
      ? Array.isArray(projects)
        ? projects
        : (projects as string).split(",")
      : undefined;
    const tagIds = tags
      ? Array.isArray(tags)
        ? tags
        : (tags as string).split(",")
      : undefined;
    const clientIds = clients
      ? Array.isArray(clients)
        ? clients
        : (clients as string).split(",")
      : undefined;
    const memberIds = members
      ? Array.isArray(members)
        ? members
        : (members as string).split(",")
      : undefined;
    const taskIds = tasks
      ? Array.isArray(tasks)
        ? tasks
        : (tasks as string).split(",")
      : undefined;
    const billableFilter =
      billable !== undefined ? billable === "true" : undefined;

    // Build Prisma where clause
    const where: any = {
      organizationId,
      ...utcRange,
      ...(projectIds && { projectId: { in: projectIds } }),
      ...(memberIds && { memberId: { in: memberIds } }),
      ...(taskIds && { taskId: { in: taskIds } }),
      ...(billableFilter !== undefined && { billable: billableFilter }),
    };

    if (tagIds) {
      where.tags = { some: { tagId: { in: tagIds } } };
    }
    if (clientIds) {
      where.project = { clientId: { in: clientIds } };
    }

    // Fetch time entries
    const timeEntries = await db.timeEntry.findMany({
      where,
      select: {
        id: true,
        projectId: true,
        billable: true,
        duration: true,
        billableRate: true,
        memberId: true,
        taskId: true,
        description: true,
        project: {
          select: {
            clientId: true,
          },
        },
        tags: {
          select: {
            tagId: true,
          },
        },
      },
    });

    let groupKeys: string[];
    if (groups) {
      if (Array.isArray(groups)) {
        groupKeys = (groups as (string | ParsedQs)[]).map(String);
      } else {
        groupKeys = String(groups).split(",");
      }
    } else {
      groupKeys = ["projects"];
    }

    // Group the data
    const groupedData = groupByMultiple(timeEntries, groupKeys);

    // Top-level summary
    const totalSeconds = timeEntries.reduce(
      (sum, e) => sum + (e.duration || 0),
      0
    );
    const totalCost = timeEntries.reduce(
      (sum, e) =>
        sum +
        (e.billable && e.billableRate
          ? Math.round((e.duration / 3600) * e.billableRate)
          : 0),
      0
    );

    res.json({
      data: {
        seconds: totalSeconds,
        cost: totalCost,
        grouped_type: groupKeys[0] || null,
        grouped_data: groupedData,
      },
    });
  } catch (error) {
    throw new ErrorHandler(
      error instanceof Error ? error.message : "Internal Server Error",
      error instanceof Error ? 500 : 400
    );
  }
};
