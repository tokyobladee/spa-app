import { Controller, Get, Param, Res, StreamableFile } from "@nestjs/common";
import type { Response } from "express";
import { FilesService } from "./files.service";

@Controller("files")
export class FilesController {
  constructor(private readonly files: FilesService) {}

  @Get(":storageKey")
  async download(@Param("storageKey") storageKey: string, @Res({ passthrough: true }) response: Response) {
    const file = await this.files.getDownload(storageKey);

    response.setHeader("Content-Type", file.attachment.mimeType);
    response.setHeader(
      "Content-Disposition",
      `inline; filename="${encodeURIComponent(file.attachment.originalName)}"`
    );

    return new StreamableFile(file.stream);
  }
}
