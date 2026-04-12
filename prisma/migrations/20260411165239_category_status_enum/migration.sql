/*
  Convert category.status from text to CategoryStatus enum.
  Preserves existing data by mapping old string values to new enum values.
*/

-- CreateEnum
CREATE TYPE "CategoryStatus" AS ENUM ('NOT_STARTED', 'LIVE', 'COMPLETE', 'CANCELED');

-- Convert existing string values to match enum values
UPDATE "category" SET "status" = 'NOT_STARTED' WHERE "status" = 'not_started';
UPDATE "category" SET "status" = 'LIVE' WHERE "status" = 'in_progress';
UPDATE "category" SET "status" = 'COMPLETE' WHERE "status" = 'completed';

-- Alter column type from text to enum (using USING clause for safe cast)
-- Must drop the default first, then cast, then re-set the default
ALTER TABLE "category" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "category"
  ALTER COLUMN "status" TYPE "CategoryStatus" USING "status"::"CategoryStatus";
ALTER TABLE "category" ALTER COLUMN "status" SET DEFAULT 'NOT_STARTED'::"CategoryStatus";
