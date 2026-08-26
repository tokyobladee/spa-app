import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { UsersModule } from "../users/users.module";
import { CommentsController } from "./comments.controller";
import { CommentsMapper } from "./comments.mapper";
import { CommentsService } from "./comments.service";
import { CommentEntity } from "./entities/comment.entity";

@Module({
  imports: [TypeOrmModule.forFeature([CommentEntity]), UsersModule],
  controllers: [CommentsController],
  providers: [CommentsService, CommentsMapper],
  exports: [CommentsService]
})
export class CommentsModule {}
