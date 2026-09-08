import { Document } from "@langchain/core/documents";
import { prisma } from "../prisma/client.js";
import {BM25Retriever} from "@langchain/community/retrievers/bm25"
export type ChunkMetadata= {
  chunkId: string;
  chunkIdx: number;
  docId: string;
  docName:string
}
export const sparseSearch=async(pathsIds:string[],query:string):Promise<Document<ChunkMetadata>[]>=>{
    const docChunks=await prisma.documentChunk.findMany({
        where:{
            documentId:{in:pathsIds}
        },
        select:{chunkIndex:true,content:true,documentId:true,id:true,
            document:{
                select:{
                    name:true
                }
            }
        }
    })
    const lcDocs=docChunks.map(chunk=>new Document<ChunkMetadata>({
        id:chunk.id,
        pageContent:chunk.content,
        metadata:{
            chunkId:chunk.id,
            chunkIdx:chunk.chunkIndex,
            docId:chunk.documentId,
            docName:chunk.document.name
        }
    }))
    const bm25retriever=BM25Retriever.fromDocuments(lcDocs,{k:20})
    const sparseSearchRes=await bm25retriever.invoke(query)
    // console.log("[Sparse Search Res] ",sparseSearchRes)
    return sparseSearchRes as Document<ChunkMetadata>[]
}