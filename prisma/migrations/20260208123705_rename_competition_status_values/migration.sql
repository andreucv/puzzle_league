/*
  Rename CompetitionStatus enum values:
  - UPCOMING  -> NOT_STARTED
  - ACTIVE    -> STARTED
  - COMPLETED -> FINISHED
  - CANCELLED stays unchanged
*/
-- AlterEnum: Rename existing values before swapping the type
BEGIN;

-- 1. Add new values to the existing enum
ALTER TYPE "CompetitionStatus" ADD VALUE IF NOT EXISTS 'NOT_STARTED';
ALTER TYPE "CompetitionStatus" ADD VALUE IF NOT EXISTS 'STARTED';
ALTER TYPE "CompetitionStatus" ADD VALUE IF NOT EXISTS 'FINISHED';

COMMIT;

-- 2. Migrate existing data to new values (must be outside the ADD VALUE transaction)
UPDATE "competition" SET "status" = 'NOT_STARTED' WHERE "status" = 'UPCOMING';
UPDATE "competition" SET "status" = 'STARTED' WHERE "status" = 'ACTIVE';
UPDATE "competition" SET "status" = 'FINISHED' WHERE "status" = 'COMPLETED';

-- 3. Recreate enum without old values
BEGIN;
CREATE TYPE "CompetitionStatus_new" AS ENUM ('NOT_STARTED', 'STARTED', 'FINISHED', 'CANCELLED');
ALTER TABLE "competition" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "competition" ALTER COLUMN "status" TYPE "CompetitionStatus_new" USING ("status"::text::"CompetitionStatus_new");
ALTER TYPE "CompetitionStatus" RENAME TO "CompetitionStatus_old";
ALTER TYPE "CompetitionStatus_new" RENAME TO "CompetitionStatus";
DROP TYPE "CompetitionStatus_old";
ALTER TABLE "competition" ALTER COLUMN "status" SET DEFAULT 'NOT_STARTED';
COMMIT;
