import { BadRequestException } from "@nestjs/common";
import { CommentTextPolicy } from "./comment-text.policy";

describe(CommentTextPolicy.name, () => {
  const policy = new CommentTextPolicy();

  it("keeps allowed XHTML-style markup", () => {
    const result = policy.sanitize('<strong>Hello</strong> <a href="https://example.com" title="site">site</a>');

    expect(result).toBe('<strong>Hello</strong> <a href="https://example.com" title="site">site</a>');
  });

  it("rejects unsupported or unclosed markup", () => {
    expect(() => policy.sanitize("<script>alert(1)</script>")).toThrow(BadRequestException);
    expect(() => policy.sanitize("<strong>Hello")).toThrow(BadRequestException);
  });

  it("removes unsafe link protocols", () => {
    const result = policy.sanitize('<a href="javascript:alert(1)" title="x">x</a>');

    expect(result).toBe('<a title="x">x</a>');
  });
});
