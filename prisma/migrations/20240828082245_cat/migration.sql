/*
  Warnings:

  - Added the required column `ageNumber` to the `Cat` table without a default value. This is not possible if the table is not empty.
  - Added the required column `ageType` to the `Cat` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Cat" ADD COLUMN     "ageNumber" TEXT NOT NULL,
ADD COLUMN     "ageType" TEXT NOT NULL,
ALTER COLUMN "job" DROP NOT NULL,
ALTER COLUMN "class" DROP NOT NULL,
ALTER COLUMN "strength" DROP NOT NULL,
ALTER COLUMN "agility" DROP NOT NULL,
ALTER COLUMN "health" DROP NOT NULL,
ALTER COLUMN "finesse" DROP NOT NULL,
ALTER COLUMN "cleverness" DROP NOT NULL,
ALTER COLUMN "perception" DROP NOT NULL,
ALTER COLUMN "luck" DROP NOT NULL,
ALTER COLUMN "bravery" DROP NOT NULL,
ALTER COLUMN "benevolence" DROP NOT NULL,
ALTER COLUMN "energy" DROP NOT NULL,
ALTER COLUMN "extroversion" DROP NOT NULL,
ALTER COLUMN "dedication" DROP NOT NULL,
ALTER COLUMN "ownerName" DROP NOT NULL,
ALTER COLUMN "classXp" DROP NOT NULL,
ALTER COLUMN "jobXp" DROP NOT NULL,
ALTER COLUMN "bio" DROP NOT NULL,
ALTER COLUMN "ownerId" DROP NOT NULL;
