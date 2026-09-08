import { Job, Worker } from "bullmq";
import type { TextSplitType } from "../processor/textSplitterProcessor.js";
import { connection } from "../config/redis.js";
import { embedderProcessor } from "../processor/embedderProcessor.js";

const worker = new Worker(
  "embedder-queue",
  async (job: Job<TextSplitType[]>) => {
    console.log(`[Embedder Worker] Embedder Job ${job.id} started`);
    const children = await job.getChildrenValues();
    console.log(children);
    const textSplitRes = Object.values(children)[0];
    await embedderProcessor(textSplitRes);
  },
  { connection: connection,
    concurrency:5
   },
);

worker.on("failed", (job, err) => {
  console.error(`[Embedder Worker] Job ${job?.id} failed:`, err);
});
