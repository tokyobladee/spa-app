import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AuthUserEntity } from "./entities/auth-user.entity";

@Module({
  imports: [TypeOrmModule.forFeature([AuthUserEntity])],
  exports: [TypeOrmModule]
})
export class SecurityModule {}
