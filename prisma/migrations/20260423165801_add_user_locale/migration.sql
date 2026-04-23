-- AlterTable
ALTER TABLE "user" ADD COLUMN     "locale" TEXT,
ADD COLUMN     "localePromptLastChecked" TIMESTAMP(3);
