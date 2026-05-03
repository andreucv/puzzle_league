-- AlterTable
ALTER TABLE "category" ADD COLUMN     "autoStop" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "autoStopMessageId" TEXT;
