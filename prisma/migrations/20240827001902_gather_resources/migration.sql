-- CreateTable
CREATE TABLE "ResourceGather" (
    "id" TEXT NOT NULL,
    "roll" INTEGER NOT NULL,
    "skillBonus" INTEGER NOT NULL,
    "profession" TEXT NOT NULL,
    "catName" TEXT NOT NULL,
    "catId" INTEGER NOT NULL,
    "extraText" TEXT,

    CONSTRAINT "ResourceGather_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResourceGatherResult" (
    "itemId" INTEGER NOT NULL,
    "resourceGatherId" TEXT NOT NULL,
    "count" INTEGER NOT NULL,

    CONSTRAINT "ResourceGatherResult_pkey" PRIMARY KEY ("itemId","resourceGatherId")
);

-- AddForeignKey
ALTER TABLE "ResourceGatherResult" ADD CONSTRAINT "ResourceGatherResult_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResourceGatherResult" ADD CONSTRAINT "ResourceGatherResult_resourceGatherId_fkey" FOREIGN KEY ("resourceGatherId") REFERENCES "ResourceGather"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
