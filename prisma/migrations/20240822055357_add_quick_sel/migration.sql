-- CreateTable
CREATE TABLE "QuickSellEntry" (
    "id" TEXT NOT NULL,
    "itemId" INTEGER NOT NULL,
    "priceType" "Currency",
    "priceCount" INTEGER NOT NULL,

    CONSTRAINT "QuickSellEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "QuickSellEntry_itemId_priceCount_priceType_key" ON "QuickSellEntry"("itemId", "priceCount", "priceType");

-- AddForeignKey
ALTER TABLE "QuickSellEntry" ADD CONSTRAINT "QuickSellEntry_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
