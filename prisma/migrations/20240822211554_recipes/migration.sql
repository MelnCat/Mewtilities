-- CreateTable
CREATE TABLE "Recipe" (
    "resultId" INTEGER NOT NULL,

    CONSTRAINT "Recipe_pkey" PRIMARY KEY ("resultId")
);

-- CreateTable
CREATE TABLE "_ItemToUsage" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_ItemToUsage_AB_unique" ON "_ItemToUsage"("A", "B");

-- CreateIndex
CREATE INDEX "_ItemToUsage_B_index" ON "_ItemToUsage"("B");

-- AddForeignKey
ALTER TABLE "Recipe" ADD CONSTRAINT "Recipe_resultId_fkey" FOREIGN KEY ("resultId") REFERENCES "Item"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ItemToUsage" ADD CONSTRAINT "_ItemToUsage_A_fkey" FOREIGN KEY ("A") REFERENCES "Item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ItemToUsage" ADD CONSTRAINT "_ItemToUsage_B_fkey" FOREIGN KEY ("B") REFERENCES "Recipe"("resultId") ON DELETE CASCADE ON UPDATE CASCADE;
