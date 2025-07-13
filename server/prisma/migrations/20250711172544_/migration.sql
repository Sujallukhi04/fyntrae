/*
  Warnings:

  - You are about to alter the column `spentTime` on the `Project` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Integer`.

*/
-- AlterTable
ALTER TABLE "Project" ALTER COLUMN "spentTime" SET DATA TYPE INTEGER;
