/*
  Warnings:

  - You are about to drop the column `tagId` on the `entry_tag` table. All the data in the column will be lost.
  - You are about to drop the column `tagId` on the `tag_category` table. All the data in the column will be lost.
  - You are about to drop the `participant_tag` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[tag,categoryId]` on the table `tag_category` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `tag` to the `entry_tag` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tag` to the `tag_category` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ParticipantTagType" AS ENUM ('LOCAL_MUNICIPALITY', 'JUVENILE');

-- DropForeignKey
ALTER TABLE "entry_tag" DROP CONSTRAINT "entry_tag_tagId_fkey";

-- DropForeignKey
ALTER TABLE "participant_tag" DROP CONSTRAINT "participant_tag_competitionId_fkey";

-- DropForeignKey
ALTER TABLE "tag_category" DROP CONSTRAINT "tag_category_tagId_fkey";

-- DropIndex
DROP INDEX "tag_category_tagId_categoryId_key";

-- AlterTable
ALTER TABLE "entry_tag" DROP COLUMN "tagId",
ADD COLUMN     "tag" "ParticipantTagType" NOT NULL;

-- AlterTable
ALTER TABLE "tag_category" DROP COLUMN "tagId",
ADD COLUMN     "tag" "ParticipantTagType" NOT NULL;

-- DropTable
DROP TABLE "participant_tag";

-- CreateIndex
CREATE UNIQUE INDEX "tag_category_tag_categoryId_key" ON "tag_category"("tag", "categoryId");
