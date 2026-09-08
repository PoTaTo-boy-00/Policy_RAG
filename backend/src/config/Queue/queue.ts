import { FlowProducer, Queue } from "bullmq";
import { connection } from "../redis.js";

export const SplitterQueue=new Queue("splitter-queue",{connection})
export const EmbedderQueue=new Queue("embedder-queue",{connection})
export const IngestionFlowProducer=new FlowProducer({connection})