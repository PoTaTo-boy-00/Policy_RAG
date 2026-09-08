import type { fileDetails } from "../app.js";
import { textSplitter } from "../ingestion/splitting/splitter.js";
import {Document as ChunkDoc} from "@langchain/core/documents"
export type TextSplitType = Omit<fileDetails, "data"> & {
  textContents: string[];
  chunks: ChunkDoc[];
};
export const textSplitterProcessor = async (paths: fileDetails[]):Promise<TextSplitType[]> => {
  console.log("[Processor] text Splitter called");
  const data: TextSplitType[] = [];

  for (const p of paths) {
    if (!p.data) continue;
    const chunks = await textSplitter(p);
    // console.log("FILE NAME:", p.name)
    const textContents: string[] = chunks.map((c) => c.pageContent);
    data.push({
      id: p.id,
      name: p.name,
      format: p.format,
      chunks,
      textContents,
    });
  }
//   console.log(data);
  return data;
};
