import { NotFoundException } from "@nestjs/common";
import type { ConfigService } from "@nestjs/config";
import type { EventEmitter2 } from "@nestjs/event-emitter";
import type { Queue } from "bullmq";
import type { Repository } from "typeorm";
import type { RedisCacheService } from "../cache/redis-cache.service";
import { CommentsMapper } from "./comments.mapper";
import { CommentsService } from "./comments.service";
import type { CommentEntity } from "./entities/comment.entity";
import type { CaptchaService } from "../captcha/captcha.service";
import type { FilesService } from "../files/files.service";
import type { SearchIndexJob } from "../queue/search-index-queue.processor";
import { CommentTextPolicy } from "../security/comment-text.policy";
import type { UserEntity } from "../users/entities/user.entity";
import type { UsersService } from "../users/users.service";

interface QueryBuilderMock {
  leftJoinAndSelect: jest.MockedFunction<(relation: string, alias: string) => QueryBuilderMock>;
  loadRelationCountAndMap: jest.MockedFunction<(property: string, relation: string) => QueryBuilderMock>;
  where: jest.MockedFunction<(condition: string, parameters?: Record<string, string>) => QueryBuilderMock>;
  andWhere: jest.MockedFunction<(condition: string, parameters: Record<string, string>) => QueryBuilderMock>;
  orderBy: jest.MockedFunction<(field: string, direction: "ASC" | "DESC") => QueryBuilderMock>;
  addOrderBy: jest.MockedFunction<(field: string, direction: "ASC" | "DESC") => QueryBuilderMock>;
  skip: jest.MockedFunction<(count: number) => QueryBuilderMock>;
  take: jest.MockedFunction<(count: number) => QueryBuilderMock>;
  getManyAndCount: jest.MockedFunction<() => Promise<[CommentEntity[], number]>>;
  getMany: jest.MockedFunction<() => Promise<CommentEntity[]>>;
}

function createQueryBuilderMock(comments: CommentEntity[], total: number): QueryBuilderMock {
  const builder = {} as QueryBuilderMock;
  builder.leftJoinAndSelect = jest.fn((_relation: string, _alias: string) => builder);
  builder.loadRelationCountAndMap = jest.fn((_property: string, _relation: string) => builder);
  builder.where = jest.fn((_condition: string, _parameters?: Record<string, string>) => builder);
  builder.andWhere = jest.fn((_condition: string, _parameters: Record<string, string>) => builder);
  builder.orderBy = jest.fn((_field: string, _direction: "ASC" | "DESC") => builder);
  builder.addOrderBy = jest.fn((_field: string, _direction: "ASC" | "DESC") => builder);
  builder.skip = jest.fn((_count: number) => builder);
  builder.take = jest.fn((_count: number) => builder);
  builder.getManyAndCount = jest.fn((): Promise<[CommentEntity[], number]> => Promise.resolve([comments, total]));
  builder.getMany = jest.fn(() => Promise.resolve(comments));

  return builder;
}

function buildAuthor(): UserEntity {
  return {
    id: "8d6cc08d-7110-4fc1-8f43-f38a8106dfd0",
    userName: "User123",
    email: "user@example.com",
    homePage: "https://example.com",
    avatarUrl: null,
    ipAddress: "127.0.0.1",
    userAgent: "test",
    comments: [],
    createdAt: new Date("2026-08-31T08:00:00.000Z"),
    updatedAt: new Date("2026-08-31T08:00:00.000Z")
  };
}

function buildComment(author = buildAuthor()): CommentEntity {
  return {
    id: "a76aa74a-d0f9-431d-9a8a-ea333b764bd2",
    parentId: null,
    parent: null,
    children: [],
    userId: author.id,
    author,
    sanitizedHtml: "Hello",
    plainText: "Hello",
    depth: 0,
    materializedPath: "a76aa74a-d0f9-431d-9a8a-ea333b764bd2",
    status: "published",
    attachments: [],
    repliesCount: 0,
    createdAt: new Date("2026-08-31T08:00:00.000Z"),
    updatedAt: new Date("2026-08-31T08:00:00.000Z")
  };
}

function buildCache() {
  const get = jest.fn(() => Promise.resolve(null));
  const set = jest.fn(() => Promise.resolve());
  const delByPattern = jest.fn(() => Promise.resolve());

  return {
    cache: { get, set, delByPattern } as unknown as RedisCacheService,
    get,
    set,
    delByPattern
  };
}

function buildSearchQueue() {
  const add = jest.fn(() => Promise.resolve());

  return {
    searchQueue: { add } as unknown as Queue<SearchIndexJob>,
    add
  };
}

function buildConfig() {
  return {
    getOrThrow: jest.fn(() => 30)
  } as unknown as ConfigService;
}

describe(CommentsService.name, () => {
  it("lists top-level comments with allowlisted sorting and pagination", async () => {
    const comment = buildComment();
    const builder = createQueryBuilderMock([comment], 1);
    const repository = {
      createQueryBuilder: jest.fn(() => builder)
    } as unknown as Repository<CommentEntity>;
    const captcha = { verify: jest.fn(() => Promise.resolve()) } as unknown as CaptchaService;
    const files = { attachToComment: jest.fn(() => Promise.resolve([])) } as unknown as FilesService;
    const events = { emit: jest.fn() } as unknown as EventEmitter2;
    const { cache, set } = buildCache();
    const { searchQueue } = buildSearchQueue();
    const service = new CommentsService(
      repository,
      { createAuthor: jest.fn() } as unknown as UsersService,
      captcha,
      new CommentTextPolicy(),
      files,
      events,
      new CommentsMapper(),
      cache,
      buildConfig(),
      searchQueue
    );

    const result = await service.listTopLevel({
      page: 2,
      pageSize: 25,
      sortBy: "userName",
      direction: "asc"
    });

    expect(builder.where).toHaveBeenCalledWith("comment.parent_id IS NULL");
    expect(builder.andWhere).toHaveBeenCalledWith("comment.status = :status", {
      status: "published"
    });
    expect(builder.orderBy).toHaveBeenCalledWith("author.userName", "ASC");
    expect(builder.skip).toHaveBeenCalledWith(25);
    expect(builder.take).toHaveBeenCalledWith(25);
    expect(set).toHaveBeenCalledWith("comments:list:2:25:userName:asc", result, 30);
    expect(result.total).toBe(1);
    expect(result.items[0]?.author.userName).toBe("User123");
  });

  it("creates a top-level comment with author metadata and materialized path", async () => {
    const author = buildAuthor();
    const repository = {
      create: jest.fn((value: Partial<CommentEntity>) => value as CommentEntity),
      save: jest.fn((value: CommentEntity) => {
        const id = value.id ?? "a76aa74a-d0f9-431d-9a8a-ea333b764bd2";
        return Promise.resolve({
          ...value,
          id,
          createdAt: value.createdAt ?? new Date("2026-08-31T08:00:00.000Z"),
          updatedAt: value.updatedAt ?? new Date("2026-08-31T08:00:00.000Z"),
          attachments: value.attachments ?? [],
          children: value.children ?? [],
          repliesCount: value.repliesCount ?? 0
        });
      })
    } as unknown as Repository<CommentEntity>;
    const createAuthor = jest.fn(() => Promise.resolve(author));
    const verify = jest.fn(() => Promise.resolve());
    const attachToComment = jest.fn(() => Promise.resolve([]));
    const emit = jest.fn();
    const { cache, delByPattern } = buildCache();
    const { searchQueue, add } = buildSearchQueue();
    const users = {
      createAuthor
    } as unknown as UsersService;
    const service = new CommentsService(
      repository,
      users,
      { verify } as unknown as CaptchaService,
      new CommentTextPolicy(),
      { attachToComment } as unknown as FilesService,
      { emit } as unknown as EventEmitter2,
      new CommentsMapper(),
      cache,
      buildConfig(),
      searchQueue
    );

    const result = await service.create(
      {
        userName: "User123",
        email: "user@example.com",
        homePage: "https://example.com",
        captchaId: "e2719f10-f251-4abd-8adf-d555562b7550",
        captchaValue: "A1B2C3",
        text: "Hello"
      },
      {
        ipAddress: "127.0.0.1",
        userAgent: "test"
      }
    );

    expect(createAuthor).toHaveBeenCalledWith({
      userName: "User123",
      email: "user@example.com",
      homePage: "https://example.com",
      avatarUrl: null,
      ipAddress: "127.0.0.1",
      userAgent: "test"
    });
    expect(verify).toHaveBeenCalledWith("e2719f10-f251-4abd-8adf-d555562b7550", "A1B2C3");
    expect(attachToComment).toHaveBeenCalledWith(expect.objectContaining({ id: result.id }), undefined);
    expect(delByPattern).toHaveBeenCalledWith("comments:list:*");
    expect(add).toHaveBeenCalledWith("index-comment", { comment: result });
    expect(emit).toHaveBeenCalledWith("comments.created", result);
    expect(result.id).toBe("a76aa74a-d0f9-431d-9a8a-ea333b764bd2");
    expect(result.parentId).toBeNull();
    expect(result.sanitizedHtml).toBe("Hello");
  });

  it("rejects replies for missing parent comments", async () => {
    const repository = {
      findOne: jest.fn(() => Promise.resolve(null))
    } as unknown as Repository<CommentEntity>;
    const captcha = { verify: jest.fn(() => Promise.resolve()) } as unknown as CaptchaService;
    const files = { attachToComment: jest.fn(() => Promise.resolve([])) } as unknown as FilesService;
    const events = { emit: jest.fn() } as unknown as EventEmitter2;
    const { cache } = buildCache();
    const { searchQueue } = buildSearchQueue();
    const service = new CommentsService(
      repository,
      { createAuthor: jest.fn() } as unknown as UsersService,
      captcha,
      new CommentTextPolicy(),
      files,
      events,
      new CommentsMapper(),
      cache,
      buildConfig(),
      searchQueue
    );

    await expect(service.listReplies("a76aa74a-d0f9-431d-9a8a-ea333b764bd2")).rejects.toBeInstanceOf(
      NotFoundException
    );
  });
});
