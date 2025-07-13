/*
  Warnings:

  - The values [ACCEPTED,DELETED] on the enum `InvitationStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `deletedAt` on the `OrganizationInvitation` table. All the data in the column will be lost.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "InvitationStatus_new" AS ENUM ('PENDING', 'EXPIRED');
ALTER TABLE "OrganizationInvitation" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "OrganizationInvitation" ALTER COLUMN "status" TYPE "InvitationStatus_new" USING ("status"::text::"InvitationStatus_new");
ALTER TYPE "InvitationStatus" RENAME TO "InvitationStatus_old";
ALTER TYPE "InvitationStatus_new" RENAME TO "InvitationStatus";
DROP TYPE "InvitationStatus_old";
ALTER TABLE "OrganizationInvitation" ALTER COLUMN "status" SET DEFAULT 'PENDING';
COMMIT;

-- AlterTable
ALTER TABLE "OrganizationInvitation" DROP COLUMN "deletedAt";
