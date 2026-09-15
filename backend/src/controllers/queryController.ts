import type { QueryData } from "../app.js";
import { buildPrompt } from "../generation/buildPrompt.js";
import { joinQueryPrompt } from "../generation/joinPrompt.js";
import { callCompressionQuery } from "../generation/llm.js";
import { rewriteQuery } from "../retrival/pre-retrival.js";
import { retriveAndRerank } from "../service/retrival.service.js";
import { deduplication } from "../utils/deduplication.js";

export const queryStoreForEval = new Map<string, QueryData>();

export async function runContentRetrival(question: string, pathIds: string[]) {
  let queries = await rewriteQuery(question);

  if (queries.length > 10) {
    const prompt = joinQueryPrompt(queries);
    queries = await callCompressionQuery(prompt);
  }

  const result = await Promise.all(
    queries.map((q) => retriveAndRerank(q, pathIds)),
  );

  const flatResult = result.flat();

  const uniqueRes = deduplication(flatResult);

  const prompt = buildPrompt(question, uniqueRes);

  const sources = uniqueRes.map((chunk, idx) => ({
    sourceId: `Source ${idx + 1}`,
    chunkId: chunk.id,
    documentName: chunk.docName,
    documentId: chunk.documentId,
    chunkIndex: chunk.chunkIndex,
    snippet: chunk.content,
  }));

  const queryId = crypto.randomUUID();
  queryStoreForEval.set(queryId, {
    prompt,
    question,
    sources,
  });
  return queryId
}
