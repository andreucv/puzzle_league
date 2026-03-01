-- AlterTable
ALTER TABLE "category" ADD COLUMN     "price" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "competition" ADD COLUMN     "paymentMethod" TEXT;
