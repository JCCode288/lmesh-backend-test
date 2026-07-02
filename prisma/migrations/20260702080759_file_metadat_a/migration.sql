/*
  Warnings:

  - Added the required column `metadata` to the `FileDatas` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "FileDatas" ADD COLUMN     "metadata" JSONB NOT NULL;
