import {
  Body,
  Controller,
  Get,
  Headers,
  Ip,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UploadedFile,
  UseInterceptors
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { memoryStorage } from "multer";
import { CommentsService } from "./comments.service";
import { CreateCommentDto } from "./dto/create-comment.dto";
import { ListCommentsQueryDto } from "./dto/list-comments-query.dto";
import { PreviewCommentDto } from "./dto/preview-comment.dto";

@Controller("comments")
export class CommentsController {
  constructor(private readonly comments: CommentsService) {}

  @Get()
  listTopLevel(@Query() query: ListCommentsQueryDto) {
    return this.comments.listTopLevel(query);
  }

  @Get(":id/replies")
  listReplies(@Param("id", ParseUUIDPipe) id: string) {
    return this.comments.getReplyItems(id);
  }

  @Post()
  @UseInterceptors(
    FileInterceptor("attachment", {
      storage: memoryStorage(),
      limits: {
        fileSize: 5 * 1024 * 1024
      }
    })
  )
  create(
    @Body() body: CreateCommentDto,
    @Ip() ipAddress: string,
    @Headers("user-agent") userAgent?: string,
    @UploadedFile() attachment?: Express.Multer.File
  ) {
    return this.comments.create(
      body,
      {
        ipAddress,
        userAgent: userAgent ?? null
      },
      attachment
    );
  }

  @Post("preview")
  preview(@Body() body: PreviewCommentDto) {
    return this.comments.preview(body.text);
  }
}
