-- DropForeignKey
ALTER TABLE "record" DROP CONSTRAINT "record_categoryId_fkey";

-- AddForeignKey
ALTER TABLE "record" ADD CONSTRAINT "record_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "category"("id") ON DELETE CASCADE ON UPDATE CASCADE;
