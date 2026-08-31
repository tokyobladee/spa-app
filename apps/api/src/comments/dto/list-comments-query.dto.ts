import { Transform } from "class-transformer";
import { IsIn, IsInt, IsOptional, Max, Min } from "class-validator";

export type CommentSortField = "createdAt" | "email" | "userName";
export type SortDirection = "asc" | "desc";

export class ListCommentsQueryDto {
  @IsOptional()
  @Transform(({ value }) => Number(value ?? 1))
  @IsInt()
  @Min(1)
  page = 1;

  @IsOptional()
  @Transform(({ value }) => Number(value ?? 25))
  @IsInt()
  @Min(1)
  @Max(25)
  pageSize = 25;

  @IsOptional()
  @IsIn(["createdAt", "userName", "email"])
  sortBy: CommentSortField = "createdAt";

  @IsOptional()
  @IsIn(["asc", "desc"])
  direction: SortDirection = "desc";
}
