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
      const project = await db.project.findUnique({
        where: { id: projectId },
        select: { billable: true, billableRate: true },
      });

      if (project && !project.billable) {
        return null;
      }

      const projectMember = await db.projectMember.findFirst({
        where: { userId, projectId },
        select: { billableRate: true },
      });

      if (projectMember?.billableRate != null) {
        return Number(projectMember.billableRate);
      }

      if (project?.billableRate != null) {
        return Number(project.billableRate);
      }
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
  userId?: string | null;
  projectId?: string;
}): Promise<void> => {
  try {
    await db.$transaction(async (tx) => {
      let oldRate: number | null = null;

      switch (source) {
        case "project_member": {
          const oldPM = await tx.projectMember.findUnique({
            where: { id: sourceId },
            select: { billableRate: true },
          });
          oldRate = oldPM?.billableRate ?? null;

          await tx.projectMember.update({
            where: { id: sourceId },
            data: { billableRate: newRate },
          });

          let effectiveRate = newRate;

          if (userId && projectId) {
            const project = await tx.project.findUnique({
              where: { id: projectId },
              select: { billable: true, billableRate: true },
            });

            const orgMember = await tx.member.findFirst({
              where: { organizationId, userId },
              select: { billableRate: true },
            });

            const org = await tx.organizations.findUnique({
              where: { id: organizationId },
              select: { billableRates: true },
            });

            if (newRate === null) {
              effectiveRate =
                project?.billable && project?.billableRate != null
                  ? project.billableRate
                  : orgMember?.billableRate != null
                  ? orgMember.billableRate
                  : org?.billableRates ?? null;
            }
          }

          if (applyToExisting && userId && projectId) {
            await tx.timeEntry.updateMany({
              where: {
                organizationId,
                userId,
                projectId,
              },
              data: {
                billableRate: effectiveRate,
              },
            });
          }

          break;
        }

        case "project": {
          const oldProject = await tx.project.findUnique({
            where: { id: sourceId },
            select: { billableRate: true, billable: true },
          });

          oldRate = oldProject?.billableRate ?? null;

          await tx.project.update({
            where: { id: sourceId },
            data: { billableRate: newRate },
          });

          if (applyToExisting && projectId) {
            const updatedProject = await tx.project.findUnique({
              where: { id: sourceId },
              select: { billable: true },
            });

            const projectMembers = await tx.projectMember.findMany({
              where: { projectId },
              select: { userId: true },
            });

            if (updatedProject?.billable === false) {
              await tx.timeEntry.updateMany({
                where: {
                  organizationId,
                  projectId,
                },
                data: {
                  billableRate: null,
                },
              });
            } else {
              for (const { userId } of projectMembers) {
                let fallbackRate: number | null = null;

                if (newRate !== null) {
                  fallbackRate = newRate;
                } else {
                  const projectMember = await tx.projectMember.findFirst({
                    where: { userId, projectId },
                    select: { billableRate: true },
                  });

                  if (projectMember?.billableRate != null) {
                    fallbackRate = projectMember.billableRate;
                  } else {
                    const orgMember = await tx.member.findFirst({
                      where: { userId, organizationId },
                      select: { billableRate: true },
                    });

                    if (orgMember?.billableRate != null) {
                      fallbackRate = orgMember.billableRate;
                    } else {
                      const org = await tx.organizations.findUnique({
                        where: { id: organizationId },
                        select: { billableRates: true },
                      });

                      fallbackRate = org?.billableRates ?? null;
                    }
                  }
                }

                await tx.timeEntry.updateMany({
                  where: {
                    organizationId,
                    projectId,
                    userId,
                  },
                  data: {
                    billableRate: fallbackRate,
                  },
                });
              }
            }
          }

          break;
        }

        case "organization_member": {
          const oldMember = await tx.member.findUnique({
            where: { id: sourceId },
            select: { billableRate: true, userId: true },
          });

          const org = await tx.organizations.findUnique({
            where: { id: organizationId },
            select: { billableRates: true },
          });

          // Update the member’s billable rate
          await tx.member.update({
            where: { id: sourceId },
            data: { billableRate: newRate },
          });

          if (applyToExisting && userId) {
            // Determine fallback rate if newRate is null
            let fallbackRate: number | null;

            if (newRate !== null) {
              fallbackRate = newRate;
            } else {
              fallbackRate = org?.billableRates ?? null;
            }

            await tx.timeEntry.updateMany({
              where: {
                organizationId,
                userId: oldMember?.userId || userId,
                projectId: null,
              },
              data: {
                billableRate: fallbackRate,
              },
            });
          }

          break;
        }

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

export async function recalculateProjectSpentTime(projectId: string) {
  const total = await db.timeEntry.aggregate({
    where: { projectId },
    _sum: { duration: true },
  });

  await db.project.update({
    where: { id: projectId },
    data: { spentTime: total._sum.duration ?? 0 },
  });
}

export async function recalculateTaskSpentTime(taskId: string) {
  const total = await db.timeEntry.aggregate({
    where: { taskId },
    _sum: { duration: true },
  });

  await db.task.update({
    where: { id: taskId },
    data: { spentTime: total._sum.duration ?? 0 },
  });
}
