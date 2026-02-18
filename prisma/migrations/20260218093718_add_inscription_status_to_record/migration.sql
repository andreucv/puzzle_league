-- CreateEnum
CREATE TYPE "InscriptionStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REFUSED');

-- AlterTable
ALTER TABLE "record" ADD COLUMN     "status" "InscriptionStatus" NOT NULL DEFAULT 'PENDING';
