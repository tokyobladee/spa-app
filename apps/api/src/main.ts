import { ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import type { AppConfig } from "./config/app.config";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get<ConfigService<AppConfig, true>>(ConfigService);

  app.setGlobalPrefix("api");
  app.enableCors({
    origin: config.get("webOrigin", { infer: true }),
    credentials: true
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true
    })
  );

  await app.listen(config.get("apiPort", { infer: true }));
}

void bootstrap();
