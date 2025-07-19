/*
  Warnings:

  - You are about to drop the `_EntryToUser` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `creatorId` to the `entry` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "_EntryToUser" DROP CONSTRAINT "_EntryToUser_A_fkey";

-- DropForeignKey
ALTER TABLE "_EntryToUser" DROP CONSTRAINT "_EntryToUser_B_fkey";

-- DropForeignKey
ALTER TABLE "entry" DROP CONSTRAINT "entry_categoryId_fkey";

-- AlterTable
ALTER TABLE "entry" ADD COLUMN     "creatorId" TEXT NOT NULL;

-- DropTable
DROP TABLE "_EntryToUser";

-- CreateTable
CREATE TABLE "_EntryParticipants" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_EntryParticipants_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_EntryParticipants_B_index" ON "_EntryParticipants"("B");

-- AddForeignKey
ALTER TABLE "entry" ADD CONSTRAINT "entry_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entry" ADD CONSTRAINT "entry_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "user"("id") ON DELETE SET DEFAULT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_EntryParticipants" ADD CONSTRAINT "_EntryParticipants_A_fkey" FOREIGN KEY ("A") REFERENCES "entry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_EntryParticipants" ADD CONSTRAINT "_EntryParticipants_B_fkey" FOREIGN KEY ("B") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
