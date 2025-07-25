/*
  Warnings:

  - You are about to alter the column `billableRate` on the `Member` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Integer`.
  - You are about to alter the column `billableRates` on the `Organizations` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Integer`.

*/
-- AlterTable
ALTER TABLE "Member" ALTER COLUMN "billableRate" SET DATA TYPE INTEGER;

-- AlterTable
ALTER TABLE "Organizations" ALTER COLUMN "billableRates" SET DATA TYPE INTEGER;
