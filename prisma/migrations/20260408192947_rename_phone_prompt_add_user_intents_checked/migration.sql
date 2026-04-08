-- AlterTable: rename phonePromptSeenAt → phonePromptLastChecked, add userIntentsLastChecked
ALTER TABLE "user" RENAME COLUMN "phonePromptSeenAt" TO "phonePromptLastChecked";
ALTER TABLE "user" ADD COLUMN "userIntentsLastChecked" TIMESTAMP(3);
