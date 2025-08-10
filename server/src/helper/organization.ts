import { Role } from "@prisma/client";
import { db } from "../prismaClient";
import { ErrorHandler } from "../utils/errorHandler";
import { emailTemplates, sendMail } from "./mailer";

const ROLE_HIERARCHY = {
  OWNER: 5,
  ADMIN: 4,
  MANAGER: 3,
  EMPLOYEE: 2,
  PLACEHOLDER: 1,
} as const;

export const API_PERMISSIONS = {
  PROJECT: {
    CREATE: [Role.OWNER, Role.ADMIN, Role.MANAGER],
    VIEW: [Role.OWNER, Role.ADMIN, Role.MANAGER, Role.EMPLOYEE],
    UPDATE: [Role.OWNER, Role.ADMIN, Role.MANAGER],
    ARCHIVE: [Role.OWNER, Role.ADMIN, Role.MANAGER],
    DELETE: [Role.OWNER, Role.ADMIN],
    MANAGE_MEMBERS: [Role.OWNER, Role.ADMIN, Role.MANAGER],
    VIEW_MEMBERS: [Role.OWNER, Role.ADMIN, Role.MANAGER],
    ADD_TASKS: [Role.OWNER, Role.ADMIN, Role.MANAGER],
    VIEW_TASKS: [Role.OWNER, Role.ADMIN, Role.MANAGER, Role.EMPLOYEE],
  },

  CLIENT: {
    CREATE: [Role.OWNER, Role.ADMIN],
    VIEW: [Role.OWNER, Role.ADMIN],
    UPDATE: [Role.OWNER, Role.ADMIN],
    ARCHIVE: [Role.OWNER, Role.ADMIN],
    DELETE: [Role.OWNER, Role.ADMIN],
  },

  ORGANIZATION: {
    CREATE: [Role.OWNER, Role.ADMIN, Role.MANAGER, Role.EMPLOYEE],
    VIEW: [Role.OWNER, Role.ADMIN, Role.MANAGER, Role.EMPLOYEE],
    UPDATE: [Role.OWNER, Role.ADMIN],
    DELETE: [Role.OWNER, Role.ADMIN],
    MANAGE_MEMBERS: [Role.OWNER, Role.ADMIN],
    INVITE_MEMBERS: [Role.OWNER, Role.ADMIN],
    VIEW_MEMBERS: [Role.OWNER, Role.ADMIN, Role.MANAGER],
  },

  MEMBER: {
    VIEW: [Role.OWNER, Role.ADMIN, Role.MANAGER, Role.EMPLOYEE],
    UPDATE: [Role.OWNER, Role.ADMIN],
    DEACTIVATE: [Role.OWNER, Role.ADMIN],
    DELETE: [Role.OWNER, Role.ADMIN],
    CHANGE_ROLE: [Role.OWNER, Role.ADMIN],
  },

  TIME: {
    CREATE: [Role.OWNER, Role.ADMIN, Role.MANAGER, Role.EMPLOYEE],
    UPDATE: [Role.OWNER, Role.ADMIN, Role.MANAGER],
  },

  TAG: {
    CREATE: [Role.OWNER, Role.ADMIN, Role.MANAGER],
    VIEW: [Role.OWNER, Role.ADMIN, Role.MANAGER, Role.EMPLOYEE],
  },
  TIME_SUMMARY: {
    VIEW: [Role.OWNER, Role.ADMIN, Role.MANAGER, Role.EMPLOYEE],
    EXPORT: [Role.OWNER, Role.ADMIN, Role.MANAGER, Role.EMPLOYEE],
  },
  REPORTS: {
    CREATE: [Role.OWNER, Role.ADMIN, Role.MANAGER],
  },
};

export const hasPermission = (
  userRole: Role,
  requiredRoles: Role[]
): boolean => {
  return requiredRoles.some(
    (role) => ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[role]
  );
};

export const getUserRole = async (
  userId: string,
  organizationId: string
): Promise<Role | null> => {
  const member = await db.member.findFirst({
    where: { userId, organizationId, isActive: true },
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
      throw new ErrorHandler("Only one owner allowed", 400);
    }
  }

  // Prevent changing OWNER role through regular update
  if (member.role === "OWNER" && newRole !== "OWNER") {
    // Check if it's the owner trying to change their own role
    if (member.userId === userId) {
      throw new ErrorHandler("Cannot change own owner role", 403);
    }
    throw new ErrorHandler("Cannot change owner role", 403);
  }

  // Check personal team restrictions
  if (member.role === "OWNER" && newRole !== "OWNER") {
    const organization = await db.organizations.findUnique({
      where: { id: organizationId },
      select: { personalTeam: true },
    });

    if (organization?.personalTeam) {
      throw new ErrorHandler("Cannot change personal team owner", 403);
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
  allowedRoles: Role[],
  context?: string
) => {
  if (!userId) {
    throw new ErrorHandler("Authentication required", 401);
  }

  if (!organizationId) {
    throw new ErrorHandler("Organization ID is required", 400);
  }

  const organization = await db.organizations.findUnique({
    where: { id: organizationId },
    select: { id: true },
  });

  if (!organization) {
    console.log("dsdsf");
    throw new ErrorHandler("Organization not found", 404);
  }

  const membership = await isUserActiveMember(userId, organizationId);

  if (!membership) {
    throw new ErrorHandler(
      "Access denied. You are not a member of this organization or your membership is inactive",
      403
    );
  }

  if (!hasPermission(membership.role, allowedRoles)) {
    throw new ErrorHandler(`Insufficient permissions for this operation.`, 403);
  }

  return membership;
};

export const assertAPIPermission = async (
  userId: string | undefined,
  organizationId: string,
  apiEndpoint: keyof typeof API_PERMISSIONS,
  action: string,
  context?: string
) => {
  if (!userId) {
    throw new ErrorHandler("Authentication required", 401);
  }

  if (!organizationId) {
    throw new ErrorHandler("Organization ID is required", 400);
  }

  const permissionSet = API_PERMISSIONS[apiEndpoint];
  if (!permissionSet || !(action in permissionSet)) {
    throw new ErrorHandler("Invalid API permission configuration", 500);
  }

  const requiredRoles = permissionSet[action as keyof typeof permissionSet];

  const membership = await assertActivePermissionedMember(
    userId,
    organizationId,
    requiredRoles,
    context || `${apiEndpoint.toLowerCase()} ${action.toLowerCase()}`
  );

  return membership;
};

export const assertProjectAccess = async (
  userId: string,
  organizationId: string,
  projectId: string,
  action: keyof typeof API_PERMISSIONS.PROJECT
) => {
  const requiredRoles = API_PERMISSIONS.PROJECT[action];

  const membership = await assertActivePermissionedMember(
    userId,
    organizationId,
    requiredRoles,
    "project access"
  );

  const project = await db.project.findUnique({
    where: { id: projectId },
    select: { id: true, organizationId: true },
  });

  if (!project) {
    throw new ErrorHandler("Project not found", 404);
  }

  if (project.organizationId !== organizationId) {
    throw new ErrorHandler("Project does not belong to this organization", 403);
  }

  if (hasPermission(membership.role, API_PERMISSIONS.PROJECT.UPDATE)) {
    return membership;
  }

  if (membership.role === Role.EMPLOYEE && action === "VIEW") {
    const projectMember = await db.projectMember.findFirst({
      where: { projectId, userId },
    });

    if (!projectMember) {
      throw new ErrorHandler(
        "Access denied. You are not assigned to this project",
        403
      );
    }
  }

  return membership;
};

export const assertClientAccess = async (
  userId: string,
  organizationId: string,
  clientId: string,
  action: keyof typeof API_PERMISSIONS.CLIENT
) => {
  const requiredRoles = API_PERMISSIONS.CLIENT[action];

  const membership = await assertActivePermissionedMember(
    userId,
    organizationId,
    requiredRoles,
    "client access"
  );

  const client = await db.client.findUnique({
    where: { id: clientId },
    select: { id: true, organizationId: true, archivedAt: true },
  });

  if (!client) {
    throw new ErrorHandler("Client not found", 404);
  }

  if (client.organizationId !== organizationId) {
    throw new ErrorHandler("Client does not belong to this organization", 403);
  }

  return { membership, client };
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

export const validateTaskInProject = async (
  taskId: string,
  projectId: string,
  organizationId: string
) => {
  const task = await db.task.findUnique({
    where: { id: taskId },
    select: { id: true, projectId: true, organizationId: true },
  });

  if (!task) {
    throw new ErrorHandler("Task not found", 404);
  }

  if (task.projectId !== projectId) {
    throw new ErrorHandler("Task does not belong to this project", 403);
  }

  if (task.organizationId !== organizationId) {
    throw new ErrorHandler("Task does not belong to this organization", 403);
  }

  return task;
};
