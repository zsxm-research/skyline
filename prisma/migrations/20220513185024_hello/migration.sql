/*
  Warnings:

  - You are about to drop the `MatchList` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "MatchList";

-- CreateTable
CREATE TABLE "PlayerOpr" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "team" TEXT,
    "opr" INTEGER,
    "matchId" INTEGER,

    CONSTRAINT "PlayerOpr_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "PlayerOpr" ADD CONSTRAINT "PlayerOpr_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE SET NULL ON UPDATE CASCADE;
