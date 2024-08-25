/*
  Warnings:

  - A unique constraint covering the columns `[itemId,priceCount]` on the table `QuickSellEntry` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "QuickSellEntry_itemId_priceCount_priceType_key";

-- AlterTable
ALTER TABLE "Item" ADD COLUMN     "custom" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "customData" JSONB;

-- CreateIndex
CREATE UNIQUE INDEX "QuickSellEntry_itemId_priceCount_key" ON "QuickSellEntry"("itemId", "priceCount");
