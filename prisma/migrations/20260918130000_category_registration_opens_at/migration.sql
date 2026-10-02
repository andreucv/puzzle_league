-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'REGISTRATION_OPENED';

-- AlterTable
ALTER TABLE "category" ADD COLUMN "registrationOpensAt" TIMESTAMP(3);
