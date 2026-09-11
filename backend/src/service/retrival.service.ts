import { embedUserQuestion } from "../ingestion/embeddings/embeddingService.js";
import { measure } from "../performance/measure.js";
import { denseSearch } from "../retrival/denseSearch.js";
import { hybridSearch, type HybridSearchResType } from "../retrival/hybridSearch.js";
import { reRank } from "../retrival/reranker/rerank.js";
import { sparseSearch } from "../retrival/sparseSearch.js";

export const retriveAndRerank=async(query:string,pathIds:string[]):Promise<HybridSearchResType[]>=>{
     const userEmbeds = await embedUserQuestion(query);
  if (!userEmbeds || userEmbeds.length === 0) {
    throw new Error("Failed to generate vector embeddings");
  }
  const [sparseSearchResult, denseSearchResult] = await measure("[Hybrid Search]",()=>Promise.all([
    sparseSearch(pathIds, query),
    denseSearch(userEmbeds, pathIds),
  ]));

  const hybridSearchRes = hybridSearch(
    denseSearchResult,
    sparseSearchResult,
    10, // need to get 20 resuklt
  );
  console.log("[Hybrid Search Res] ",hybridSearchRes)
  //  feed those 20 res to a rertanker along with our query anbd then it will send the top 5 similar chunks 
 
  const documents=hybridSearchRes.map((res)=>{
    return res.content
  })
  const rerankres=await reRank(query,documents)
  console.log("[Reranker Res] ",rerankres)
  return rerankres.slice(0,5).map(rank=>hybridSearchRes[rank.index]!)
}