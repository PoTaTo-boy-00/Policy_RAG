/**@abstract
 *
 * id,name,format,chunks,embeddings
 *
 */
import { Document as ChunkDocument } from "@langchain/core/documents";
import { prisma } from "../prisma/client.js";
export const storeDocumentandChunks = async (
  fileId: string,
  fileName: string,
  format: string,
  chunks: ChunkDocument[],
  embeddings: number[][],
) => {
  if (chunks.length === 0) return;
  if (chunks.length !== embeddings.length) {
    throw new Error("Mismatch between chunk count and embedding vector count.");
  }
  const chunkInsert = chunks.map((c, idx) => {
    const content = c.pageContent;
    const stringVector = `[${embeddings[idx]?.join(",")}]`;
    return prisma.$executeRaw`
         Insert into "DocumentChunk" ("id","chunkIndex","content","documentId","embedding") 
         values (gen_random_uuid(),${idx},${content},${fileId},${stringVector}::vector)
         `;
  });
  await prisma.$transaction([
    prisma.document.create({
      data: {
        id: fileId,
        name: fileName,
        format: format,
        createdAt: new Date()
      },
    }),
    ...chunkInsert
  ]);
};
