-- CreateTable
CREATE TABLE "ChestEntry" (
    "id" INTEGER NOT NULL,
    "pools" JSONB[],
    "notes" INTEGER,
    "essence" INTEGER,
    "cat" TEXT,

    CONSTRAINT "ChestEntry_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ChestEntry" ADD CONSTRAINT "ChestEntry_id_fkey" FOREIGN KEY ("id") REFERENCES "Item"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
