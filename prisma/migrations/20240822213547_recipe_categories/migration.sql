/*
  Warnings:

  - Added the required column `category` to the `Recipe` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "RecipeCategory" AS ENUM ('APOTHECARY', 'CLOTHIER', 'SCRIBE', 'ARTIST', 'BLACKSMITH', 'CRAFTSCAT', 'BUILDER', 'MASON', 'BAKER');

-- AlterTable
ALTER TABLE "Recipe" ADD COLUMN     "category" "RecipeCategory" NOT NULL;
