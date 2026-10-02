-- Category.registrationOpen becomes the single source of truth (#90).
-- Preserve current behavior: categories of a closed competition become closed.
UPDATE "category" SET "registrationOpen" = false
FROM "competition"
WHERE "category"."competitionId" = "competition"."id"
  AND "competition"."registrationOpen" = false;

-- New categories start closed (competitions used to start closed).
ALTER TABLE "category" ALTER COLUMN "registrationOpen" SET DEFAULT false;

-- AlterTable
ALTER TABLE "competition" DROP COLUMN "registrationOpen";
