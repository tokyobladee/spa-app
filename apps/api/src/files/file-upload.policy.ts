import { BadRequestException, Injectable } from "@nestjs/common";

const imageMimeTypes = new Set(["image/jpeg", "image/png", "image/gif"]);
const textMimeTypes = new Set(["text/plain"]);
const imageExtensions = new Set(["jpg", "jpeg", "png", "gif"]);
const textExtensions = new Set(["txt"]);

export interface FileUploadCandidate {
  originalName: string;
  mimeType: string;
  sizeBytes: number;
}

@Injectable()
export class FileUploadPolicy {
  validate(candidate: FileUploadCandidate) {
    const extension = candidate.originalName.split(".").pop()?.toLowerCase() ?? "";

    if (imageMimeTypes.has(candidate.mimeType)) {
      this.assertExtension(extension, imageExtensions);
      return;
    }

    if (textMimeTypes.has(candidate.mimeType)) {
      this.assertExtension(extension, textExtensions);

      if (candidate.sizeBytes > 100 * 1024) {
        throw new BadRequestException("TXT attachment cannot exceed 100 KB");
      }

      return;
    }

    throw new BadRequestException("Attachment type is not supported");
  }

  private assertExtension(extension: string, allowedExtensions: Set<string>) {
    if (!allowedExtensions.has(extension)) {
      throw new BadRequestException("Attachment extension does not match its type");
    }
  }
}
