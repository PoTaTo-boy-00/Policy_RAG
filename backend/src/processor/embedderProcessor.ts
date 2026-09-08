import { storeDocumentandChunks } from "../db/dbService.js";
import { embedChunks } from "../ingestion/embeddings/embeddingService.js";
import type { TextSplitType } from "./textSplitterProcessor.js";

export const embedderProcessor=async(paths:TextSplitType[])=>{
    console.log(`[Embeder Processor] Started... `)
    for (const p of paths) {
    const embeddedText = await embedChunks(p.textContents);
    await storeDocumentandChunks(p.id, p.name, p.format, p.chunks, embeddedText);
  }
  return
}