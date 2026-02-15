-- RenameColumn
ALTER TABLE "category" RENAME COLUMN "name" TO "description";

-- CreateTable
CREATE TABLE "puzzle" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "pieces" INTEGER NOT NULL,
    "image_cld_id" TEXT,
    "brand" TEXT NOT NULL,
    "serialNumber" TEXT,
    "barcode" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "puzzle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_CategoryToPuzzle" (
    "A" INTEGER NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_CategoryToPuzzle_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "puzzle_barcode_key" ON "puzzle"("barcode");

-- CreateIndex
CREATE INDEX "_CategoryToPuzzle_B_index" ON "_CategoryToPuzzle"("B");

-- AddForeignKey
ALTER TABLE "_CategoryToPuzzle" ADD CONSTRAINT "_CategoryToPuzzle_A_fkey" FOREIGN KEY ("A") REFERENCES "category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CategoryToPuzzle" ADD CONSTRAINT "_CategoryToPuzzle_B_fkey" FOREIGN KEY ("B") REFERENCES "puzzle"("id") ON DELETE CASCADE ON UPDATE CASCADE;
