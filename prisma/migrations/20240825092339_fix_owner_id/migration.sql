/*
  Warnings:

  - Changed the type of `ownerId` on the `Cat` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "Cat" DROP COLUMN "ownerId",
ADD COLUMN     "ownerId" INTEGER NOT NULL;
