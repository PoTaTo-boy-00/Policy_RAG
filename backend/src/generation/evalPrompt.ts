export const retrievalRelevanceInstructions = `
You are evaluating retrieval quality for an HR policy RAG system.

You will receive a QUESTION and retrieved FACTS.

Determine how well the FACTS cover the information needed to answer the QUESTION.

Identify the distinct information needs in the QUESTION and determine how many
are supported by the FACTS. Treat the coverageScore as roughly the proportion
of distinct information needs that are actually satisfied by the FACTS — do
not anchor on 0.5 by default when something is missing; compute it relative
to how many needs the question actually has.

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

Specificity rule: FACTS that discuss the right general topic but the wrong
specific qualifier (e.g. a different employee band, grade, tier, location,
or employment type than the one asked about) do NOT count as covering the
question. Only count a need as covered if the FACTS address it for the
specific qualifier(s) named in the QUESTION. If the QUESTION does not name a
specific band/tier/grade, general FACTS are acceptable.

Depth rule: merely confirming that a benefit or policy exists is not the same
as covering the question. If the QUESTION asks for a specific value (amount,
duration, eligibility criteria, process), FACTS that only confirm the topic
exists without giving that value count as partially covered, not fully
covered.

Also provide an explanation identifying what is covered and what is missing.

Return ONLY the structured output, in exactly this format:

{
  "coverageScore": 0.0,
  "explanation": "What is covered and what is missing."
}

Example 1:
QUESTION: "How many days of maternity leave am I entitled to, and is it paid?"
FACTS: "Maternity leave is 26 weeks." (no mention of pay status)
{
  "coverageScore": 0.5,
  "explanation": "Duration (26 weeks) is covered, but paid/unpaid status is missing. 1 of 2 information needs met."
}

Example 2:
QUESTION: "What is the eligibility, amount, and application process for the optical allowance?"
FACTS: "Optical allowance is ₹5000 per year." (no mention of eligibility or how to apply)
{
  "coverageScore": 0.25,
  "explanation": "Only the amount (₹5000/year) is covered. Eligibility criteria and application process are both missing. 1 of 3 information needs met."
}

Example 3 (specificity failure):
QUESTION: "What is the optical allowance for Band C employees?"
FACTS: "Optical allowance for Band B employees is ₹4000 per year." (no mention of Band C)
{
  "coverageScore": 0.0,
  "explanation": "FACTS only address Band B, not the Band C tier the question asks about. The specific information need is not met despite the general topic matching."
}
`;

export const groundednessInstructions = `
You are a strict evaluator for a Retrieval-Augmented Generation (RAG) system.

Your task is to evaluate whether the generated ANSWER is fully supported by the provided FACTS.

Definition:
Groundedness measures whether every factual claim made in the ANSWER can be directly supported by the FACTS.

Evaluation rules:

1. Treat the FACTS as the only source of truth.
2. Every factual claim in the ANSWER must be supported by the FACTS.
3. Do not use your own knowledge or assumptions to verify the ANSWER. Even if a claim seems plausible or generally true, if it is not present in FACTS, treat it as unsupported.
4. If the ANSWER contains information that is not present or reasonably supported by the FACTS, consider it ungrounded.
5. If the ANSWER contradicts the FACTS, consider it ungrounded.
6. If the ANSWER adds specific numbers, dates, limits, names, policy codes, benefits, conditions, or other details that are not supported by the FACTS, penalize the groundedness score.
7. A concise answer is acceptable if it is fully supported by the FACTS.
8. If the FACTS do not contain enough information to answer the question, an answer stating that the information is unavailable, unclear, or not covered by the retrieved policy is grounded.
9. Absence vs. exclusion: FACTS being silent on a topic is NOT the same as FACTS confirming that topic is excluded or not covered. An ANSWER that says "I don't have information on X" is grounded (per rule 8). An ANSWER that asserts a negative claim like "X is not covered" or "X is not provided" when FACTS simply never mention X is UNGROUNDED — that is an unsupported claim of exclusion, not an honest statement of missing information. Only treat "not covered" as grounded if FACTS explicitly state an exclusion.
10. Do not penalize wording differences, paraphrasing, or logically equivalent statements when the meaning is supported by the FACTS.
11. Evaluate the ANSWER as a whole, but identify unsupported or contradictory claims.

Scoring:

1.0 = Fully grounded. Every factual claim in the ANSWER is supported by the FACTS.

0.75 = Mostly grounded. The main answer is supported, but there is a minor unsupported detail that does not substantially change the answer.

0.5 = Partially grounded. Some important claims are supported, but one or more significant claims are unsupported.

0.25 = Mostly ungrounded. Most important claims are unsupported by the FACTS.

0.0 = Completely ungrounded or contradicts the FACTS.

Return ONLY valid JSON in exactly this format:

{
  "score": 0.0,
  "reason": "Brief explanation of why the answer is or is not supported by the facts.",
  "unsupported_claims": [
    "List each unsupported or contradictory claim here."
  ]
}

Example 1 (honest absence — grounded):
FACTS: "Optical allowance for Band B employees is ₹4000 per year."
ANSWER: "I don't have information on the optical allowance for Band C employees in the retrieved policy."
{
  "score": 1.0,
  "reason": "The answer correctly states the information is unavailable rather than guessing, consistent with FACTS only covering Band B.",
  "unsupported_claims": []
}

Example 2 (false exclusion claim — ungrounded):
FACTS: "Optical allowance for Band B employees is ₹4000 per year."
ANSWER: "Band C employees are not eligible for optical allowance."
{
  "score": 0.0,
  "reason": "FACTS never state that Band C is excluded from optical allowance; they are simply silent on Band C. The ANSWER asserts an exclusion that is not supported, which is a contradiction-by-overreach, not an honest absence statement.",
  "unsupported_claims": ["Band C employees are not eligible for optical allowance."]
}

Example 3 (unsupported specific detail — partially ungrounded):
FACTS: "Dental implant treatment is covered under the medical benefits plan."
ANSWER: "Dental implant treatment is covered under the medical benefits plan, up to ₹50,000 per year."
{
  "score": 0.5,
  "reason": "Coverage of dental implants is supported, but the ₹50,000 annual limit is not present in FACTS and appears fabricated.",
  "unsupported_claims": ["up to ₹50,000 per year"]
}
`;