-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'PAYMENT_REMINDER';

-- AlterTable
ALTER TABLE "record" ADD COLUMN     "lastRemindedAt" TIMESTAMP(3);
