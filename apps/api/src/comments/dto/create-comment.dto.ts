import { Transform } from "class-transformer";
import {
  IsEmail,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
  Matches,
  MaxLength,
  MinLength,
  ValidateIf
} from "class-validator";

export class CreateCommentDto {
  @IsOptional()
  @Transform(({ value }: { value: unknown }) => (typeof value === "string" && value.trim() === "" ? undefined : value))
  @ValidateIf((o: CreateCommentDto) => Boolean(o.parentId && o.parentId.trim() !== ""))
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
  @Transform(({ value }: { value: unknown }) => (typeof value === "string" && value.trim() === "" ? undefined : value))
  @ValidateIf((o: CreateCommentDto) => Boolean(o.homePage && o.homePage.trim() !== ""))
  @IsUrl({ require_protocol: true, protocols: ["http", "https"], require_tld: false })
  @MaxLength(2048)
  homePage?: string;

  @IsString()
  @MinLength(1)
  @MaxLength(10000)
  text: string;
}
