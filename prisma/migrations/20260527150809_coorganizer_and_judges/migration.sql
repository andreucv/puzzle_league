/*
  Warnings:

  - You are about to drop the `_CategoryJudges` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `competition_role_assignment` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "_CategoryJudges" DROP CONSTRAINT "_CategoryJudges_A_fkey";

-- DropForeignKey
ALTER TABLE "_CategoryJudges" DROP CONSTRAINT "_CategoryJudges_B_fkey";

-- DropForeignKey
ALTER TABLE "competition_role_assignment" DROP CONSTRAINT "competition_role_assignment_competitionId_fkey";

-- DropForeignKey
ALTER TABLE "competition_role_assignment" DROP CONSTRAINT "competition_role_assignment_userId_fkey";

-- DropTable
DROP TABLE "_CategoryJudges";

-- DropTable
DROP TABLE "competition_role_assignment";

-- DropEnum
DROP TYPE "CompetitionRole";

-- CreateTable
CREATE TABLE "competition_coorganizer_role_assignment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "competitionId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "competition_coorganizer_role_assignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "category_judge_assignment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "categoryId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "category_judge_assignment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "competition_coorganizer_role_assignment_userId_competitionI_key" ON "competition_coorganizer_role_assignment"("userId", "competitionId");

-- CreateIndex
CREATE UNIQUE INDEX "category_judge_assignment_userId_categoryId_key" ON "category_judge_assignment"("userId", "categoryId");

-- AddForeignKey
ALTER TABLE "competition_coorganizer_role_assignment" ADD CONSTRAINT "competition_coorganizer_role_assignment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "competition_coorganizer_role_assignment" ADD CONSTRAINT "competition_coorganizer_role_assignment_competitionId_fkey" FOREIGN KEY ("competitionId") REFERENCES "competition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "category_judge_assignment" ADD CONSTRAINT "category_judge_assignment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "category_judge_assignment" ADD CONSTRAINT "category_judge_assignment_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "category"("id") ON DELETE CASCADE ON UPDATE CASCADE;
