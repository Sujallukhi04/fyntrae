/*
  Warnings:

  - You are about to drop the column `doneAt` on the `Task` table. All the data in the column will be lost.
  - Added the required column `status` to the `Task` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "Status" AS ENUM ('ACTIVE', 'DONE');

-- AlterTable
ALTER TABLE "Task" DROP COLUMN "doneAt",
ADD COLUMN     "status" "Status" NOT NULL;
