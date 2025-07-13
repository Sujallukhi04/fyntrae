import { Role } from "@prisma/client";
import { db } from "../prismaClient";
import { ErrorHandler } from "../utils/errorHandler";
import { emailTemplates, sendMail } from "./mailer";

export const hasPermission = (
  userRole: Role,
  requiredRole: Role[]
): boolean => {
  const roleHierarchy = {
    OWNER: 5,
    ADMIN: 4,
    MANAGER: 3,
    EMPLOYEE: 2,
    PLACEHOLDER: 1,
  };

  return requiredRole.some(
    (role) => roleHierarchy[userRole] >= roleHierarchy[role]
  );
};

export const getUserRole = async (
  userId: string,
  organizationId: string
): Promise<Role | null> => {
  const member = await db.member.findFirst({
    where: { userId, organizationId },
    select: { role: true },
  });
  return member?.role || null;
};

export const isUserActiveMember = async (
  userId: string,
  organizationId: string
) => {
  const member = await db.member.findFirst({
    where: { userId, organizationId, isActive: true },
  });
  return member;
};

export const validateRoleChange = async (
  member: any,
  newRole: string,
  userId: string,
  organizationId: string
): Promise<void> => {
  // Check if trying to create multiple owners
  if (member.role !== "OWNER" && newRole === "OWNER") {
    const existingOwner = await db.member.findFirst({
      where: {
        organizationId,
        role: "OWNER",
        isActive: true,
        id: { not: member.id },
      },
    });

    if (existingOwner) {
      throw new ErrorHandler(
        "There can only be one OWNER in an organization. Please transfer ownership instead.",
        400
      );
    }
  }

  // Prevent changing OWNER role through regular update
  if (member.role === "OWNER" && newRole !== "OWNER") {
    // Check if it's the owner trying to change their own role
    if (member.userId === userId) {
      throw new ErrorHandler(
        "You cannot change your own OWNER role. Please transfer ownership to another member first.",
        403
      );
    }

    // Check if it's someone else trying to change owner role
    throw new ErrorHandler(
      "Cannot change OWNER role through this API. Use transfer ownership API instead.",
      403
    );
  }

  // Check personal team restrictions
  if (member.role === "OWNER" && newRole !== "OWNER") {
    const organization = await db.organizations.findUnique({
      where: { id: organizationId },
      select: { personalTeam: true },
    });

    if (organization?.personalTeam) {
      throw new ErrorHandler(
        "You cannot change ownership of a personal team.",
        403
      );
    }
  }
};

export const getOrganization = async (organizationId: string) => {
  return await db.organizations.findUnique({
    where: { id: organizationId },
  });
};

export const assertActivePermissionedMember = async (
  userId: string | undefined,
  organizationId: string,
  allowedRoles: Role[]
) => {
  if (!userId) {
    throw new ErrorHandler("User not authenticated", 401);
  }

  if (!organizationId) {
    throw new ErrorHandler("Organization ID is required", 400);
  }

  const membership = await isUserActiveMember(userId, organizationId);

  if (!membership || !hasPermission(membership.role, allowedRoles)) {
    throw new ErrorHandler("You don't have permission for this action", 403);
  }

  return membership;
};

export const sendInvitationEmail = async ({
  email,
  inviterName,
  organizationName,
  inviteLink,
  role,
}: {
  email: string;
  inviterName: string;
  organizationName: string;
  inviteLink: string;
  role: string;
}) => {
  await sendMail({
    to: email,
    subject: `Invitation to join ${organizationName}`,
    html: emailTemplates.organizationInvitation({
      inviterName,
      organizationName,
      inviteLink,
      role,
    }),
  });
};
