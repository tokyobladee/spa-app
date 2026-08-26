import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { HealthController } from "./health/health.controller";
import { appConfig, validateEnvironment } from "./config/app.config";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig],
      validate: validateEnvironment
    })
  ],
  controllers: [HealthController]
})
export class AppModule {}
