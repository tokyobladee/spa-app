import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { CreateCommentDto } from "./create-comment.dto";

describe(CreateCommentDto.name, () => {
  it("accepts valid comment input", async () => {
    const dto = plainToInstance(CreateCommentDto, {
      userName: "User123",
      email: "user@example.com",
      homePage: "https://example.com",
      text: "Hello"
    });

    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
  });

  it("rejects invalid user identity and empty text", async () => {
    const dto = plainToInstance(CreateCommentDto, {
      userName: "User_123",
      email: "not-email",
      homePage: "javascript:alert(1)",
      text: ""
    });

    const errors = await validate(dto);
    const invalidProperties = errors.map((error) => error.property);

    expect(invalidProperties).toEqual(expect.arrayContaining(["userName", "email", "homePage", "text"]));
  });
});
