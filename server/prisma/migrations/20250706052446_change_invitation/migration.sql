-- AlterTable
ALTER TABLE "OrganizationInvitation" ADD COLUMN     "lastSentAt" TIMESTAMP(3),
ADD COLUMN     "resendCount" INTEGER NOT NULL DEFAULT 0;
