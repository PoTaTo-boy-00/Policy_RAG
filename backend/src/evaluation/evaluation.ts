import type { Sources } from "../app.js";
import { retrievalRelevanceInstructions } from "../generation/evalPrompt.js";
import { callEvalLLM } from "../generation/llm.js";

export const evaluateCoverage=async(query:string,sources:Sources[])=>{
    const context=sources.map(src=>src.snippet)
    const prompt=retrievalRelevanceInstructions
    console.log("[Eval Set {Conext}] ",context)
    const answer=`
    QUESTION : ${query},
    FACTS: ${context}
    `
    const response=await callEvalLLM(prompt,answer)
    console.log("[Eval Set @RELEVANCE SCORE {Resposne}] ",response)
    return
}
export const evaluateGroundness=async(answer:string,sources:Sources[])=>{
    const context=sources.map(src=>src.snippet)
    const prompt=retrievalRelevanceInstructions
    console.log("[Eval Set {Conext}] ",context)
    const ans=`
    FACTS: ${context}
    ANSWER : ${answer},
    `
    const response=await callEvalLLM(prompt,ans)
    console.log("[Eval Set @GROUNDNESS {Resposne}] ",response)
    return
}