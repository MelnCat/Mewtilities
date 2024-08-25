/*
  Warnings:

  - Added the required column `location` to the `Cat` table without a default value. This is not possible if the table is not empty.
  - Added the required column `ownerId` to the `Cat` table without a default value. This is not possible if the table is not empty.
  - Added the required column `ownerName` to the `Cat` table without a default value. This is not possible if the table is not empty.
  - Added the required column `travelling` to the `Cat` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Cat" ADD COLUMN     "location" TEXT NOT NULL,
ADD COLUMN     "ownerId" TEXT NOT NULL,
ADD COLUMN     "ownerName" TEXT NOT NULL,
ADD COLUMN     "travelling" BOOLEAN NOT NULL,
ALTER COLUMN "sizeLb" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "sizeKg" SET DATA TYPE DOUBLE PRECISION;
