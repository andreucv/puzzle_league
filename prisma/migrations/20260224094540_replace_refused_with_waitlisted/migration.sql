/*
  Warnings:

  - The values [REFUSED] on the enum `InscriptionStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- Delete any existing REFUSED records before removing the enum value
DELETE FROM "record" WHERE "status" = 'REFUSED';

-- AlterEnum
BEGIN;
CREATE TYPE "InscriptionStatus_new" AS ENUM ('PENDING', 'ACCEPTED', 'WAITLISTED');
ALTER TABLE "public"."record" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "record" ALTER COLUMN "status" TYPE "InscriptionStatus_new" USING ("status"::text::"InscriptionStatus_new");
ALTER TYPE "InscriptionStatus" RENAME TO "InscriptionStatus_old";
ALTER TYPE "InscriptionStatus_new" RENAME TO "InscriptionStatus";
DROP TYPE "public"."InscriptionStatus_old";
ALTER TABLE "record" ALTER COLUMN "status" SET DEFAULT 'PENDING';
COMMIT;

-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'INSCRIPTION_WAITLISTED';
