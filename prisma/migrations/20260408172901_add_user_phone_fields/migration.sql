-- AlterTable
ALTER TABLE "user" ADD COLUMN     "phoneNumber" TEXT,
ADD COLUMN     "phonePrefix" TEXT,
ADD COLUMN     "phonePromptSeenAt" TIMESTAMP(3);
