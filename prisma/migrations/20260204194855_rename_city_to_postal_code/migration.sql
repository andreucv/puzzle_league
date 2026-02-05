-- AlterTable
ALTER TABLE "competition" ADD COLUMN     "postalCode" TEXT;

-- AlterTable: Rename city to postalCode (preserving data)
ALTER TABLE "user" RENAME COLUMN "city" TO "postalCode";
