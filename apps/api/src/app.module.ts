import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { CaptchaModule } from "./captcha/captcha.module";
import { CommentsModule } from "./comments/comments.module";
import { HealthController } from "./health/health.controller";
import { appConfig, validateEnvironment } from "./config/app.config";
import { DatabaseModule } from "./database/database.module";
import { FilesModule } from "./files/files.module";
import { MessagingModule } from "./messaging/messaging.module";
import { QueueModule } from "./queue/queue.module";
import { RealtimeModule } from "./realtime/realtime.module";
import { SearchModule } from "./search/search.module";
import { SecurityModule } from "./security/security.module";
import { UsersModule } from "./users/users.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig],
      validate: validateEnvironment
    }),
    DatabaseModule,
    UsersModule,
    CommentsModule,
    CaptchaModule,
    FilesModule,
    SecurityModule,
    RealtimeModule,
    QueueModule,
    MessagingModule,
    SearchModule
  ],
  controllers: [HealthController]
})
export class AppModule {}
