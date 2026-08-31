import { WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import type { Server } from "socket.io";
import type { CommentResponse } from "../comments/comment-response";

@WebSocketGateway({
  cors: {
    origin: "*"
  }
})
export class CommentsGateway {
  @WebSocketServer()
  private server: Server;

  publishCreated(comment: CommentResponse) {
    this.server.emit("comment.created", comment);
  }
}
