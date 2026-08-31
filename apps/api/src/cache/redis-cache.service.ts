import { Injectable, OnModuleDestroy } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Redis from "ioredis";

@Injectable()
export class RedisCacheService implements OnModuleDestroy {
  private readonly redis: Redis;

  constructor(config: ConfigService) {
    this.redis = new Redis({
      host: config.getOrThrow<string>("app.redis.host"),
      port: config.getOrThrow<number>("app.redis.port"),
      lazyConnect: true,
      maxRetriesPerRequest: 3
    });
  }

  async get<T>(key: string): Promise<T | null> {
    const value = await this.redis.get(key);

    return value ? (JSON.parse(value) as T) : null;
  }

  async set<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
    await this.redis.set(key, JSON.stringify(value), "EX", ttlSeconds);
  }

  async del(key: string): Promise<void> {
    await this.redis.del(key);
  }

  async delByPattern(pattern: string): Promise<void> {
    let cursor = "0";

    do {
      const [nextCursor, keys] = await this.redis.scan(cursor, "MATCH", pattern, "COUNT", 100);
      cursor = nextCursor;

      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
    } while (cursor !== "0");
  }

  onModuleDestroy(): void {
    this.redis.disconnect();
  }
}
