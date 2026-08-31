import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn
} from "typeorm";

@Entity("auth_users")
export class AuthUserEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Index("uq_auth_users_email", { unique: true })
  @Column({ length: 254 })
  email: string;

  @Column({ name: "password_hash", length: 255 })
  passwordHash: string;

  @Column({ length: 32, default: "admin" })
  role: string;

  @CreateDateColumn({ name: "created_at", type: "datetime", precision: 6 })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at", type: "datetime", precision: 6 })
  updatedAt: Date;
}
