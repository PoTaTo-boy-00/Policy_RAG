import { prisma } from "../prisma/client.js";
export type ChunkQueryResult = {
  chunkId: string;
  content: string;
  documentId: string;
  documentName: string;
  chunkIndex:string,
  similarity: number;
}
export type RawChunksType= Omit<ChunkQueryResult,"documentName">
export const denseSearch=async(userEmbeddings:number[],pathIds:string[]) : Promise<ChunkQueryResult[]>=>{
    const stringUserVector=`[${userEmbeddings.join(",")}]`
    let rawChunks:RawChunksType[]
    if(pathIds && pathIds.length>0){
        rawChunks =await prisma.$queryRaw`
        select 
        c.id as "chunkId",
        c.content,
        c."chunkIndex",
        c."documentId",
        1-(c.embedding<=>${stringUserVector}::vector) as similarity
        from 
        "DocumentChunk" c
        where 
        c."documentId" = any(${pathIds}::text[])
        order by c.embedding<=>${stringUserVector}::vector
        limit 20
        `
    }else{
           rawChunks =await prisma.$queryRaw`
        select 
         c.id as "chunkId",
        c.content,
         c."chunkIndex",
        c."documentId",
        1-(c.embedding<=>${stringUserVector}::vector) as similarity
        from 
        "DocumentChunk" c
        -- where 
        -- c."documentId" = any(${pathIds}::text[])
        order by c.embedding<=>${stringUserVector}::vector
        limit 20
        `

    }
    if(rawChunks.length===0) return []
    const documentId=Array.from(new Set(rawChunks.map(rc=>rc.documentId)))
    const findDocNames=await prisma.document.findMany({
        where:{id:{in:documentId}},
        select:{id:true,name:true}
    })
    
    const docMap:Map<string,string>=new Map(findDocNames.map(d=>[d.id,d.name]))
    const relevantChunks:ChunkQueryResult[]=rawChunks.map(c=>({
        chunkId:c.chunkId,
        documentId:c.documentId,
         chunkIndex:c.chunkIndex,
        similarity:c.similarity,
        content:c.content,
        documentName:docMap.get(c.documentId)||""
    }))
    // console.log("[Dense Search res]",relevantChunks)
    // console.log("[DENSE SEARCH]",relevantChunks)
    return relevantChunks
}