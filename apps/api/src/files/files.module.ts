import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AttachmentEntity } from "./entities/attachment.entity";

@Module({
  imports: [TypeOrmModule.forFeature([AttachmentEntity])],
  exports: [TypeOrmModule]
})
export class FilesModule {}
