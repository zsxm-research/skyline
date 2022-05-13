/*
  Warnings:

  - You are about to drop the column `opr` on the `Team` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Team" DROP COLUMN "opr",
ADD COLUMN     "ap" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "totalPoints" DOUBLE PRECISION NOT NULL DEFAULT 0;
