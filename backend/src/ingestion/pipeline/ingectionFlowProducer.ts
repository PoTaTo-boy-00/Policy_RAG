import { IngestionFlowProducer } from "../../config/Queue/queue.js";
import type { fileDetails } from "../../app.js";

export const createIngestionFLow = async (paths: fileDetails[]) => {
  try {
    await IngestionFlowProducer.add({
      name: "ingestion-flow",
      queueName: "embedder-queue",
      children: [
        {
          name: "text-splitter-job",
          queueName: "splitter-queue",
          data: { paths },
          // opts:{
          //     jobId:``
          // }
        },
      ],
    });
    console.log(`Flow for order  queued successfully!`);
    return { success: true };
  } catch (error) {
    console.error(error);
    return { success: false };
  }
};
