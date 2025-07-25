/*
  Warnings:

  - Added the required column `duration` to the `TimeEntry` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "TimeEntry" ADD COLUMN     "duration" INTEGER NOT NULL;
