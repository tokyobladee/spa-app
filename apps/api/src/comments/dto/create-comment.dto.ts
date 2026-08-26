import {
  IsEmail,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
  Matches,
  MaxLength,
  MinLength
} from "class-validator";

export class CreateCommentDto {
  @IsOptional()
  @IsUUID()
  parentId?: string;

  @IsUUID()
  captchaId: string;

  @Matches(/^[A-Za-z0-9]+$/)
  @MaxLength(16)
  captchaValue: string;

  @Matches(/^[A-Za-z0-9]+$/)
  @MaxLength(64)
  userName: string;

  @IsEmail()
  @MaxLength(254)
  email: string;

  @IsOptional()
  @IsUrl({ require_protocol: true, protocols: ["http", "https"] })
  @MaxLength(2048)
  homePage?: string;

  @IsString()
  @MinLength(1)
  @MaxLength(10000)
  text: string;
}
