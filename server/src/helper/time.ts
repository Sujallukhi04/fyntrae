import { Member } from "@prisma/client";
import { db } from "../prismaClient";
import { getLocalDateRangeInUTC } from "./billableRate";
import { assertAPIPermission } from "./organization";
import { ParsedQs } from "qs";

export function formatDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function getDateRangeArray(start: string, end: string) {
  const arr = [];
  let current = new Date(start);
  const last = new Date(end);
  while (current <= last) {
    arr.push(formatDate(current));
    current.setDate(current.getDate() + 1);
  }
  return arr;
}

export function getValueByGroupKey(
  entry: any,
  key: string,
  offset = 0
): string | null {
  switch (key) {
    case "date":
    case "day": {
      if (!entry.start) return null;
      const d = new Date(entry.start);
      d.setMinutes(d.getMinutes() - offset);
      return d.toISOString().slice(0, 10);
    }
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

export const generateColors = (count: number) => {
  const colors = [
    "#3B82F6",
    "#60A5FA",
    "#93C5FD",
    "#BFDBFE",
    "#DBEAFE",
    "#F472B6",
    "#FBBF24",
    "#34D399",
    "#A78BFA",
    "#F87171",
  ];
  return Array.from({ length: count }, (_, i) => colors[i % colors.length]);
};

export function getNameByGroupKey(entry: any, key: string): string | null {
  switch (key) {
    case "date":
    case "day": {
      if (!entry.start) return null;
      const d = new Date(entry.start);
      return d.toLocaleDateString("en-US", {
        weekday: "short",
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    }
    case "members":
      return entry.member?.user?.name || entry.member?.name || "Unknown Member";
    case "tasks":
      return entry.task?.name || "No Task";
    case "clients":
      return entry.project?.client?.name || "No Client";
    case "billable":
      return entry.billable ? "Billable" : "Non-Billable";
    case "description":
      return entry.description || "No Description";
    case "projects":
      return entry.project?.name || "No Project";
    default:
      return entry[key] || null;
  }
}

export function groupByMultiple(
  entries: any[],
  groupKeys: string[],
  offset = 0
): any[] | null {
  if (!groupKeys.length) return null;
  const [currentKey, ...restKeys] = groupKeys;
  const grouped: Record<string, any[]> = {};

  for (const entry of entries) {
    const key = getValueByGroupKey(entry, currentKey, offset) ?? "null";
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(entry);
  }

  return Object.entries(grouped).map(([key, groupEntries]) => {
    const grouped_data = restKeys.length
      ? groupByMultiple(groupEntries, restKeys, offset)
      : null;

    const name =
      key === "null"
        ? "No " + currentKey.charAt(0).toUpperCase() + currentKey.slice(1, -1)
        : getNameByGroupKey(groupEntries[0], currentKey);
    return {
      key,
      name,
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

export function filterGroupDataForEmployeeRecursive(
  data: any[] | null,
  groupedType: string | null
): any[] | null {
  if (!data) return null;

  return data
    .filter((group) => {
      // Only filter out non-null clients if this level is grouped by clients
      if (groupedType === "clients") {
        return group.key === "null";
      }
      return true;
    })
    .map((group) => ({
      ...group,
      grouped_data: filterGroupDataForEmployeeRecursive(
        group.grouped_data,
        group.grouped_type
      ),
    }))
    .filter(
      (group) =>
        group.seconds > 0 || (group.grouped_data && group.grouped_data.length)
    );
}

export async function generateReportData(
  organizationId: string,
  filters: {
    startDate?: string;
    endDate?: string;
    tags?: string | string[];
    clients?: string | string[];
    members?: string | string[];
    tasks?: string | string[];
    projects?: string | string[];
    billable?: string;
    groups?: string | string[];
  },
  userId: string,
  member: Member
) {
  const {
    startDate,
    endDate,
    tags,
    clients,
    members,
    tasks,
    projects,
    billable,
    groups,
  } = filters;

  const userTimezoneOffset = new Date().getTimezoneOffset() * -1;
  const offset = Number(userTimezoneOffset) || 0;
  const isEmployee = member.role === "EMPLOYEE";

  // Date range filter
  let utcRange = {};
  if (startDate && endDate) {
    const { startUTC } = getLocalDateRangeInUTC(startDate, offset);
    const { endUTC } = getLocalDateRangeInUTC(endDate, offset);
    utcRange = {
      start: {
        gte: startUTC,
        lt: endUTC,
      },
    };
  }

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

  if (isEmployee) {
    memberIds = [userId];
    clientIds = undefined;
  }

  // Build Prisma where clause
  const where: any = {
    organizationId,
    ...utcRange,
    ...(projectIds && { projectId: { in: projectIds } }),
    ...(memberIds && { memberId: { in: memberIds } }),
    ...(taskIds && { taskId: { in: taskIds } }),
    ...(billableFilter !== undefined && { billable: billableFilter }),
  };

  if (isEmployee) {
    where.memberId = member.id;
  }

  if (tagIds) {
    where.tags = { some: { tagId: { in: tagIds } } };
  }
  if (clientIds && !isEmployee) {
    where.project = { clientId: { in: clientIds } };
  }

  // Fetch time entries with additional data for export
  const timeEntries = await db.timeEntry.findMany({
    where,
    select: {
      id: true,
      projectId: true,
      start: true,
      billable: true,
      duration: true,
      billableRate: true,
      memberId: true,
      taskId: true,
      description: true,
      project: {
        select: {
          clientId: true,
          name: true,
        },
      },
      member: {
        select: {
          user: {
            select: {
              name: true,
            },
          },
        },
      },
      task: {
        select: {
          name: true,
        },
      },
      tags: {
        select: {
          tag: {
            select: {
              name: true,
            },
          },
        },
      },
    },
  });

  // Parse group keys
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

  // Generate grouped data
  const primaryGroupedData = groupByMultiple(timeEntries, groupKeys, offset);
  const filteredPrimaryData = isEmployee
    ? filterGroupDataForEmployeeRecursive(
        primaryGroupedData,
        groupKeys[0] || null
      )
    : primaryGroupedData;

  // Generate date-based chart data
  const dateGroupedData = groupByMultiple(timeEntries, ["date"], offset);
  let chartData = dateGroupedData || [];

  if (startDate && endDate) {
    const groupedMap = new Map(
      (dateGroupedData || []).map((g: any) => [g.key, g])
    );
    const allDates = getDateRangeArray(startDate, endDate);
    chartData = allDates.map((date) => {
      if (groupedMap.has(date)) {
        const existingData = groupedMap.get(date);
        return {
          ...existingData,
          name: new Date(date).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          }),
        };
      }
      return {
        key: date,
        name: new Date(date).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
        seconds: 0,
        cost: 0,
        grouped_type: null,
        grouped_data: null,
      };
    });
  } else {
    // For non-date range data, ensure consistent naming
    chartData = (dateGroupedData || []).map((item: any) => ({
      ...item,
      name:
        item.name ||
        new Date(item.key).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
    }));
  }

  // Calculate totals
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

  // Return comprehensive report data
  return {
    summary: {
      totalHours: Math.round((totalSeconds / 3600) * 100) / 100,
      totalCost: totalCost,
      totalEntries: timeEntries.length,
      dateRange: {
        start: startDate || null,
        end: endDate || null,
      },
    },

    barChart: {
      type: "bar",
      title: "Daily Time Tracking",
      data: {
        labels: chartData.map((item) => item.name || item.key),
        datasets: [
          {
            label: "Hours Tracked",
            data: chartData.map(
              (item) => Math.round((item.seconds / 3600) * 100) / 100
            ),
            backgroundColor: "rgba(54, 162, 235, 0.6)",
            borderColor: "rgba(54, 162, 235, 1)",
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: `Time Tracking from ${startDate || "Start"} to ${
              endDate || "End"
            }`,
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: "Hours",
            },
          },
          x: {
            title: {
              display: true,
              text: "Date",
            },
          },
        },
      },
    },

    pieChart: {
      type: "pie",
      title: `Time Distribution by ${groupKeys[0] || "Category"}`,
      data: {
        labels:
          filteredPrimaryData?.map((item: any) => item.name || item.key) || [],
        datasets: [
          {
            label: "Hours",
            data:
              filteredPrimaryData?.map(
                (item: any) => Math.round((item.seconds / 3600) * 100) / 100
              ) || [],
            backgroundColor: generateColors(filteredPrimaryData?.length || 0),
            borderColor: generateColors(filteredPrimaryData?.length || 0).map(
              (color) => color.replace("0.8", "1")
            ),
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: `Time Distribution by ${groupKeys[0] || "Category"}`,
          },
          legend: {
            position: "right" as const,
          },
          tooltip: {
            callbacks: {
              label: function (context: any) {
                const label = context.label || "";
                const value = context.parsed;
                const total = context.dataset.data.reduce(
                  (sum: number, val: number) => sum + val,
                  0
                );
                const percentage = ((value / total) * 100).toFixed(1);
                return `${label}: ${value}h (${percentage}%)`;
              },
            },
          },
        },
      },
    },

    groupedData: {
      seconds: totalSeconds,
      cost: totalCost,
      grouped_type: groupKeys[0] || null,
      grouped_data: filteredPrimaryData,
    },

    analytics: {
      averageHoursPerDay:
        startDate && endDate
          ? Math.round((totalSeconds / 3600 / chartData.length) * 100) / 100
          : 0,
      billableHours:
        Math.round(
          (timeEntries
            .filter((e) => e.billable)
            .reduce((sum, e) => sum + (e.duration || 0), 0) /
            3600) *
            100
        ) / 100,
      nonBillableHours:
        Math.round(
          (timeEntries
            .filter((e) => !e.billable)
            .reduce((sum, e) => sum + (e.duration || 0), 0) /
            3600) *
            100
        ) / 100,
      billablePercentage:
        totalSeconds > 0
          ? Math.round(
              (timeEntries
                .filter((e) => e.billable)
                .reduce((sum, e) => sum + (e.duration || 0), 0) /
                totalSeconds) *
                100 *
                100
            ) / 100
          : 0,
      topPerformers:
        filteredPrimaryData?.slice(0, 5).map((item: any) => ({
          name: item.name || item.key,
          hours: Math.round((item.seconds / 3600) * 100) / 100,
          cost: item.cost,
        })) || [],
    },
  };
}

export async function generateTimeSummaryGroupData(
  organizationId: string,
  filters: {
    startDate?: string;
    endDate?: string;
    tags?: string;
    clients?: string;
    members?: string;
    tasks?: string;
    projects?: string;
    billable?: string;
    groups?: string;
  },
  userId: string | null,
  member: Member | null
) {
  // Get member if not provided
  if (!member && userId) {
    member = await assertAPIPermission(
      userId,
      organizationId,
      "TIME_SUMMARY",
      "VIEW"
    );
  }

  const {
    startDate,
    endDate,
    tags,
    clients,
    members,
    tasks,
    projects,
    billable,
    groups,
  } = filters;

  const userTimezoneOffset = new Date().getTimezoneOffset() * -1;
  const offset = Number(userTimezoneOffset) || 0;
  const isEmployee = member?.role === "EMPLOYEE";

  // Date range filter
  let utcRange = {};
  if (startDate && endDate) {
    const { startUTC } = getLocalDateRangeInUTC(startDate, offset);
    const { endUTC } = getLocalDateRangeInUTC(endDate, offset);
    utcRange = {
      start: {
        gte: startUTC,
        lt: endUTC,
      },
    };
  }

  // Parse filters
  let projectIds = projects
    ? Array.isArray(projects)
      ? (projects as string[])
      : (projects as string).split(",")
    : undefined;

  let tagIds = tags
    ? Array.isArray(tags)
      ? (tags as string[])
      : (tags as string).split(",")
    : undefined;

  let clientIds = clients
    ? Array.isArray(clients)
      ? (clients as string[])
      : (clients as string).split(",")
    : undefined;

  let memberIds = members
    ? Array.isArray(members)
      ? (members as string[])
      : (members as string).split(",")
    : undefined;

  let taskIds = tasks
    ? Array.isArray(tasks)
      ? (tasks as string[])
      : (tasks as string).split(",")
    : undefined;

  const billableFilter =
    billable !== undefined ? billable === "true" : undefined;

  if (isEmployee && userId) {
    memberIds = [userId];
    clientIds = undefined;
  }

  // Build Prisma where clause
  const where: any = {
    organizationId,
    ...utcRange,
    ...(projectIds && { projectId: { in: projectIds } }),
    ...(memberIds && { memberId: { in: memberIds } }),
    ...(taskIds && { taskId: { in: taskIds } }),
    ...(billableFilter !== undefined && { billable: billableFilter }),
  };

  if (isEmployee && member) {
    where.memberId = member.id;
  }

  if (tagIds) {
    where.tags = { some: { tagId: { in: tagIds } } };
  }
  if (clientIds && !isEmployee) {
    where.project = { clientId: { in: clientIds } };
  }

  // Fetch time entries
  const timeEntries = await db.timeEntry.findMany({
    where,
    select: {
      id: true,
      projectId: true,
      start: true,
      billable: true,
      duration: true,
      billableRate: true,
      memberId: true,
      taskId: true,
      description: true,
      member: {
        select: {
          user: {
            select: {
              name: true,
            },
          },
        },
      },
      project: {
        select: {
          clientId: true,
          name: true,
          client: {
            select: {
              name: true,
            },
          },
        },
      },
      task: {
        select: {
          name: true,
        },
      },
      tags: {
        select: {
          tag: {
            select: {
              name: true,
            },
          },
        },
      },
    },
  });

  // Parse group keys
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
  const groupedData = groupByMultiple(timeEntries, groupKeys, offset);

  // Calculate totals
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

  // Handle special case for date/day grouping with date range
  if (
    groupKeys.length === 1 &&
    (groupKeys[0] === "date" || groupKeys[0] === "day") &&
    startDate &&
    endDate
  ) {
    const groupedMap = new Map((groupedData || []).map((g: any) => [g.key, g]));
    const allDates = getDateRangeArray(startDate, endDate);
    const filledGroupedData = allDates.map((date) => {
      if (groupedMap.has(date)) {
        return groupedMap.get(date);
      }
      return {
        key: date,
        seconds: 0,
        cost: 0,
        grouped_type: null,
        grouped_data: null,
      };
    });

    return {
      seconds: totalSeconds,
      cost: totalCost,
      grouped_type: groupKeys[0],
      grouped_data: filledGroupedData,
    };
  }

  // Filter data for employees
  const filteredGroupData = isEmployee
    ? filterGroupDataForEmployeeRecursive(groupedData, groupKeys[0] || null)
    : groupedData;

  return {
    seconds: totalSeconds,
    cost: totalCost,
    grouped_type: groupKeys[0] || null,
    grouped_data: filteredGroupData,
  };
}
