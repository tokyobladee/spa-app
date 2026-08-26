import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { CaptchaService } from "../captcha/captcha.service";
import { CommentTextPolicy } from "../security/comment-text.policy";
import { UsersService } from "../users/users.service";
import { CommentsMapper } from "./comments.mapper";
import type { PaginatedCommentsResponse } from "./comment-response";
import { CreateCommentDto } from "./dto/create-comment.dto";
import { ListCommentsQueryDto } from "./dto/list-comments-query.dto";
import { CommentEntity } from "./entities/comment.entity";

type SortExpression = "comment.created_at" | "author.email" | "author.user_name";

const sortExpressions: Record<ListCommentsQueryDto["sortBy"], SortExpression> = {
  createdAt: "comment.created_at",
  email: "author.email",
  userName: "author.user_name"
};

@Injectable()
export class CommentsService {
  constructor(
    @InjectRepository(CommentEntity)
    private readonly comments: Repository<CommentEntity>,
    private readonly users: UsersService,
    private readonly captcha: CaptchaService,
    private readonly textPolicy: CommentTextPolicy,
    private readonly mapper: CommentsMapper
  ) {}

  async listTopLevel(query: ListCommentsQueryDto): Promise<PaginatedCommentsResponse> {
    const page = query.page;
    const pageSize = query.pageSize;
    const sortExpression = sortExpressions[query.sortBy];
    const direction = query.direction.toUpperCase() as "ASC" | "DESC";

    const [comments, total] = await this.comments
      .createQueryBuilder("comment")
      .leftJoinAndSelect("comment.author", "author")
      .leftJoinAndSelect("comment.attachments", "attachments")
      .loadRelationCountAndMap("comment.repliesCount", "comment.children")
      .where("comment.parent_id IS NULL")
      .andWhere("comment.status = :status", { status: "published" })
      .orderBy(sortExpression, direction)
      .addOrderBy("comment.id", direction)
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getManyAndCount();

    return {
      items: comments.map((comment) => this.mapper.toItem(comment)),
      page,
      pageSize,
      total
    };
  }

  async listReplies(commentId: string): Promise<CommentEntity[]> {
    await this.getCommentOrThrow(commentId);

    return this.comments
      .createQueryBuilder("comment")
      .leftJoinAndSelect("comment.author", "author")
      .leftJoinAndSelect("comment.attachments", "attachments")
      .loadRelationCountAndMap("comment.repliesCount", "comment.children")
      .where("comment.parent_id = :commentId", { commentId })
      .andWhere("comment.status = :status", { status: "published" })
      .orderBy("comment.created_at", "ASC")
      .addOrderBy("comment.id", "ASC")
      .getMany();
  }

  async create(input: CreateCommentDto, metadata: RequestMetadata) {
    await this.captcha.verify(input.captchaId, input.captchaValue);

    const parent = input.parentId ? await this.getCommentOrThrow(input.parentId) : null;
    const sanitizedHtml = this.textPolicy.sanitize(input.text);
    const author = await this.users.createAuthor({
      userName: input.userName,
      email: input.email,
      homePage: input.homePage ?? null,
      ipAddress: metadata.ipAddress,
      userAgent: metadata.userAgent
    });

    const comment = this.comments.create({
      parent,
      parentId: parent?.id ?? null,
      author,
      userId: author.id,
      sanitizedHtml,
      plainText: this.textPolicy.toPlainText(sanitizedHtml),
      depth: parent ? parent.depth + 1 : 0,
      materializedPath: ""
    });

    const saved = await this.comments.save(comment);
    saved.materializedPath = parent ? `${parent.materializedPath}.${saved.id}` : saved.id;

    return this.mapper.toItem(await this.comments.save(saved));
  }

  preview(text: string) {
    return {
      sanitizedHtml: this.textPolicy.sanitize(text)
    };
  }

  async getReplyItems(commentId: string) {
    const replies = await this.listReplies(commentId);

    return replies.map((reply) => this.mapper.toItem(reply));
  }

  private async getCommentOrThrow(commentId: string): Promise<CommentEntity> {
    const comment = await this.comments.findOne({
      where: { id: commentId },
      relations: { author: true }
    });

    if (!comment) {
      throw new NotFoundException("Comment was not found");
    }

    return comment;
  }
}

export interface RequestMetadata {
  ipAddress: string | null;
  userAgent: string | null;
}
