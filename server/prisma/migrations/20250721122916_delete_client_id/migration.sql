/*
  Warnings:

  - You are about to drop the column `clientId` on the `TimeEntry` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "TimeEntry" DROP CONSTRAINT "TimeEntry_clientId_fkey";

-- AlterTable
ALTER TABLE "TimeEntry" DROP COLUMN "clientId";
