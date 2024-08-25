/*
  Warnings:

  - Added the required column `genetic` to the `Cat` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Cat" ADD COLUMN     "genetic" TEXT NOT NULL;
