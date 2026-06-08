/*
  Warnings:

  - You are about to drop the column `competitionId` on the `role_assignment` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "CompetitionRole" AS ENUM ('ORGANIZER');

-- CreateTable
CREATE TABLE "competition_role_assignment" (
    "id" TEXT NOT NULL,
    "role" "CompetitionRole" NOT NULL,
    "userId" TEXT NOT NULL,
    "competitionId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "competition_role_assignment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "competition_role_assignment_userId_competitionId_role_key" ON "competition_role_assignment"("userId", "competitionId", "role");

-- AddForeignKey
ALTER TABLE "competition_role_assignment" ADD CONSTRAINT "competition_role_assignment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "competition_role_assignment" ADD CONSTRAINT "competition_role_assignment_competitionId_fkey" FOREIGN KEY ("competitionId") REFERENCES "competition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Data migration: move scoped ORGANIZER rows to the new table
INSERT INTO "competition_role_assignment" ("id", "role", "userId", "competitionId", "createdAt", "updatedAt")
SELECT gen_random_uuid(), 'ORGANIZER', "userId", "competitionId", "createdAt", "updatedAt"
FROM "role_assignment"
WHERE "competitionId" IS NOT NULL AND "role" = 'ORGANIZER'
ON CONFLICT DO NOTHING;

-- Delete all competition-scoped rows from role_assignment (both ORGANIZER and JUDGE)
DELETE FROM "role_assignment" WHERE "competitionId" IS NOT NULL;

-- DropForeignKey
ALTER TABLE "role_assignment" DROP CONSTRAINT "role_assignment_competitionId_fkey";

-- AlterTable
ALTER TABLE "role_assignment" DROP COLUMN "competitionId";
