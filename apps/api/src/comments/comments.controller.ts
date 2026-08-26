import { Body, Controller, Get, Headers, Ip, Param, ParseUUIDPipe, Post, Query } from "@nestjs/common";
import { CommentsService } from "./comments.service";
import { CreateCommentDto } from "./dto/create-comment.dto";
import { ListCommentsQueryDto } from "./dto/list-comments-query.dto";

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
  create(
    @Body() body: CreateCommentDto,
    @Ip() ipAddress: string,
    @Headers("user-agent") userAgent?: string
  ) {
    return this.comments.create(body, {
      ipAddress,
      userAgent: userAgent ?? null
    });
  }
}
