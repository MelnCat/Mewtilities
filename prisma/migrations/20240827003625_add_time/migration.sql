/*
  Warnings:

  - Added the required column `time` to the `ResourceGather` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ResourceGather" ADD COLUMN     "time" TEXT NOT NULL;
