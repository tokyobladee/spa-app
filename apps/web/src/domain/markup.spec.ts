import { describe, expect, it } from "vitest";
import { validateCommentMarkup } from "./markup";

describe(validateCommentMarkup.name, () => {
  it("accepts valid text and allowed XHTML tags", () => {
    expect(validateCommentMarkup("Plain text comment")).toBeNull();
    expect(
      validateCommentMarkup('Hello <strong>world</strong>! Visit <a href="https://example.com" title="site">site</a>.')
    ).toBeNull();
    expect(validateCommentMarkup("<i>Italic</i> and <code>console.log('hi')</code>")).toBeNull();
  });

  it("rejects unclosed HTML tags", () => {
    expect(validateCommentMarkup("<strong>unclosed")).toContain("Unclosed tag");
    expect(validateCommentMarkup("<i><strong>mismatch</i></strong>")).toContain("mismatch");
  });

  it("rejects unsupported HTML tags", () => {
    expect(validateCommentMarkup("<script>alert(1)</script>")).toContain("Unsupported HTML tag");
    expect(validateCommentMarkup("<img src='x' />")).toContain("Unsupported HTML tag");
    expect(validateCommentMarkup("<div>hello</div>")).toContain("Unsupported HTML tag");
  });

  it("rejects empty text", () => {
    expect(validateCommentMarkup("   ")).toContain("cannot be empty");
  });
});
