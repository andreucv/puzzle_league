-- CreateIndex
CREATE INDEX "competition_status_startDate_idx" ON "competition"("status", "startDate");

-- CreateIndex
CREATE INDEX "competition_leagueId_idx" ON "competition"("leagueId");

-- CreateIndex
CREATE INDEX "competition_creatorId_idx" ON "competition"("creatorId");

-- CreateIndex
CREATE INDEX "category_competitionId_idx" ON "category"("competitionId");

-- CreateIndex
CREATE INDEX "entry_categoryId_idx" ON "entry"("categoryId");

-- CreateIndex
CREATE INDEX "entry_creatorId_idx" ON "entry"("creatorId");

-- CreateIndex
CREATE INDEX "request_competitionId_idx" ON "request"("competitionId");

-- CreateIndex
CREATE INDEX "request_userId_idx" ON "request"("userId");
