
import { callLLM } from "../generation/llm.js";
import { queryStoreForEval } from "./queryController.js";

export async function generateResponse(queryId:string){
    const query = queryStoreForEval.get(queryId);
    // console.log(query)
    if (!query) {
        console.error("Query not found");
    }
    try {
      if(query?.prompt==="" || query?.prompt===undefined) {
          console.log("Prompt cannot be empty")
          return
      }
    const resposne=callLLM(query.prompt)
      return resposne
  } catch (error) {
    console.log(error)
  }
}