import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { BullModule } from "@nestjs/bullmq";
import { AttachmentQueueProcessor } from "./attachment-queue.processor";
import { SearchIndexQueueProcessor } from "./search-index-queue.processor";
import { SearchModule } from "../search/search.module";

@Module({
  imports: [
    SearchModule,
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        connection: {
          host: config.getOrThrow<string>("app.redis.host"),
          port: config.getOrThrow<number>("app.redis.port")
        }
      })
    }),
    BullModule.registerQueue({ name: "attachments" }, { name: "search-index" })
  ],
  providers: [AttachmentQueueProcessor, SearchIndexQueueProcessor],
  exports: [BullModule]
})
export class QueueModule {}
