import { Processor, WorkerHost } from "@nestjs/bullmq";
import type { Job } from "bullmq";

@Processor("search-index")
export class SearchIndexQueueProcessor extends WorkerHost {
  process(job: Job<SearchIndexJob>): Promise<SearchIndexJobResult> {
    return Promise.resolve({
      jobId: String(job.id),
      commentId: job.data.commentId,
      status: "accepted"
    });
  }
}

export interface SearchIndexJob {
  commentId: string;
}

export interface SearchIndexJobResult {
  jobId: string;
  commentId: string;
  status: "accepted";
}
