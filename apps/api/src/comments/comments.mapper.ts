import type { CommentAttachmentResponse, CommentResponse } from "./comment-response";
import type { CommentEntity } from "./entities/comment.entity";

export class CommentsMapper {
  toItem(comment: CommentEntity): CommentResponse {
    return {
      id: comment.id,
      parentId: comment.parentId,
      author: {
        id: comment.author.id,
        userName: comment.author.userName,
        email: comment.author.email,
        homePage: comment.author.homePage
      },
      sanitizedHtml: comment.sanitizedHtml,
      createdAt: comment.createdAt.toISOString(),
      repliesCount: comment.repliesCount ?? 0,
      attachments: (comment.attachments ?? []).map((attachment) => this.toAttachment(attachment)),
      replies: (comment.children ?? []).map((reply) => this.toItem(reply))
    };
  }

  private toAttachment(attachment: {
    id: string;
    originalName: string;
    mimeType: string;
    sizeBytes: number;
    width: number | null;
    height: number | null;
    storageKey: string;
  }): CommentAttachmentResponse {
    return {
      id: attachment.id,
      originalName: attachment.originalName,
      mimeType: attachment.mimeType,
      sizeBytes: attachment.sizeBytes,
      width: attachment.width,
      height: attachment.height,
      url: `/api/files/${attachment.storageKey}`
    };
  }
}
