import { config } from "dotenv";
import { DataSource } from "typeorm";
import { AttachmentEntity } from "../files/entities/attachment.entity";
import { AuthUserEntity } from "../security/entities/auth-user.entity";
import { CaptchaChallengeEntity } from "../captcha/entities/captcha-challenge.entity";
import { CommentEntity } from "../comments/entities/comment.entity";
import { UserEntity } from "../users/entities/user.entity";
import { CreateCoreSchema1725100000000 } from "./migrations/1725100000000-create-core-schema";

config({ path: "../../.env" });
config();

export default new DataSource({
  type: "mysql",
  host: process.env.DATABASE_HOST ?? "localhost",
  port: Number(process.env.DATABASE_PORT ?? 3306),
  username: process.env.DATABASE_USER ?? "comments",
  password: process.env.DATABASE_PASSWORD ?? "comments",
  database: process.env.DATABASE_NAME ?? "comments_spa",
  entities: [
    UserEntity,
    CommentEntity,
    AttachmentEntity,
    CaptchaChallengeEntity,
    AuthUserEntity
  ],
  migrations: [CreateCoreSchema1725100000000],
  synchronize: false
});
