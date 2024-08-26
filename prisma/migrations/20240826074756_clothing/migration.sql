/*
  Warnings:

  - You are about to drop the column `appearance` on the `Cat` table. All the data in the column will be lost.
  - You are about to drop the column `clothes` on the `Cat` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Cat" DROP COLUMN "appearance",
DROP COLUMN "clothes",
ADD COLUMN     "clothing" INTEGER[];
