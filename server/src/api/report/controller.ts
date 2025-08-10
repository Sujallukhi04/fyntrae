import { Request, Response } from "express";
import { ErrorHandler } from "../../utils/errorHandler";
import { assertAPIPermission } from "../../helper/organization";
import {
  generateReportData,
  generateTimeSummaryGroupData,
} from "../../helper/time";
import crypto from "crypto";
import { db } from "../../prismaClient";
import { createReportSchema, updateReportSchema } from "../../schemas/report";
import { catchAsync } from "../../utils/catchAsync";

export const createReport = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const { organizationId } = req.params;
    const userId = req.user?.id;

    if (!userId || !organizationId) {
      throw new ErrorHandler("User ID and Organization ID are required", 400);
    }

    await assertAPIPermission(userId, organizationId, "REPORTS", "CREATE");

    const validatedData = createReportSchema.parse(req.body);

    const {
      name,
      description,
      isPublic,
      publicUntil,
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

    const shareSecret = isPublic ? crypto.randomUUID() : null;

    const report = await db.report.create({
      data: {
        name,
        description,
        isPublic,
        publicUntil: isPublic && publicUntil ? new Date(publicUntil) : null,
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
  }
);

export const getReports = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const { organizationId } = req.params;
    const { page = "1", limit = "10" } = req.query;

    const userId = req.user?.id;
    if (!userId) {
      throw new ErrorHandler("User not authenticated", 401);
    }

    await assertAPIPermission(userId, organizationId, "REPORTS", "CREATE");

    const pageNumber = parseInt(page as string, 10);
    const pageSize = parseInt(limit as string, 10);
    const skip = (pageNumber - 1) * pageSize;

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
  }
);

export const getPublicReportById = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
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
        groups: "date",
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
  }
);

export const updateReport = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const { organizationId, reportId } = req.params;
    const userId = req.user?.id;

    if (!userId || !organizationId || !reportId) {
      throw new ErrorHandler(
        "User ID, Organization ID, and Report ID are required",
        400
      );
    }

    const validatedData = updateReportSchema.parse(req.body);

    const member = await assertAPIPermission(
      userId,
      organizationId,
      "REPORTS",
      "CREATE"
    );

    const { name, description, isPublic, publicUntil } = validatedData;

    const existingReport = await db.report.findUnique({
      where: { id: reportId },
    });

    if (!existingReport) {
      throw new ErrorHandler("Report not found", 404);
    }

    let shareSecret: string | null = existingReport.shareSecret;

    if (isPublic && !existingReport.isPublic && !existingReport.shareSecret) {
      shareSecret = crypto.randomUUID();
    }

    const report = await db.report.update({
      where: {
        id: reportId,
        organizationId: organizationId,
      },
      data: {
        name,
        description,
        isPublic,
        publicUntil: isPublic && publicUntil ? new Date(publicUntil) : null,
        shareSecret: isPublic ? shareSecret : null,
      },
    });

    res.status(200).json({
      success: true,
      data: report,
      message: "Report updated successfully",
    });
  }
);

export const deleteReport = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const { organizationId, reportId } = req.params;
    const userId = req.user?.id;

    if (!userId || !organizationId || !reportId) {
      throw new ErrorHandler(
        "User ID, Organization ID, and Report ID are required",
        400
      );
    }

    await assertAPIPermission(userId, organizationId, "REPORTS", "CREATE");

    await db.report.delete({
      where: {
        id: reportId,
        organizationId: organizationId,
      },
    });

    res.status(200).json({
      success: true,
      message: "Report deleted successfully",
    });
  }
);
