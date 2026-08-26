import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtModule } from "@nestjs/jwt";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AuthTokenService } from "./auth-token.service";
import { CommentTextPolicy } from "./comment-text.policy";
import { AuthUserEntity } from "./entities/auth-user.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([AuthUserEntity]),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>("app.jwtSecret"),
        signOptions: {
          expiresIn: "15m"
        }
      })
    })
  ],
  providers: [AuthTokenService, CommentTextPolicy],
  exports: [AuthTokenService, CommentTextPolicy]
})
export class SecurityModule {}
