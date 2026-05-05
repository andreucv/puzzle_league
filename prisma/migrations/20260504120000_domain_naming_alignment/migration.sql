-- Safe domain naming alignment migration
-- Aligns database names with CONTEXT.md domain language using RENAME operations
-- to preserve all existing data.
--
-- Changes:
--   InscriptionStatus enum → RegistrationStatus
--   NotificationType enum values: INSCRIPTION_* → REGISTRATION_*, USER_INTENT_CLAIMED → EXTERNAL_PARTICIPANT_CLAIMED
--   Table "record" → "entry"
--   Table "user_intent" → "external_participant"
--   Join table "_RecordParticipants" → "_EntryParticipants"
--   Join table "_RecordUserIntents" → "_EntryExternalParticipants"
--   Column user."userIntentsLastChecked" → "externalParticipantsLastChecked"

-- 1. Rename enums
ALTER TYPE "InscriptionStatus" RENAME TO "RegistrationStatus";

-- 2. Rename NotificationType enum values
ALTER TYPE "NotificationType" RENAME VALUE 'INSCRIPTION_CREATED' TO 'REGISTRATION_CREATED';
ALTER TYPE "NotificationType" RENAME VALUE 'INSCRIPTION_CONFIRMED' TO 'REGISTRATION_CONFIRMED';
ALTER TYPE "NotificationType" RENAME VALUE 'INSCRIPTION_REFUSED' TO 'REGISTRATION_REFUSED';
ALTER TYPE "NotificationType" RENAME VALUE 'INSCRIPTION_WAITLISTED' TO 'REGISTRATION_WAITLISTED';
ALTER TYPE "NotificationType" RENAME VALUE 'USER_INTENT_CLAIMED' TO 'EXTERNAL_PARTICIPANT_CLAIMED';

-- 3. Rename main tables (preserves all data and indexes)
ALTER TABLE "record" RENAME TO "entry";
ALTER TABLE "user_intent" RENAME TO "external_participant";

-- 4. Rename join tables
ALTER TABLE "_RecordParticipants" RENAME TO "_EntryParticipants";
ALTER TABLE "_RecordUserIntents" RENAME TO "_EntryExternalParticipants";

-- 5. Rename user column
ALTER TABLE "user" RENAME COLUMN "userIntentsLastChecked" TO "externalParticipantsLastChecked";

-- 6. Rename primary key constraints
ALTER TABLE "entry" RENAME CONSTRAINT "record_pkey" TO "entry_pkey";
ALTER TABLE "external_participant" RENAME CONSTRAINT "user_intent_pkey" TO "external_participant_pkey";

-- 7. Rename foreign key constraints on main tables
ALTER TABLE "entry" RENAME CONSTRAINT "record_categoryId_fkey" TO "entry_categoryId_fkey";
ALTER TABLE "entry" RENAME CONSTRAINT "record_creatorId_fkey" TO "entry_creatorId_fkey";
ALTER TABLE "external_participant" RENAME CONSTRAINT "user_intent_createdById_fkey" TO "external_participant_createdById_fkey";
ALTER TABLE "external_participant" RENAME CONSTRAINT "user_intent_claimedById_fkey" TO "external_participant_claimedById_fkey";

-- 8. Rename constraints and indexes on join tables

-- _EntryParticipants (was _RecordParticipants)
ALTER TABLE "_EntryParticipants" RENAME CONSTRAINT "_RecordParticipants_AB_pkey" TO "_EntryParticipants_AB_pkey";
ALTER TABLE "_EntryParticipants" RENAME CONSTRAINT "_RecordParticipants_A_fkey" TO "_EntryParticipants_A_fkey";
-- _RecordParticipants_B_fkey references user(id) which was not renamed; Prisma keeps the old FK name
ALTER INDEX "_RecordParticipants_B_index" RENAME TO "_EntryParticipants_B_index";

-- _EntryExternalParticipants (was _RecordUserIntents)
ALTER TABLE "_EntryExternalParticipants" RENAME CONSTRAINT "_RecordUserIntents_AB_pkey" TO "_EntryExternalParticipants_AB_pkey";
ALTER TABLE "_EntryExternalParticipants" RENAME CONSTRAINT "_RecordUserIntents_A_fkey" TO "_EntryExternalParticipants_A_fkey";
ALTER TABLE "_EntryExternalParticipants" RENAME CONSTRAINT "_RecordUserIntents_B_fkey" TO "_EntryExternalParticipants_B_fkey";
ALTER INDEX "_RecordUserIntents_B_index" RENAME TO "_EntryExternalParticipants_B_index";
