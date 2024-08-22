-- CreateEnum
CREATE TYPE "Season" AS ENUM ('SPRING', 'SUMMER', 'AUTUMN', 'WINTER');

-- CreateEnum
CREATE TYPE "Event" AS ENUM ('SNOWMELT', 'MIDSUMMER_FESTIVAL', 'LEAF_DAY', 'CANDLELIGHT_FESTIVAL');

-- CreateEnum
CREATE TYPE "Currency" AS ENUM ('NOTE', 'ESSENCE', 'SNOWMELT_STAMP', 'LEAF_DAY_STAMP', 'LOST_BUTTON', 'FESTIVAL_TICKET');

-- CreateTable
CREATE TABLE "Item" (
    "id" INTEGER NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "image" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "seasons" "Season"[],
    "extraText" TEXT[],
    "info" JSONB NOT NULL,

    CONSTRAINT "Item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarketEntry" (
    "id" INTEGER NOT NULL,
    "itemId" INTEGER NOT NULL,
    "itemCount" INTEGER NOT NULL,
    "sellerId" INTEGER NOT NULL,
    "sellerName" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "priceType" "Currency" NOT NULL,
    "priceCount" INTEGER NOT NULL,
    "expiryTime" TIMESTAMP(3) NOT NULL,
    "creationTime" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MarketEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Shop" (
    "url" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "previewImage" TEXT NOT NULL,
    "image" TEXT,
    "blurb" TEXT,

    CONSTRAINT "Shop_pkey" PRIMARY KEY ("url")
);

-- CreateTable
CREATE TABLE "ShopEntry" (
    "id" TEXT NOT NULL,
    "itemId" INTEGER NOT NULL,
    "shopUrl" TEXT NOT NULL,
    "priceType" "Currency" NOT NULL,
    "priceCount" INTEGER NOT NULL,
    "event" "Event",

    CONSTRAINT "ShopEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Shop_name_key" ON "Shop"("name");

-- CreateIndex
CREATE UNIQUE INDEX "ShopEntry_shopUrl_itemId_priceCount_priceType_key" ON "ShopEntry"("shopUrl", "itemId", "priceCount", "priceType");

-- AddForeignKey
ALTER TABLE "MarketEntry" ADD CONSTRAINT "MarketEntry_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShopEntry" ADD CONSTRAINT "ShopEntry_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShopEntry" ADD CONSTRAINT "ShopEntry_shopUrl_fkey" FOREIGN KEY ("shopUrl") REFERENCES "Shop"("url") ON DELETE RESTRICT ON UPDATE CASCADE;
