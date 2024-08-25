/*
  Warnings:

  - A unique constraint covering the columns `[itemId,priceCount,priceType]` on the table `QuickSellEntry` will be added. If there are existing duplicate values, this will fail.
  - Made the column `priceType` on table `QuickSellEntry` required. This step will fail if there are existing NULL values in that column.

*/
-- DropIndex
DROP INDEX "QuickSellEntry_itemId_priceCount_key";

UPDATE "QuickSellEntry" SET "priceType" = 'NOTE' where "priceType" IS NULL;
-- AlterTable
ALTER TABLE "QuickSellEntry" ALTER COLUMN "priceType" SET NOT NULL,
ALTER COLUMN "priceType" SET DEFAULT 'NOTE';

-- CreateIndex
CREATE UNIQUE INDEX "QuickSellEntry_itemId_priceCount_priceType_key" ON "QuickSellEntry"("itemId", "priceCount", "priceType");
