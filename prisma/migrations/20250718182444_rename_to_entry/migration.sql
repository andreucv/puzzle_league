/*
  Warnings:

  - You are about to drop the `_RegisterToUser` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `register` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "_RegisterToUser" DROP CONSTRAINT "_RegisterToUser_A_fkey";

-- DropForeignKey
ALTER TABLE "_RegisterToUser" DROP CONSTRAINT "_RegisterToUser_B_fkey";

-- DropForeignKey
ALTER TABLE "register" DROP CONSTRAINT "register_categoryId_fkey";

-- DropTable
DROP TABLE "_RegisterToUser";

-- DropTable
DROP TABLE "register";

-- CreateTable
CREATE TABLE "entry" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "finishTime" TIMESTAMP(3),
    "categoryId" INTEGER NOT NULL,

    CONSTRAINT "entry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_EntryToUser" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_EntryToUser_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_EntryToUser_B_index" ON "_EntryToUser"("B");

-- AddForeignKey
ALTER TABLE "entry" ADD CONSTRAINT "entry_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_EntryToUser" ADD CONSTRAINT "_EntryToUser_A_fkey" FOREIGN KEY ("A") REFERENCES "entry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_EntryToUser" ADD CONSTRAINT "_EntryToUser_B_fkey" FOREIGN KEY ("B") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
