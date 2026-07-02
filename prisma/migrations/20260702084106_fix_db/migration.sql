/*
  Warnings:

  - You are about to drop the column `finsihedAt` on the `Analysis` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Analysis" DROP COLUMN "finsihedAt",
ADD COLUMN     "finishedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "FileDatas" ALTER COLUMN "metadata" DROP NOT NULL;
