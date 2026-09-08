
import { callGemma } from "../generation/llm.js";

const OLLAMA_URL = process.env.OLLAMA_BASE_URL || "http://localhost:11434";
export type rewriteMessageType={
    role:string,
    content:string
}
export const rewriteQuery = async (query: string) => {
    console.log("[rewitw query] called")
    const message:rewriteMessageType[]=[
        {
          role: "system",
          content: `You are a search query optimization assistant.
Your job is to rephrase raw, conversational user questions into concise, high-density search queries optimized for vector and keyword search.

Rules:
- Strip out conversational filler (e.g., "hello", "can you tell me", "please").
- Expand abbreviations or vague terms into clear domain terms.
- Output ONLY the rewritten query text. Do NOT explain or wrap in quotes.`,
        },
        {
          role: "user",
          content: query,
        },
    ]
  try {
//    console.log(message)
    const res=await callGemma(message)
    return res
  } catch (error) {
    console.error("Failed to rewrite query, falling back to raw question:", error);
    return query;
  }
};
