import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from "typeorm";

@Entity("captcha_challenges")
export class CaptchaChallengeEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ name: "challenge_hash", length: 255 })
  challengeHash: string;

  @Column({ name: "ip_address", type: "varchar", length: 45, nullable: true })
  ipAddress: string | null;

  @Column({ name: "user_agent", type: "varchar", length: 512, nullable: true })
  userAgent: string | null;

  @Index("idx_captcha_expires")
  @Column({ name: "expires_at", type: "datetime", precision: 6 })
  expiresAt: Date;

  @Index("idx_captcha_consumed")
  @Column({ name: "consumed_at", type: "datetime", precision: 6, nullable: true })
  consumedAt: Date | null;

  @CreateDateColumn({ name: "created_at", type: "datetime", precision: 6 })
  createdAt: Date;
}
