import { registerAs } from "@nestjs/config";

export interface EnvironmentVariables {
  NODE_ENV?: string;
  API_PORT?: string;
  WEB_ORIGIN?: string;
  DATABASE_HOST?: string;
  DATABASE_PORT?: string;
  DATABASE_USER?: string;
  DATABASE_PASSWORD?: string;
  DATABASE_NAME?: string;
  REDIS_HOST?: string;
  REDIS_PORT?: string;
  RABBITMQ_URL?: string;
  ELASTICSEARCH_NODE?: string;
  JWT_SECRET?: string;
  UPLOAD_ROOT?: string;
}

export interface AppConfig {
  nodeEnv: string;
  apiPort: number;
  webOrigin: string;
  database: {
    host: string;
    port: number;
    username: string;
    password: string;
    name: string;
  };
  redis: {
    host: string;
    port: number;
  };
  rabbitmqUrl: string;
  elasticsearchNode: string;
  jwtSecret: string;
  uploadRoot: string;
}

export const appConfig = registerAs("app", (): AppConfig => {
  const env = process.env as EnvironmentVariables;

  return {
    nodeEnv: env.NODE_ENV ?? "development",
    apiPort: Number(env.API_PORT ?? 3000),
    webOrigin: env.WEB_ORIGIN ?? "http://localhost:5173",
    database: {
      host: env.DATABASE_HOST ?? "localhost",
      port: Number(env.DATABASE_PORT ?? 3306),
      username: env.DATABASE_USER ?? "comments",
      password: env.DATABASE_PASSWORD ?? "comments",
      name: env.DATABASE_NAME ?? "comments_spa"
    },
    redis: {
      host: env.REDIS_HOST ?? "localhost",
      port: Number(env.REDIS_PORT ?? 6379)
    },
    rabbitmqUrl: env.RABBITMQ_URL ?? "amqp://comments:comments@localhost:5672",
    elasticsearchNode: env.ELASTICSEARCH_NODE ?? "http://localhost:9200",
    jwtSecret: env.JWT_SECRET ?? "change-me-in-local-env",
    uploadRoot: env.UPLOAD_ROOT ?? "storage/uploads"
  };
});

export function validateEnvironment(env: EnvironmentVariables) {
  const numericValues = {
    API_PORT: env.API_PORT,
    DATABASE_PORT: env.DATABASE_PORT,
    REDIS_PORT: env.REDIS_PORT
  };

  for (const [key, value] of Object.entries(numericValues)) {
    if (value !== undefined && Number.isNaN(Number(value))) {
      throw new Error(`${key} must be a number`);
    }
  }

  if (env.JWT_SECRET === "change-me-in-local-env" && env.NODE_ENV === "production") {
    throw new Error("JWT_SECRET must be changed in production");
  }

  return env;
}
