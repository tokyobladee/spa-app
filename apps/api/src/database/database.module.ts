import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import type { TypeOrmModuleOptions } from "@nestjs/typeorm";
import { AttachmentEntity } from "../files/entities/attachment.entity";
import { AuthUserEntity } from "../security/entities/auth-user.entity";
import { CaptchaChallengeEntity } from "../captcha/entities/captcha-challenge.entity";
import { CommentEntity } from "../comments/entities/comment.entity";
import { UserEntity } from "../users/entities/user.entity";

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService): TypeOrmModuleOptions => ({
        type: "mysql",
        host: config.getOrThrow<string>("app.database.host"),
        port: config.getOrThrow<number>("app.database.port"),
        username: config.getOrThrow<string>("app.database.username"),
        password: config.getOrThrow<string>("app.database.password"),
        database: config.getOrThrow<string>("app.database.name"),
        entities: [
          UserEntity,
          CommentEntity,
          AttachmentEntity,
          CaptchaChallengeEntity,
          AuthUserEntity
        ],
        synchronize: false,
        migrationsRun: false
      })
    })
  ]
})
export class DatabaseModule {}
