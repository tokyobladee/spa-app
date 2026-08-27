import { Processor, WorkerHost } from "@nestjs/bullmq";
import type { Job } from "bullmq";
import type { CommentResponse } from "../comments/comment-response";
import { SearchService } from "../search/search.service";

@Processor("search-index")
export class SearchIndexQueueProcessor extends WorkerHost {
  constructor(private readonly search: SearchService) {
    super();
  }

  async process(job: Job<SearchIndexJob>): Promise<SearchIndexJobResult> {
    await this.search.indexComment(job.data.comment);

    return {
      jobId: String(job.id),
      commentId: job.data.comment.id,
      status: "indexed"
    };
  }
}

export interface SearchIndexJob {
  comment: CommentResponse;
}

export interface SearchIndexJobResult {
  jobId: string;
  commentId: string;
  status: "indexed";
}
