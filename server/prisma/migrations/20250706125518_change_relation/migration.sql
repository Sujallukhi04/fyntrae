/*
  Warnings:

  - Made the column `invitedBy` on table `OrganizationInvitation` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "OrganizationInvitation" DROP CONSTRAINT "OrganizationInvitation_invitedBy_fkey";

-- AlterTable
ALTER TABLE "OrganizationInvitation" ALTER COLUMN "invitedBy" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "OrganizationInvitation" ADD CONSTRAINT "OrganizationInvitation_invitedBy_fkey" FOREIGN KEY ("invitedBy") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
