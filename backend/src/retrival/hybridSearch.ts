import type { Document, DocumentInterface } from "@langchain/core/documents";
import type { ChunkQueryResult } from "./denseSearch.js";
import type { ChunkMetadata } from "./sparseSearch.js";
export type HybridSearchResType={
  idx:string,
    id:string,
    content:string,
    chunkIndex:number,
    documentId:string,
    docName:string,
    rrfScore:number
}
export const hybridSearch =  (
  denseSearchRes: ChunkQueryResult[],
  sparseSearchRes: Document<ChunkMetadata>[],
  topK: number,
):HybridSearchResType[] => {
  const scores = new Map();
  const chunkData = new Map();
  // calc rank for dense search
  denseSearchRes.forEach((chunk, idx) => {
    const id = chunk.chunkId;
    const rank = idx + 1;
    const rrfScore = 1.0 / (60 + rank);
    scores.set(id, (scores.get(id) || 0) + rrfScore);
    chunkData.set(id, {
      id,
      docName:chunk.documentName, 
      content: chunk.content,
      chunkIndex: chunk.chunkIndex,
      documentId: chunk.documentId,
    });
  });
  sparseSearchRes.forEach((chunk, idx) => {
    const id = chunk.id;
    const rank = idx + 1;
    const rrfScore = 1.0 / (60 + rank);
    scores.set(id, (scores.get(id) || 0) + rrfScore);
    chunkData.set(id, {
      id,
      docName:chunk.metadata.docName,
      content: chunk.pageContent,
      chunkIndex: chunk.metadata.chunkIdx,
      documentId: chunk.metadata.docId,
    });
  });
  const hybridSearchRes = Array.from(scores.entries())
    .map(([id, rrfScore],idx) => ({
      index:idx,
      ...chunkData.get(id),
      rrfScore,
    }))
    .sort((a, b) => b.rrfScore - a.rrfScore)
    .slice(0, topK);

  return hybridSearchRes;
};
