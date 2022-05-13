-- AlterTable
ALTER TABLE "Match" ADD COLUMN     "penalties_blue" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "penalties_red" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Team" ADD COLUMN     "loss" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "won" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "MatchList" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "blueAlliance" TEXT[],
    "redAlliance" TEXT[],

    CONSTRAINT "MatchList_pkey" PRIMARY KEY ("id")
);
