-- CreateTable
CREATE TABLE "Match" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "blueAlliance" TEXT[],
    "redAlliance" TEXT[],
    "blueScore" INTEGER NOT NULL,
    "redScore" INTEGER NOT NULL,
    "blueAutoScore" INTEGER NOT NULL,
    "redAutoScore" INTEGER NOT NULL,
    "blueTeleScore" INTEGER NOT NULL,
    "redTeleScore" INTEGER NOT NULL,
    "redHangTraverse" BOOLEAN NOT NULL,
    "blueHangTraverse" BOOLEAN NOT NULL,
    "redHangHigh" BOOLEAN NOT NULL,
    "blueHangHigh" BOOLEAN NOT NULL,
    "redHangMid" BOOLEAN NOT NULL,
    "blueHangMid" BOOLEAN NOT NULL,
    "redHangLow" BOOLEAN NOT NULL,
    "blueHangLow" BOOLEAN NOT NULL,
    "blueEndScore" INTEGER NOT NULL,
    "redEndScore" INTEGER NOT NULL,

    CONSTRAINT "Match_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Alliance" (
    "id" SERIAL NOT NULL,
    "teams" TEXT[],
    "combindedOpr" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "Alliance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Team" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "iconUrl" TEXT NOT NULL,
    "opr" DOUBLE PRECISION NOT NULL,
    "rankingPoints" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Team_pkey" PRIMARY KEY ("id")
);
