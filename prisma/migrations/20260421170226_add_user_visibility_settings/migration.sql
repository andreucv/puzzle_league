-- AlterTable
ALTER TABLE "user" ADD COLUMN     "publicProfileVisibility" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "publicResultsVisibility" BOOLEAN NOT NULL DEFAULT true;
