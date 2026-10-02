-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'CATEGORY_REGISTRATION_OPENED';

-- CreateTable
CREATE TABLE "category_follow" (
    "userId" TEXT NOT NULL,
    "categoryId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notifiedAt" TIMESTAMP(3),

    CONSTRAINT "category_follow_pkey" PRIMARY KEY ("userId","categoryId")
);

-- CreateIndex
CREATE INDEX "category_follow_categoryId_notifiedAt_idx" ON "category_follow"("categoryId", "notifiedAt");

-- AddForeignKey
ALTER TABLE "category_follow" ADD CONSTRAINT "category_follow_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "category_follow" ADD CONSTRAINT "category_follow_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "category"("id") ON DELETE CASCADE ON UPDATE CASCADE;
