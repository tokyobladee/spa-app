import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { CaptchaController } from "./captcha.controller";
import { CaptchaService } from "./captcha.service";
import { CaptchaChallengeEntity } from "./entities/captcha-challenge.entity";

@Module({
  imports: [TypeOrmModule.forFeature([CaptchaChallengeEntity])],
  controllers: [CaptchaController],
  providers: [CaptchaService],
  exports: [CaptchaService]
})
export class CaptchaModule {}
