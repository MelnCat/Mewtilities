-- DropForeignKey
ALTER TABLE "Cat" DROP CONSTRAINT "Cat_trinketId_fkey";

-- AlterTable
ALTER TABLE "Cat" ALTER COLUMN "trinketId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Cat" ADD CONSTRAINT "Cat_trinketId_fkey" FOREIGN KEY ("trinketId") REFERENCES "Item"("id") ON DELETE SET NULL ON UPDATE CASCADE;
