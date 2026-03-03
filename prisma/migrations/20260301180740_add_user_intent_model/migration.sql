-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'USER_INTENT_CLAIMED';

-- CreateTable
CREATE TABLE "user_intent" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" TEXT NOT NULL,
    "claimedById" TEXT,

    CONSTRAINT "user_intent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_RecordUserIntents" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_RecordUserIntents_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_RecordUserIntents_B_index" ON "_RecordUserIntents"("B");

-- AddForeignKey
ALTER TABLE "user_intent" ADD CONSTRAINT "user_intent_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_intent" ADD CONSTRAINT "user_intent_claimedById_fkey" FOREIGN KEY ("claimedById") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_RecordUserIntents" ADD CONSTRAINT "_RecordUserIntents_A_fkey" FOREIGN KEY ("A") REFERENCES "record"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_RecordUserIntents" ADD CONSTRAINT "_RecordUserIntents_B_fkey" FOREIGN KEY ("B") REFERENCES "user_intent"("id") ON DELETE CASCADE ON UPDATE CASCADE;
