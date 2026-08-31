import { IsEmail, IsString, MaxLength, MinLength } from "class-validator";

export class BootstrapAdminDto {
  @IsEmail()
  @MaxLength(254)
  email: string;

  @IsString()
  @MinLength(12)
  @MaxLength(128)
  password: string;

  @IsString()
  @MinLength(16)
  @MaxLength(256)
  bootstrapToken: string;
}
