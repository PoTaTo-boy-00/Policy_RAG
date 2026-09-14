import type { HybridSearchResType } from "../retrival/hybridSearch.js";

// export const buildPrompt = (
//   userQuery: string,
//   chunks: HybridSearchResType[],
// ) => {
//   const formatedContext = chunks
//     .map(
//       (c, idx) =>
//         `[Source ${idx + 1}]: File "${c.docName}" (Chunk ${c.chunkIndex})\n${c.content}`,
//     )
//     .join("\n\n");

//   return `You are a strict QA assistant.
//    Use ONLY the CONTEXT below to answer. Do not use outside knowledge.

// ### CONTEXT:
// ${formatedContext}

// ### RULES:
// - Every sentence or bullet must end with its source tag, like [Source 1].
// - Plain text or Markdown bullets only. No code blocks, no HTML.
// - Some sources may include a "Contact" section near the end containing an email address for that specific policy. Use it ONLY as instructed in GROUNDING LOGIC below — never anywhere else, and never invent one.

// ### GROUNDING LOGIC (follow in this exact order):
// 1. Determine the INTENT of the USER QUESTION — which policy category it is asking about (e.g. Benefits, IT Security, Leave, Payroll, Travel, etc.), based purely on the wording of the question.
// 2. Determine the POLICY CATEGORY that the retrieved CONTEXT belongs to, based on the file name(s), headings, and content of the sources.
// 3.If the CONTEXT contains an explicit statement that directly supports
// the answer, answer normally.

// Do not infer an answer from related information.

// Do not treat absence of information as evidence.

// Do not infer that something is excluded, unavailable, or not covered
// merely because it is not mentioned.
// 4. If the CONTEXT does NOT contain enough information to answer, check the following in order and reply with EXACTLY the matching message (no extra text, no source tags on fallback replies):
//    a. INTENT matches the CONTEXT's policy category (the question is about the same policy area as the retrieved documents, but the specific detail just isn't present) AND 
//    A Contact email may appear inside a source. If used, copy the email
// EXACTLY from that source. Never construct, modify, or infer an email address.:
//       → Reply exactly: "I cannot answer this, please contact <email> for more details on this policy." (substitute the exact email found in the CONTEXT's Contact section — never fabricate one)
//    b. INTENT does NOT match the CONTEXT's policy category (e.g. question is about IT Security but retrieved CONTEXT is about Benefits):
//       → Reply exactly: "I cannot answer this please Contact HR."
//    c. INTENT matches the CONTEXT's policy category but there is no "Contact" section / email present in the CONTEXT:
//       → Reply exactly: "I cannot answer this please Contact HR."
//    d. Any other case not covered above:
//       → Reply exactly: "I cannot answer this please Contact HR."

// ### EXAMPLE:
// USER QUESTION: What is the project deadline?
// ### ANSWER:
// - The project deadline is March 15th. [Source 2]
// - Final submissions must include a demo video. [Source 2]

// ### USER QUESTION:
// ${userQuery}

// ### ANSWER:`;
// };

// import type { HybridSearchResType } from "../retrival/hybridSearch.js";
export const buildPrompt = (
  userQuery: string,
  chunks: HybridSearchResType[],
) => {
  const formattedContext = chunks
    .map(
      (c, idx) =>
        `[Source ${idx + 1}]: File "${c.docName}" (Chunk ${c.chunkIndex})\n${c.content}`,
    )
    .join("\n\n");

  return `You are a strict QA assistant.

Use ONLY the CONTEXT below to answer the user's question.
Do not use outside knowledge.

If the CONTEXT does not contain enough information to answer
the question, reply exactly:

I cannot answer this please Contact HR.

### CONTEXT:

${formattedContext}

### RULES:

- Use only information explicitly stated in the CONTEXT.
- Do not make assumptions or use outside knowledge.
- Do not infer an answer from related information.
- Do not treat missing information as evidence that something is not covered.
- If the CONTEXT explicitly states that something is not covered, excluded,
  or not reimbursable, you may use that information in the answer.
- Every factual sentence or bullet must end with its source tag, like [Source 1].
- Plain text or Markdown bullets only.
- No code blocks.
- No HTML.
- If the answer is not supported by the CONTEXT, reply exactly:
  I cannot answer this please Contact HR.

### EXAMPLE:

USER QUESTION:
What is the project deadline?

### ANSWER:

- The project deadline is March 15th. [Source 2]
- Final submissions must include a demo video. [Source 2]

### USER QUESTION:

${userQuery}

### ANSWER:`;
};