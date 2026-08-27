import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { CacheModule } from "../cache/cache.module";
import { CaptchaModule } from "../captcha/captcha.module";
import { FilesModule } from "../files/files.module";
import { QueueModule } from "../queue/queue.module";
import { SecurityModule } from "../security/security.module";
import { UsersModule } from "../users/users.module";
import { CommentsController } from "./comments.controller";
import { CommentsMapper } from "./comments.mapper";
import { CommentsService } from "./comments.service";
import { CommentEntity } from "./entities/comment.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([CommentEntity]),
    UsersModule,
    CaptchaModule,
    SecurityModule,
    FilesModule,
    CacheModule,
    QueueModule
  ],
  controllers: [CommentsController],
  providers: [CommentsService, CommentsMapper],
  exports: [CommentsService]
})
export class CommentsModule {}
