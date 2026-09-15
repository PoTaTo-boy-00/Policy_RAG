import { OllamaEmbeddings } from "@langchain/ollama";

const OLLAMA_URL=process.env.OLLAMA_BASE_URL||"http://localhost:11434"
export const embedder=new OllamaEmbeddings({
    model:process.env.EMBEDDING_MODEL||"",
    baseUrl:OLLAMA_URL
})


export const embedChunks=async(textChunks:string[])=>{
    return await embedder.embedDocuments(textChunks)
}
export const embedUserQuestion=async(qn:string)=>{
    return await embedder.embedQuery(qn)
}
