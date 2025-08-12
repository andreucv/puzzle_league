/*
  Warnings:

  - You are about to drop the `_EntryParticipants` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `entry` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "_EntryParticipants" DROP CONSTRAINT "_EntryParticipants_A_fkey";

-- DropForeignKey
ALTER TABLE "_EntryParticipants" DROP CONSTRAINT "_EntryParticipants_B_fkey";

-- DropForeignKey
ALTER TABLE "entry" DROP CONSTRAINT "entry_categoryId_fkey";

-- DropForeignKey
ALTER TABLE "entry" DROP CONSTRAINT "entry_creatorId_fkey";

-- DropTable
DROP TABLE "_EntryParticipants";

-- DropTable
DROP TABLE "entry";

-- CreateTable
CREATE TABLE "record" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "finishTime" TIMESTAMP(3),
    "tableNumber" INTEGER,
    "categoryId" INTEGER NOT NULL,
    "creatorId" TEXT NOT NULL,

    CONSTRAINT "record_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_RecordParticipants" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_RecordParticipants_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_RecordParticipants_B_index" ON "_RecordParticipants"("B");

-- AddForeignKey
ALTER TABLE "record" ADD CONSTRAINT "record_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "record" ADD CONSTRAINT "record_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "user"("id") ON DELETE SET DEFAULT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_RecordParticipants" ADD CONSTRAINT "_RecordParticipants_A_fkey" FOREIGN KEY ("A") REFERENCES "record"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_RecordParticipants" ADD CONSTRAINT "_RecordParticipants_B_fkey" FOREIGN KEY ("B") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
