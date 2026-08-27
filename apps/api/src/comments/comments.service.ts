import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectQueue } from "@nestjs/bullmq";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { InjectRepository } from "@nestjs/typeorm";
import type { Queue } from "bullmq";
import { Repository } from "typeorm";
import { RedisCacheService } from "../cache/redis-cache.service";
import { CaptchaService } from "../captcha/captcha.service";
import { FilesService } from "../files/files.service";
import type { SearchIndexJob } from "../queue/search-index-queue.processor";
import { CommentTextPolicy } from "../security/comment-text.policy";
import { UsersService } from "../users/users.service";
import { CommentsMapper } from "./comments.mapper";
import type { PaginatedCommentsResponse } from "./comment-response";
import { CreateCommentDto } from "./dto/create-comment.dto";
import { ListCommentsQueryDto } from "./dto/list-comments-query.dto";
import { CommentEntity } from "./entities/comment.entity";

type SortExpression = "comment.createdAt" | "author.email" | "author.userName";

const sortExpressions: Record<ListCommentsQueryDto["sortBy"], SortExpression> = {
  createdAt: "comment.createdAt",
  email: "author.email",
  userName: "author.userName"
};

@Injectable()
export class CommentsService {
  constructor(
    @InjectRepository(CommentEntity)
    private readonly comments: Repository<CommentEntity>,
    private readonly users: UsersService,
    private readonly captcha: CaptchaService,
    private readonly textPolicy: CommentTextPolicy,
    private readonly files: FilesService,
    private readonly events: EventEmitter2,
    private readonly mapper: CommentsMapper,
    private readonly cache: RedisCacheService,
    @InjectQueue("search-index")
    private readonly searchQueue: Queue<SearchIndexJob>
  ) {}

  async listTopLevel(query: ListCommentsQueryDto): Promise<PaginatedCommentsResponse> {
    const cacheKey = this.listCacheKey(query);
    const cached = await this.readCachedList(cacheKey);

    if (cached) {
      return cached;
    }

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

    const response = {
      items: comments.map((comment) => this.mapper.toItem(comment)),
      page,
      pageSize,
      total
    };

    await this.writeCachedList(cacheKey, response);

    return response;
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
      .orderBy("comment.createdAt", "ASC")
      .addOrderBy("comment.id", "ASC")
      .getMany();
  }

  async create(input: CreateCommentDto, metadata: RequestMetadata, file?: Express.Multer.File) {
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
    const persisted = await this.comments.save(saved);
    persisted.attachments = await this.files.attachToComment(persisted, file);

    const response = this.mapper.toItem(persisted);
    await this.invalidateCommentListCache();
    void this.enqueueSearchIndex(response);
    this.events.emit("comments.created", response);

    return response;
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

  private listCacheKey(query: ListCommentsQueryDto): string {
    return `comments:list:${query.page}:${query.pageSize}:${query.sortBy}:${query.direction}`;
  }

  private async readCachedList(cacheKey: string): Promise<PaginatedCommentsResponse | null> {
    try {
      return await this.cache.get<PaginatedCommentsResponse>(cacheKey);
    } catch {
      return null;
    }
  }

  private async writeCachedList(cacheKey: string, response: PaginatedCommentsResponse): Promise<void> {
    try {
      await this.cache.set(cacheKey, response, 30);
    } catch {
      return;
    }
  }

  private async invalidateCommentListCache(): Promise<void> {
    try {
      await this.cache.delByPattern("comments:list:*");
    } catch {
      return;
    }
  }

  private async enqueueSearchIndex(comment: ReturnType<CommentsMapper["toItem"]>): Promise<void> {
    try {
      await this.searchQueue.add("index-comment", { comment });
    } catch {
      return;
    }
  }
}

export interface RequestMetadata {
  ipAddress: string | null;
  userAgent: string | null;
}
