import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { CaptchaChallengeEntity } from "./entities/captcha-challenge.entity";

@Module({
  imports: [TypeOrmModule.forFeature([CaptchaChallengeEntity])],
  exports: [TypeOrmModule]
})
export class CaptchaModule {}
