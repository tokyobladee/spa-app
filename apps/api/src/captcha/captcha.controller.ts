import { Controller, Get, Headers, Ip } from "@nestjs/common";
import { CaptchaService } from "./captcha.service";

@Controller("captcha")
export class CaptchaController {
  constructor(private readonly captcha: CaptchaService) {}

  @Get()
  create(@Ip() ipAddress: string, @Headers("user-agent") userAgent?: string) {
    return this.captcha.create({
      ipAddress,
      userAgent: userAgent ?? null
    });
  }
}
