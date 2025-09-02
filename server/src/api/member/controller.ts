import { config } from "../../config/config";
import { updateBillableRate } from "../../helper/billableRate";
import { emailTemplates, sendMail } from "../../helper/mailer";
import {
  assertAPIPermission,
  hasPermission,
  isUserActiveMember,
  sendInvitationEmail,
  validateRoleChange,
} from "../../helper/organization";
import { getUserByEmail } from "../../helper/user";
import { db } from "../../prismaClient";
import {
  inviteUserSchema,
  updateMemberRoleSchema,
} from "../../schemas/organization";
import { catchAsync } from "../../utils/catchAsync";
import { ErrorHandler } from "../../utils/errorHandler";
import { Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";

export const inviteNewMember = catchAsync(
  async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const { organizationId } = req.params;
    const { email, role } = req.body;

    if (!userId) throw new ErrorHandler("User not authenticated", 401);

    const validated = inviteUserSchema.parse({ email, role });

    await assertAPIPermission(
      userId,
      organizationId,
      "ORGANIZATION",
      "INVITE_MEMBERS"
    );

    const invitee = await getUserByEmail(email);
    if (!invitee)
      throw new ErrorHandler("User with this email does not exist", 404);

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

    const inviteLink = `${config.FRONTEND_URL}/team-invite/${invitation.token}`;

    try {
      await sendInvitationEmail({
        email,
        inviterName: inviter.name,
        organizationName: organization.name,
        inviteLink,
        role: invitation.role,
      });
    } catch (emailError) {
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
  }
);

export const resendInvite = catchAsync(async (req: Request, res: Response) => {
  const { invitationId, organizationId } = req.params;
  const userId = req.user?.id;

  if (!userId) throw new ErrorHandler("User not authenticated", 401);

  if (!invitationId || !organizationId) {
    throw new ErrorHandler(
      "Invitation ID and Organization ID are required",
      400
    );
  }

  await assertAPIPermission(
    userId,
    organizationId,
    "ORGANIZATION",
    "INVITE_MEMBERS"
  );

  const organization = await db.organizations.findUnique({
    where: { id: organizationId },
    select: { id: true, name: true, personalTeam: true },
  });

  if (!organization) {
    throw new ErrorHandler("Organization not found", 404);
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

  const inviteLink = `${config.FRONTEND_URL}/team-invite/${updatedInvitation.token}`;

  try {
    await sendInvitationEmail({
      email: updatedInvitation.email,
      inviterName: organization.name,
      organizationName: organization.name,
      inviteLink,
      role: updatedInvitation.role,
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

  res.status(200).json({
    message: "Invitation resent successfully",
    invitation: updatedInvitation,
  });
});

export const reinviteInactiveMember = catchAsync(
  async (req: Request, res: Response) => {
    const { memberId, organizationId } = req.params;
    const userId = req.user?.id;
    if (!userId) throw new ErrorHandler("User not authenticated", 401);

    if (!memberId || !organizationId) {
      throw new ErrorHandler("Member ID and Organization ID are required", 400);
    }

    await assertAPIPermission(
      userId,
      organizationId,
      "ORGANIZATION",
      "INVITE_MEMBERS"
    );

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

    const inviteLink = `${config.FRONTEND_URL}/team-invite/${invitation.token}`;

    try {
      await sendInvitationEmail({
        email: member.user.email,
        inviterName: organization.name,
        organizationName: organization.name,
        inviteLink,
        role: invitation.role,
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
  }
);

export const acceptInvitation = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
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
  }
);

export const updateMember = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
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
    const validatedData = updateMemberRoleSchema.parse({
      role,
      billableRate: billableRate,
    });

    await assertAPIPermission(userId, organizationId, "MEMBER", "UPDATE");

    const member = await db.member.findUnique({
      where: { id: memberId },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });

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

    if (billableRate !== undefined) {
      console.log(billableRate, "billableRate");
      await updateBillableRate({
        source: "organization_member",
        sourceId: memberId,
        newRate: billableRate === null ? null : Number(billableRate),
        applyToExisting: true,
        organizationId,
        userId: member.user.id,
      });
    }

    const getMember = await db.member.findUnique({
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
    });

    res.status(200).json({
      message: "Member updated successfully",
      member: getMember,
    });
  }
);

export const transferOwnership = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const { organizationId, newOwnerId } = req.params;
    const userId = req.user?.id;

    if (!userId) throw new ErrorHandler("User not authenticated", 401);

    if (!organizationId || !newOwnerId) {
      throw new ErrorHandler(
        "Organization ID and New Owner ID are required",
        400
      );
    }

    await assertAPIPermission(userId, organizationId, "MEMBER", "CHANGE_ROLE");

    const organization = await db.organizations.findUnique({
      where: { id: organizationId },
      select: { personalTeam: true },
    });

    if (organization?.personalTeam) {
      throw new ErrorHandler(
        "Ownership transfer is not allowed for personal teams.",
        400
      );
    }

    const [currentOwner, newOwner] = await Promise.all([
      db.member.findFirst({
        where: { userId, organizationId },
        include: { user: { select: { id: true, name: true, email: true } } },
      }),
      db.member.findFirst({
        where: { userId: newOwnerId, organizationId },
        include: { user: { select: { id: true, name: true, email: true } } },
      }),
    ]);

    if (!newOwner) {
      throw new ErrorHandler(
        "The specified user is not a member of this organization",
        404
      );
    }

    if (!newOwner.isActive) {
      throw new ErrorHandler(
        "The specified user is not an active member of this organization",
        400
      );
    }

    // Ensure only one OWNER per organization
    await db.$transaction(async (tx) => {
      // Demote all current OWNERs to ADMIN
      await tx.member.updateMany({
        where: {
          organizationId,
          role: "OWNER",
        },
        data: {
          role: "ADMIN",
        },
      });

      // Promote the new owner
      await tx.member.update({
        where: {
          userId_organizationId: {
            organizationId,
            userId: newOwnerId,
          },
        },
        data: {
          role: "OWNER",
        },
      });

      await tx.organizations.update({
        where: { id: organizationId },
        data: { userId: newOwnerId },
      });
    });

    res.status(200).json({
      message: "Ownership transferred successfully",
      previousOwner: {
        id: currentOwner?.user.id,
        name: currentOwner?.user.name,
        email: currentOwner?.user.email,
        role: "ADMIN",
      },
      newOwner: {
        id: newOwner.user.id,
        name: newOwner.user.name,
        email: newOwner.user.email,
        role: "OWNER",
      },
    });
  }
);
