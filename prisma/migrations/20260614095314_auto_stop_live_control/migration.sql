/*
  Warnings:

  - You are about to drop the column `autoStop` on the `category` table. All the data in the column will be lost.

*/
-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "NotificationType" ADD VALUE 'AUTO_STOP_SUCCESS';
ALTER TYPE "NotificationType" ADD VALUE 'AUTO_STOP_FAILED';

-- AlterTable
ALTER TABLE "category" DROP COLUMN "autoStop";
