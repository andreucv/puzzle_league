-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('INSCRIPTION_ACCEPTED', 'INSCRIPTION_REFUSED', 'COMPETITION_STARTED', 'COMPETITION_CANCELLED', 'ROLE_REQUEST_APPROVED', 'ROLE_REQUEST_REJECTED', 'GENERAL');

-- CreateTable
CREATE TABLE "notification" (
    "id" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "link" TEXT,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "notification_userId_read_idx" ON "notification"("userId", "read");

-- AddForeignKey
ALTER TABLE "notification" ADD CONSTRAINT "notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
