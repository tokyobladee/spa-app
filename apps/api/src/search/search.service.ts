import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Client } from "@elastic/elasticsearch";
import type { CommentResponse } from "../comments/comment-response";

@Injectable()
export class SearchService {
  private readonly client: Client;

  constructor(config: ConfigService) {
    this.client = new Client({
      node: config.getOrThrow<string>("app.elasticsearchNode")
    });
  }

  async indexComment(comment: CommentResponse): Promise<void> {
    await this.client.index({
      index: "comments",
      id: comment.id,
      document: {
        id: comment.id,
        parentId: comment.parentId,
        authorName: comment.author.userName,
        authorEmail: comment.author.email,
        text: comment.sanitizedHtml,
        createdAt: comment.createdAt
      }
    });
  }
}
