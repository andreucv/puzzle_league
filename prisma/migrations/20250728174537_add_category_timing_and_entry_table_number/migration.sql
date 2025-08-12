-- AlterTable
ALTER TABLE "category" ADD COLUMN     "realEndTime" TIMESTAMP(3),
ADD COLUMN     "realStartTime" TIMESTAMP(3),
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'not_started';

-- AlterTable
ALTER TABLE "entry" ADD COLUMN     "tableNumber" INTEGER;
