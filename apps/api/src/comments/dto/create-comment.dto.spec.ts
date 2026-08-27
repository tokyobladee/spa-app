import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { CreateCommentDto } from "./create-comment.dto";

describe(CreateCommentDto.name, () => {
  it("accepts valid comment input", async () => {
    const dto = plainToInstance(CreateCommentDto, {
      userName: "User123",
      email: "user@example.com",
      homePage: "https://example.com",
      captchaId: "e2719f10-f251-4abd-8adf-d555562b7550",
      captchaValue: "A1B2C3",
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

  it("rejects SQL-shaped identity and URL payloads before persistence", async () => {
    const dto = plainToInstance(CreateCommentDto, {
      userName: "User123';DROP",
      email: "user@example.com' OR '1'='1",
      homePage: "https://example.com');DROP TABLE users;--",
      captchaId: "e2719f10-f251-4abd-8adf-d555562b7550",
      captchaValue: "A1B2C3",
      text: "Hello"
    });

    const errors = await validate(dto);
    const invalidProperties = errors.map((error) => error.property);

    expect(invalidProperties).toEqual(expect.arrayContaining(["userName", "email", "homePage"]));
  });
});
