/*
  Warnings:

  - You are about to drop the column `headingPath` on the `DocumentChunk` table. All the data in the column will be lost.
  - You are about to drop the column `section` on the `DocumentChunk` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "DocumentChunk" DROP COLUMN "headingPath",
DROP COLUMN "section";
