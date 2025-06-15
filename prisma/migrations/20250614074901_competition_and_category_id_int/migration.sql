/*
  Warnings:

  - The primary key for the `category` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `category` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `competition` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `competition` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `competitionId` column on the `request` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `competitionId` column on the `role_assignment` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Changed the type of `competitionId` on the `category` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `categoryId` on the `party` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- DropForeignKey
ALTER TABLE "category" DROP CONSTRAINT "category_competitionId_fkey";

-- DropForeignKey
ALTER TABLE "party" DROP CONSTRAINT "party_categoryId_fkey";

-- DropForeignKey
ALTER TABLE "request" DROP CONSTRAINT "request_competitionId_fkey";

-- DropForeignKey
ALTER TABLE "role_assignment" DROP CONSTRAINT "role_assignment_competitionId_fkey";

-- AlterTable
ALTER TABLE "category" DROP CONSTRAINT "category_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
DROP COLUMN "competitionId",
ADD COLUMN     "competitionId" INTEGER NOT NULL,
ADD CONSTRAINT "category_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "competition" DROP CONSTRAINT "competition_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "competition_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "party" DROP COLUMN "categoryId",
ADD COLUMN     "categoryId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "request" DROP COLUMN "competitionId",
ADD COLUMN     "competitionId" INTEGER;

-- AlterTable
ALTER TABLE "role_assignment" DROP COLUMN "competitionId",
ADD COLUMN     "competitionId" INTEGER;

-- AddForeignKey
ALTER TABLE "category" ADD CONSTRAINT "category_competitionId_fkey" FOREIGN KEY ("competitionId") REFERENCES "competition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "party" ADD CONSTRAINT "party_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_assignment" ADD CONSTRAINT "role_assignment_competitionId_fkey" FOREIGN KEY ("competitionId") REFERENCES "competition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "request" ADD CONSTRAINT "request_competitionId_fkey" FOREIGN KEY ("competitionId") REFERENCES "competition"("id") ON DELETE CASCADE ON UPDATE CASCADE;
