import 'dotenv/config';
import { z } from 'zod';

const bool = z
  .union([z.boolean(), z.string()])
  .transform((v) => (typeof v === 'boolean' ? v : v.toLowerCase() === 'true'));

const schema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  HOST: z.string().min(1).default('0.0.0.0'),
  LOG_LEVEL: z
    .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace'])
    .default('info'),
  TRUST_PROXY: bool.default(false),

  CORS_ORIGIN: z.string().min(1).default('http://localhost:5173'),

  VALKEY_URL: z.string().min(1).default('redis://localhost:6379'),

  MINIO_ENDPOINT: z.string().min(1).default('localhost'),
  MINIO_PORT: z.coerce.number().int().positive().default(9000),
  MINIO_USE_SSL: bool.default(false),
  MINIO_ACCESS_KEY: z.string().min(1),
  MINIO_SECRET_KEY: z.string().min(1),
  MINIO_BUCKET: z.string().min(1).default('zap-sessions'),

  MINIO_PUBLIC_ENDPOINT: z.string().min(1).default('localhost'),
  MINIO_PUBLIC_PORT: z.coerce.number().int().positive().default(9000),
  MINIO_PUBLIC_USE_SSL: bool.default(false),

  AUTH_SECRET: z.string().min(32),
  AUTH_TOKEN_TTL_HOURS: z.coerce.number().int().positive().default(24),
});

export type Env = z.infer<typeof schema>;

export class Config {
  readonly nodeEnv: Env['NODE_ENV'];
  readonly port: number;
  readonly host: string;
  readonly logLevel: Env['LOG_LEVEL'];
  readonly trustProxy: boolean;

  readonly auth: Readonly<{ secret: string; tokenTtlHours: number }>;
  readonly cors: Readonly<{ origin: string }>;
  readonly valkey: Readonly<{ url: string }>;
  readonly minio: Readonly<{
    endPoint: string;
    port: number;
    useSSL: boolean;
    accessKey: string;
    secretKey: string;
    bucket: string;
    public: Readonly<{ endPoint: string; port: number; useSSL: boolean }>;
  }>;

  private constructor(env: Env) {
    this.nodeEnv = env.NODE_ENV;
    this.port = env.PORT;
    this.host = env.HOST;
    this.logLevel = env.LOG_LEVEL;
    this.trustProxy = env.TRUST_PROXY;

    this.auth = Object.freeze({ secret: env.AUTH_SECRET, tokenTtlHours: env.AUTH_TOKEN_TTL_HOURS });
    this.cors = Object.freeze({ origin: env.CORS_ORIGIN });
    this.valkey = Object.freeze({ url: env.VALKEY_URL });
    this.minio = Object.freeze({
      endPoint: env.MINIO_ENDPOINT,
      port: env.MINIO_PORT,
      useSSL: env.MINIO_USE_SSL,
      accessKey: env.MINIO_ACCESS_KEY,
      secretKey: env.MINIO_SECRET_KEY,
      bucket: env.MINIO_BUCKET,
      public: Object.freeze({
        endPoint: env.MINIO_PUBLIC_ENDPOINT,
        port: env.MINIO_PUBLIC_PORT,
        useSSL: env.MINIO_PUBLIC_USE_SSL,
      }),
    });

    Object.freeze(this);
  }

  get isProduction(): boolean {
    return this.nodeEnv === 'production';
  }

  get isDevelopment(): boolean {
    return this.nodeEnv === 'development';
  }

  static load(): Config {
    const result = schema.safeParse(process.env);
    if (!result.success) {
      const errors = result.error.issues
        .map((i) => `  - ${i.path.join('.')}: ${i.message}`)
        .join('\n');
      throw new Error(`[config] invalid environment:\n${errors}`);
    }
    return new Config(result.data);
  }
}

declare module 'fastify' {
  interface FastifyInstance {
    config: Config;
  }
}
