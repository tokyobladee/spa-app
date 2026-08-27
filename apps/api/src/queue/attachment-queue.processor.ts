import { Processor, WorkerHost } from "@nestjs/bullmq";
import type { Job } from "bullmq";

@Processor("attachments")
export class AttachmentQueueProcessor extends WorkerHost {
  process(job: Job<AttachmentJob>): Promise<AttachmentJobResult> {
    return Promise.resolve({
      jobId: String(job.id),
      attachmentId: job.data.attachmentId,
      status: "accepted"
    });
  }
}

export interface AttachmentJob {
  attachmentId: string;
}

export interface AttachmentJobResult {
  jobId: string;
  attachmentId: string;
  status: "accepted";
}
