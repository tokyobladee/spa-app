import { Injectable, NotFoundException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectRepository } from "@nestjs/typeorm";
import { randomUUID } from "node:crypto";
import { createReadStream } from "node:fs";
import { access, mkdir, writeFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import sharp from "sharp";
import type { ReadStream } from "node:fs";
import { Repository } from "typeorm";
import { CommentEntity } from "../comments/entities/comment.entity";
import { AttachmentEntity } from "./entities/attachment.entity";
import { FileUploadPolicy } from "./file-upload.policy";

@Injectable()
export class FilesService {
  constructor(
    @InjectRepository(AttachmentEntity)
    private readonly attachments: Repository<AttachmentEntity>,
    private readonly config: ConfigService,
    private readonly policy: FileUploadPolicy
  ) {}

  async attachToComment(comment: CommentEntity, file?: Express.Multer.File): Promise<AttachmentEntity[]> {
    if (!file) {
      return [];
    }

    this.policy.validate({
      originalName: file.originalname,
      mimeType: file.mimetype,
      sizeBytes: file.size
    });

    const processed = await this.process(file);
    const attachment = this.attachments.create({
      comment,
      commentId: comment.id,
      fileKind: processed.fileKind,
      originalName: file.originalname,
      storageKey: processed.storageKey,
      mimeType: processed.mimeType,
      sizeBytes: processed.sizeBytes,
      width: processed.width,
      height: processed.height
    });

    return [await this.attachments.save(attachment)];
  }

  async getDownload(storageKey: string): Promise<FileDownload> {
    const attachment = await this.attachments.findOne({ where: { storageKey } });

    if (!attachment) {
      throw new NotFoundException("File was not found");
    }

    const filePath = this.resolveStoragePath(attachment.storageKey);

    try {
      await access(filePath);
    } catch {
      throw new NotFoundException("File was not found");
    }

    return {
      stream: createReadStream(filePath),
      attachment
    };
  }

  private async process(file: Express.Multer.File): Promise<ProcessedFile> {
    const uploadRoot = this.config.getOrThrow<string>("app.uploadRoot");
    await mkdir(uploadRoot, { recursive: true });

    if (file.mimetype === "text/plain") {
      const storageKey = `${randomUUID()}.txt`;
      await writeFile(join(uploadRoot, storageKey), file.buffer);

      return {
        fileKind: "text",
        storageKey,
        mimeType: file.mimetype,
        sizeBytes: file.size,
        width: null,
        height: null
      };
    }

    const extension = this.getImageExtension(file);
    const storageKey = `${randomUUID()}${extension}`;
    const output = await sharp(file.buffer, { animated: file.mimetype === "image/gif" })
      .rotate()
      .resize({
        width: 320,
        height: 240,
        fit: "inside",
        withoutEnlargement: true
      })
      .toBuffer();
    const metadata = await sharp(output).metadata();
    await writeFile(join(uploadRoot, storageKey), output);

    return {
      fileKind: "image",
      storageKey,
      mimeType: file.mimetype,
      sizeBytes: output.length,
      width: metadata.width ?? null,
      height: metadata.height ?? null
    };
  }

  private getImageExtension(file: Express.Multer.File): string {
    const extension = extname(file.originalname).toLowerCase();

    return extension || ".png";
  }

  private resolveStoragePath(storageKey: string): string {
    const normalized = normalize(storageKey);

    if (normalized.includes("..") || normalized.includes("/") || normalized.includes("\\")) {
      throw new NotFoundException("File was not found");
    }

    return join(this.config.getOrThrow<string>("app.uploadRoot"), normalized);
  }
}

interface ProcessedFile {
  fileKind: string;
  storageKey: string;
  mimeType: string;
  sizeBytes: number;
  width: number | null;
  height: number | null;
}

export interface FileDownload {
  stream: ReadStream;
  attachment: AttachmentEntity;
}
