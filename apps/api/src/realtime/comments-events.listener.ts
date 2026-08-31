import { Injectable } from "@nestjs/common";
import { OnEvent } from "@nestjs/event-emitter";
import type { CommentResponse } from "../comments/comment-response";
import { CommentsGateway } from "./comments.gateway";

@Injectable()
export class CommentsEventsListener {
  constructor(private readonly gateway: CommentsGateway) {}

  @OnEvent("comments.created")
  handleCreated(comment: CommentResponse) {
    this.gateway.publishCreated(comment);
  }
}
