import { Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import { db } from "../prismaClient";
import {
  createOrganizationSchema,
  inviteUserSchema,
  switchOrganizationSchema,
  updateMemberRoleSchema,
  updateOrganizationSchema,
} from "../utils";
import { ErrorHandler } from "../utils/errorHandler";
import {
  getOrganization,
  hasPermission,
  isUserActiveMember,
  validateRoleChange,
} from "../helper/organization";
import { getAuthUserData, getUserByEmail } from "../helper/user";
import { emailTemplates, sendMail } from "../helper/mailer";

export const switchOrganization = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { organizationId } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      throw new ErrorHandler("User not authenticated", 401);
    }

    const validatedData = switchOrganizationSchema.safeParse({
      organizationId,
    });

    if (!validatedData.success) {
      const messages = validatedData.error.errors.map((err) => err.message);
      throw new ErrorHandler(messages, 400);
    }

    // Check if user is an active member of the organization
    const membership = await isUserActiveMember(
      userId,
      validatedData.data.organizationId
    );

    if (!membership) {
      throw new ErrorHandler(
        "You are not an active member of this organization",
        403
      );
    }

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
  } catch (error) {
    throw new ErrorHandler(
      error instanceof Error ? error.message : "Internal Server Error",
      error instanceof ErrorHandler ? (error as any).statusCode : 500
    );
  }
};

export const getCurrentOrganization = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { organizationId } = req.params;

    if (!userId) {
      throw new ErrorHandler("User not authenticated", 401);
    }

    if (organizationId) {
      const membership = await db.member.findFirst({
        where: {
          userId,
          organizationId,
          isActive: true,
        },
      });

      if (!membership) {
        throw new ErrorHandler(
          "You are not an active member of this organization",
          403
        );
      }

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
  } catch (error) {
    throw new ErrorHandler(
      error instanceof Error ? error.message : "Internal Server Error",
      error instanceof ErrorHandler ? (error as any).statusCode : 500
    );
  }
};

export const updateOrganization = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { organizationId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      throw new ErrorHandler("User not authenticated", 401);
    }

    const data = req.body;

    const validatedData = updateOrganizationSchema.safeParse(data);

    if (!validatedData.success) {
      const messages = validatedData.error.errors.map((err) => err.message);
      throw new ErrorHandler(messages, 400);
    }

    const membership = await isUserActiveMember(userId, organizationId);

    if (!membership) {
      throw new ErrorHandler(
        "You are not an active member of this organization",
        403
      );
    }

    if (!hasPermission(membership.role, ["OWNER", "ADMIN"])) {
      throw new ErrorHandler(
        "You don't have permission to update this organization",
        403
      );
    }

    const existingOrganization = await getOrganization(organizationId);

    if (!existingOrganization) {
      throw new ErrorHandler("Organization not found", 404);
    }

    const updatedOrganization = await db.organizations.update({
      where: {
        id: organizationId,
      },
      data: {
        name: validatedData.data.name,
        currency: validatedData.data.currency,
        dateFormat: validatedData.data.dateFormat,
        timeFormat: validatedData.data.timeFormat,
        intervalFormat: validatedData.data.intervalFormat,
        numberFormat: validatedData.data.numberFormat,
        billableRates: validatedData.data.billableRates?.toFixed(2),
        employeesCanSeeBillableRates:
          validatedData.data.employeesCanSeeBillableRates,
        updatedAt: new Date(),
      },
    });

    res.status(200).json({
      message: "Organization updated successfully",
      organization: updatedOrganization,
    });
  } catch (error) {
    throw new ErrorHandler(
      error instanceof Error ? error.message : "Internal Server Error",
      error instanceof ErrorHandler ? (error as any).statusCode : 500
    );
  }
};

export const deleteOrganization = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { organizationId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      throw new ErrorHandler("User not authenticated", 401);
    }
    const membership = await isUserActiveMember(userId, organizationId);
    if (!membership) {
      throw new ErrorHandler(
        "You are not an active member of this organization",
        403
      );
    }
    if (!hasPermission(membership.role, ["OWNER"])) {
      throw new ErrorHandler(
        "You don't have permission to delete this organization",
        403
      );
    }
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
            { organization: { personalTeam: "desc" } }, // Prioritize personal teams
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
  } catch (error) {
    throw new ErrorHandler(
      error instanceof Error ? error.message : "Internal Server Error",
      error instanceof ErrorHandler ? (error as any).statusCode : 500
    );
  }
};

export const createOrganization = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      throw new ErrorHandler("User not authenticated", 401);
    }

    const { name } = req.body;

    const validatedData = createOrganizationSchema.safeParse({ name });

    if (!validatedData.success) {
      const messages = validatedData.error.errors.map((err) => err.message);
      throw new ErrorHandler(messages, 400);
    }

    const existingOrganization = await db.organizations.findFirst({
      where: { userId, name: validatedData.data.name },
    });

    if (existingOrganization) {
      throw new ErrorHandler("You already have a team with this name", 400);
    }

    const result = await db.$transaction(async (tx) => {
      // Create the new organization (always non-personal for new organizations)
      const newOrganization = await tx.organizations.create({
        data: {
          userId,
          name: validatedData.data.name,
          personalTeam: false,
          dateFormat: "MM/DD/YYYY",
          currency: "INR",
          employeesCanSeeBillableRates: false,
          billableRates: 0,
          intervalFormat: "12h",
          timeFormat: "12h",
          numberFormat: "1,000.00",
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
  } catch (error) {
    throw new ErrorHandler(
      error instanceof Error ? error.message : "Internal Server Error",
      error instanceof ErrorHandler ? (error as any).statusCode : 500
    );
  }
};

export const inviteNewMember = async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const { organizationId } = req.params;
  const { email, role } = req.body;

  if (!userId) throw new ErrorHandler("User not authenticated", 401);

  const validated = inviteUserSchema.safeParse({ email, role });
  if (!validated.success)
    throw new ErrorHandler(validated.error.errors[0].message, 400);

  const invitee = await getUserByEmail(email);
  if (!invitee)
    throw new ErrorHandler("User with this email does not exist", 404);

  const membership = await isUserActiveMember(userId, organizationId);
  if (!membership || !hasPermission(membership.role, ["OWNER", "ADMIN"])) {
    throw new ErrorHandler("You don't have permission to invite users", 403);
  }

  const [organization, inviter] = await Promise.all([
    db.organizations.findUnique({
      where: { id: organizationId },
      select: { id: true, name: true, personalTeam: true },
    }),
    db.user.findUnique({
      where: { id: userId },
      select: { name: true, email: true, id: true },
    }),
  ]);

  if (!organization || !inviter)
    throw new ErrorHandler("Organization or inviter not found", 404);

  const existingMember = await db.member.findFirst({
    where: {
      user: {
        email,
      },
      organizationId,
    },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
        },
      },
    },
  });

  if (existingMember) {
    throw new ErrorHandler(
      `${
        existingMember.user?.name || email
      } is already a member of this organization`,
      400
    );
  }

  // Check if an invitation already exists for this email and expires or is pending
  const existingInvite = await db.organizationInvitation.findFirst({
    where: {
      email,
      organizationId,
    },
  });

  if (existingInvite) {
    if (
      existingInvite.status === "PENDING" &&
      existingInvite.expiresAt > new Date()
    ) {
      throw new ErrorHandler(
        "A pending invitation already exists for this email address",
        400
      );
    } else if (
      existingInvite.status === "EXPIRED" ||
      existingInvite.expiresAt < new Date()
    ) {
      throw new ErrorHandler(
        "An expired invitation already exists for this email address - please resend it",
        400
      );
    }
  }

  const token = uuidv4();

  const invitation = await db.organizationInvitation.create({
    data: {
      email,
      organizationId,
      invitedBy: userId,
      role: role || "EMPLOYEE",
      token,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7), // 7 days
    },
    select: {
      id: true,
      email: true,
      role: true,
      status: true,
      expiresAt: true,
      token: true,
    },
  });

  const inviteLink = `${process.env.FRONTEND_URL}/team-invite/${invitation.token}`;

  const emailSubject = `Invitation to join ${organization.name}`;

  try {
    await sendMail({
      to: email,
      subject: emailSubject,
      html: emailTemplates.organizationInvitation({
        inviterName: inviter.name,
        organizationName: organization.name,
        inviteLink,
        role: invitation.role,
      }),
    });
  } catch (emailError) {
    // Clean up the invitation if email sending fails
    await db.organizationInvitation.delete({
      where: { id: invitation.id },
    });
    throw new ErrorHandler(
      "Failed to send invitation email. Please try again.",
      500
    );
  }

  res.status(200).json({
    message: "Invitation sent successfully",
    invitation,
  });
};

export const resendInvite = async (req: Request, res: Response) => {
  const { invitationId, organizationId } = req.params;
  const userId = req.user?.id;

  if (!userId) throw new ErrorHandler("User not authenticated", 401);

  if (!invitationId || !organizationId) {
    throw new ErrorHandler(
      "Invitation ID and Organization ID are required",
      400
    );
  }

  const membership = await isUserActiveMember(userId, organizationId);
  if (!membership || !hasPermission(membership.role, ["OWNER", "ADMIN"])) {
    throw new ErrorHandler("You don't have permission to resend invites", 403);
  }

  const invitation = await db.organizationInvitation.findUnique({
    where: { id: invitationId },
    select: {
      id: true,
      email: true,
      role: true,
      status: true,
      expiresAt: true,
      token: true,
      lastReSentAt: true,
      resendCount: true,
    },
  });

  if (!invitation) {
    throw new ErrorHandler("Invitation not found", 404);
  }

  if (invitation.status === "PENDING" && invitation.expiresAt > new Date()) {
    throw new ErrorHandler(
      "This invitation is still pending and has not expired yet",
      400
    );
  }

  const updatedInvitation = await db.organizationInvitation.update({
    where: { id: invitationId },
    data: {
      status: "PENDING",
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7), // 7 days
      token: uuidv4(),
      resendCount: { increment: 1 },
      lastReSentAt: new Date(),
      updatedAt: new Date(),
    },
    select: {
      id: true,
      email: true,
      role: true,
      status: true,
      expiresAt: true,
      token: true,
    },
  });

  const inviteLink = `${process.env.FRONTEND_URL}/team-invite/${updatedInvitation.token}`;

  const emailSubject = `Invitation to join ${organizationId}`;

  try {
    await sendMail({
      to: updatedInvitation.email,
      subject: emailSubject,
      html: emailTemplates.organizationInvitation({
        inviterName: "Your Team",
        organizationName: organizationId,
        inviteLink,
        role: updatedInvitation.role,
      }),
    });
  } catch (emailError) {
    // Revert the invitation status if email sending fails
    await db.organizationInvitation.update({
      where: { id: invitationId },
      data: {
        status: invitation.status,
        expiresAt: invitation.expiresAt,
        token: invitation.token,
        lastReSentAt: invitation.lastReSentAt,
        ...(invitation.resendCount > 0 && {
          resendCount: { decrement: 1 },
        }),
      },
    });
    throw new ErrorHandler(
      "Failed to resend invitation email. Please try again.",
      500
    );
  }
};

export const reinviteInactiveMember = async (req: Request, res: Response) => {
  const { memberId, organizationId } = req.params;
  const userId = req.user?.id;
  if (!userId) throw new ErrorHandler("User not authenticated", 401);

  if (!memberId || !organizationId) {
    throw new ErrorHandler("Member ID and Organization ID are required", 400);
  }

  const membership = await isUserActiveMember(userId, organizationId);
  if (!membership || !hasPermission(membership.role, ["OWNER", "ADMIN"])) {
    throw new ErrorHandler(
      "You don't have permission to reinvite members",
      403
    );
  }

  const member = await db.member.findUnique({
    where: { id: memberId },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
        },
      },
    },
  });

  const organization = await db.organizations.findUnique({
    where: { id: organizationId },
    select: { id: true, name: true, personalTeam: true },
  });

  if (!organization) {
    throw new ErrorHandler("Organization not found", 404);
  }

  if (!member) {
    throw new ErrorHandler("Member not found", 404);
  }

  if (member.isActive) {
    throw new ErrorHandler(
      "This member is already active in the organization",
      400
    );
  }

  if (member.organizationId !== organizationId) {
    throw new ErrorHandler(
      "This member does not belong to the specified organization",
      400
    );
  }

  const existingInvite = await db.organizationInvitation.findFirst({
    where: {
      email: member.user.email,
      organizationId,
    },
  });

  if (existingInvite) {
    if (
      existingInvite.status === "PENDING" &&
      existingInvite.expiresAt > new Date()
    ) {
      throw new ErrorHandler(
        "A pending invitation already exists for this member",
        400
      );
    }
  }

  // Create a new invitation or update the existing one
  const invitation = await db.organizationInvitation.upsert({
    where: {
      email_organizationId: {
        email: member.user.email,
        organizationId,
      },
    },
    update: {
      role: "EMPLOYEE",
      status: "PENDING",
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7), // 7 days
      token: uuidv4(),
      resendCount: { increment: 1 },
      lastReSentAt: new Date(),
      updatedAt: new Date(),
    },
    create: {
      email: member.user.email,
      organizationId,
      invitedBy: userId,
      role: "EMPLOYEE",
      token: uuidv4(),
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7), // 7 days
    },
    select: {
      id: true,
      email: true,
      role: true,
      status: true,
      expiresAt: true,
      token: true,
    },
  });

  const inviteLink = `${process.env.FRONTEND_URL}/team-invite/${invitation.token}`;

  const emailSubject = `Invitation to rejoin ${organizationId}`;

  try {
    await sendMail({
      to: member.user.email,
      subject: emailSubject,
      html: emailTemplates.organizationInvitation({
        inviterName: organization.name,
        organizationName: organization?.name,
        inviteLink,
        role: invitation.role,
      }),
    });
  } catch (emailError) {
    if (existingInvite) {
      // Revert the updates to existing invitation
      await db.organizationInvitation.update({
        where: { id: existingInvite.id },
        data: {
          status: existingInvite.status,
          expiresAt: existingInvite.expiresAt,
          token: existingInvite.token,
          resendCount:
            existingInvite.resendCount > 0 ? { decrement: 1 } : undefined,
          lastReSentAt: existingInvite.lastReSentAt,
        },
      });
    } else {
      await db.organizationInvitation.delete({
        where: { id: invitation.id },
      });
    }

    throw new ErrorHandler(
      "Failed to send reinvitation email. Please try again.",
      500
    );
  }

  res.status(200).json({
    message: "Reinvitation sent successfully",
    invitation,
  });
};

export const getOrganizationMembers = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
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

    const membership = await isUserActiveMember(userId, organizationId);
    if (!membership) {
      throw new ErrorHandler(
        "You are not an active member of this organization",
        403
      );
    }

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
      skip,
      take: pageSize,
    });

    res.status(200).json({
      message: "Organization members retrieved successfully",
      members,
      pagination: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    throw new ErrorHandler(
      error instanceof Error ? error.message : "Internal Server Error",
      error instanceof ErrorHandler ? (error as any).statusCode : 500
    );
  }
};

export const getOrganizationInvitations = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
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

    const membership = await isUserActiveMember(userId, organizationId);
    if (!membership) {
      throw new ErrorHandler(
        "You are not an active member of this organization",
        403
      );
    }

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
  } catch (error) {
    throw new ErrorHandler(
      error instanceof Error ? error.message : "Internal Server Error",
      error instanceof ErrorHandler ? (error as any).statusCode : 500
    );
  }
};

export const acceptInvitation = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { token } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      throw new ErrorHandler("User not authenticated", 401);
    }

    if (!token) {
      throw new ErrorHandler("Invitation token is required", 400);
    }

    const invitation = await db.organizationInvitation.findFirst({
      where: {
        token,
        status: "PENDING",
      },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            personalTeam: true,
          },
        },
        inviter: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!invitation) {
      throw new ErrorHandler("Invalid or expired invitation token", 404);
    }

    if (invitation.expiresAt < new Date()) {
      await db.organizationInvitation.update({
        where: { id: invitation.id },
        data: { status: "EXPIRED" },
      });
      throw new ErrorHandler("Invitation has expired", 400);
    }

    const authenticatedUser = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
      },
    });

    if (!authenticatedUser) {
      throw new ErrorHandler("User not found", 404);
    }

    if (
      authenticatedUser.email.toLowerCase() !== invitation.email.toLowerCase()
    ) {
      throw new ErrorHandler(
        "This invitation was sent to a different email address. Please log in with the correct account.",
        403
      );
    }

    const existingMembership = await db.member.findFirst({
      where: {
        userId,
        organizationId: invitation.organizationId,
      },
    });

    if (existingMembership) {
      if (existingMembership.isActive) {
        throw new ErrorHandler(
          "You are already a member of this organization",
          400
        );
      } else {
        // Reactivate the membership if it was previously deactivated
        await db.member.update({
          where: { id: existingMembership.id },
          data: {
            isActive: true,
            role: invitation.role,
            updatedAt: new Date(),
          },
        });
      }
    } else {
      // Create new membership
      await db.member.create({
        data: {
          userId,
          organizationId: invitation.organizationId,
          role: invitation.role,
          isActive: true,
        },
      });
    }

    await db.organizationInvitation.delete({
      where: { id: invitation.id },
    });

    res.status(200).json({
      message: "Inviation accepted successfully",
      organization: invitation.organization,
      inviter: invitation.inviter,
    });
  } catch (error) {
    throw new ErrorHandler(
      error instanceof Error ? error.message : "Internal Server Error",
      error instanceof ErrorHandler ? (error as any).statusCode : 500
    );
  }
};

export const updateMember = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { organizationId, memberId } = req.params;
    const userId = req.user?.id;
    const { role, billableRate } = req.body;

    // Input validation
    if (!userId) {
      throw new ErrorHandler("User not authenticated", 401);
    }

    if (!organizationId || !memberId) {
      throw new ErrorHandler("Organization ID and Member ID are required", 400);
    }

    // Schema validation
    const validatedData = updateMemberRoleSchema.safeParse({
      role,
      billableRate: billableRate || 0,
    });

    if (!validatedData.success) {
      const messages = validatedData.error.errors[0].message;
      throw new ErrorHandler(messages, 400);
    }

    // Get user membership and member data in parallel
    const [membership, member] = await Promise.all([
      isUserActiveMember(userId, organizationId),
      db.member.findUnique({
        where: { id: memberId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      }),
    ]);

    // Permission check
    if (!membership || !hasPermission(membership.role, ["OWNER", "ADMIN"])) {
      throw new ErrorHandler(
        "You don't have permission to update members",
        403
      );
    }

    // Member existence and validation
    if (!member || member.organizationId !== organizationId) {
      throw new ErrorHandler("Member not found in this organization", 404);
    }

    if (!member.isActive) {
      throw new ErrorHandler("Cannot update inactive member", 400);
    }

    // Role-specific business logic validation
    if (role) {
      await validateRoleChange(member, role, userId, organizationId);
    }

    // Build update data conditionally
    const updateData: any = {
      updatedAt: new Date(),
    };

    if (role !== undefined) {
      updateData.role = role;
    }

    if (billableRate !== undefined) {
      updateData.billableRate = Number(billableRate);
    }

    // Update member
    const updatedMember = await db.member.update({
      where: { id: memberId },
      data: updateData,
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

    res.status(200).json({
      message: "Member updated successfully",
      member: updatedMember,
    });
  } catch (error) {
    throw new ErrorHandler(
      error instanceof Error ? error.message : "Internal Server Error",
      error instanceof ErrorHandler ? (error as any).statusCode : 500
    );
  }
};

export const deactiveMember = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { organizationId, memberId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      throw new ErrorHandler("User not authenticated", 401);
    }

    if (!organizationId || !memberId) {
      throw new ErrorHandler("Organization ID and Member ID are required", 400);
    }

    const [membership, member] = await Promise.all([
      isUserActiveMember(userId, organizationId),
      db.member.findUnique({
        where: { id: memberId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      }),
    ]);

    if (!membership || !hasPermission(membership.role, ["OWNER", "ADMIN"])) {
      throw new ErrorHandler(
        "You don't have permission to deactivate members",
        403
      );
    }

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
  } catch (error) {
    throw new ErrorHandler(
      error instanceof Error ? error.message : "Internal Server Error",
      error instanceof ErrorHandler ? (error as any).statusCode : 500
    );
  }
};

export const deleteMember = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { organizationId, memberId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      throw new ErrorHandler("User not authenticated", 401);
    }

    if (!organizationId || !memberId)
      throw new ErrorHandler("Organization ID and Member ID are required", 400);

    const [membership, member] = await Promise.all([
      isUserActiveMember(userId, organizationId),
      db.member.findUnique({
        where: { id: memberId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      }),
    ]);

    if (!membership || !hasPermission(membership.role, ["OWNER", "ADMIN"])) {
      throw new ErrorHandler(
        "You don't have permission to delete members",
        403
      );
    }

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
    });

    const currentUser = await getAuthUserData(userId);

    res.status(200).json({
      message: `Member ${
        member.user.name || member.user.email
      } has been permanently removed from the organization`,
      user: currentUser,
    });
  } catch (error) {
    throw new ErrorHandler(
      error instanceof Error ? error.message : "Internal Server Error",
      error instanceof ErrorHandler ? (error as any).statusCode : 500
    );
  }
};

export const deleteInvitation = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
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

    const membership = await isUserActiveMember(userId, organizationId);
    if (!membership || !hasPermission(membership.role, ["OWNER", "ADMIN"])) {
      throw new ErrorHandler(
        "You don't have permission to delete invitations",
        403
      );
    }

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
  } catch (error) {
    throw new ErrorHandler(
      error instanceof Error ? error.message : "Internal Server Error",
      error instanceof ErrorHandler ? (error as any).statusCode : 500
    );
  }
};
