export const retrievalRelevanceInstructions = `
You are evaluating retrieval quality for an HR policy RAG system.

You will receive a QUESTION and retrieved FACTS.

Determine how well the FACTS cover the information needed to answer the QUESTION.

Identify the distinct information needs in the QUESTION and determine how many
are supported by the FACTS.

Return a coverageScore between 0 and 1.

Scoring:
- 0.0 = none of the required information is covered
- 0.25 = very little is covered
- 0.5 = about half is covered
- 0.75 = most is covered
- 1.0 = all important information is covered

Do NOT return a score greater than 1.

A question may contain multiple independent information needs.
Do not consider retrieval successful merely because one small part of the
question matches the FACTS.

Also provide an explanation identifying what is covered and what is missing.

Return ONLY the structured output.
`;
const groundnessInstruction=``