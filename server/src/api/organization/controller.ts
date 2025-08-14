import { Request, Response } from "express";
import { db } from "../../prismaClient";
import {
  createOrganizationSchema,
  switchOrganizationSchema,
  updateOrganizationSchema,
} from "../../schemas/organization";
import { ErrorHandler } from "../../utils/errorHandler";
import {
  assertAPIPermission,
  getOrganization,
  hasPermission,
} from "../../helper/organization";
import { getAuthUserData } from "../../helper/user";
import { updateBillableRate } from "../../helper/billableRate";
import { catchAsync } from "../../utils/catchAsync";

export const switchOrganization = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const { organizationId } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      throw new ErrorHandler("User not authenticated", 401);
    }

    const validatedData = switchOrganizationSchema.parse({
      organizationId,
    });

    await assertAPIPermission(userId, organizationId, "ORGANIZATION", "VIEW");

    // Update user's current team
    const updatedUser = await db.user.update({
      where: { id: userId },
      data: { currentTeamId: organizationId },
    });

    const currentUser = await getAuthUserData(userId);

    res.status(200).json({
      message: "Organization switched successfully",
      user: currentUser,
    });
  }
);

export const getCurrentOrganization = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const userId = req.user?.id;
    const { organizationId } = req.params;

    if (!userId) {
      throw new ErrorHandler("User not authenticated", 401);
    }

    if (!organizationId) throw new ErrorHandler("OrgId is required", 403);

    await assertAPIPermission(userId, organizationId, "ORGANIZATION", "VIEW");

    const organization = await db.organizations.findUnique({
      where: { id: organizationId },
    });

    if (!organization) {
      throw new ErrorHandler("Organization not found", 404);
    }

    res.status(200).json({
      message: "Organization data retrieved successfully",
      organization,
    });
  }
);

export const updateOrganization = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const { organizationId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      throw new ErrorHandler("User not authenticated", 401);
    }

    if (!organizationId) {
      throw new ErrorHandler("Organization ID is required", 400);
    }

    const data = req.body;

    const validatedData = updateOrganizationSchema.parse(data);

    await assertAPIPermission(userId, organizationId, "ORGANIZATION", "UPDATE");

    const existingOrganization = await getOrganization(organizationId);

    if (!existingOrganization) {
      throw new ErrorHandler("Organization not found", 404);
    }

    const updatedOrganization = await db.organizations.update({
      where: {
        id: organizationId,
      },
      data: {
        name: validatedData.name,
        currency: validatedData.currency,
        dateFormat: validatedData.dateFormat,
        timeFormat: validatedData.timeFormat,
        intervalFormat: validatedData.intervalFormat,
        numberFormat: validatedData.numberFormat,
        employeesCanSeeBillableRates:
          validatedData.employeesCanSeeBillableRates,
        updatedAt: new Date(),
      },
    });

    if (
      validatedData.billableRates !== undefined &&
      validatedData.billableRates !== null
    ) {
      await updateBillableRate({
        source: "organization",
        sourceId: organizationId,
        newRate: validatedData.billableRates,
        applyToExisting: true,
        organizationId,
      });
    }

    res.status(200).json({
      message: "Organization updated successfully",
      organization: await getOrganization(organizationId),
    });
  }
);

export const deleteOrganization = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const { organizationId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      throw new ErrorHandler("User not authenticated", 401);
    }

    if (!organizationId) {
      throw new ErrorHandler("Organization ID is required", 400);
    }

    await assertAPIPermission(userId, organizationId, "ORGANIZATION", "DELETE");

    const organization = await db.organizations.findUnique({
      where: { id: organizationId },
    });
    if (!organization) {
      throw new ErrorHandler("Organization not found", 404);
    }

    if (organization.personalTeam) {
      throw new ErrorHandler(
        "You cannot delete a personal team organization",
        403
      );
    }

    const usersWithAlternatives = await db.user.findMany({
      where: {
        currentTeamId: organizationId,
      },
      select: {
        id: true,
        members: {
          where: {
            organizationId: { not: organizationId },
            isActive: true,
          },
          include: {
            organization: {
              select: {
                id: true,
                personalTeam: true,
              },
            },
          },
          orderBy: [
            { organization: { personalTeam: "desc" } },
            { createdAt: "asc" },
          ],
          take: 1,
        },
      },
    });

    await db.$transaction(async (tx) => {
      for (const user of usersWithAlternatives) {
        const alternativeOrganizationId =
          user.members[0]?.organization.id || null;

        await tx.user.update({
          where: { id: user.id },
          data: { currentTeamId: alternativeOrganizationId },
        });
      }

      // Finally, delete the organization
      await tx.organizations.delete({
        where: { id: organizationId },
      });
    });

    const currentUser = await getAuthUserData(userId);

    res.status(200).json({
      message: "Organization deleted successfully",
      user: currentUser,
    });
  }
);

export const createOrganization = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const userId = req.user?.id;

    if (!userId) {
      throw new ErrorHandler("User not authenticated", 401);
    }

    const { name } = req.body;

    const validatedData = createOrganizationSchema.parse({ name });

    const existingOrganization = await db.organizations.findFirst({
      where: { userId, name: validatedData.name },
    });

    if (existingOrganization) {
      throw new ErrorHandler("You already have a team with this name", 400);
    }

    const result = await db.$transaction(async (tx) => {
      // Create the new organization (always non-personal for new organizations)
      const newOrganization = await tx.organizations.create({
        data: {
          userId,
          name: validatedData.name,
          personalTeam: false,
          dateFormat: "MM/DD/YYYY",
          currency: "INR",
          employeesCanSeeBillableRates: false,
          billableRates: 0,
          intervalFormat: "12h",
          timeFormat: "12h",
          numberFormat: "1,00,000.00",
        },
      });

      // Add the user as OWNER member of the new organization
      await tx.member.create({
        data: {
          userId,
          organizationId: newOrganization.id,
          role: "OWNER",
          isActive: true,
        },
      });

      // Get current user to check if they need a default currentTeamId
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { currentTeamId: true },
      });

      // If user has no current team, set this as their current team
      if (!user?.currentTeamId) {
        await tx.user.update({
          where: { id: userId },
          data: { currentTeamId: newOrganization.id },
        });
      }

      return newOrganization;
    });

    const user = await getAuthUserData(userId);
    res.status(201).json({
      message: "Organization created successfully",
      organization: result,
      user,
    });
  }
);

export const getOrganizationMembers = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const { organizationId } = req.params;
    const userId = req.user?.id;

    if (!organizationId) {
      throw new ErrorHandler("Organization ID is required", 400);
    }

    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 10;
    const skip = (page - 1) * pageSize;
    const all = req.query.all === "true";

    if (!userId) {
      throw new ErrorHandler("User not authenticated", 401);
    }

    const membership = await assertAPIPermission(
      userId,
      organizationId,
      "ORGANIZATION",
      "VIEW_MEMBERS"
    );

    const hasOwnerAdmin = hasPermission(membership.role, ["OWNER", "ADMIN"]);

    const whereCondition = {
      organizationId,
      ...(hasOwnerAdmin ? {} : { isActive: true }),
    };

    const total = await db.member.count({
      where: whereCondition,
    });

    const members = await db.member.findMany({
      where: whereCondition,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: [{ isActive: "desc" }, { createdAt: "asc" }],
      ...(all ? {} : { skip, take: pageSize }),
    });

    res.status(200).json({
      message: "Organization members retrieved successfully",
      members,
      ...(all
        ? {}
        : {
            pagination: {
              total,
              page,
              pageSize,
              totalPages: Math.ceil(total / pageSize),
            },
          }),
    });
  }
);

export const getOrganizationInvitations = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const { organizationId } = req.params;
    const userId = req.user?.id;

    if (!organizationId) {
      throw new ErrorHandler("Organization ID is required", 400);
    }

    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 10;
    const skip = (page - 1) * pageSize;

    if (!userId) {
      throw new ErrorHandler("User not authenticated", 401);
    }

    await assertAPIPermission(
      userId,
      organizationId,
      "ORGANIZATION",
      "MANAGE_MEMBERS"
    );

    await db.organizationInvitation.updateMany({
      where: {
        organizationId,
        status: "PENDING",
        expiresAt: {
          lt: new Date(),
        },
      },
      data: {
        status: "EXPIRED",
        updatedAt: new Date(),
      },
    });

    const total = await db.organizationInvitation.count({
      where: {
        organizationId,
        status: { in: ["PENDING", "EXPIRED"] },
      },
    });

    const invitations = await db.organizationInvitation.findMany({
      where: {
        organizationId,
        status: { in: ["PENDING", "EXPIRED"] },
      },
      orderBy: [{ createdAt: "desc" }],
      skip,
      take: pageSize,
      select: {
        id: true,
        email: true,
        role: true,
        status: true,
        expiresAt: true,
      },
    });

    res.status(200).json({
      message: "Organization invitations retrieved successfully",
      invitations,
      pagination: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  }
);

export const deactiveMember = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const { organizationId, memberId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      throw new ErrorHandler("User not authenticated", 401);
    }

    if (!organizationId || !memberId) {
      throw new ErrorHandler("Organization ID and Member ID are required", 400);
    }

    // Use helper function for permission check
    await assertAPIPermission(userId, organizationId, "MEMBER", "DEACTIVATE");

    const member = await db.member.findUnique({
      where: { id: memberId },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    if (!member || member.organizationId !== organizationId) {
      throw new ErrorHandler("Member not found in this organization", 404);
    }

    if (!member.isActive) {
      throw new ErrorHandler("Member is already deactivated", 400);
    }

    if (member.role === "OWNER") {
      throw new ErrorHandler(
        "You cannot deactivate the OWNER of the organization.",
        403
      );
    }

    if (member.userId === userId) {
      throw new ErrorHandler(
        "You cannot deactivate yourself. Please ask another admin to deactivate you.",
        403
      );
    }

    if (member.userId) {
      const userCurrentTeam = await db.user.findFirst({
        where: { id: member.userId },
        select: {
          currentTeamId: true,
        },
      });

      if (userCurrentTeam?.currentTeamId === organizationId) {
        const alternativeOrganization = await db.member.findFirst({
          where: {
            userId: member.userId,
            isActive: true,
            organizationId: { not: organizationId },
          },
          include: {
            organization: {
              select: {
                id: true,
                personalTeam: true,
              },
            },
          },
          orderBy: [
            { organization: { personalTeam: "desc" } },
            { createdAt: "asc" },
          ],
        });

        if (alternativeOrganization) {
          await db.user.update({
            where: { id: member.userId },
            data: { currentTeamId: alternativeOrganization.organization.id },
          });
        } else {
          await db.user.update({
            where: { id: member.userId },
            data: { currentTeamId: null },
          });
        }
      }
    }

    const updatedMember = await db.member.update({
      where: { id: memberId },
      data: {
        isActive: false,
        role: "PLACEHOLDER",
        updatedAt: new Date(),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    const currentUser = await getAuthUserData(userId);

    res.status(200).json({
      message: "Member deactivated successfully",
      member: updatedMember,
      user: currentUser,
    });
  }
);

export const deleteMember = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const { organizationId, memberId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      throw new ErrorHandler("User not authenticated", 401);
    }

    if (!organizationId || !memberId)
      throw new ErrorHandler("Organization ID and Member ID are required", 400);

    await assertAPIPermission(userId, organizationId, "MEMBER", "DELETE");

    const member = await db.member.findUnique({
      where: { id: memberId },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    if (!member || member.organizationId !== organizationId) {
      throw new ErrorHandler("Member not found in this organization", 404);
    }

    if (member.role === "OWNER") {
      throw new ErrorHandler(
        "You cannot delete the OWNER of the organization. Transfer ownership first.",
        403
      );
    }

    if (member.userId === userId) {
      throw new ErrorHandler(
        "You cannot delete yourself. Please ask another admin to remove you.",
        403
      );
    }

    if (member.userId) {
      const userCurrentTeam = await db.user.findFirst({
        where: { id: member.userId },
        select: {
          currentTeamId: true,
        },
      });

      if (userCurrentTeam?.currentTeamId === organizationId) {
        const alternativeOrganization = await db.member.findFirst({
          where: {
            userId: member.userId,
            isActive: true,
            organizationId: { not: organizationId },
          },
          include: {
            organization: {
              select: {
                id: true,
                personalTeam: true,
              },
            },
          },
          orderBy: [
            {
              organization: { personalTeam: "desc" },
            },
            { createdAt: "asc" },
          ],
        });

        if (alternativeOrganization) {
          await db.user.update({
            where: { id: member.userId },
            data: { currentTeamId: alternativeOrganization.organization.id },
          });
        } else {
          await db.user.update({
            where: { id: member.userId },
            data: { currentTeamId: null },
          });
        }
      }
    }

    await db.$transaction(async (tx) => {
      //in future delete related data if needed like project tasks , timeentry

      await tx.member.delete({
        where: { id: memberId },
      });

      await tx.organizationInvitation.deleteMany({
        where: {
          email: member.user.email,
          organizationId,
        },
      });

      await tx.timeEntry.deleteMany({
        where: {
          userId: member.userId,
          organizationId,
        },
      });

      await db.projectMember.deleteMany({
        where: {
          memberId: memberId,
        },
      });
    });

    const currentUser = await getAuthUserData(userId);

    res.status(200).json({
      message: `Member ${
        member.user.name || member.user.email
      } has been permanently removed from the organization`,
      user: currentUser,
    });
  }
);

export const deleteInvitation = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const userId = req.user?.id;
    const { organizationId, invitationId } = req.params;

    if (!userId) {
      throw new ErrorHandler("User not authenticated", 401);
    }

    if (!organizationId || !invitationId) {
      throw new ErrorHandler(
        "Organization ID and Invitation ID are required",
        400
      );
    }

    await assertAPIPermission(
      userId,
      organizationId,
      "ORGANIZATION",
      "MANAGE_MEMBERS"
    );

    const invitation = await db.organizationInvitation.findUnique({
      where: { id: invitationId },
    });

    if (!invitation || invitation.organizationId !== organizationId) {
      throw new ErrorHandler("Invitation not found in this organization", 404);
    }

    await db.organizationInvitation.delete({
      where: { id: invitationId },
    });

    res.status(200).json({
      message: "Invitation deleted successfully",
    });
  }
);
