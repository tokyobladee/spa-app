import { describe, expect, it } from "vitest";
import { validateAttachment } from "./files";

describe(validateAttachment.name, () => {
  it("accepts supported files", () => {
    expect(validateAttachment(new File(["x"], "image.png", { type: "image/png" }))).toBeNull();
    expect(validateAttachment(new File(["x"], "note.txt", { type: "text/plain" }))).toBeNull();
  });

  it("rejects unsupported and oversized files", () => {
    expect(validateAttachment(new File(["x"], "vector.svg", { type: "image/svg+xml" }))).toContain("Only");
    expect(validateAttachment(new File([new Uint8Array(101 * 1024)], "note.txt", { type: "text/plain" }))).toContain(
      "100 KB"
    );
  });
});
