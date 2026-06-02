-- CreateTable
CREATE TABLE "landing_stats" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "upcomingCount" INTEGER NOT NULL DEFAULT 0,
    "cityCount" INTEGER NOT NULL DEFAULT 0,
    "participantCount" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "landing_stats_pkey" PRIMARY KEY ("id")
);
