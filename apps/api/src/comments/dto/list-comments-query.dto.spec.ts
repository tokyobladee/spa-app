import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { ListCommentsQueryDto } from "./list-comments-query.dto";

describe(ListCommentsQueryDto.name, () => {
  it("accepts supported pagination and sorting", async () => {
    const dto = plainToInstance(ListCommentsQueryDto, {
      page: "1",
      pageSize: "25",
      sortBy: "createdAt",
      direction: "desc"
    });

    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
    expect(dto.page).toBe(1);
    expect(dto.pageSize).toBe(25);
  });

  it("rejects SQL-shaped sorting payloads", async () => {
    const dto = plainToInstance(ListCommentsQueryDto, {
      page: "1",
      pageSize: "25",
      sortBy: "createdAt;DROP TABLE comments",
      direction: "desc;--"
    });

    const errors = await validate(dto);
    const invalidProperties = errors.map((error) => error.property);

    expect(invalidProperties).toEqual(expect.arrayContaining(["sortBy", "direction"]));
  });
});
