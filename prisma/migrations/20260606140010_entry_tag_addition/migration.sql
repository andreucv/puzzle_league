-- CreateEnum
CREATE TYPE "EntryTagStatus" AS ENUM ('PENDING', 'CONFIRMED', 'REJECTED');

-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'TAG_REJECTED';

-- CreateTable
CREATE TABLE "participant_tag" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "competitionId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "participant_tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tag_category" (
    "id" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,
    "categoryId" INTEGER NOT NULL,
    "priceOverride" INTEGER,

    CONSTRAINT "tag_category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "entry_tag" (
    "id" TEXT NOT NULL,
    "entryId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,
    "status" "EntryTagStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "entry_tag_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tag_category_tagId_categoryId_key" ON "tag_category"("tagId", "categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "entry_tag_entryId_key" ON "entry_tag"("entryId");

-- AddForeignKey
ALTER TABLE "participant_tag" ADD CONSTRAINT "participant_tag_competitionId_fkey" FOREIGN KEY ("competitionId") REFERENCES "competition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tag_category" ADD CONSTRAINT "tag_category_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "participant_tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tag_category" ADD CONSTRAINT "tag_category_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entry_tag" ADD CONSTRAINT "entry_tag_entryId_fkey" FOREIGN KEY ("entryId") REFERENCES "entry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entry_tag" ADD CONSTRAINT "entry_tag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "participant_tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;
