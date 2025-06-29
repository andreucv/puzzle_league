-- AlterEnum
ALTER TYPE "CategoryType" ADD VALUE 'OTHER';

-- AlterTable
ALTER TABLE "category" ADD COLUMN     "maxPartySize" INTEGER;
