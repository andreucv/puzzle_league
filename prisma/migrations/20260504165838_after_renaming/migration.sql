/*
  Warnings:

  - You are about to drop the column `externalParticipantsLastChecked` on the `user` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "_EntryExternalParticipants" RENAME CONSTRAINT "_RecordUserIntents_AB_pkey" TO "_EntryExternalParticipants_AB_pkey";

-- AlterTable
ALTER TABLE "_EntryParticipants" RENAME CONSTRAINT "_RecordParticipants_AB_pkey" TO "_EntryParticipants_AB_pkey";

-- AlterTable
ALTER TABLE "user" DROP COLUMN "externalParticipantsLastChecked",
ADD COLUMN     "userIntentsLastChecked" TIMESTAMP(3);

-- RenameIndex
ALTER INDEX "_RecordUserIntents_B_index" RENAME TO "_EntryExternalParticipants_B_index";

-- RenameIndex
ALTER INDEX "_RecordParticipants_B_index" RENAME TO "_EntryParticipants_B_index";
