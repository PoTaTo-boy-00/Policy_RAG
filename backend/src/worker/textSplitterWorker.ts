import { Job, Worker } from "bullmq";
import type { fileDetails } from "../app.js";
import { textSplitterProcessor, type TextSplitType } from "../processor/textSplitterProcessor.js";
import { connection } from "../config/redis.js";
interface SplitterJobData {
  paths: fileDetails[];
}
const worker=new Worker<SplitterJobData,TextSplitType[]>("splitter-queue",async(job:Job<SplitterJobData>)=>{
    console.log(`[Splitter Worker] Text Splitter Job ${job.id} started`);
     const { paths } = job.data;
    
    if (!paths || paths.length === 0) {
      console.warn(`[Worker] Job ${job.id} received no paths.`);
      return [];
    }
    const res=await textSplitterProcessor(paths)
     console.log(`[Worker] Job ${job.id} finished processing.`);
    // console.log(res)
    return res
},{
    connection:connection
})
worker.on("failed", (job, err) => {
  console.error(`[Splitter Worker] Job ${job?.id} failed:`, err);
});