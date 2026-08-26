import { IsString, MaxLength, MinLength } from "class-validator";

export class PreviewCommentDto {
  @IsString()
  @MinLength(1)
  @MaxLength(10000)
  text: string;
}
