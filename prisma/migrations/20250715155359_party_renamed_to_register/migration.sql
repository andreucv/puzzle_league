/*
  Warnings:

  - You are about to drop the `_PartyToUser` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `party` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "_PartyToUser" DROP CONSTRAINT "_PartyToUser_A_fkey";

-- DropForeignKey
ALTER TABLE "_PartyToUser" DROP CONSTRAINT "_PartyToUser_B_fkey";

-- DropForeignKey
ALTER TABLE "party" DROP CONSTRAINT "party_categoryId_fkey";

-- DropTable
DROP TABLE "_PartyToUser";

-- DropTable
DROP TABLE "party";

-- CreateTable
CREATE TABLE "register" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "finishTime" TIMESTAMP(3),
    "categoryId" INTEGER NOT NULL,

    CONSTRAINT "register_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_RegisterToUser" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_RegisterToUser_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_RegisterToUser_B_index" ON "_RegisterToUser"("B");

-- AddForeignKey
ALTER TABLE "register" ADD CONSTRAINT "register_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_RegisterToUser" ADD CONSTRAINT "_RegisterToUser_A_fkey" FOREIGN KEY ("A") REFERENCES "register"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_RegisterToUser" ADD CONSTRAINT "_RegisterToUser_B_fkey" FOREIGN KEY ("B") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
