import { pipeline } from "@huggingface/transformers";
import { cohere } from "../../config/cohere.js";
export type reRankType={
    index:number,
    relevanceScore:number
}

export const reRank = async (query: string, documents: string[]):Promise<reRankType[]> => {
  const response = await cohere.rerank({
    model: "rerank-v4.0-fast",
    query,
    documents,
    topN: 5,
  });
  return response.results.map((result)=>({
    index:result.index,
    relevanceScore:result.relevanceScore
  }));
};
