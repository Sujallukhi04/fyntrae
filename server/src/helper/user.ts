import { db } from "../prismaClient";

export const getAuthUserData = async (userId: string) => {
  try {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        weekStart: true,
        currentTeamId: true,
        createdAt: true,
        updatedAt: true,
        isPlaceholder: true,
        isActive: true,
        profilePicUrl: true,

        currentTeam: {
          select: {
            id: true,
            name: true,
          },
        },

        members: {
          select: {
            role: true,
            isActive: true,
            organization: {
              select: {
                id: true,
                name: true,
                personalTeam: true,
              },
            },
          },
        },
      },
    });

    if (!user) return null;

    const organizations = user.members
      .filter((member) => member.isActive)
      .map((member) => ({
        id: member.organization.id,
        name: member.organization.name,
        role: member.role,
      }));

    const { members, ...userWithoutMembers } = user;

    return {
      ...userWithoutMembers,
      organizations,
    };
  } catch (error) {
    return null;
  }
};

export async function getUserByEmail(email: string) {
  return await db.user.findFirst({ where: { email } });
}

export async function getUserById(id: string) {
  return await db.user.findUnique({ where: { id } });
}
