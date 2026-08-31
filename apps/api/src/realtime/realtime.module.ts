import { Module } from "@nestjs/common";
import { CommentsEventsListener } from "./comments-events.listener";
import { CommentsGateway } from "./comments.gateway";

@Module({
  providers: [CommentsGateway, CommentsEventsListener],
  exports: [CommentsGateway]
})
export class RealtimeModule {}
