import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AttachmentEntity } from "./entities/attachment.entity";
import { FileUploadPolicy } from "./file-upload.policy";

@Module({
  imports: [TypeOrmModule.forFeature([AttachmentEntity])],
  providers: [FileUploadPolicy],
  exports: [FileUploadPolicy]
})
export class FilesModule {}
