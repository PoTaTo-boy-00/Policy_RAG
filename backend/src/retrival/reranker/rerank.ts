import { cohere } from "../../config/cohere.js";
export type reRankType={
    index:number,
    relevanceScore:number
}
export const reRank = async (query: string, documents: string[]):Promise<reRankType[]> => {
  const response = await cohere.rerank({
    model: "rerank-v3.5",
    query,
    documents,
    topN: 5,
  });
  return response.results.map((result)=>({
    index:result.index,
    relevanceScore:result.relevanceScore
  }));
};
