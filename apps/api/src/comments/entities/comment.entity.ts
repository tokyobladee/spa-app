import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn
} from "typeorm";
import { AttachmentEntity } from "../../files/entities/attachment.entity";
import { UserEntity } from "../../users/entities/user.entity";

@Entity("comments")
export class CommentEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ name: "parent_id", type: "char", length: 36, nullable: true })
  parentId: string | null;

  @ManyToOne(() => CommentEntity, (comment) => comment.children, {
    nullable: true,
    onDelete: "CASCADE"
  })
  @JoinColumn({ name: "parent_id" })
  parent: CommentEntity | null;

  @OneToMany(() => CommentEntity, (comment) => comment.parent)
  children: CommentEntity[];

  @Column({ name: "user_id", type: "char", length: 36 })
  userId: string;

  @ManyToOne(() => UserEntity, (user) => user.comments, { onDelete: "RESTRICT" })
  @JoinColumn({ name: "user_id" })
  author: UserEntity;

  @Column({ name: "sanitized_html", type: "text" })
  sanitizedHtml: string;

  @Column({ name: "plain_text", type: "text" })
  plainText: string;

  @Column({ default: 0 })
  depth: number;

  @Index("idx_comments_path")
  @Column({ name: "materialized_path", length: 2048 })
  materializedPath: string;

  @Column({ length: 32, default: "published" })
  status: string;

  @OneToMany(() => AttachmentEntity, (attachment) => attachment.comment)
  attachments: AttachmentEntity[];

  repliesCount: number;

  @CreateDateColumn({ name: "created_at", type: "datetime", precision: 6 })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at", type: "datetime", precision: 6 })
  updatedAt: Date;
}
