import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn
} from "typeorm";
import { CommentEntity } from "../../comments/entities/comment.entity";

@Entity("users")
export class UserEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Index("idx_users_user_name")
  @Column({ name: "user_name", length: 64 })
  userName: string;

  @Index("idx_users_email")
  @Column({ length: 254 })
  email: string;

  @Column({ name: "home_page", length: 2048, nullable: true })
  homePage: string | null;

  @Column({ name: "ip_address", length: 45, nullable: true })
  ipAddress: string | null;

  @Column({ name: "user_agent", length: 512, nullable: true })
  userAgent: string | null;

  @OneToMany(() => CommentEntity, (comment) => comment.author)
  comments: CommentEntity[];

  @CreateDateColumn({ name: "created_at", type: "datetime", precision: 6 })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at", type: "datetime", precision: 6 })
  updatedAt: Date;
}
