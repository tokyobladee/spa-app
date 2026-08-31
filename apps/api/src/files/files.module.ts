import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AttachmentEntity } from "./entities/attachment.entity";
import { FileUploadPolicy } from "./file-upload.policy";
import { FilesController } from "./files.controller";
import { FilesService } from "./files.service";

@Module({
  imports: [TypeOrmModule.forFeature([AttachmentEntity])],
  controllers: [FilesController],
  providers: [FileUploadPolicy, FilesService],
  exports: [FileUploadPolicy, FilesService]
})
export class FilesModule {}
