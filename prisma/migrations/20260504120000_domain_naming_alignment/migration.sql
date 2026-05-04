-- Domain naming alignment migration
-- Aligns code names with CONTEXT.md domain language:
--   InscriptionStatus → RegistrationStatus
--   Record → Entry (model only, table stays as "record" via @@map)
--   UserIntent → ExternalParticipant (model only, table stays as "user_intent" via @@map)
--   Notification type values: INSCRIPTION_* → REGISTRATION_*, USER_INTENT_CLAIMED → EXTERNAL_PARTICIPANT_CLAIMED

-- 1. Rename the enum type
ALTER TYPE "InscriptionStatus" RENAME TO "RegistrationStatus";

-- 2. Rename NotificationType enum values
ALTER TYPE "NotificationType" RENAME VALUE 'INSCRIPTION_CREATED' TO 'REGISTRATION_CREATED';
ALTER TYPE "NotificationType" RENAME VALUE 'INSCRIPTION_CONFIRMED' TO 'REGISTRATION_CONFIRMED';
ALTER TYPE "NotificationType" RENAME VALUE 'INSCRIPTION_REFUSED' TO 'REGISTRATION_REFUSED';
ALTER TYPE "NotificationType" RENAME VALUE 'INSCRIPTION_WAITLISTED' TO 'REGISTRATION_WAITLISTED';
ALTER TYPE "NotificationType" RENAME VALUE 'USER_INTENT_CLAIMED' TO 'EXTERNAL_PARTICIPANT_CLAIMED';

-- 3. Rename implicit many-to-many join tables (metadata-only, no data movement)
ALTER TABLE "_RecordParticipants" RENAME TO "_EntryParticipants";
ALTER TABLE "_RecordUserIntents" RENAME TO "_EntryExternalParticipants";

-- 4. Rename user column (metadata-only)
ALTER TABLE "user" RENAME COLUMN "userIntentsLastChecked" TO "externalParticipantsLastChecked";
