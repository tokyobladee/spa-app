import { BadRequestException, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { createHash, timingSafeEqual } from "node:crypto";
import svgCaptcha from "svg-captcha";
import { IsNull, MoreThan, Repository } from "typeorm";
import { CaptchaChallengeEntity } from "./entities/captcha-challenge.entity";

export interface CaptchaChallenge {
  id: string;
  image: string;
}

@Injectable()
export class CaptchaService {
  constructor(
    @InjectRepository(CaptchaChallengeEntity)
    private readonly challenges: Repository<CaptchaChallengeEntity>
  ) {}

  async create(metadata: CaptchaMetadata): Promise<CaptchaChallenge> {
    const captcha = svgCaptcha.create({
      size: 6,
      noise: 2,
      ignoreChars: "0oO1ilI"
    });
    const challenge = this.challenges.create({
      challengeHash: this.hash(captcha.text),
      ipAddress: metadata.ipAddress,
      userAgent: metadata.userAgent,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      consumedAt: null
    });
    const saved = await this.challenges.save(challenge);

    return {
      id: saved.id,
      image: captcha.data
    };
  }

  async verify(id: string, value: string) {
    const challenge = await this.challenges.findOne({
      where: {
        id,
        consumedAt: IsNull(),
        expiresAt: MoreThan(new Date())
      }
    });

    if (!challenge) {
      throw new BadRequestException("CAPTCHA challenge is invalid or expired");
    }

    if (!this.equals(challenge.challengeHash, this.hash(value))) {
      throw new BadRequestException("CAPTCHA value is invalid");
    }

    challenge.consumedAt = new Date();
    await this.challenges.save(challenge);
  }

  private hash(value: string): string {
    return createHash("sha256").update(value.toLowerCase().trim()).digest("hex");
  }

  private equals(left: string, right: string): boolean {
    return timingSafeEqual(Buffer.from(left, "hex"), Buffer.from(right, "hex"));
  }
}

export interface CaptchaMetadata {
  ipAddress: string | null;
  userAgent: string | null;
}
