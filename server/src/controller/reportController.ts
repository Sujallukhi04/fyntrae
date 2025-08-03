import { Request, Response } from "express";
import { ErrorHandler } from "../utils/errorHandler";
import { assertAPIPermission } from "../helper/organization";
import {
  generateReportData,
  generateTimeSummaryGroupData,
} from "../helper/time";
import crypto from "crypto";
import { db } from "../prismaClient";

export const createReport = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { organizationId } = req.params;
    const {
      name,
      description,
      isPublic = false,
      publicUntil,
      startDate,
      endDate,
      tags,
      clients,
      members,
      tasks,
      projects,
      billable,
      groups,
    } = req.body;

    const userId = req.user?.id;

    if (!userId || !organizationId) {
      throw new ErrorHandler("User ID and Organization ID are required", 400);
    }

    if (!name) {
      throw new ErrorHandler("Report name is required", 400);
    }

    // const member = await assertAPIPermission(
    //   userId,
    //   organizationId,
    //   "REPORTS",
    //   "CREATE"
    // );

    // const reportData = await generateReportData(
    //   organizationId,
    //   {
    //     startDate,
    //     endDate,
    //     tags,
    //     clients,
    //     members,
    //     tasks,
    //     projects,
    //     billable,
    //     groups,
    //   },
    //   userId,
    //   member
    // );

    const shareSecret = isPublic ? crypto.randomUUID() : null;

    const report = await db.report.create({
      data: {
        name,
        description,
        isPublic,
        publicUntil: isPublic ? new Date(publicUntil) : null,
        shareSecret,
        organizationId,
        properties: {
          group: groups,
          startDate,
          endDate,
          members,
          billable,
          clients,
          tasks,
          projects,
          tags,
        },
      },
    });

    res.status(201).json({
      success: true,
      data: report,
      message: "Report created successfully",
    });
  } catch (error) {
    throw new ErrorHandler(
      error instanceof Error ? error.message : "Internal Server Error",
      500
    );
  }
};

export const getReports = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { organizationId } = req.params;
  const { page = "1", limit = "10" } = req.query;

  const userId = req.user?.id;
  if (!userId) {
    throw new ErrorHandler("User not authenticated", 401);
  }

  const pageNumber = parseInt(page as string, 10);
  const pageSize = parseInt(limit as string, 10);
  const skip = (pageNumber - 1) * pageSize;

  try {
    const [reports, totalCount] = await Promise.all([
      db.report.findMany({
        where: {
          organizationId,
        },
        orderBy: {
          createdAt: "desc",
        },
        skip,
        take: pageSize,
      }),
      db.report.count({
        where: {
          organizationId,
          name: {
            mode: "insensitive",
          },
        },
      }),
    ]);

    res.json({
      success: true,
      data: reports,
      pagination: {
        total: totalCount,
        page: pageNumber,
        pageSize: pageSize,
        totalPages: Math.ceil(totalCount / pageSize),
      },
    });
  } catch (error) {
    throw new ErrorHandler(
      error instanceof Error ? error.message : "Internal Server Error",
      500
    );
  }
};

export const getPublicReportById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { publicSecret } = req.params;

    if (!publicSecret) {
      throw new ErrorHandler("Public secret is required", 400);
    }

    // Fetch the public report
    const report = await db.report.findFirst({
      where: {
        shareSecret: publicSecret,
        isPublic: true,
        OR: [{ publicUntil: null }, { publicUntil: { gte: new Date() } }],
      },
      include: {
        organization: {
          select: {
            name: true,
            currency: true,
          },
        },
      },
    });

    if (!report) {
      throw new ErrorHandler("Public report not found or expired", 404);
    }

    // Get the properties from the report
    const properties = report.properties as any;

    // Generate main grouped data
    const reportGroupData = await generateTimeSummaryGroupData(
      report.organizationId,
      {
        startDate: properties.startDate,
        endDate: properties.endDate,
        tags: properties.tags,
        clients: properties.clients,
        members: properties.members,
        tasks: properties.tasks,
        projects: properties.projects,
        billable: properties.billable,
        groups: properties.group,
      },
      null, // userId is null for public reports
      null // member is null for public reports
    );

    // Generate history data (daily breakdown)
    const historyData = await generateTimeSummaryGroupData(
      report.organizationId,
      {
        startDate: properties.startDate,
        endDate: properties.endDate,
        tags: properties.tags,
        clients: properties.clients,
        members: properties.members,
        tasks: properties.tasks,
        projects: properties.projects,
        billable: properties.billable,
        groups: ["date"], // Always group by date for history
      },
      null,
      null
    );

    // Transform data to match the expected format
    const responseData = {
      name: report.name,
      description: report.description,
      public_until: report.publicUntil,
      currency: report.organization.currency,
      properties: {
        group: properties.group || "projects",
        history_group: properties.history_group || "day",
        start: properties.startDate
          ? new Date(properties.startDate + "T18:30:00Z").toISOString()
          : null,
        end: properties.endDate
          ? new Date(properties.endDate + "T18:29:59Z").toISOString()
          : null,
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
      message: "Public report retrieved successfully",
    });
  } catch (error) {
    throw new ErrorHandler(
      error instanceof Error ? error.message : "Internal Server Error",
      500
    );
  }
};
