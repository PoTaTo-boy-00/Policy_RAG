# DESIGN DOC

## Technology Stack

| Technology | Purpose | Why |
|---|---|---|
| **TypeScript** | Application language | Type safety and maintainability. |
| **Fastify** | Backend API | Lightweight and performant API framework. |
| **PostgreSQL** | Database | Reliable relational database with `pgvector` support. |
| **Prisma** | ORM | Type-safe database access and migrations. |
| **pgvector** | Vector search | Stores and searches embeddings in PostgreSQL. |
| **BullMQ + Redis** | Async ingestion | Processes document ingestion as background jobs. |
| **LangChain** | RAG pipeline | Simplifies retrieval and LLM integration. |
| **remark-parse and remark-gfm** | Markdown parsing | Parses Markdown into a structured format. |
| **unified** | Document processing | Provides the Markdown processing pipeline. |
| **Firecrawl / PDFInspector** | PDF extraction | Extracts and converts document content for processing. |
| **Cohere API** | Reranking | Improves relevance of retrieved chunks. |

## 1. Architecture

The system follows a RAG architecture consisting of document ingestion, hybrid retrieval, reranking, and grounded answer generation.

![RAG System Architecture](./public/architecture-rag-policy.png)
### Hybrid Retrieval

The retrieval layer combines dense and sparse search. Each retrieval method
returns candidate chunks, which are combined using Reciprocal Rank Fusion
(RRF) before selecting the top-ranked chunks.

![Hybrid Search Diagram](./public/hybrid-serach-rag.png)
## 2. Chunking & Retrival

### Document Processing
The ingestion pipeline accepts PDF, Markdown, and TXT documents. PDF documents are first converted to Markdown so that the document structure can be processed consistently across supported formats.

During processing the file system identifies structual elements liek headings,paragraphs
and tables.This structure is preserved during chunking rather than treating the document as an unstructured block of text.



### Chunking Strategy


The system uses a combination of **structure-aware chunking** and **Recursive Text Splitting** based on the logical organization of the document.

Rather than splitting documents solely by a fixed character or token count, the initial chunking stage identifies meaningful structural boundaries such as:

* Headings and sections
* Paragraphs
* Tables

The relevant heading and section context is associated with each paragraph or table chunk. This preserves the semantic context required to correctly interpret the content during retrieval and generation.

To prevent structurally defined chunks from becoming excessively large, a **512-character threshold** with **10% overlap** is applied. If a structure exceeds this threshold, it is further divided using a Recursive Text Splitter. 

The recursive splitting process preserves the original **heading and section context** across the resulting sub-chunks. For example:

```text
Health Insurance
└── Standard Tier
    ├── Chunk 1
    │   └── [Heading + Section Context + Content]
    ├── Chunk 2
    │   └── [Heading + Section Context + Content]
    └── Chunk 3
        └── [Heading + Section Context + Content]
```

This hybrid approach addresses the main trade-off of structure-aware chunking: while structural boundaries preserve semantic meaning, some structures may be too large for effective retrieval. Recursive splitting limits chunk size while retaining the document's hierarchical context.

As a result, the system preserves both **manageable chunk sizes and meaningful semantic boundaries**, providing the embedding and generation stages with sufficient context without unnecessarily large chunks.

### Retrieval Pipeline

```text

The system uses hybrid retrieval, combining dense semantic search with sparse keyword-based search.

Dense retrieval is useful when the query and policy use different wording but express the same concept. Sparse retrieval is useful for exact policy terminology, benefit names, exclusions, employee tiers, and other terms where lexical matching is important.

Results from dense and sparse retrieval are combined using Reciprocal Rank Fusion (RRF). RRF combines the rankings from both retrieval methods without requiring their raw similarity scores to be directly comparable.

The resulting candidates are then passed through a reranking stage to evaluate their relevance to the specific query. The highest-ranked chunks are selected as the final retrieval context for answer generation.
```
### Query Decomposition

```text
Complex policy questions may contain multiple independent information requirements. The system uses a query-modification step to decompose such questions into concise, intent-specific sub-queries.

For example:

> What is my health insurance tier, annual coverage, optical allowance, and dental entitlement?

This is decomposed into separate intents, and each sub-query is retrieved independently. The results are then aggregated and deduplicated before being passed to the grounding and generation stages.

This increases retrieval cost and latency for complex queries, but improves answer quality by ensuring that chunks are retrieved for **each individual intent** rather than relying on a single retrieval operation for the entire question.
```
---

## 3. GROUNDING
### Context Construction
```text
The system uses the retrieved policy chunks as the primary source for answer generation. After hybrid search, RRF-based ranking, and re-ranking, the top-ranked chunks are selected for context construction and provided to the LLM.

For complex questions, the original question is decomposed into multiple intent-based sub-queries. Retrieval is then performed independently for each sub-query. The retrieved chunks from all sub-queries are aggregated, deduplicated where necessary, and constructed into a unified context.

This consolidated context is then passed to the LLM, which generates the final answer based on the retrieved policy information.

The generation prompt instructs the model to answer using the provided context and not introduce policy information that is not supported by the retrieved documents.
```
### Source Attribution
```text
Retrieved chunks are retained alongside the generated answer so that the response can be traced back to the source policy content.

The `/query` endpoint returns a sources field containing the sources associated with the retrieval results. These sources are used by the client to provide citations for claims in the generated response.

Source attribution is particularly important for HR policy questions because users need to be able to verify where a benefit, eligibility rule, coverage amount, or exclusion came from
```
### Weak Retrival
```text
The system treats weak retrieval as a failure condition rather than allowing the LLM to fill the missing information using its general knowledge.

If the retrieved chunks do not provide sufficient evidence for the user's question, the system should avoid generating a definitive policy answer. Instead, the response should indicate that the available policy context does not contain enough information to answer the question reliably.

This approach prioritizes grounding over answer completeness. A missing or uncertain policy answer is preferable to an incorrect answer that appears authoritative.
```
---
## 4. Evaluation

A tiny evaluation set (8 representative questions covering direct-fact,
table/structured, and off-policy cases) runs after each change to catch
regressions in retrieval and generation.

For each question, the harness:

- Runs retrieval and generation through the live pipeline.
- Scores **coverage** — whether retrieved chunks contain the information
  needed to answer the question, via an LLM judge with an explicit rubric
  and few-shot examples (including a specificity check so content about the
  wrong employee band/tier doesn't count as coverage).
- Scores **groundedness** — whether every claim in the generated answer is
  actually supported by the retrieved chunks, including a check that
  distinguishes an honest "I don't have this information" from a fabricated
  exclusion claim like "X is not covered" when the policy is simply silent
  on X.
- Fails the run (non-zero exit code) if either score falls below a
  threshold, so it can gate changes in a dev loop or CI.


---

## 5. Schema & APIs

The system exposes three main endpoints covering document ingestion, query
creation, and streamed answer generation.

---

### 5.1 `/upload`

The `/upload` endpoint accepts policy documents in Markdown, TXT, or PDF
format. Uploaded files are processed and indexed so they can be used during
subsequent queries.

#### Request

```json
{
  "files": []
}
```
#### Response

```json
{
    "success":"boolean",
    "pathIds":[]
}
```
---
### 5.2 `/query`
The `/query` endpoint accepts a user's question and the IDs of the documents
that should be searched.

#### Request
```json
{
  "body": {
    "question": "What is my annual health insurance coverage?",
    "filePathsIds": []
  }
}
```

#### Response
```json
{
  "queryId": "string",
  "sources": []
}
```


The `queryId` uniquely identifies the query and is used by the streaming
endpoint to retrieve the generated answer.

The `sources` contain the retrieved information required for citations. This
allows the client to associate the final answer with the policy evidence used
by the RAG pipeline.

---
### 5.3 `/query/stream?queryId=<queryId>`
The `/query/stream` endpoint generates and streams the answer for an existing
query.
The query ID is provided as a URL query parameter.

#### Request
```json
{
  "query": {
    "queryId": "..."
  }
}
```

#### Response
```json
{

    "stream output"
}
```

Streaming allows the frontend to display the generated response incrementally
instead of waiting for the complete LLM response.

---
 
### 5.4 `/records`

The `/records` endpoint retrieves the available document records.

Response
```json
{
  "success": true,
  "response": []
}

```
---
### 5.5 `/records/:id`

The `/records/:id` endpoint updates a document record using its ID.

Response
```json
{
  id: string
}
```
Response
```json
{
  "success": true,
  "response": {}
}
```
---
### 5.6 `/records/:id`

The same resource endpoint supports deletion of a document record.

Request
```json
{
id: string

}
```
Response
```json
{
  "success": true,
  "response": {}
}
```
---
## 6. Trade-offs

### Structure-Aware Chunking vs Fixed-Size Chunking

```text
A fixed-size chunking strategy is simpler and provides consistent chunk sizes, but it can split content across semantic boundaries. The system therefore uses structure-aware chunking and applies Recursive Text Splitting only when a structure exceeds 500 characters.

This preserves document structure while keeping chunks within a manageable size.
```
###  Dense Retrieval vs Hybrid Retrieval

```text
Dense retrieval provides strong semantic matching but can miss exact policy terminology. Since policy documents contain specific terms, benefit names, exclusions, and numerical values, the system combines dense retrival (using Cosine Similarity) and sparse retrieval (using BM25 Retriever).

RRF is then used to combine the results from both retrieval methods. This improves retrieval coverage at the cost of additional retrieval complexity.
```
### Single Query vs Query Decomposition

```text
Using the original query directly is simpler and has lower latency, but complex questions can contain multiple independent intents. The system therefore decomposes complex queries into intent-specific sub-queries and retrieves results independently.

This increases retrieval cost and latency, but improves coverage by allowing each intent to retrieve its own relevant chunks.
```
---
## 7. Future Improvements

If I had two additional weeks, I would prioritize the following improvements:

### 1. Expand the Evaluation Set

A small evaluation set (see Evaluation section above) already covers a handful of representative questions with coverage and groundedness scoring. With more time I would expand this to a larger, more representative question set (20–50+ questions spanning direct-fact, table/structured, and off-policy refusal cases) and wire it into CI so it runs automatically on every retrieval or prompt change rather than manually.

### 2. Chunking Improvements

Extend the structure-aware chunking logic to support additional document structures such as lists, nested lists, blockquotes, and other Markdown elements. Currently, chunking primarily handles headings, paragraphs, and tables, which can result in list-based policy information being poorly represented during retrieval.

### 3. Document Versioning

Implement document versioning so that policy changes can be tracked over time. This would allow queries to be associated with the specific policy version used to generate an answer, improving traceability and preventing outdated policy information from being used.