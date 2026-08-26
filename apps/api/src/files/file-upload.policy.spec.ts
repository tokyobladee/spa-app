import { BadRequestException } from "@nestjs/common";
import { FileUploadPolicy } from "./file-upload.policy";

describe(FileUploadPolicy.name, () => {
  const policy = new FileUploadPolicy();

  it("accepts supported image and txt files", () => {
    expect(() =>
      policy.validate({
        originalName: "photo.png",
        mimeType: "image/png",
        sizeBytes: 500000
      })
    ).not.toThrow();

    expect(() =>
      policy.validate({
        originalName: "note.txt",
        mimeType: "text/plain",
        sizeBytes: 1024
      })
    ).not.toThrow();
  });

  it("rejects unsupported files and oversized txt files", () => {
    expect(() =>
      policy.validate({
        originalName: "script.svg",
        mimeType: "image/svg+xml",
        sizeBytes: 1024
      })
    ).toThrow(BadRequestException);

    expect(() =>
      policy.validate({
        originalName: "note.txt",
        mimeType: "text/plain",
        sizeBytes: 101 * 1024
      })
    ).toThrow(BadRequestException);
  });
});
