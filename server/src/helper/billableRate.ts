import { db } from "../prismaClient";
import { ErrorHandler } from "../utils/errorHandler";

export const calculateBillableRate = async ({
  userId,
  projectId,
  organizationId,
}: {
  userId: string;
  projectId?: string | null;
  organizationId: string;
}): Promise<number | null> => {
  try {
    if (projectId) {
      const projectMember = await db.projectMember.findFirst({
        where: {
          userId,
          projectId,
        },
        select: {
          billableRate: true,
        },
      });

      if (projectMember?.billableRate)
        return Number(projectMember.billableRate);
    }

    if (projectId) {
      const project = await db.project.findUnique({
        where: {
          id: projectId,
        },
        select: {
          billableRate: true,
        },
      });

      if (project?.billableRate) return Number(project.billableRate);
    }

    const organizationMember = await db.member.findFirst({
      where: {
        userId,
        organizationId,
      },
      select: {
        billableRate: true,
      },
    });

    if (organizationMember?.billableRate)
      return Number(organizationMember.billableRate);

    const organization = await db.organizations.findUnique({
      where: {
        id: organizationId,
      },
      select: {
        billableRates: true,
      },
    });

    if (organization?.billableRates) return Number(organization.billableRates);

    return null;
  } catch (error) {
    console.error("Error calculating billable rate:", error);
    throw new ErrorHandler("Failed to calculate billable rate", 500);
  }
};

export const updateBillableRate = async ({
  source,
  sourceId,
  newRate,
  applyToExisting = false,
  organizationId,
  userId,
  projectId,
}: {
  source: "project_member" | "project" | "organization_member" | "organization";
  sourceId: string;
  newRate: number | null;
  applyToExisting?: boolean;
  organizationId: string;
  userId?: string;
  projectId?: string;
}): Promise<void> => {
  try {
    await db.$transaction(async (tx) => {
      let oldRate: number | null = null;

      switch (source) {
        case "project_member":
          const oldPM = await tx.projectMember.findUnique({
            where: { id: sourceId },
            select: { billableRate: true },
          });
          oldRate = oldPM?.billableRate ?? null;

          await tx.projectMember.update({
            where: { id: sourceId },
            data: { billableRate: newRate },
          });

          if (applyToExisting && userId && projectId) {
            await tx.timeEntry.updateMany({
              where: {
                organizationId,
                userId,
                projectId,
                billableRate: oldRate, // only entries that had this PM rate
              },
              data: {
                billableRate: newRate,
              },
            });
          }
          break;

        case "project":
          const oldProject = await tx.project.findUnique({
            where: { id: sourceId },
            select: { billableRate: true },
          });
          oldRate = oldProject?.billableRate ?? null;

          await tx.project.update({
            where: { id: sourceId },
            data: { billableRate: newRate },
          });

          if (applyToExisting && projectId) {
            await tx.timeEntry.updateMany({
              where: {
                organizationId,
                projectId,
                billableRate: oldRate,
                // exclude ones with matching ProjectMember billableRate
                NOT: {
                  userId: {
                    in: (
                      await tx.projectMember.findMany({
                        where: {
                          projectId,
                          billableRate: {
                            not: null,
                          },
                        },
                        select: { userId: true },
                      })
                    ).map((m) => m.userId),
                  },
                },
              },
              data: {
                billableRate: newRate,
              },
            });
          }
          break;

        case "organization_member":
          const oldMember = await tx.member.findUnique({
            where: { id: sourceId },
            select: { billableRate: true },
          });
          oldRate = oldMember?.billableRate ?? null;

          await tx.member.update({
            where: { id: sourceId },
            data: { billableRate: newRate },
          });

          if (applyToExisting && userId) {
            await tx.timeEntry.updateMany({
              where: {
                organizationId,
                userId,
                billableRate: oldRate,
                // exclude ones with project or project_member rate
                OR: [
                  { projectId: null },
                  {
                    projectId: {
                      notIn: (
                        await tx.project.findMany({
                          where: {
                            billableRate: {
                              not: null,
                            },
                          },
                          select: { id: true },
                        })
                      ).map((p) => p.id),
                    },
                  },
                ],
              },
              data: {
                billableRate: newRate,
              },
            });
          }
          break;

        case "organization":
          const oldOrg = await tx.organizations.findUnique({
            where: { id: sourceId },
            select: { billableRates: true },
          });
          oldRate = oldOrg?.billableRates ?? null;

          await tx.organizations.update({
            where: { id: sourceId },
            data: { billableRates: newRate },
          });

          if (applyToExisting) {
            // Find members with their own rate
            const memberUserIds = (
              await tx.member.findMany({
                where: {
                  organizationId,
                  billableRate: {
                    not: null,
                  },
                },
                select: { userId: true },
              })
            ).map((m) => m.userId);

            await tx.timeEntry.updateMany({
              where: {
                organizationId,
                billableRate: oldRate,
                userId: {
                  notIn: memberUserIds,
                },
              },
              data: {
                billableRate: newRate,
              },
            });
          }
          break;
      }
    });
  } catch (error) {
    console.error("Error updating billable rate:", error);
    throw new ErrorHandler("Failed to update billable rate", 500);
  }
};

export function getLocalDateRangeInUTC(
  date: string,
  timezoneOffsetInMinutes: number
) {
  // Parse date and reset to midnight local time
  const localMidnight = new Date(date);
  localMidnight.setUTCHours(0, 0, 0, 0);

  // Adjust to UTC
  const startUTC = new Date(localMidnight);
  startUTC.setUTCMinutes(startUTC.getUTCMinutes() - timezoneOffsetInMinutes);

  const endUTC = new Date(startUTC);
  endUTC.setUTCDate(endUTC.getUTCDate() + 1);

  return { startUTC, endUTC };
}
