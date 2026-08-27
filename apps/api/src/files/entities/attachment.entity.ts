import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn
} from "typeorm";
import { CommentEntity } from "../../comments/entities/comment.entity";

@Entity("attachments")
export class AttachmentEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ name: "comment_id", type: "char", length: 36 })
  commentId: string;

  @ManyToOne(() => CommentEntity, (comment) => comment.attachments, { onDelete: "CASCADE" })
  @JoinColumn({ name: "comment_id" })
  comment: CommentEntity;

  @Column({ name: "file_kind", length: 16 })
  fileKind: string;

  @Column({ name: "original_name", length: 255 })
  originalName: string;

  @Index("uq_attachments_storage_key", { unique: true })
  @Column({ name: "storage_key", length: 512 })
  storageKey: string;

  @Column({ name: "mime_type", length: 128 })
  mimeType: string;

  @Column({ name: "size_bytes" })
  sizeBytes: number;

  @Column({ type: "int", nullable: true })
  width: number | null;

  @Column({ type: "int", nullable: true })
  height: number | null;

  @CreateDateColumn({ name: "created_at", type: "datetime", precision: 6 })
  createdAt: Date;
}
