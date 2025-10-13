/*
  Warnings:

  - You are about to drop the `Account` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `User` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."Account" DROP CONSTRAINT "Account_userId_fkey";

-- AlterTable
ALTER TABLE "public"."UserCat" ADD COLUMN     "flipped" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "pose" TEXT NOT NULL DEFAULT 'playing';

-- DropTable
DROP TABLE "public"."Account";

-- DropTable
DROP TABLE "public"."User";
