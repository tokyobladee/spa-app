import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtModule } from "@nestjs/jwt";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { AuthTokenService } from "./auth-token.service";
import { CommentTextPolicy } from "./comment-text.policy";
import { AuthUserEntity } from "./entities/auth-user.entity";
import { JwtAuthGuard } from "./jwt-auth.guard";

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
  controllers: [AuthController],
  providers: [AuthService, AuthTokenService, CommentTextPolicy, JwtAuthGuard],
  exports: [AuthService, AuthTokenService, CommentTextPolicy, JwtAuthGuard]
})
export class SecurityModule {}
