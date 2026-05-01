-- AlterTable
ALTER TABLE "record" ADD COLUMN "confirmedAt" TIMESTAMP(3);

-- Backfill: set confirmedAt = updatedAt for already-confirmed records
UPDATE "record" SET "confirmedAt" = "updatedAt" WHERE "status" = 'CONFIRMED' AND "confirmedAt" IS NULL;
