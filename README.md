# PolicyRag

A RAG-based HR policy assistant that retrieves relevant policy information from uploaded documents and generates grounded answers with source citations.

DEMO VIDEO: [Demo Video](https://drive.google.com/file/d/1KemlbiLafMCjaORFUzdKQqNOr8lf7Tw2/view?usp=sharing)

## Projects

- **Frontend:** [Frontend ](./frontend)
- **Backend:** [Backend ](./backend)

## Running Locally

The application consists of a Next.js frontend and a backend service. The backend requires Redis and Ollama for processing and local LLM/embedding inference.

---
### Prerequisites


The following services/tools are required:

- Node.js
- PostgreSQL with `pgvector`
- Redis
- Ollama
- Cohere API key
---
### Models and Services

| Purpose | Provider | Model / Service |
|---|---|---|
| Answer Generation | Ollama | `gemma4` |
| Embeddings | Ollama | `nomic-embed-text` |
| Reranking | Cohere | Cohere Rerank API |
| Vector Store | PostgreSQL | `pgvector` |
| Asynchronous Ingestion | Redis | BullMQ |
---
### 1. Clone the Repository

```bash
git clone <repository-url>
cd <repository-name>
```
---
### 2. Install Dependencies

Install frontend dependencies:

```bash
cd frontend
npm install
```

Install backend dependencies:

```bash
cd ../backend
npm install
```
---
### 3. Database

The backend uses **PostgreSQL with pgvector** for storing document chunks,
embeddings, and metadata. **Prisma ORM** is used for database access and
schema migrations.

PostgreSQL must have the `pgvector` extension enabled.

The database is used to store:

- Document chunks
- Embeddings
- Chunk metadata

Configure the PostgreSQL connection in the backend `.env` file using
`DATABASE_URL`.

Generate the Prisma client and apply the database migrations:

```bash
cd backend

npx prisma generate
npx prisma migrate dev
```
---

### 4. Set up Redis

The backend requires Redis for runnig BullMQ. You can either run Redis locally or use a hosted Redis provider.

Make sure Redis is running before starting the backend, and configure your connection string in the backend `.env` file.

---

### 5. Set up Ollama

Install and start the Ollama service, then pull the required models:

```bash
ollama pull gemma4
ollama pull nomic-embed-text
```

| Purpose | Model |
|---|---|
| LLM / Answer Generation | `gemma4` |
| Embeddings | `nomic-embed-text` |

Both models run locally through Ollama. `nomic-embed-text` is used solely for embedding generation, while `gemma4` handles query processing and answer generation.

---

### 6. Configure Cohere

The retrieval pipeline uses Cohere for reranking the chunks retrieved from
the hybrid search stage.

Create a Cohere API key and add it to the backend environment configuration.
```env
COHERE_API_KEY=your_cohere_api_key
```

---
### 7. Environment Variables

#### Backend
Create a `.env` file in the `backend` directory:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/policyrag
# Redis
REDIS_URL=redis://localhost:6379

# Ollama
OLLAMA_BASE_URL=http://localhost:11434

# Cohere
COHERE_API_KEY=<cohere_api_key>

```

> If using a hosted Redis provider, replace `REDIS_URL` with your provider's connection string.

#### Frontend

Create a `.env` file in the `frontend` directory:

```env
NEXT_PUBLIC_BACKEND_URL="http://localhost:8080"

```

---
### 8. Start the Backend

```bash
cd backend
npm run dev
```

---
### 9. Start the Frontend

In a separate terminal window:

```bash
cd frontend
npm run dev
```

The Next.js development server will then be available at the URL shown in the terminal.