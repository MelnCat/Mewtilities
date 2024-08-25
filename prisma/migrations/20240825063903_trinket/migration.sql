/*
  Warnings:

  - You are about to drop the column `heldTrinket` on the `Cat` table. All the data in the column will be lost.
  - Added the required column `trinketId` to the `Cat` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Cat" DROP COLUMN "heldTrinket",
ADD COLUMN     "trinketId" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "Cat" ADD CONSTRAINT "Cat_trinketId_fkey" FOREIGN KEY ("trinketId") REFERENCES "Item"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
