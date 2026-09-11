/*
  Warnings:

  - A unique constraint covering the columns `[documentId,chunkIndex]` on the table `DocumentChunk` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `allowed` to the `Document` table without a default value. This is not possible if the table is not empty.
  - Added the required column `isDeleted` to the `Document` table without a default value. This is not possible if the table is not empty.
  - Added the required column `chunkIndex` to the `DocumentChunk` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "DocumentChunk_embedding_hnsw_idx";

-- AlterTable
ALTER TABLE "Document" ADD COLUMN     "allowed" BOOLEAN NOT NULL,
ADD COLUMN     "isDeleted" BOOLEAN NOT NULL,
ALTER COLUMN "createdAt" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "DocumentChunk" ADD COLUMN     "chunkIndex" INTEGER NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "DocumentChunk_documentId_chunkIndex_key" ON "DocumentChunk"("documentId", "chunkIndex");
