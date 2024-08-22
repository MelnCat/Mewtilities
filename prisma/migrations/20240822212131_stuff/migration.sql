/*
  Warnings:

  - The primary key for the `Recipe` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the `_ItemToUsage` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[resultId]` on the table `Recipe` will be added. If there are existing duplicate values, this will fail.
  - The required column `id` was added to the `Recipe` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.

*/
-- DropForeignKey
ALTER TABLE "_ItemToUsage" DROP CONSTRAINT "_ItemToUsage_A_fkey";

-- DropForeignKey
ALTER TABLE "_ItemToUsage" DROP CONSTRAINT "_ItemToUsage_B_fkey";

-- AlterTable
ALTER TABLE "Recipe" DROP CONSTRAINT "Recipe_pkey",
ADD COLUMN     "id" TEXT NOT NULL,
ADD CONSTRAINT "Recipe_pkey" PRIMARY KEY ("id");

-- DropTable
DROP TABLE "_ItemToUsage";

-- CreateTable
CREATE TABLE "RecipeIngredient" (
    "itemId" INTEGER NOT NULL,
    "recipeId" TEXT NOT NULL,
    "count" INTEGER NOT NULL,

    CONSTRAINT "RecipeIngredient_pkey" PRIMARY KEY ("itemId","recipeId")
);

-- CreateIndex
CREATE UNIQUE INDEX "Recipe_resultId_key" ON "Recipe"("resultId");

-- AddForeignKey
ALTER TABLE "RecipeIngredient" ADD CONSTRAINT "RecipeIngredient_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecipeIngredient" ADD CONSTRAINT "RecipeIngredient_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipe"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
