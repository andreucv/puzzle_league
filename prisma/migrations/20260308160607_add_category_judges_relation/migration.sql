-- CreateTable
CREATE TABLE "_CategoryJudges" (
    "A" INTEGER NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_CategoryJudges_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_CategoryJudges_B_index" ON "_CategoryJudges"("B");

-- AddForeignKey
ALTER TABLE "_CategoryJudges" ADD CONSTRAINT "_CategoryJudges_A_fkey" FOREIGN KEY ("A") REFERENCES "category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CategoryJudges" ADD CONSTRAINT "_CategoryJudges_B_fkey" FOREIGN KEY ("B") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
