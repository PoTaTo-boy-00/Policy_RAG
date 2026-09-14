/*
  Warnings:

  - Added the required column `headingPath` to the `DocumentChunk` table without a default value. This is not possible if the table is not empty.
  - Added the required column `section` to the `DocumentChunk` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "DocumentChunk" ADD COLUMN     "headingPath" TEXT NOT NULL,
ADD COLUMN     "section" TEXT NOT NULL;
