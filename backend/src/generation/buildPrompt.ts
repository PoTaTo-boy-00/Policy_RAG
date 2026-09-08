import type { ChunkQueryResult } from "../retrival/denseSearch.js";
import type { HybridSearchResType } from "../retrival/hybridSearch.js";

export const buildPrompt = (userQuery: string, chunks: HybridSearchResType[]) => {
  const formatedContext = chunks
    .map(
      (c, idx) =>
        `[Source ${idx+1}]: File "${c.docName}" (Chunk ${c.chunkIndex})\n${c.content}`
    )
    .join("\n\n");
// console.log(formatedContext)
  return `You are a strict QA assistant. Use ONLY the CONTEXT below to answer. Do not use outside knowledge.

### CONTEXT:
${formatedContext}

### RULES:
- Every sentence or bullet must end with its source tag, like [Source 1].
- Plain text or Markdown bullets only. No code blocks, no HTML.
- If the answer isn't in the CONTEXT, reply exactly: I cannot answer this based on the uploaded documents.

### EXAMPLE:
USER QUESTION: What is the project deadline?
### ANSWER:
- The project deadline is March 15th. [Source 2][Document Name]
- Final submissions must include a demo video. [Source 2]

### USER QUESTION:
${userQuery}

### ANSWER:`;
};