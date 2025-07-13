-- AlterTable
ALTER TABLE "Member" ADD COLUMN     "billableRate" DECIMAL(65,30);

-- AlterTable
ALTER TABLE "Organizations" ALTER COLUMN "billableRates" SET DATA TYPE DECIMAL(65,30);
