import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { APP_GUARD } from "@nestjs/core";
import { EventEmitterModule } from "@nestjs/event-emitter";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
import { CacheModule } from "./cache/cache.module";
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
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => [
        {
          ttl: config.getOrThrow<number>("app.rateLimit.ttlMilliseconds"),
          limit: config.getOrThrow<number>("app.rateLimit.limit")
        }
      ]
    }),
    EventEmitterModule.forRoot(),
    CacheModule,
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
  controllers: [HealthController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard
    }
  ]
})
export class AppModule {}
