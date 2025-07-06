/*
  Warnings:

  - You are about to drop the column `endDate` on the `category` table. All the data in the column will be lost.
  - You are about to drop the column `startDate` on the `category` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "category" DROP COLUMN "endDate",
DROP COLUMN "startDate";
