import { ChatOllama } from "@langchain/ollama";
import type { rewriteMessageType } from "../retrival/pre-retrival.js";

const OLLAMA_URL = process.env.OLLAMA_BASE_URL || "http://localhost:11434";

const gemmaLLM = new ChatOllama({
  model: "gemma4",
  temperature: 0,
  think: false,
  baseUrl: OLLAMA_URL,
  keepAlive: "15m",
  stop: [
    "### INSTRUCTIONS:",
    "### CONTEXT:",
    "### RULES:",
    "USER QUESTION:",
    "### ANSWER WITH CITATIONS:",
    "```html",
    "```javascript",
    "```typescript",
  ],
});

const preRetrivalLLM = new ChatOllama({
  model: "gemma4",
  temperature: 0.1,
  baseUrl: OLLAMA_URL,
  keepAlive: "15m", 
});

export const callLLM = async (prompt: string): Promise<string> => {
  const start=performance.now()
  const res = await gemmaLLM.invoke(prompt);
  console.log(
    "[LLM] latency:",
    `${(performance.now() - start).toFixed(0)}ms`
  );

  console.log("[LLM] metadata:", res.response_metadata);

  return res.content as string;
};

export const callLLMSream = async function *(prompt: string) {
  const start=performance.now()
  const res = await gemmaLLM.stream(prompt);
  for await(const chunk of res){
    
    if(typeof chunk.content==="string"){
      // console.log(chunk)
      yield chunk.content
    }
  }
  console.log(
    "[LLM] latency:",
    `${(performance.now() - start).toFixed(0)}ms`
  );
};

export const callGemma = async (prompt: rewriteMessageType[]): Promise<string[]> => {
   // console.log("first")
  const res = await preRetrivalLLM.invoke(prompt);
  const content = res.content as string;
  console.log("[RAW GEMMA CONTENT]:", content);

  try {
     const cleanedContent = content
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();
    const queries=JSON.parse(cleanedContent)
    if(!Array.isArray(queries) || queries.every(q=>typeof q!=="string")){
      throw new Error("Gemma returned an invalid query format");
    }
    return queries
  } catch (error) {
     throw new Error("Failed to parse Gemma response as string array");
  }
};