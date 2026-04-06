-- Rename InscriptionStatus: PENDING → PENDING_CONFIRMATION, ACCEPTED → CONFIRMED
-- Two-step: create new type, migrate data, swap types, drop old type.

-- Step 1: InscriptionStatus rename
BEGIN;

-- Create the replacement enum with the new values
CREATE TYPE "InscriptionStatus_new" AS ENUM ('PENDING_CONFIRMATION', 'CONFIRMED', 'WAITLISTED');

-- Drop default so we can alter the column type
ALTER TABLE "record" ALTER COLUMN "status" DROP DEFAULT;

-- Convert existing data: map old values → new values via text cast
ALTER TABLE "record"
  ALTER COLUMN "status" TYPE "InscriptionStatus_new"
  USING (
    CASE "status"::text
      WHEN 'PENDING' THEN 'PENDING_CONFIRMATION'
      WHEN 'ACCEPTED' THEN 'CONFIRMED'
      ELSE "status"::text
    END
  )::"InscriptionStatus_new";

-- Swap type names
ALTER TYPE "InscriptionStatus" RENAME TO "InscriptionStatus_old";
ALTER TYPE "InscriptionStatus_new" RENAME TO "InscriptionStatus";
DROP TYPE "InscriptionStatus_old";

-- Restore default
ALTER TABLE "record" ALTER COLUMN "status" SET DEFAULT 'PENDING_CONFIRMATION';

COMMIT;

-- Step 2: NotificationType rename (INSCRIPTION_ACCEPTED → INSCRIPTION_CONFIRMED)
BEGIN;

CREATE TYPE "NotificationType_new" AS ENUM (
  'INSCRIPTION_CREATED',
  'INSCRIPTION_CONFIRMED',
  'INSCRIPTION_REFUSED',
  'INSCRIPTION_WAITLISTED',
  'COMPETITION_STARTED',
  'COMPETITION_CANCELLED',
  'ROLE_REQUEST_APPROVED',
  'ROLE_REQUEST_REJECTED',
  'USER_INTENT_CLAIMED',
  'GENERAL'
);

ALTER TABLE "notification"
  ALTER COLUMN "type" TYPE "NotificationType_new"
  USING (
    CASE "type"::text
      WHEN 'INSCRIPTION_ACCEPTED' THEN 'INSCRIPTION_CONFIRMED'
      ELSE "type"::text
    END
  )::"NotificationType_new";

ALTER TYPE "NotificationType" RENAME TO "NotificationType_old";
ALTER TYPE "NotificationType_new" RENAME TO "NotificationType";
DROP TYPE "NotificationType_old";

COMMIT;
