
import { callGemma } from "../generation/llm.js";
import { queryModificationPrompt } from "../generation/queryModifyPrompt.js";

export type rewriteMessageType={
    role:string,
    content:string
}
export const rewriteQuery = async (query: string) : Promise<string[]>=> {
    // console.log("[rewitw query] called")
    const message:rewriteMessageType[]=queryModificationPrompt(query)
    try {
      //    console.log(message)
      const res=await callGemma(message)
      console.log("[REWRITE QUERY RES]: ",res)
    return res
  } catch (error) {
    console.error("Failed to rewrite query, falling back to raw question:", error);
    return [query];
  }
};
