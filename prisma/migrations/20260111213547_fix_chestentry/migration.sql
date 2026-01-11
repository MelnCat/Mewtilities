/*
  Warnings:

  - Changed the type of `pools` on the `ChestEntry` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "ChestEntry" DROP COLUMN "pools",
ADD COLUMN     "pools" JSONB NOT NULL;
