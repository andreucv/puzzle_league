/*
  Warnings:

  - A unique constraint covering the columns `[userId,role]` on the table `role_assignment` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "role_assignment_userId_role_key" ON "role_assignment"("userId", "role");
