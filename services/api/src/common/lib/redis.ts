import Redis from "ioredis";

const RedisClient = (Redis as any).default ?? Redis;

export const redis = new RedisClient(process.env.REDIS_URL ?? "redis://localhost:6379");
