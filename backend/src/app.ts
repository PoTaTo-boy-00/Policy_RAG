import fastify from "fastify";
import multipart from "@fastify/multipart";
import { readFile } from "./ingestion/Extraction/readFile.js";
import { saveFile } from "./ingestion/Extraction/save-file.js";
import { textSplitter } from "./ingestion/splitting/splitter.js";
import {
  embedChunks,
  embedUserQuestion,
} from "./ingestion/embeddings/embeddingService.js";
import { storeDocumentandChunks } from "./db/dbService.js";
import { denseSearch, type ChunkQueryResult } from "./retrival/denseSearch.js";
import { buildPrompt } from "./generation/buildPrompt.js";
import {
  callCompressionQuery,
  callLLM,
  callLLMSream,
} from "./generation/llm.js";
import { createIngestionFLow } from "./ingestion/pipeline/ingectionFlowProducer.js";
import "./worker/textSplitterWorker.js";
import "./worker/embedderWorker.js";
import {
  rewriteQuery,
  type rewriteMessageType,
} from "./retrival/pre-retrival.js";
import { sparseSearch } from "./retrival/sparseSearch.js";
import {
  hybridSearch,
  type HybridSearchResType,
} from "./retrival/hybridSearch.js";
import { measure } from "./performance/measure.js";
import type { DocumentBlock } from "./types/documentType.js";
import cors from "@fastify/cors";
import {
  textSplitterProcessor,
  type TextSplitType,
} from "./processor/textSplitterProcessor.js";
import { embedderProcessor } from "./processor/embedderProcessor.js";
import { reRank } from "./retrival/reranker/rerank.js";
import { retriveAndRerank } from "./service/retrival.service.js";
import { deduplication } from "./utils/deduplication.js";
import {
  deleteDocument,
  getDocuments,
  updateDocuments,
} from "./controllers/document.controllers.js";
import {
  evaluateCoverage,
  evaluateGroundness,
} from "./evaluation/evaluation.js";
import { joinQueryPrompt } from "./generation/joinPrompt.js";

export type fileDetails = {
  id: string;
  name: string;
  format: string;
  data?: DocumentBlock[];
};
export type UserQuery = {
  question: string;
  pathIds: string[];
};
export type Sources = {
  sourceId: string;
  chunkId: string;
  documentName: string;
  documentId: string;
  chunkIndex: number;
  snippet: string;
};
export type QueryData = {
  prompt: string;
  question: string;
  sources: Sources[];
};
export const queryStore = new Map<string, QueryData>();
const app = fastify({
  logger: true,
});
await app.register(cors, {
  origin: "*",
  methods: ["GET", "POST", "OPTIONS", "PUT", "DELETE"],
});
app.register(multipart);
// ! HEALTH

app.get("/health", async (request, reply) => {
  return { title: "OK", timestamp: new Date() };
});
// ! UPLOAD A FILE
app.post("/upload", async (req, res) => {
  const files = req.files();
  const paths: fileDetails[] = [];
  const pathIds: { id: string }[] = [];
  for await (const file of files) {
    const res = await saveFile(file);
    const data = await readFile(res.path || "", res.extension || "");
    pathIds.push({ id: res.fileId || "" });
    paths.push({
      id: res.fileId || "",
      name: file.filename || "",
      format: res.extension || "",
      data: data,
    });
  }
  const { success } = await createIngestionFLow(paths);
  // const splitData:TextSplitType[]=await textSplitterProcessor(paths)
  // const embed=await embedderProcessor(splitData)
  return {
    // success:embed,
    success,
    pathIds,
  };
  // if(embed){

  //   return {
  //     success:true,
  //     pathIds
  //   }
  // }
  // for (const p of paths) {
  //   if (!p.data) continue;
  //   const chunks = await textSplitter(p);
  //   // console.log("FILE NAME:", p.name)
  //   const textContents: string[] = chunks.map((c) => c.pageContent);
  //   // console.log(typeof chunks)
  //   //! embeed them
  //   const embeddedText = await embedChunks(textContents);
  //   await storeDocumentandChunks(p.id, p.name, p.format, chunks, embeddedText);
  //   // console.log(embeddedText)
  // }
  // console.log(paths.length);
  // return res.send({
  //   message: "Files processed, embedded, and stored successfully.",
  //   pathIds,
  // });
});

//? User Query
app.post("/query", async (req, res) => {
  const { question, pathIds } = req.body as UserQuery;
  if (!question || !Array.isArray(pathIds) || pathIds.length === 0) {
    return res.status(400).send({
      error:
        "Invalid payload. 'question' and a non-empty 'pathIds' array are required.",
    });
  }
  // const queries: string[] = [question]
  let queries: string[] = await measure("Rewrite Query", () =>
    rewriteQuery(question),
  );
  if (queries.length > 10) {
    const prompt: rewriteMessageType[] = joinQueryPrompt(queries);
    queries = await callCompressionQuery(prompt);
  }
  // const userEmbeds = await embedUserQuestion(modifiedQuery);
  // if (!userEmbeds || userEmbeds.length === 0) {
  //   return res.status(422).send({
  //     error: "Failed to generate vector embeddings for the provided question.",
  //   });
  // }
  // const [sparseSearchResult, denseSearchResult] = await measure("[Hybrid Search]",()=>Promise.all([
  //   sparseSearch(pathIds, question),
  //   denseSearch(userEmbeds, pathIds),
  // ]));

  // const hybridSearchRes = hybridSearch(
  //   denseSearchResult,
  //   sparseSearchResult,
  //   20, // need to get 20 resuklt
  // );

  // //  feed those 20 res to a rertanker along with our query anbd then it will send the top 5 similar chunks

  // const documents=hybridSearchRes.map((res)=>{
  //   return res.content
  // })
  // const rerankres=await reRank(question,documents)
  // console.log(rerankres)
  // console.log(rerankres.map(rank=>hybridSearchRes[rank.index]))

  // let rres:HybridSearchResType[]=rerankres.map(rank=>hybridSearchRes[rank.index]!)

  // console.log(rres.length)

  const result = await Promise.all(
    queries.map((q) => retriveAndRerank(q, pathIds)),
  );
  // console.log("[Reranbk3ed resulr] ",result)
  const flastResult = result.flat();
  // console.log(flastResult.length);
  const uniqueRes = deduplication(flastResult);
  // const uniqueRes = flastResult;
  // console.log(uniqueRes.length);

  const prompt = buildPrompt(question, uniqueRes);
  const sources = uniqueRes.map((chunk, idx) => ({
    sourceId: `Source ${idx + 1}`,
    chunkId: chunk.id,
    documentName: chunk.docName,
    documentId: chunk.documentId,
    chunkIndex: chunk.chunkIndex,
    snippet: chunk.content,
  }));
  // const op=await callLLM(prompt)
  const queryId = crypto.randomUUID();
  queryStore.set(queryId, {
    prompt,
    question,
    sources,
  });
  //  void evaluateCoverage(question,sources).catch((error)=>{
  //       console.error("[from: /query/stream EVAL SET] ",error);

  //     })
  return res.send({
    // LLM_Output:op,
    queryId,
    sources,
  });
});
// * STREAMING
app.get("/query/stream", async (req, res) => {
  const { queryId } = req.query as { queryId: string };

  const query = queryStore.get(queryId);
  // console.log(query)
  if (!query) {
    return res.status(404).send({
      error: "Query not found",
    });
  }
  res.raw.setHeader("Access-Control-Allow-Origin", "*");
  res.raw.setHeader("Content-Type", "text/event-stream");
  res.raw.setHeader("Cache-Control", "no-cache");
  res.raw.setHeader("Connection", "keep-alive");
  let answer = "";
  try {
    console.log("Generation Started");
    for await (const chunk of callLLMSream(query.prompt)) {
      // console.log(chunk)
      answer += chunk;
      res.raw.write(
        `data: ${JSON.stringify({
          type: "chunk",
          content: chunk,
        })}\n\n`,
      );
    }

    res.raw.write(
      `data: ${JSON.stringify({
        type: "done",
      })}\n\n`,
    );

    res.raw.end();
    console.log(answer);
    // RUN A EAVLUATION SEPERATELY shoudl noty block the main thread
    //  evaluateGroundness(answer,query.sources)
  } catch (error) {
    console.error(error);

    res.raw.write(
      `data: ${JSON.stringify({
        type: "error",
        message: "LLM generation failed",
      })}\n\n`,
    );

    res.raw.end();
  }
  console.log("Generation Ended");
});

/**
 *
 ** DOCUMENT FETCH/UPDATE/DELETE
 */
app.get("/records", async (req, res) => {
  const response = await getDocuments();
  // const allResponse = await getAllDocuments();
  res.send({
    success: true,
    response,
    // allResponse,
  });
});
app.put("/records/:id", async (req, res) => {
  const { id } = req.params as {
    id: string;
  };
  const resposne = await updateDocuments(id);
  res.send({
    success: true,
    resposne,
  });
});
app.delete("/records/:id", async (req, res) => {
  const { id } = req.params as {
    id: string;
  };
  // console.log(id)
  const resposne = await deleteDocument(id);
  res.send({
    success: true,
    resposne,
  });
});

// __inti__ server
app.listen({ port: 8080 }, (err, address) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log(`Server listening to ${address}`);
});
