import { ChatOllama } from "@langchain/ollama";
import type { rewriteMessageType } from "../retrival/pre-retrival.js";
import { z } from "zod";
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
  think:false,
  baseUrl: OLLAMA_URL,
  keepAlive: "15m",
});

const retrievalRelevanceLLM = new ChatOllama({
  model: "gemma4",
  temperature: 0,
  think:false,
  baseUrl: OLLAMA_URL!,
  keepAlive: "15m",
}).withStructuredOutput(
  z
    .object({
      explanation: z.string().describe("Explain your reasoning for the score"),
      coverageScore: z
      .number()
        .min(0)
        .max(1)
        .describe(
          "Provide the score on if the answer hallucinates from the documents",
        ),
    })
    .describe("Grounded score for the answer from the retrieved documents."),

);

export const callLLM = async (prompt: string): Promise<string> => {
  const start = performance.now();
  const res = await gemmaLLM.invoke(prompt);
  console.log("[LLM] latency:", `${(performance.now() - start).toFixed(0)}ms`);

  console.log("[LLM] metadata:", res.response_metadata);

  return res.content as string;
};

export const callLLMSream = async function* (prompt: string) {
  const start = performance.now();
  const res = await gemmaLLM.stream(prompt);
  for await (const chunk of res) {
    if (typeof chunk.content === "string") {
      // console.log(chunk)
      yield chunk.content;
    }
  }
  console.log("[LLM] latency:", `${(performance.now() - start).toFixed(0)}ms`);
};

export const callGemma = async (
  prompt: rewriteMessageType[],
): Promise<string[]> => {
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
    const queries = JSON.parse(cleanedContent);
    if (
      !Array.isArray(queries) ||
      queries.every((q) => typeof q !== "string")
    ) {
      throw new Error("Gemma returned an invalid query format");
    }
    return queries;
  } catch (error) {
    throw new Error("Failed to parse Gemma response as string array");
  }
};

export const callCompressionQuery=async(prompt:rewriteMessageType[]):Promise<string[]>=>{
  try {
    const res=await preRetrivalLLM.invoke(prompt)
    const content=res.content as string
    const cleanedContent = content
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
    const queries=JSON.parse(cleanedContent)
    console.log(queries)
   
   if (
      !Array.isArray(queries) ||
      queries.every((q) => typeof q !== "string")
    ) {
      throw new Error("Gemma returned an invalid query format");
    }
    console.log("[COMPRESSION QUERY ]",queries)
    return queries;
  } catch (error) {
    throw new Error("Failed to parse Gemma response as string array");
  }
}

export const callEvalLLM = async (
  prompt: string,
  answer: string,
) => {
  console.log("[Eval] Before invoke");

  const system_and_base_prompt = [
    {
      role: "system",
      content: prompt,
    },
    {
      role: "user",
      content: answer,
    },
  ];

  console.log("[Eval] Sending to Ollama");

  const grade = await retrievalRelevanceLLM.invoke(system_and_base_prompt);

  console.log("[Eval] Ollama returned");
  console.log("[Eval] Grade:", grade);

  return {
    key: "retrieval_relevance",
    groundScore: grade.coverageScore,
  };
};