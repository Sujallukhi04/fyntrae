/*
  Warnings:

  - You are about to drop the column `lastSentAt` on the `OrganizationInvitation` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "OrganizationInvitation" DROP COLUMN "lastSentAt",
ADD COLUMN     "lastReSentAt" TIMESTAMP(3);
