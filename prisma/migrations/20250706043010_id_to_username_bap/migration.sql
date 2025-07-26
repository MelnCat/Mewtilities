/*
  Warnings:

  - The primary key for the `BapEntry` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `BapEntry` table. All the data in the column will be lost.
  - Added the required column `username` to the `BapEntry` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "BapEntry" DROP CONSTRAINT "BapEntry_pkey",
DROP COLUMN "id",
ADD COLUMN     "username" TEXT NOT NULL,
ADD CONSTRAINT "BapEntry_pkey" PRIMARY KEY ("username");
