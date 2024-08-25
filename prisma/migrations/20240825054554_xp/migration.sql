/*
  Warnings:

  - Added the required column `classXp` to the `Cat` table without a default value. This is not possible if the table is not empty.
  - Added the required column `jobXp` to the `Cat` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Cat" ADD COLUMN     "classXp" JSONB NOT NULL,
ADD COLUMN     "jobXp" JSONB NOT NULL;
